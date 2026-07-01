import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Abonados } from 'src/app/modelos/abonados';
import { Aboxsuspension } from 'src/app/modelos/aboxsuspension';
import { Clientes } from 'src/app/modelos/clientes';
import { Facturas } from 'src/app/modelos/facturas.model';
import { Suspensiones } from 'src/app/modelos/suspensiones';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { AboxsuspensionService } from 'src/app/servicios/aboxsuspension.service';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { SuspensionesService } from 'src/app/servicios/suspensiones.service';

@Component({
  selector: 'app-habilitaciones',
  templateUrl: './habilitaciones.component.html',
  styleUrls: ['./habilitaciones.component.css'],
})
export class HabilitacionesComponent implements OnInit {
  titulo: string = 'Habilitaciones';
  f_buscarxFechas: FormGroup;
  f_habilitacion: FormGroup;
  today: string = this.formatDateForInput(new Date());
  startOfYear: string = this.formatDateForInput(new Date(new Date().getFullYear(), 0, 1));
  filterTerm: string;
  suspensiones: any[] = [];
  abonado: Abonados = new Abonados();
  cliente: Clientes = new Clientes();
  habilitacion: Suspensiones = new Suspensiones();
  aboxsuspension: Aboxsuspension = new Aboxsuspension();
  suspensionOrigen: Suspensiones | null = null;
  l_habilitaciones: boolean = true;
  l_documentos: any;
  btn_habilitacion: boolean = true;
  mensajeSeleccion = '';
  mensajeFactura = '';
  facturaValidada: Facturas | null = null;
  buscandoFactura = false;
  ultimaFacturaConsultada: number | null = null;
  habilitacionesRegistradas: Suspensiones[] = [];
  estado = [
    { valor: 1, estado: 'Activo' },
    { valor: 2, estado: 'Suspendido' },
    { valor: 3, estado: 'Suspendido y retirado' },
  ];
  date: Date = new Date();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private suspeService: SuspensionesService,
    private s_abonado: AbonadosService,
    private s_aboxsuspension: AboxsuspensionService,
    private s_documentos: DocumentosService,
    private facturaService: FacturaService,
    private coloresService: ColoresService,
    private authService: AutorizaService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/habilitaciones');
    let coloresJSON = sessionStorage.getItem('/habilitaciones');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    this.f_buscarxFechas = this.fb.group({
      desde: [this.startOfYear],
      hasta: [this.today],
    });
    this.f_habilitacion = this.fb.group({
      numero: '',
      numdoc: '',
      iddocumento_documentos: '',
      factura: '',
      observacion: '',
    });
    this.buscarxFecha();
    this.getLastHabilitacion();
    this.listarDocumentos();
    this.cargarHabilitacionesRegistradas();
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, 'habilitaciones');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/habilitaciones', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  listarSuspensiones() {
    this.suspeService.getListaHabilitaciones().subscribe({
      next: (datos) => {
        this.suspensiones = Array.isArray(datos) ? datos : [];
      },
      error: (e) => console.error(e),
    });
  }

  buscarxFecha() {
    if (
      this.f_buscarxFechas.value.desde !== null &&
      this.f_buscarxFechas.value.hasta !== null
    ) {
      this.suspeService
        .getListaHabilitacionesByFecha(
          this.f_buscarxFechas.value.desde,
          this.f_buscarxFechas.value.hasta
        )
        .subscribe({
          next: (datos) => {
            this.suspensiones = Array.isArray(datos) ? datos : [];
          },
          error: (e) => console.error(e),
        });
    } else {
      let i_desde = document.getElementById('desde') as HTMLInputElement;
      let i_hasta = document.getElementById('hasta') as HTMLInputElement;
      i_desde.style.border = '#F54500 1px solid';
      i_hasta.style.border = '#F54500 1px solid';
      setTimeout(() => {
        i_desde.style.border = '';
        i_hasta.style.border = '';
      }, 2000);
    }
  }

  listarDocumentos() {
    this.s_documentos.getListaDocumentos().subscribe({
      next: (datos) => {
        this.l_documentos = datos;
        const documentoPorDefecto = (this.l_documentos || []).find((documento: any) =>
          this.esDocumentoNinguno(documento)
        );
        if (documentoPorDefecto) {
          this.f_habilitacion.patchValue({
            iddocumento_documentos: documentoPorDefecto,
          });
        }
      },
      error: (e) => console.error(e),
    });
  }

  cargarHabilitacionesRegistradas() {
    this.suspeService.getListaHabilitaciones().subscribe({
      next: (datos) => {
        this.habilitacionesRegistradas = Array.isArray(datos) ? datos : [];
      },
      error: (e) => console.error(e),
    });
  }

  habilitarMedidor() {
    if (!this.facturaEstaPagada()) {
      this.mensajeFactura = 'Debes ingresar una factura pagada para continuar.';
      return;
    }
    if (this.facturaYaUsadaEnHabilitacion(this.facturaValidada?.idfactura)) {
      this.facturaValidada = null;
      this.mensajeFactura = 'La factura ingresada ya fue registrada en otra habilitación.';
      return;
    }
    this.abonado.estado = 1;
    this.s_abonado.updateAbonadoAuditoria(
      this.abonado,
      this.authService.idusuario,
      this.f_habilitacion.value.observacion || 'Habilitación de medidor',
      'HABILITACION'
    ).subscribe({
      next: () => {
        this.l_habilitaciones = true;
        this.guardarHabilitacion();
      },
      error: (e) => console.error(e),
    });
  }

  getLastHabilitacion() {
    this.suspeService.getUltimoPorTipo(1).subscribe({
      next: (datos: any) => {
        if(datos != null){
          this.f_habilitacion.patchValue({
            numero: datos.numero + 1,
          });
        }else{
          this.f_habilitacion.patchValue({
            numero: 1
          })
        }

      },
    });
  }

  guardarHabilitacion() {
    this.habilitacion.usucrea = this.authService.idusuario;
    this.habilitacion.feccrea = this.date;
    this.habilitacion.numero = this.f_habilitacion.value.numero;
    this.habilitacion.tipo = 1;
    this.habilitacion.idsuspension_origen = this.suspensionOrigen ?? undefined;
    this.habilitacion.fecha = this.date;
    this.habilitacion.numdoc = this.f_habilitacion.value.numdoc;
    const documentoSeleccionado =
      this.f_habilitacion.value.iddocumento_documentos ||
      (this.l_documentos || []).find((documento: any) => this.esDocumentoNinguno(documento));
    this.habilitacion.iddocumento_documentos = documentoSeleccionado;
    this.habilitacion.observa = this.f_habilitacion.value.observacion;
    this.habilitacion.idfactura_facturas = this.facturaValidada ?? undefined;
    this.habilitacion.factura = this.facturaValidada?.idfactura;
    this.habilitacion.total = 1;
    this.suspeService.saveSuspension(this.habilitacion).subscribe({
      next: (datos: any) => {
        this.aboxsuspension.idsuspension_suspensiones = datos;
        this.aboxsuspension.idabonado_abonados = this.abonado;
        this.s_aboxsuspension
          .saveAboxSuspension(this.aboxsuspension)
          .subscribe({
            next: (datos) => {
              window.location.reload();
            },
            error: (e) => console.error(e),
          });
      },
      error: (e) => console.error(e),
    });
  }

  async setAbonado(abonado: any) {
    this.mensajeSeleccion = '';
    this.mensajeFactura = '';
    this.facturaValidada = null;
    this.ultimaFacturaConsultada = null;
    this.f_habilitacion.patchValue({ factura: '' });
    if (![0, 2, 3].includes(Number(abonado?.estado))) {
      this.mensajeSeleccion = 'Solo se pueden habilitar cuentas con estado 0, suspendidas o suspendidas y retiradas.';
      return;
    }

    this.abonado = abonado;
    this.cliente = abonado.idcliente_clientes;
    this.suspensionOrigen = null;
    this.l_habilitaciones = false;
    this.btn_habilitacion = abonado.estado === 1;

    try {
      const relacion: any = await firstValueFrom(
        this.s_aboxsuspension.getUltimaSuspensionActivaByAbonado(abonado.idabonado)
      );
      if (relacion?.idsuspension_suspensiones?.idsuspension) {
        this.suspensionOrigen = relacion.idsuspension_suspensiones;
        this.mensajeSeleccion = `Se encontró la suspensión origen #${this.suspensionOrigen?.numero}.`;
      } else {
        this.mensajeSeleccion = 'La cuenta no consta en la lista de suspensiones activas, pero puedes registrar la habilitación.';
      }
    } catch (e) {
      this.mensajeSeleccion = 'No fue posible obtener la suspensión de origen. La habilitación se registrará sin ese enlace.';
      console.error(e);
    }
  }

  buscarFactura() {
    const facturaId = Number(this.f_habilitacion.value.factura);

    if (!Number.isFinite(facturaId) || facturaId <= 0) {
      this.facturaValidada = null;
      this.ultimaFacturaConsultada = null;
      this.mensajeFactura = 'Ingresa un id de factura válido.';
      return;
    }

    if (
      this.ultimaFacturaConsultada === facturaId &&
      (this.facturaValidada?.idfactura === facturaId || !!this.mensajeFactura)
    ) {
      return;
    }

    this.facturaValidada = null;
    this.mensajeFactura = '';
    this.ultimaFacturaConsultada = facturaId;

    this.buscandoFactura = true;
    this.facturaService.getById(facturaId).subscribe({
      next: (factura: Facturas) => {
        this.buscandoFactura = false;
        if (!factura?.idfactura) {
          this.mensajeFactura = 'No se encontró la factura ingresada.';
          return;
        }
        if (Number(factura.pagado) !== 1) {
          this.mensajeFactura = 'La factura existe, pero todavía no registra pago.';
          return;
        }
        if (this.facturaYaUsadaEnHabilitacion(factura.idfactura)) {
          this.mensajeFactura = 'La factura ingresada ya fue registrada en otra habilitación.';
          return;
        }
        this.facturaValidada = factura;
        this.mensajeFactura = `Factura #${factura.idfactura} validada correctamente.`;
      },
      error: (e) => {
        this.buscandoFactura = false;
        this.mensajeFactura = 'No fue posible consultar la factura.';
        console.error(e);
      },
    });
  }

  onFacturaBlur() {
    this.buscarFactura();
  }

  onFacturaEnter(event: Event) {
    event.preventDefault();
    this.buscarFactura();
  }

  facturaEstaPagada(): boolean {
    return Number(this.facturaValidada?.pagado) === 1;
  }

  puedeGuardar(): boolean {
    return !this.btn_habilitacion && this.facturaEstaPagada() && !this.buscandoFactura;
  }

  private facturaYaUsadaEnHabilitacion(idfactura?: number): boolean {
    const facturaId = Number(idfactura ?? 0);
    if (!Number.isFinite(facturaId) || facturaId <= 0) {
      return false;
    }

    return (this.habilitacionesRegistradas || []).some((habilitacion: any) => {
      const facturaRegistrada = Number(
        habilitacion?.idfactura_facturas?.idfactura ??
        habilitacion?.factura ??
        0
      );
      return facturaRegistrada === facturaId;
    });
  }

  private esDocumentoNinguno(documento: any): boolean {
    const nombre = String(documento?.nomdoc ?? '')
      .trim()
      .toLowerCase();
    return nombre === '(ninguno)' || nombre === 'ninguno';
  }

  setEstado(estado: number) {
    let es = this.estado.find(
      (_estado: { valor: number }) => _estado.valor == estado
    );
    return es?.estado;
  }

  getTipoLabel(tipo: number): string {
    switch (Number(tipo)) {
      case 1:
        return 'Habilitación';
      case 2:
        return 'Suspensión';
      case 3:
        return 'Suspensión y retiro';
      default:
        return `${tipo ?? ''}`;
    }
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
