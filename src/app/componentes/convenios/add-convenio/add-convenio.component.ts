import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import Swal from 'sweetalert2';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Abonados } from 'src/app/modelos/abonados';
import { Clientes } from 'src/app/modelos/clientes';
import { Convenios } from 'src/app/modelos/convenios.model';
import { Cuotas } from 'src/app/modelos/cuotas.model';
import { Facturas } from 'src/app/modelos/facturas.model';
import { Facxconvenio } from 'src/app/modelos/facxconvenio.model';
import { Modulos } from 'src/app/modelos/modulos.model';
import { Rubroxfac } from 'src/app/modelos/rubroxfac.model';
import { Rubros } from 'src/app/modelos/rubros.model';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { ConvenioService } from 'src/app/servicios/convenio.service';
import { CuotasService } from 'src/app/servicios/cuotas.service';
import { FacxconvenioService } from 'src/app/servicios/facxconvenio.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { InteresesService } from 'src/app/servicios/intereses.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { ModulosService } from 'src/app/servicios/modulos.service';
import {
  OutboxAttachment,
  OutboxEmailService,
} from 'src/app/servicios/outbox-email.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { ConveniosReportsService } from '../convenios-reports.service';

@Component({
  selector: 'app-add-convenio',
  templateUrl: './add-convenio.component.html',
  styleUrls: ['./add-convenio.component.css'],
})
export class AddConvenioComponent implements OnInit {
  cliente: Clientes = new Clientes();
  formConvenio!: FormGroup;
  f_nuevosValores!: FormGroup;

  _modulos: any;
  _intereses: any;
  _sincobro: any;

  rubros: any[] = [];
  facturas: any[] = [];
  conveniosExistentes: any[] = [];
  cronogramaPagos: any[] = [];
  facturasConvenioPendientes: any[] = [];
  detalleConvenioSeleccionado: any = null;

  modulo27: any = { idmodulo: 27 };
  abonado!: Abonados;
  seccion: Modulos = new Modulos();
  newconvenio: any;

  nropagos = 0;
  pagomensual = 0;
  fecha = new Date();
  total = 0;
  idabonado = 0;
  idmodulo = 3;
  porcentaje = 0.2;
  totInteres = 0;

  swbuscando = false;
  txtbuscar = 'Abonado';
  swcalcular = false;
  swcalculando = false;
  txtcalcular = 'Calcular';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private aboService: AbonadosService,
    private facService: FacturaService,
    private convService: ConvenioService,
    public authService: AutorizaService,
    private cuotService: CuotasService,
    private rubxfacService: RubroxfacService,
    private facxconvService: FacxconvenioService,
    private rxfService: RubroxfacService,
    private moduService: ModulosService,
    private interService: InteresesService,
    private s_loading: LoadingService,
    private outboxEmailService: OutboxEmailService,
    private conveniosReportsService: ConveniosReportsService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/convenios');
    const coloresJSON = sessionStorage.getItem('/convenios');
    if (coloresJSON) {
      this.colocaColor(JSON.parse(coloresJSON));
    }

    this.formConvenio = this.fb.group(
      {
        seccion: this.seccion,
        idabonado: ['', Validators.required],
        nroconvenio: ['', Validators.required, this.valNroconvenio.bind(this)],
        referencia: ['', Validators.required],
        nroautorizacion: ['', Validators.required],
        cuotainicial: ['', Validators.required],
        cuotas: ['', [Validators.required, Validators.min(2), Validators.max(24)]],
        cuotafinal: ['', Validators.required],
        observaciones: '',
        correosNotificacion: [''],
        cedula: '',
        nombre: '',
        pagomensual: '',
        totalpago: '',
      },
      { updateOn: 'blur' }
    );

    this.f_nuevosValores = this.fb.group({
      seccion: this.seccion,
    });

    this.changeCuotainicial();
    this.changeCuotas();
    this.modulos();
    this.siguienteNroconvenio();
    this.listarIntereses();
  }

  get f() {
    return this.formConvenio.controls;
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  modulos() {
    this.moduService.getListaModulos().subscribe({
      next: (datos) => {
        this._modulos = datos;
        this.formConvenio.controls['seccion'].setValue(this.idmodulo);
      },
      error: (err) => console.error(err.error),
    });
  }

  obtenerSeccion(e: any) {
    this.formConvenio.value.seccion = +e.target.value;
    this.idmodulo = this.formConvenio.value.seccion;
  }

  siguienteNroconvenio() {
    this.convService.siguienteNroconvenio().subscribe({
      next: (x) => this.formConvenio.patchValue({ nroconvenio: x }),
      error: (err) => console.error('Al obtener el último Nroconvenio', err.error),
    });
  }

  async buscarFacxAbo() {
    const idabonado = Number(this.formConvenio.value.idabonado || 0);
    if (!idabonado) {
      this._sincobro = null;
      this.conveniosExistentes = [];
      this.cronogramaPagos = [];
      this.facturasConvenioPendientes = [];
      this.detalleConvenioSeleccionado = null;
      this.formConvenio.controls['nombre'].setValue('');
      this.formConvenio.controls['cuotainicial'].setValue('');
      return;
    }

    this.swbuscando = true;
    this.txtbuscar = 'Buscando';
    await this.cargarConveniosExistentes(idabonado);

    this.aboService.unAbonado(idabonado).subscribe({
      next: (_datos) => {
        this.abonado = _datos;
        this.facService.getFacSincobroBycuenta(_datos.idabonado).subscribe({
          next: async (datos) => {
            this._sincobro = this.filtrarFacturasParaNuevoConvenio(datos);
            this.formConvenio.controls['cedula'].setValue(
              this.abonado.idcliente_clientes.cedula
            );
            this.formConvenio.controls['nombre'].setValue(
              this.abonado.idcliente_clientes.nombre
            );
            this.formConvenio.controls['correosNotificacion'].setValue(
              String(this.abonado.idcliente_clientes?.email ?? '')
            );
            await this.sumTotaltarifa();
            this.pagomensual = 0;
            this.formConvenio.controls['cuotas'].setValue('');
            this.nropagos = 0;
            this.formConvenio.controls['cuotafinal'].setValue('');
            this.cronogramaPagos = [];
            this.swbuscando = false;
            this.txtbuscar = 'Abonado';
          },
          error: (err) => {
            console.error('Al recuperar las planillas sin cobrar por abonado:', err.error);
            this.swbuscando = false;
            this.txtbuscar = 'Abonado';
          },
        });
      },
      error: (err) => {
        console.error('Al recuperar el abonado:', err.error);
        this.swbuscando = false;
        this.txtbuscar = 'Abonado';
      },
    });
  }

  async sumTotaltarifa() {
    let suma = 0;
    let inte = 0;

    for (let i = 0; i < (this._sincobro || []).length; i++) {
      const item = this._sincobro[i];
      const interes = await this.cInteres(item);
      const idmodulo = Number(item?.idmodulo?.idmodulo ?? item?.idmodulo ?? 0);
      const com = idmodulo === 3 && item?.idabonado != null ? 1 : 0;
      item.total += interes;
      inte += interes;
      suma += item.total + com;
    }

    this.total = suma;
    this.totInteres = inte;
    const cuotainicial = Math.round(suma * this.porcentaje * 100) / 100;
    this.formConvenio.controls['cuotainicial'].setValue(cuotainicial);
  }

  sumComercializacion(sincobro: any) {
    const idmodulo = Number(sincobro?.idmodulo?.idmodulo ?? sincobro?.idmodulo ?? 0);
    if (idmodulo === 3 && sincobro.idabonado != null) {
      return sincobro.total + 1;
    }
    return sincobro.total;
  }

  changeCuotainicial() {
    this.formConvenio.get('cuotainicial')!.valueChanges.subscribe((cuotainicial) => {
      this.porcentaje = (cuotainicial * 100) / this.total / 100 || this.porcentaje;
      this.pagomensual = 0;
      this.nropagos = 0;
      this.formConvenio.controls['cuotafinal'].setValue('');
      this.formConvenio.controls['pagomensual'].setValue('');
      this.formConvenio.controls['totalpago'].setValue('');
      const cuotas = this.formConvenio.value.cuotas;
      this.swcalcular = !!(cuotainicial > 0 && cuotas >= 2);
    });
  }

  changeCuotas() {
    this.formConvenio.get('cuotas')!.valueChanges.subscribe((cuotas) => {
      const cuotainicial = this.formConvenio.value.cuotainicial;
      this.swcalcular = !!(cuotainicial > 0 && cuotas >= 2);
    });
  }

  calcular() {
    this.swcalculando = true;
    this.s_loading.showLoading();
    this.txtcalcular = 'Calculando';
    this.facturas = [];
    this.rubros = [];

    const cuotainicial = Number(this.formConvenio.value.cuotainicial || 0);
    const cuotas = Number(this.formConvenio.value.cuotas || 0);
    this.nropagos = cuotas - 1;
    this.pagomensual = this.nropagos > 0
      ? Math.round(((this.total - cuotainicial) / cuotas) * 100) / 100
      : 0;

    this.formConvenio.controls['pagomensual'].setValue(this.pagomensual);
    const totalpago = Math.round(this.pagomensual * this.nropagos * 100) / 100;
    this.formConvenio.controls['totalpago'].setValue(totalpago);
    const cuotafinal = this.total - cuotainicial - this.pagomensual * this.nropagos;
    this.formConvenio.controls['cuotafinal'].setValue(cuotafinal.toFixed(2));

    this.totaltarifaFacturas();
    this.construirCronogramaPagos();

    if (this.totInteres > 0) {
      this.rubros.push({ idrubro: 5, valorunitario: this.totInteres });
    }

    this.sumaRubros(0);
  }

  totaltarifaFacturas() {
    const cuotainicial = Number(this.formConvenio.value.cuotainicial || 0);
    const cuotas = Number(this.formConvenio.value.cuotas || 0);
    const pagomensual = Number(this.formConvenio.value.pagomensual || 0);
    const cuotafinal = Number(this.formConvenio.value.cuotafinal || 0);

    this.facturas.push({
      totaltarifa: cuotainicial,
      porcentaje: cuotainicial / this.total,
    });

    for (let i = 0; i < cuotas - 1; i++) {
      this.facturas.push({
        totaltarifa: pagomensual,
        porcentaje: pagomensual / this.total,
      });
    }

    this.facturas.push({
      totaltarifa: cuotafinal,
      porcentaje: cuotafinal / this.total,
    });
  }

  listarIntereses() {
    this.interService.getListaIntereses().subscribe({
      next: (datos) => {
        this._intereses = datos;
      },
      error: (err) => console.error(err.error),
    });
  }

  cInteres(factura: any) {
    return this.interService.getInteresFactura(factura.idfactura);
  }

  sumaRubros(i: number) {
    if (!this._sincobro || i >= this._sincobro.length) {
      this.swcalculando = false;
      this.txtcalcular = 'Calcular';
      this.s_loading.hideLoading();
      return;
    }

    this.rubxfacService.getByIdfactura(this._sincobro[i].idfactura).subscribe({
      next: (datos: any) => {
        for (let j = 0; j < datos.length; j++) {
          const r = {
            idrubro: datos[j].idrubro_rubros.idrubro,
            valorunitario: +datos[j].valorunitario.toFixed(2),
          };
          const indice = this.rubros.findIndex(
            (rubro: { idrubro: number }) => rubro.idrubro === r.idrubro
          );
          if (indice === -1) {
            this.rubros.push(r);
          } else {
            this.rubros[indice].valorunitario =
              Math.round((this.rubros[indice].valorunitario + r.valorunitario) * 100) / 100;
          }
        }
        this.sumaRubros(i + 1);
      },
      error: (err) => {
        console.error(err.error);
        this.swcalculando = false;
        this.txtcalcular = 'Calcular';
        this.s_loading.hideLoading();
      },
    });
  }

  guardar() {
    Swal.fire({
      title: '¿Está seguro?',
      text: '¿Desea crear este convenio?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, crear convenio',
      cancelButtonText: 'No, cancelar',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.confirmarGuardar();
      }
    });
  }

  private confirmarGuardar() {
    this.s_loading.showLoading();
    const abonado = new Abonados();
    abonado.idabonado = this.formConvenio.value.idabonado;

    const convenio = new Convenios();
    convenio.nroautorizacion = this.formConvenio.value.nroautorizacion;
    convenio.referencia = this.formConvenio.value.referencia;
    convenio.estado = 1;
    convenio.nroconvenio = this.formConvenio.value.nroconvenio;
    convenio.totalconvenio = this.total;
    convenio.cuotas = this.formConvenio.value.cuotas;
    convenio.cuotainicial = this.formConvenio.value.cuotainicial;
    convenio.pagomensual = this.formConvenio.value.pagomensual;
    convenio.cuotafinal = this.formConvenio.value.cuotafinal;
    convenio.observaciones = this.formConvenio.value.observaciones;
    convenio.usucrea = this.authService.idusuario;
    convenio.feccrea = this.fecha;
    convenio.idabonado = abonado;

    this.convService.saveConvenio(convenio).subscribe({
      next: async (resp) => {
        this.newconvenio = resp;
        await this.creaFacturas();
        await this.enviarNotificacionConvenioSiAplica();
        this.s_loading.hideLoading();
        Swal.fire('¡Operación exitosa!', 'Convenio creado correctamente.', 'success');
        this.router.navigate(['convenios']);
      },
      error: (err) => {
        this.s_loading.hideLoading();
        console.error(err.error);
        Swal.fire('Error', 'No se pudo crear el convenio. Intente nuevamente.', 'error');
      },
    });
  }

  async creaFacturas() {
    await this.facturasAsync();
    await this.facxconvenioAsync();
    sessionStorage.removeItem('desdeconvenio');
  }

  async facturasAsync() {
    const fechaBase = new Date(this.fecha);
    for (let i = 0; i < this.facturas.length; i++) {
      const factura = new Facturas();
      this.cliente = this.abonado.idcliente_clientes;
      const fechaCuota = this.addMonthsClamped(fechaBase, i);
      factura.idcliente = this.cliente;
      factura.idabonado = this.formConvenio.value.idabonado;
      factura.idmodulo = this.modulo27;
      factura.totaltarifa = this.facturas[i].totaltarifa;
      factura.formapago = 1;
      factura.estado = 2;
      factura.pagado = 0;
      factura.porcexoneracion = 0;
      factura.conveniopago = 0;
      factura.estadoconvenio = 0;
      factura.usucrea = this.authService.idusuario;
      factura.feccrea = fechaCuota;
      factura.valorbase = this.facturas[i].totaltarifa;
      try {
        const nuevafac = await this.facService.saveFacturaAsync(factura);
        await this.generarCuotas(i, nuevafac);
        await this.rubroxfac(i, nuevafac);
      } catch (error) {
        console.error(`Al guardar la factura ${i}`, error);
      }
    }
  }

  async generarCuotas(i: number, factura: any) {
    const cuota = new Cuotas();
    cuota.nrocuota = i + 1;
    cuota.idfactura = factura;
    cuota.idconvenio_convenios = this.newconvenio;
    cuota.usucrea = this.authService.idusuario;
    cuota.feccrea = this.fecha;
    try {
      await this.cuotService.saveCuotaAsync(cuota);
    } catch (error) {
      console.error('Al guardar la cuota:', error);
    }
  }

  async rubroxfac(i: number, factura: any) {
    for (let j = 0; j < this.rubros.length; j++) {
      const rxf = new Rubroxfac();
      rxf.cantidad = 1;
      rxf.estado = 1;
      rxf.valorunitario =
        +this.rubros[j].valorunitario.toFixed(2) * this.facturas[i].porcentaje;
      rxf.idfactura_facturas = factura;
      const rubro = new Rubros();
      rubro.idrubro = this.rubros[j].idrubro;
      rxf.idrubro_rubros = rubro;
      try {
        await this.rxfService.saveRubroxfacAsync(rxf);
      } catch (error) {
        console.error(`Al guardar Rubroxfac ${j}`, error);
      }
    }
  }

  async facxconvenioAsync() {
    for (let k = 0; k < this._sincobro.length; k++) {
      const facxconv = new Facxconvenio();
      const factura = new Facturas();
      factura.idfactura = this._sincobro[k].idfactura;
      facxconv.idconvenio_convenios = this.newconvenio;
      facxconv.idfactura_facturas = factura;
      try {
        await this.facxconvService.saveFacxconvenioAsync(facxconv);
        await this.actuAntiguas(k);
      } catch (error) {
        console.error(`Al guardar facxconvenio ${k}`, error);
      }
    }
  }

  async actuAntiguas(k: number) {
    const factura: any = await this.getFacturaById(this._sincobro[k].idfactura);
    factura.conveniopago = this.newconvenio.nroconvenio;
    factura.fechaconvenio = this.fecha;
    factura.estadoconvenio = 1;
    factura.usumodi = this.authService.idusuario;
    factura.fecmodi = this.fecha;
    try {
      await this.facService.updateFacturaAsync(factura);
    } catch (error) {
      console.error(`Al actualizar las antiguas ${k}`, error);
    }
  }

  async getFacturaById(idfactura: number) {
    return await this.facService.getByIdAsync(idfactura);
  }

  regresar() {
    this.router.navigate(['convenios']);
  }

  valNroconvenio(control: AbstractControl) {
    return this.convService
      .valNroconvenio(control.value)
      .pipe(map((result) => (result ? { existe: true } : null)));
  }

  addValores() {
    const seccion = this.f_nuevosValores.value.seccion;
    const idabonado = this.formConvenio.value.idabonado;
    if (!idabonado) {
      this._sincobro = null;
      this.formConvenio.controls['nombre'].setValue('');
      this.formConvenio.controls['cuotainicial'].setValue('');
      return;
    }

    this.swbuscando = true;
    this.txtbuscar = 'Buscando';
    this.aboService.unAbonado(idabonado).subscribe({
      next: (datos) => {
        this.abonado = datos;
        this.facService.getSinCobrarAbo(seccion, idabonado).subscribe({
          next: async (items: any) => {
            this.filtrarFacturasParaNuevoConvenio(items).forEach((item: any) => {
              const query = this._sincobro.find(
                (factura: { idfactura: number }) => factura.idfactura === item.idfactura
              );
              if (query === undefined) {
                this._sincobro.push(item);
              }
            });
            await this.sumTotaltarifa();
            this.swbuscando = false;
            this.txtbuscar = 'Abonado';
          },
          error: (err) => {
            console.error('Al recuperar las planillas sin cobrar por abonado:', err.error);
            this.swbuscando = false;
            this.txtbuscar = 'Abonado';
          },
        });
      },
      error: (err) => {
        console.error('Al recuperar el abonado:', err.error);
        this.swbuscando = false;
        this.txtbuscar = 'Abonado';
      },
    });
  }

  private construirCronogramaPagos() {
    const fechaBase = new Date(this.fecha);
    this.cronogramaPagos = (this.facturas || []).map((item: any, index: number) => {
      const fechaPago = this.addMonthsClamped(fechaBase, index);
      return {
        nrocuota: index + 1,
        valor: Number(item?.totaltarifa ?? 0),
        fecha: fechaPago,
        tipo:
          index === 0
            ? 'Inicial'
            : index === this.facturas.length - 1
              ? 'Final'
              : 'Mensual',
      };
    });
  }

  private addMonthsClamped(baseDate: Date, monthsToAdd: number): Date {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth() + monthsToAdd;
    const day = baseDate.getDate();
    const lastDayOfTargetMonth = new Date(year, month + 1, 0).getDate();
    return new Date(
      year,
      month,
      Math.min(day, lastDayOfTargetMonth),
      baseDate.getHours(),
      baseDate.getMinutes(),
      baseDate.getSeconds(),
      baseDate.getMilliseconds()
    );
  }

  private async cargarConveniosExistentes(idabonado: number): Promise<void> {
    try {
      const resp: any = await firstValueFrom(
        this.convService.buscarConvenios({ cuenta: idabonado, page: 0, size: 20 })
      );
      const convenios = Array.isArray(resp?.content) ? resp.content : [];
      this.conveniosExistentes = convenios.map((item: any) => ({
        ...item,
        estadoConvenioTexto:
          Number(item?.facpendientes ?? 0) > 0 ? 'Pendiente' : 'Al día',
      }));
    } catch (error) {
      console.error('Error cargando convenios existentes:', error);
      this.conveniosExistentes = [];
    }
  }

  private async enviarNotificacionConvenioSiAplica(): Promise<void> {
    const destinatarios = this.parseRecipients(
      this.formConvenio.value.correosNotificacion
    );
    if (!destinatarios.length || !this.newconvenio) {
      return;
    }

    const invalidos = destinatarios.filter((correo) => !this.isValidEmail(correo));
    if (invalidos.length) {
      await Swal.fire(
        'Convenio creado',
        `No se envió la notificación porque hay correos inválidos: ${invalidos.join('; ')}`,
        'warning'
      );
      return;
    }

    try {
      const attachment = await this.buildConvenioAttachment();
      const html = this.buildConvenioEmailHtml();
      await firstValueFrom(
        this.outboxEmailService.sendNotificationEmail({
          to: destinatarios,
          subject: `Convenio de pago N° ${this.newconvenio.nroconvenio}`,
          html,
          text: this.stripHtml(html),
          correlationId: `CONVENIO-${this.newconvenio.idconvenio}-${Date.now()}`,
          attachments: [attachment],
        })
      );
    } catch (error) {
      console.error('Error enviando notificación de convenio:', error);
      await Swal.fire('Convenio creado', this.extractEmailError(error), 'warning');
    }
  }

  private async buildConvenioAttachment(): Promise<OutboxAttachment> {
    const datos = {
      nroconvenio: this.newconvenio.nroconvenio,
      feccrea: this.newconvenio.feccrea ?? this.fecha,
      nomcli:
        this.abonado?.idcliente_clientes?.nombre ?? this.formConvenio.value.nombre,
      referencia: this.newconvenio.referencia,
      totalconvenio: this.newconvenio.totalconvenio,
    };
    const cuotas = this.cronogramaPagos.map((item: any) => ({
      nrocuota: item.nrocuota,
      idfactura: {
        totaltarifa: item.valor,
        feccrea: item.fecha,
      },
    }));
    const blob = this.conveniosReportsService.buildConvenioPdfBlob(datos, cuotas);
    return this.fileToAttachment(
      blob,
      `convenio_${this.newconvenio.nroconvenio}.pdf`
    );
  }

  private buildConvenioEmailHtml(): string {
    const filas = (this.cronogramaPagos || [])
      .map(
        (item: any) => `
          <tr>
            <td style="border:1px solid #ddd;padding:6px 8px;text-align:center;">${item.nrocuota}</td>
            <td style="border:1px solid #ddd;padding:6px 8px;">${item.tipo}</td>
            <td style="border:1px solid #ddd;padding:6px 8px;text-align:right;">${Number(item.valor).toFixed(2)}</td>
            <td style="border:1px solid #ddd;padding:6px 8px;text-align:center;">${this.formatDate(item.fecha)}</td>
          </tr>`
      )
      .join('');

    return `
      <p>Estimado(a) ${this.formConvenio.value.nombre || 'cliente'},</p>
      <p>Se ha generado el convenio de pago N° <strong>${this.newconvenio.nroconvenio}</strong> para la cuenta <strong>${this.formConvenio.value.idabonado}</strong>.</p>
      <p>Adjuntamos el PDF del convenio y a continuación el detalle de pagos:</p>
      <table style="border-collapse:collapse;width:100%;font-size:13px;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="border:1px solid #ddd;padding:6px 8px;">Cuota</th>
            <th style="border:1px solid #ddd;padding:6px 8px;">Tipo</th>
            <th style="border:1px solid #ddd;padding:6px 8px;">Valor</th>
            <th style="border:1px solid #ddd;padding:6px 8px;">Fecha estimada</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
      <p style="margin-top:12px;"><strong>Total convenio:</strong> ${Number(
        this.total || 0
      ).toFixed(2)}</p>
      <p>Atentamente,<br>EPMAPA-T</p>
    `;
  }

  private parseRecipients(raw: string): string[] {
    return String(raw ?? '')
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter((item) => !!item)
      .filter((item, index, arr) => arr.indexOf(item) === index);
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? '').trim());
  }

  private async fileToAttachment(
    file: Blob,
    name: string
  ): Promise<OutboxAttachment> {
    const base64 = await this.blobToBase64(file);
    return {
      name,
      contentType: file.type || 'application/octet-stream',
      base64,
    };
  }

  private blobToBase64(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        resolve(result.includes(',') ? result.split(',')[1] : result);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractEmailError(error: any): string {
    if (typeof error?.error === 'string' && error.error.trim()) {
      return error.error.trim();
    }
    if (
      typeof error?.error?.message === 'string' &&
      error.error.message.trim()
    ) {
      return error.error.message.trim();
    }
    if (typeof error?.message === 'string' && error.message.trim()) {
      return error.message.trim();
    }
    return 'El convenio se creó, pero no se pudo enviar la notificación por correo.';
  }

  private formatDate(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return `${String(date.getDate()).padStart(2, '0')}-${String(
      date.getMonth() + 1
    ).padStart(2, '0')}-${date.getFullYear()}`;
  }

  private filtrarFacturasParaNuevoConvenio(facturas: any[]): any[] {
    const lista = Array.isArray(facturas) ? facturas : [];
    this.facturasConvenioPendientes = lista.filter((item: any) =>
      this.esFacturaDeConvenioPendiente(item)
    );
    return lista.filter((item: any) => !this.esFacturaDeConvenioPendiente(item));
  }

  private esFacturaDeConvenioPendiente(item: any): boolean {
    const idmodulo = Number(item?.idmodulo?.idmodulo ?? item?.idmodulo ?? 0);
    const estado = Number(item?.estado ?? 0);
    return idmodulo === 27 || estado === 2;
  }

  async verDetalleConvenio(convenio: any): Promise<void> {
    this.detalleConvenioSeleccionado = convenio;
    try {
      const cuotas: any = await firstValueFrom(
        this.cuotService.getByIdconvenio(convenio.idconvenio)
      );
      const lista = Array.isArray(cuotas) ? cuotas : [];
      this.facturasConvenioPendientes = lista
        .filter((item: any) => Number(item?.idfactura?.pagado ?? 0) === 0)
        .map((item: any) => ({
          idfactura: item?.idfactura?.idfactura,
          feccrea: item?.idfactura?.feccrea,
          totaltarifa: Number(item?.idfactura?.totaltarifa ?? 0),
          modulo: this.getModuloDescripcion(item?.idfactura),
          nrocuota: item?.nrocuota,
        }));
    } catch (error) {
      console.error('Error cargando detalle del convenio:', error);
      this.facturasConvenioPendientes = [];
    }
  }

  getModuloDescripcion(factura: any): string {
    const descripcionDirecta = String(
      factura?.idmodulo?.descripcion ?? factura?.modulo ?? ''
    ).trim();
    if (descripcionDirecta) return descripcionDirecta;

    const idmodulo = Number(factura?.idmodulo?.idmodulo ?? factura?.idmodulo ?? 0);
    if (!idmodulo) return 'Sin módulo';

    const modulo = Array.isArray(this._modulos)
      ? this._modulos.find(
          (item: any) => Number(item?.idmodulo ?? 0) === idmodulo
        )
      : null;

    return String(modulo?.descripcion ?? `Módulo ${idmodulo}`).trim();
  }
}
