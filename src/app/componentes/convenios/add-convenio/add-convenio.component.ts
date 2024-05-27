import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Convenios } from 'src/app/modelos/convenios.model';
import { Cuotas } from 'src/app/modelos/cuotas.model';
import { Facxconvenio } from 'src/app/modelos/facxconvenio.model';
import { Rubroxfac } from 'src/app/modelos/rubroxfac.model';
import { ConveniosComponent } from '../convenios/convenios.component';
import { Facturas } from 'src/app/modelos/facturas.model';
import { ConvenioService } from 'src/app/servicios/convenio.service';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { FacxconvenioService } from 'src/app/servicios/facxconvenio.service';
import { CuotasService } from 'src/app/servicios/cuotas.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { Clientes } from 'src/app/modelos/clientes';
import { Abonados } from 'src/app/modelos/abonados';
import { Modulos } from 'src/app/modelos/modulos.model';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ModulosService } from 'src/app/servicios/modulos.service';
import { Rubros } from 'src/app/modelos/rubros.model';
import { map } from 'rxjs';

@Component({
  selector: 'app-add-convenio',
  templateUrl: './add-convenio.component.html',
  styleUrls: ['./add-convenio.component.css'],
})
export class AddConvenioComponent implements OnInit {
  cliente: Clientes = new Clientes();

  formConvenio: FormGroup;
  _modulos: any;
  rubros: any = [];
  modulo27: any = { idmodulo: 27 };
  abonado: Abonados;
  nropagos: number = 0;
  pagomensual: number = 0;
  fecha = new Date();
  _sincobro: any;
  total: number;
  swbuscando: boolean;
  txtbuscar: string = 'Abonado';
  swcalcular: boolean;
  facturas: any = [];
  idabonado: number;
  newconvenio: any;
  swcalculando: boolean;
  txtcalcular: string = 'Calcular';
  idmodulo: number = 3;
  seccion: Modulos = new Modulos();
  f_nuevosValores: FormGroup;
  porcentaje: number = 0.2;
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
    private moduService: ModulosService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/convenios');
    let coloresJSON = sessionStorage.getItem('/convenios');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

    this.formConvenio = this.fb.group(
      {
        seccion: this.seccion,
        idabonado: ['', Validators.required],
        nroconvenio: ['', Validators.required, this.valNroconvenio.bind(this)],
        referencia: ['', Validators.required],
        nroautorizacion: ['', Validators.required],
        cuotainicial: ['', Validators.required],
        cuotas: [
          '',
          [Validators.required, Validators.min(2), Validators.max(12)],
        ],
        cuotafinal: ['', Validators.required],
        observaciones: '',
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

    this.modulos();
    this.siguienteNroconvenio();
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
    this.formConvenio.value.seccion = +e.target.value!;
    this.idmodulo = this.formConvenio.value.seccion;
  }

  siguienteNroconvenio() {
    this.convService.siguienteNroconvenio().subscribe({
      next: (x) => this.formConvenio.patchValue({ nroconvenio: x }),
      error: (err) =>
        console.error('Al obtener el última Nroconvenio', err.error),
    });
  }

  buscarFacxAbo() {
    let idabonado = this.formConvenio.value.idabonado;
    if (idabonado) {
      this.swbuscando = true;
      this.txtbuscar = 'Buscando';
      this.aboService.unAbonado(this.formConvenio.value.idabonado).subscribe({
        next: (datos) => {
          this.abonado = datos;
          /* this.facService.getSinCobrarAboMod(idabonado).subscribe({
            next: (datos) => {
              console.log(datos);
            },
            error: (e) => console.error(e),
          }); */
          //this.facService.getSinCobrarAboMod(this.idmodulo, idabonado).subscribe({
          this.facService.getSinCobrarAboMod(idabonado).subscribe({
            next: (datos) => {
              console.log(datos);
              this._sincobro = datos;
              this.formConvenio.controls['cedula'].setValue(
                this.abonado.idcliente_clientes.cedula
              );
              this.formConvenio.controls['nombre'].setValue(
                this.abonado.idcliente_clientes.nombre
              );
              this.sumTotaltarifa();
              this.pagomensual = 0;
              this.formConvenio.controls['cuotas'].setValue('');
              this.nropagos = 0;
              this.formConvenio.controls['cuotafinal'].setValue('');
              this.swbuscando = false;
              this.txtbuscar = 'Abonado';
            },
            error: (err) =>
              console.error(
                'Al recuperar las Planillas sin cobrar por Abonado: ',
                err.error
              ),
          });
        },
        error: (err) => console.error('Al recuperar el Abonado: ', err.error),
      });
    } else {
      this._sincobro = null;
      this.formConvenio.controls['nombre'].setValue('');
      this.formConvenio.controls['cuotainicial'].setValue('');
    }
  }

  get f() {
    return this.formConvenio.controls;
  }

  sumTotaltarifa() {
    let suma: number = 0;
    let i = 0;
    let com = 0;
    this._sincobro.forEach(() => {
      if (
        this._sincobro[i].idmodulo.idmodulo === 3 &&
        this._sincobro[i].idabonado != null
      ) {
        com = 1;
      }
      suma += this._sincobro[i].totaltarifa + com;
      i++;
    });
    this.total = suma;
    let cuotainicial = Math.round(this.total * this.porcentaje * 100) / 100;
    this.formConvenio.controls['cuotainicial'].setValue(cuotainicial);
  }
  sumComercializacion(sincobro: any) {
    let com = 0;
    if (sincobro.idmodulo.idmodulo === 3 && sincobro.idabonado != null) {
      com = 1;
      return sincobro.totaltarifa + com;
    }
    return sincobro.totaltarifa;
  }

  changeCuotainicial() {
    this.formConvenio
      .get('cuotainicial')!
      .valueChanges.subscribe((cuotainicial) => {
        console.log(cuotainicial);
        console.log(this.total);
        this.porcentaje = (cuotainicial * 100) / this.total / 100;
        console.log(this.porcentaje);
        this.pagomensual = 0;
        this.nropagos = 0;
        this.formConvenio.controls['cuotafinal'].setValue('');
        this.formConvenio.controls['pagomensual'].setValue('');
        this.formConvenio.controls['totalpago'].setValue('');
        let cuotas = this.formConvenio.value.cuotas;
        this.swcalcular = false;
        if (cuotainicial > 0 && cuotas >= 2) this.swcalcular = true;
      });
  }

  changeCuotas() {
    this.formConvenio.get('cuotas')!.valueChanges.subscribe((cuotas) => {
      let cuotainicial = this.formConvenio.value.cuotainicial;
      this.swcalcular = false;
      if (cuotainicial > 0 && cuotas >= 2) this.swcalcular = true;
    });
  }

  calcular() {
    this.swcalculando = true;
    this.txtcalcular = 'Calculando';
    this.facturas = [];
    this.rubros = [];
    let cuotainicial = this.formConvenio.value.cuotainicial;
    let cuotas = this.formConvenio.value.cuotas;
    console.log('cuotainicial: ', cuotainicial, 'cuotas: ', cuotas);
    this.nropagos = cuotas - 1;
    this.pagomensual = 0;
    if (this.nropagos > 0)
      this.pagomensual =
        Math.round(((this.total - cuotainicial) / cuotas) * 100) / 100;
    this.formConvenio.controls['pagomensual'].setValue(this.pagomensual);
    let totalpago = Math.round(this.pagomensual * this.nropagos * 100) / 100;
    this.formConvenio.controls['totalpago'].setValue(totalpago);
    let cuotafinal =
      Math.round(
        (this.total - cuotainicial - this.pagomensual * this.nropagos) * 100
      ) / 100;
    this.formConvenio.controls['cuotafinal'].setValue(cuotafinal);

    let i = 0;
    this.totaltarifaFacturas();
    this.sumaRubros(i);
  }

  //Guarda en un arreglo totaltarifa de las facturas a generar
  totaltarifaFacturas() {
    //Cuota inicial
    let cuotainicial = this.formConvenio.value.cuotainicial;
    let r: any = {};
    r = {
      totaltarifa: cuotainicial,
      porcentaje: Math.round((cuotainicial / this.total) * 100) / 100,
    };
    this.facturas.push(r);
    //Cuotas mensuales
    let cuotas = this.formConvenio.value.cuotas;
    let pagomensual = this.formConvenio.value.pagomensual;
    for (let i = 0; i < cuotas - 1; i++) {
      r = {
        totaltarifa: pagomensual,
        porcentaje: Math.round((pagomensual / this.total) * 100) / 100,
      };
      this.facturas.push(r);
    }
    //Cuota final
    let cuotafinal = this.formConvenio.value.cuotafinal;
    r = {
      totaltarifa: cuotafinal,
      porcentaje: Math.round((cuotafinal / this.total) * 100) / 100,
    };
    this.facturas.push(r);
  }

  //Calcula y guarda en el arreglo this.rubros los totales de cada rubro de las facturas que se 'convenian'
  sumaRubros(i: number) {
    let r: any = {};
    this.rubxfacService.getByIdfactura(this._sincobro[i].idfactura).subscribe({
      next: (datos: any) => {
        console.log(datos);
        let j = 0;
        datos.forEach(() => {
          r = {
            idrubro: datos[j].idrubro_rubros.idrubro,
            valorunitario: +datos[j].valorunitario.toFixed(2)!,
          };
          let indice = this.rubros.findIndex(
            (rubro: { idrubro: number }) => rubro.idrubro === r.idrubro
          );
          if (indice == -1) this.rubros.push(r);
          else
            this.rubros[indice].valorunitario =
              Math.round(
                (this.rubros[indice].valorunitario + r.valorunitario) * 100
              ) / 100;
          j++;
          console.log(r);
          console.log(this.rubros);
        });
        i++;
        if (i < this._sincobro.length) this.sumaRubros(i);
        else {
          this.swcalculando = false;
          this.txtcalcular = 'Calcular';
        }
      },
      error: (err) => console.error(err.error),
    });
  }

  guardar() {
    let abonado: Abonados = new Abonados();
    abonado.idabonado = this.formConvenio.value.idabonado;
    let convenio: Convenios = new Convenios();
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
        this.creaFacturas();
      },
      error: (err) => console.error(err.error),
    });
  }

  async creaFacturas() {
    await this.facturasAsync();
    await this.facxconvenioAsync();
    sessionStorage.removeItem('desdeconvenio'); //Para que vuelva a buscar los últimos y se muestre el creado
    this.router.navigate(['convenios']);
  }

  //Nuevas Facturas
  async facturasAsync() {
    let fecha = new Date();
    for (let i = 0; i < this.facturas.length; i++) {
      let factura: Facturas = new Facturas();
      this.cliente = this.abonado.idcliente_clientes;
      factura.idcliente = this.cliente;
      factura.idabonado = this.formConvenio.value.idabonado;
      factura.idmodulo = this.modulo27;
      factura.totaltarifa = this.facturas[i].totaltarifa;
      factura.formapago = 1;
      factura.estado = 2; //2=Convenio de pago
      factura.pagado = 0;
      factura.porcexoneracion = 0;
      factura.conveniopago = 0;
      factura.estadoconvenio = 0;
      factura.usucrea = this.authService.idusuario;
      factura.feccrea = fecha;
      factura.valorbase = this.facturas[i].totaltarifa;
      try {
        const nuevafac = await this.facService.saveFacturaAsync(factura);
        await this.generarCuotas(i, nuevafac);
        await this.rubroxfac(i, nuevafac);
      } catch (error) {
        console.error(`Al guardar la Factura ${i}`, error);
      }
      fecha.setMonth(fecha.getMonth() + 1);
    }
  }

  //Cuotas del convenio (Tabla cuotas)
  async generarCuotas(i: number, factura: any) {
    let cuota: Cuotas = new Cuotas();
    cuota.nrocuota = i + 1;
    cuota.idfactura = factura;
    cuota.idconvenio_convenios = this.newconvenio;
    cuota.usucrea = this.authService.idusuario;
    cuota.feccrea = this.fecha;
    try {
      await this.cuotService.saveCuotaAsync(cuota);
    } catch (error) {
      console.error(`Al guardar la Cuota: `, error);
    }
  }

  async rubroxfac(i: number, factura: any) {
    for (let j = 0; j < this.rubros.length; j++) {
      let rxf: Rubroxfac = new Rubroxfac();
      rxf.cantidad = 1;
      rxf.estado = 1;
      console.log(this.facturas[i].porcentaje);
      rxf.valorunitario =
        Math.round(
          this.rubros[j].valorunitario * this.facturas[i].porcentaje * 100
        ) / 100;
      rxf.idfactura_facturas = factura;
      const rubro: Rubros = new Rubros();
      rubro.idrubro = this.rubros[j].idrubro;
      rxf.idrubro_rubros = rubro;
      try {
        console.log(rxf);
        await this.rxfService.saveRubroxfacAsync(rxf);
      } catch (error) {
        console.error(`Al guardar Rubroxfac ${j}`, error);
      }
    }
  }

  async facxconvenioAsync() {
    let facxconv: Facxconvenio = new Facxconvenio();
    for (let k = 0; k < this._sincobro.length; k++) {
      facxconv.idconvenio_convenios = this.newconvenio;
      facxconv.idfactura_facturas = this._sincobro[k];
      try {
        await this.facxconvService.saveFacxconvenioAsync(facxconv);
        await this.actuAntiguas(k);
      } catch (error) {
        console.error(`Al guardar facxconvebnio ${k}`, error);
      }
    }
  }

  async actuAntiguas(k: number) {
    let fac: any;
    fac = this._sincobro[k];
    fac.conveniopago = this.newconvenio.nroconvenio;
    fac.fechaconvenio = this.fecha;
    fac.estadoconvenio = 1;
    fac.usumodi = this.authService.idusuario;
    fac.fecmodi = this.fecha;
    try {
      await this.facService.updateFacturaAsync(fac);
    } catch (error) {
      console.error(`Al actualizar las Antiguas ${k}`, error);
    }
  }

  regresar() {
    this.router.navigate(['convenios']);
  }

  valNroconvenio(control: AbstractControl) {
    return this.convService
      .valNroconvenio(control.value)
      .pipe(map((result) => (result ? { existe: true } : null)));
  }
  /* AÑADIR NUEVOS VALORES */
  addValores() {
    let seccion = this.f_nuevosValores.value.seccion;
    let idabonado = this.formConvenio.value.idabonado;
    if (idabonado) {
      this.swbuscando = true;
      this.txtbuscar = 'Buscando';
      this.aboService.unAbonado(this.formConvenio.value.idabonado).subscribe({
        next: (datos) => {
          this.abonado = datos;
          this.facService.getSinCobrarAbo(seccion, idabonado).subscribe({
            next: (datos: any) => {
              datos.forEach((item: any) => {
                let query = this._sincobro.find(
                  (factura: { idfactura: number }) =>
                    factura.idfactura === item.idfactura
                );
                if (query === undefined) {
                  this._sincobro.push(item);
                }
              });
              console.log(this._sincobro);
              this.sumTotaltarifa();
            },
            error: (err) =>
              console.error(
                'Al recuperar las Planillas sin cobrar por Abonado: ',
                err.error
              ),
          });
        },
        error: (err) => console.error('Al recuperar el Abonado: ', err.error),
      });
    } else {
      this._sincobro = null;
      this.formConvenio.controls['nombre'].setValue('');
      this.formConvenio.controls['cuotainicial'].setValue('');
    }
  }
}
