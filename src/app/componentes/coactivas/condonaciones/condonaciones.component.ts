import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Abonados } from 'src/app/modelos/abonados';
import { Clientes } from 'src/app/modelos/clientes';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { CondmultasinteresesService } from 'src/app/servicios/condmultasintereses.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { TmpinteresxfacService } from 'src/app/servicios/tmpinteresxfac.service';

@Component({
  selector: 'app-condonaciones',
  templateUrl: './condonaciones.component.html',
  styleUrls: ['./condonaciones.component.css'],
})
export class CondonacionesComponent implements OnInit {
  f_buscar!: FormGroup;
  f_solicitud!: FormGroup;
  abonado: Abonados = new Abonados();
  cliente: Clientes = new Clientes();
  documentos: Documentos[] = [];
  facturas: any[] = [];
  seleccionadas = new Set<number>();
  resumen = {
    cantidad: 0,
    capital: 0,
    intereses: 0,
    total: 0,
  };
  filtro = '';
  today = new Date().toISOString().slice(0, 10);

  constructor(
    private fb: FormBuilder,
    private coloresService: ColoresService,
    private abonadosService: AbonadosService,
    private clientesService: ClientesService,
    private facturaService: FacturaService,
    private documentosService: DocumentosService,
    private condonacionesService: CondmultasinteresesService,
    private authService: AutorizaService,
    private loadingService: LoadingService,
    private tmpinteresxfacService: TmpinteresxfacService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/condonaciones');
    const coloresJSON = sessionStorage.getItem('/condonaciones');
    if (coloresJSON) {
      this.colocaColor(JSON.parse(coloresJSON));
    } else {
      this.buscaColor();
    }

    this.f_buscar = this.fb.group({
      cuenta: ['', Validators.required],
      fechatope: [this.today, Validators.required],
    });
    this.f_solicitud = this.fb.group({
      documento: [null],
      numeroDocumento: ['', [Validators.required, Validators.minLength(3)]],
      fechaDocumento: [this.today],
      razonExoneracion: ['', [Validators.required, Validators.minLength(5)]],
    });
    this.cargarDocumentos();
    this.route.queryParamMap.subscribe((params) => {
      const cuenta = params.get('cuenta');
      if (cuenta) {
        this.f_buscar.patchValue({ cuenta });
        this.buscarFacturas();
      }
    });
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(this.authService.idusuario, 'condonaciones');
      sessionStorage.setItem('/condonaciones', JSON.stringify(datos));
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  cargarDocumentos() {
    this.documentosService.getListaDocumentos().subscribe({
      next: (docs) => {
        this.documentos = docs || [];
        if (this.documentos.length > 0) {
          this.f_solicitud.patchValue({ documento: this.documentos[0] });
        }
      },
      error: (e) => console.error(e),
    });
  }

  async buscarFacturas() {
    if (this.f_buscar.invalid) {
      this.authService.swal('warning', 'Debe ingresar una cuenta valida.');
      return;
    }

    this.loadingService.showLoading();
    this.facturas = [];
    this.seleccionadas.clear();
    this.resetResumen();

    try {
      const cuenta = Number(this.f_buscar.value.cuenta);
      const abonados: any = await this.abonadosService.getByidabonado(cuenta).toPromise();
      const abonado = Array.isArray(abonados) ? abonados[0] : abonados;
      if (!abonado) {
        this.authService.swal('warning', 'No se encontro el abonado.');
        return;
      }
      this.abonado = abonado;

      const idcliente = abonado.idresponsable?.idcliente || abonado.idcliente_clientes?.idcliente;
      this.cliente = await this.clientesService.getListaById(idcliente).toPromise();

      const facturas = await this.facturaService.getFacturasForRemisionabonados(
        idcliente,
        cuenta,
        this.f_buscar.value.fechatope
      );

      const enriquecidas = await Promise.all((facturas || []).map(async (item: any) => {
        const interes = await this.obtenerInteresVigente(item);
        return {
          ...item,
          interes,
          capital: Number(item.total ?? 0),
          totalActual: Number(item.total ?? 0) + interes,
          estadoLabel: item.pagado === 1 ? 'Pagada' : 'Pendiente',
          exonerable: interes > 0,
        };
      }));

      this.facturas = enriquecidas.filter((item) => item.exonerable);
      if (!this.facturas.length) {
        this.authService.swal('info', 'No hay facturas candidatas para exoneracion.');
      }
    } catch (error) {
      console.error(error);
      this.authService.swal('error', 'No se pudo obtener la informacion de facturas.');
    } finally {
      this.loadingService.hideLoading();
    }
  }

  async obtenerInteresVigente(item: any): Promise<number> {
    try {
      const valor = await this.tmpinteresxfacService.getByIdFactura(item.idfactura);
      return Number(valor ?? 0);
    } catch {
      return Number(item.intereses ?? item.interes ?? 0);
    }
  }

  toggleFactura(factura: any, event: any) {
    if (!factura?.idfactura) {
      return;
    }
    if (event.target.checked) {
      this.seleccionadas.add(factura.idfactura);
    } else {
      this.seleccionadas.delete(factura.idfactura);
    }
    this.actualizarResumen();
  }

  estaSeleccionada(idfactura: number): boolean {
    return this.seleccionadas.has(idfactura);
  }

  actualizarResumen() {
    const items = this.facturas.filter((item) => this.seleccionadas.has(item.idfactura));
    this.resumen = {
      cantidad: items.length,
      capital: items.reduce((acc, item) => acc + Number(item.capital || 0), 0),
      intereses: items.reduce((acc, item) => acc + Number(item.interes || 0), 0),
      total: items.reduce((acc, item) => acc + Number(item.interes || 0), 0),
    };
  }

  resetResumen() {
    this.resumen = { cantidad: 0, capital: 0, intereses: 0, total: 0 };
  }

  async registrarSolicitud() {
    if (this.f_solicitud.invalid) {
      this.f_solicitud.markAllAsTouched();
      this.authService.swal('warning', 'Debe ingresar el numero de documento y la razon de exoneracion.');
      return;
    }
    const items = this.facturas
      .filter((item) => this.seleccionadas.has(item.idfactura))
      .map((item) => ({
        idfactura: item.idfactura,
        totalinteres: Number(item.interes || 0),
        totalmultas: 0,
      }));

    if (!items.length) {
      this.authService.swal('warning', 'Debe seleccionar al menos una factura.');
      return;
    }

    const confirmado = await Swal.fire({
      title: 'Registrar solicitud',
      text: 'Esta accion registrara la solicitud para revision y aprobacion. La exoneracion todavia no sera aplicada hasta que un segundo usuario autorizado la apruebe.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Registrar',
      cancelButtonText: 'Cancelar',
    });

    if (!confirmado.isConfirmed) {
      return;
    }

    this.loadingService.showLoading();
    this.condonacionesService
      .crearSolicitud(
        {
          razoncondonacion: this.f_solicitud.value.razoncondonacion,
          razonExoneracion: this.f_solicitud.value.razonExoneracion,
          documento: this.f_solicitud.value.documento,
          numeroDocumento: this.f_solicitud.value.numeroDocumento,
          fechaDocumento: this.f_solicitud.value.fechaDocumento,
          items,
        },
        this.authService.idusuario
      )
      .subscribe({
        next: () => {
          this.loadingService.hideLoading();
          this.authService.swal('success', 'Solicitud registrada correctamente.');
          this.router.navigate(['/condonaciones-pendientes']);
        },
        error: (e) => {
          this.loadingService.hideLoading();
          console.error(e);
          this.authService.swal('error', e?.error?.message || 'No se pudo registrar la solicitud.');
        },
      });
  }
}
