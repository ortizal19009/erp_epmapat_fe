import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, firstValueFrom } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Convenios } from 'src/app/modelos/convenios.model';
import { ConvenioService } from 'src/app/servicios/convenio.service';
import { CuotasService } from 'src/app/servicios/cuotas.service';
import { FacxconvenioService } from 'src/app/servicios/facxconvenio.service';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { NtacreditoService } from 'src/app/servicios/ntacredito.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { Ntacredito } from 'src/app/modelos/ntacredito';

@Component({
  selector: 'app-anular-convenio',
  templateUrl: './anular-convenio.component.html',
  styleUrls: ['./anular-convenio.component.css'],
})
export class AnularConvenioComponent implements OnInit {
  _convenio: any;

  _cuotas: any[] = [];
  _facxconvenio: any[] = [];

  // ✅ listas para tablas desplegables
  facNuevas: any[] = [];
  facViejas: any[] = [];
  facturasPagadas: any[] = [];

  // ✅ estados UI
  loading = false;
  error: string | null = null;
  modalVisible = false;
  modalError: string | null = null;
  modalProcessing = false;

  notaCreditoForm!: FormGroup;
  documentos: any[] = [];
  // configura cuántos días después de feccrea vence (ajusta a tu regla real)
  DIAS_VENCIMIENTO = 30;

  // flags UI
  tieneFacturaVencidaNueva = false;
  cantVencidasNuevas = 0;

  tieneFacturaPagadaNueva = false;
  tieneFacturaPendienteNueva = false;
  modo: 'anular' | 'eliminar' = 'anular';
  isAnulacion = true; // En esta vista de anulación no debe mostrarse botón Eliminar

  constructor(
    private actRouter: ActivatedRoute,
    private s_convenio: ConvenioService,
    private s_cuota: CuotasService,
    private s_facxconvenios: FacxconvenioService,
    private s_documentos: DocumentosService,
    private s_ntacredito: NtacreditoService,
    private facturaService: FacturaService,
    private authService: AutorizaService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.notaCreditoForm = this.fb.group({
      iddocumento_documentos: [null, Validators.required],
      refdocumento: ['', [Validators.required, Validators.maxLength(30)]],
      observacion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(300)]],
    });

    this.getDocumentos();

    const idconvenio = Number(
      this.actRouter.snapshot.paramMap.get('idconvenio')
    );
    const modo = this.actRouter.snapshot.queryParamMap.get('modo');
    this.modo = modo === 'eliminar' ? 'eliminar' : 'anular';
    this.isAnulacion = this.modo === 'anular';

    if (!idconvenio) {
      this.error = 'No se encontró el convenio.';
      return;
    }
    this.getDatosConvenio(idconvenio);
  }

  getDocumentos() {
    this.s_documentos.getListaDocumentos().subscribe({
      next: (datos: any[]) => {
        this.documentos = datos ?? [];
      },
      error: (e: any) => {
        console.error(e);
      }
    });
  }

  getDatosConvenio(idconvenio: number) {
    this.loading = true;
    this.error = null;

    // ✅ Mejor: cargar todo junto
    forkJoin({
      convenio: this.s_convenio.getById(idconvenio),
      cuotas: this.s_cuota.getByIdconvenio(idconvenio),
      facxconvenio: this.s_facxconvenios.getFacByConvenio(idconvenio),
    }).subscribe({
      next: (res: any) => {
      console.log(res)
        this._convenio = res.convenio;
        this._cuotas = Array.isArray(res.cuotas) ? res.cuotas : [];
        this._facxconvenio = Array.isArray(res.facxconvenio)
          ? res.facxconvenio
          : [];

        // ✅ separar facturas
        this.separarFacturas();
        this.separarFacturas();
        this.calcularReglasBotones();
        this.separarFacturas();
        this.recalcularVencidas();

        this.loading = false;
      },
      error: (e: any) => {
        console.error(e);
        this.error = 'No se pudieron cargar los datos del convenio.';
        this.loading = false;
      },
    });
  }

  toggleFacturas() {
    const $nuevas = $('#collapseFacNuevas') as any;
    const $viejas = $('#collapseFacViejas') as any;

    const abiertas = $nuevas.hasClass('show') || $viejas.hasClass('show');

    if (abiertas) {
      $nuevas.collapse('hide');
      $viejas.collapse('hide');
    } else {
      $nuevas.collapse('show');
      $viejas.collapse('show');
    }
  }

  /**
   * ✅ Aquí defines la lógica real para separar "nuevas" vs "viejas"
   * Ajusta los campos según tu API.
   */
  private getIdFactura(x: any): number | null {
    if (!x) return null;

    // Caso: idfactura es número
    if (typeof x === 'number') return x;

    // Caso: idfactura es objeto { idfactura: 123 }
    if (typeof x === 'object') {
      if (typeof x.idfactura === 'number') return x.idfactura;

      // Caso raro: { id: 123 }
      if (typeof x.id === 'number') return x.id;

      // Caso: { idfactura_facturas: { idfactura: 123 } }
      if (
        x.idfactura_facturas &&
        typeof x.idfactura_facturas.idfactura === 'number'
      ) {
        return x.idfactura_facturas.idfactura;
      }
    }

    return null;
  }

  public esPagadaNueva(f: any): boolean {
    if (!f) return false;

    const pagado = f.pagado;
    const pagadoStr = String(pagado).toLocaleLowerCase();
    const isPagado =
      pagado === 1 ||
      pagado === '1' ||
      pagado === true ||
      pagadoStr === 'true' ||
      pagadoStr === '1' ||
      pagadoStr === 'pagado' ||
      pagadoStr === 'si' ||
      pagadoStr === 's' ||
      pagadoStr === 'pago';

    // Incluimos como pagada incluso si estado no es 1 (puede ser 0 o null)
    // si el campo pagado indica pago.
    return isPagado;
  }

  separarFacturas() {
    // Normalizar arrays
    const cuotas = Array.isArray(this._cuotas) ? this._cuotas : [];
    const facx = Array.isArray(this._facxconvenio) ? this._facxconvenio : [];

    // 1) Facturas NUEVAS: desde cuotas[*].idfactura
    const mapNuevas = new Map<number, any>();
    for (const c of cuotas) {
      const fac = c?.idfactura; // aquí viene la factura (objeto o id)
      const id = this.getIdFactura(fac);
      if (id != null && !mapNuevas.has(id)) {
        mapNuevas.set(id, fac); // guardo la factura completa
      }
    }

    // 2) Facturas VIEJAS: desde facxconvenio[*].idfactura_facturas
    const mapViejas = new Map<number, any>();
    for (const fx of facx) {
      const fac = fx?.idfactura_facturas; // aquí viene la factura (objeto o id)
      const id = this.getIdFactura(fac);
      if (id != null && !mapViejas.has(id)) {
        mapViejas.set(id, fac);
      }
    }

    // 3) Si una factura aparece en ambos, la dejamos como NUEVA y la quitamos de VIEJAS
    for (const id of mapNuevas.keys()) {
      if (mapViejas.has(id)) mapViejas.delete(id);
    }

    this.facNuevas = Array.from(mapNuevas.values()).map((f) => ({
      ...f,
      selected: this.esPagadaNueva(f),
    }));
    this.facViejas = Array.from(mapViejas.values());
  }

  // ✅ helpers de totales (por si quieres sumar en el template)
  get totalFacNuevas(): number {
    return this.facNuevas.reduce((acc, f) => acc + Number(f?.total || 0), 0);
  }

  get totalFacViejas(): number {
    return this.facViejas.reduce((acc, f) => acc + Number(f?.total || 0), 0);
  }

  anularConvenio() {
    console.log('Anular convenio', this._convenio);
    if (!this._convenio?.idconvenio) return;

    this.modalError = null;

    const selecPagadas = (this.facNuevas || []).filter(
      (f) => this.esPagadaNueva(f) && f.selected
    );

    if (selecPagadas.length === 0) {
      this.facturasPagadas = [];
      this.modalVisible = true;
      this.modalError = 'Marque al menos una factura pagada en la tabla para generar la nota de crédito.';
      return;
    }

    this.facturasPagadas = selecPagadas.map((f) => ({
      ...f,
      valorNc: Number(f?.totaltarifa ?? 0),
    }));

    this.modalVisible = true;

    this.notaCreditoForm.reset({
      iddocumento_documentos: this.documentos.length ? this.documentos[0] : null,
      refdocumento: '',
      observacion: '',
    });
  }

  async eliminarConvenio() {
    if (!this._convenio?.idconvenio) return;

    const tieneModuloConvenioPago = (this.facViejas || []).some((f) => this.isFacturaConvenioPago(f));
    if (tieneModuloConvenioPago) {
      this.error = 'No se puede eliminar: existen facturas antiguas de módulo convenio de pagos (idmodulo=27).';
      return;
    }

    const result = await Swal.fire({
      title: 'Confirmar eliminación',
      text: `¿Desea eliminar el convenio ${this._convenio.nroconvenio || this._convenio.idconvenio}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'No, cancelar',
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await this.actualizarFacturasPorEliminacion();

      await firstValueFrom(
        this.s_convenio.updateEstado(
          this._convenio.idconvenio,
          0,
          this._convenio.idresponsable || this._convenio.usucrea || 0,
          `Eliminación de convenio ${this._convenio.nroconvenio || this._convenio.idconvenio}`,
          'ELIMINACION_CONVENIO'
        )
      );
      Swal.fire('Eliminado', 'El convenio ha sido eliminado correctamente.', 'success');
      this.router.navigate(['/convenios']);
    } catch (error) {
      console.error('Error al eliminar convenio (cambiar estado):', error);
      this.error = 'No se pudo eliminar el convenio. Intente de nuevo.';
      Swal.fire('Error', 'No se pudo eliminar el convenio. Intente nuevamente.', 'error');
    }
  }

  closeNcModal() {
    this.modalError = null;
    this.modalProcessing = false;
    this.modalVisible = false;
  }

  private construirEntidadRelacionada(obj: any, campoId: string): any {
    if (!obj && obj !== 0) return null;
    if (typeof obj === 'object') return obj;
    if (typeof obj === 'number' || typeof obj === 'string') {
      const entity: any = {};
      entity[campoId] = Number(obj);
      return entity;
    }
    return null;
  }

  private crearNtacreditoDesdeFactura(
    factura: any,
    iddocumento_documentos: any,
    refdocumento: string,
    observacion: string
  ): Ntacredito {
    const nc = new Ntacredito();

    nc.estado = 1;
    nc.observacion = observacion;
    nc.valor = Number(factura.valorNc) || Number(factura.totaltarifa) || 0;
    nc.devengado = 0;
    nc.nrofactura = factura.nrofactura || factura.idfactura || '';

    let cliente = factura.idcliente || factura.idcliente_clientes || factura.idabonado?.idcliente_clientes;
    if (cliente && (typeof cliente === 'number' || typeof cliente === 'string')) {
      cliente = { idcliente: Number(cliente) };
    }

    let abonado = factura.idabonado || factura.idabonado_abonados;
    if (abonado && (typeof abonado === 'number' || typeof abonado === 'string')) {
      abonado = { idabonado: Number(abonado) };
    }

    nc.idcliente_clientes = cliente || this._convenio?.idcliente || this._convenio?.idcliente_clientes || null;
    nc.idabonado_abonados =
      abonado ||
      this._convenio?.idabonado ||
      this._convenio?.idabonado_abonados ||
      null;

    if (!nc.idcliente_clientes || !nc.idabonado_abonados) {
      throw new Error(`Factura ${factura?.idfactura || factura?.nrofactura || '?'} falta cliente o abonado`);
    }

    nc.usucrea = this._convenio?.idresponsable || this._convenio?.usucrea || 0;
    nc.feccrea = new Date();

    nc.iddocumento_documentos = this.construirEntidadRelacionada(iddocumento_documentos, 'iddocumento');
    nc.refdocumento = refdocumento;

    return nc;
  }

  async generarNotasCredito() {
    if (this.notaCreditoForm.invalid) {
      this.notaCreditoForm.markAllAsTouched();
      this.modalError = 'Complete los datos de nota de crédito.';
      return;
    }

    const seleccionadas = (this.facturasPagadas || []).filter((f) => f.selected);
    if (seleccionadas.length === 0) {
      this.modalError = 'Seleccione al menos una factura para generar nota de crédito.';
      return;
    }

    const { iddocumento_documentos, refdocumento, observacion } = this.notaCreditoForm.value;

    if (!iddocumento_documentos) {
      this.modalError = 'Debe seleccionar un documento.';
      return;
    }

    this.modalProcessing = true;
    this.modalError = null;

    try {
      const promises = seleccionadas.map((factura: any) => {
        const nc = this.crearNtacreditoDesdeFactura(
          factura,
          iddocumento_documentos,
          refdocumento,
          observacion
        );

        if (!nc.idcliente_clientes || !nc.idabonado_abonados) {
          console.warn('Factura sin cliente/abonado completo:', factura);
        }

        console.log('Generando nota de crédito', nc);
        return firstValueFrom(this.s_ntacredito.saveNtacredito(nc));
      });

      await Promise.all(promises);

      // Actualizar campos de las facturas según regla de convenios
      await this.actualizarFacturasConvenio();

      // marcar convenio como anulado (cambia solo estado con auditoría)  
      await firstValueFrom(
        this.s_convenio.updateEstado(
          this._convenio.idconvenio,
          0,
          this._convenio.idresponsable || this._convenio.usucrea || 0,
          `Anulación de convenio ${this._convenio.nroconvenio || this._convenio.idconvenio}`,
          'ANULACION_CONVENIO'
        )
      );

      this.closeNcModal();
      this.router.navigate(['/convenios']);
    } catch (error: any) {
      console.error('Error en generarNotasCredito:', error);
      const msg = error?.error?.message || error?.message || `${error?.status ?? ''} ${error?.statusText ?? ''}`;
      this.modalError = `Error generando notas de crédito o anulando el convenio. ${msg}`;
      this.modalProcessing = false;
    }
  }

  cancelar() {
    this.router.navigate(['/convenios']);
  }

  private calcularReglasBotones() {
    const nuevas = Array.isArray(this.facNuevas) ? this.facNuevas : [];

    this.tieneFacturaPagadaNueva = nuevas.some((f) => this.esPagadaNueva(f));
    this.tieneFacturaPendienteNueva = nuevas.some(
      (f) => !this.esPagadaNueva(f)
    );
  }

  get selectedPagadasCount(): number {
    return (this.facNuevas || []).filter((f) => this.esPagadaNueva(f) && f.selected).length;
  }

  get totalValorNotaCredito(): number {
    return (this.facturasPagadas || [])
      .filter((f) => f.selected)
      .reduce((sum, f) => sum + Number(f.valorNc || 0), 0);
  }

  private isFacturaConvenioPago(fac: any): boolean {
    if (!fac) return false;
    const modulo = fac.idmodulo || fac.idfactura_facturas?.idmodulo;
    return Number(modulo) === 27;
  }

  private async actualizarFacturasConvenio(): Promise<void> {
    if (!this._convenio) return;

    const antiguasModuloPago = (this.facViejas || []).some((f) => this.isFacturaConvenioPago(f));
    if (this.modo === 'eliminar' && antiguasModuloPago) {
      console.warn('Modo eliminar: facturas antiguas de módulo 27 encontradas -> no se modifica estado de facturas');
      return;
    }

    const hoy = new Date();
    const userElimina = this.authService.idusuario || this._convenio.idresponsable || this._convenio.usucrea || 0;
    const razon = `Anulación del convenio ${this._convenio.nroconvenio || this._convenio.idconvenio}`;

    const updates: Promise<any>[] = [];

    const procesarFactura = async (fac: any, cambio: Partial<any>) => {
      if (!fac || !fac.idfactura) return;

      try {
        const facCompleta: any = await firstValueFrom(this.facturaService.getById(fac.idfactura));
        if (!facCompleta) {
          console.warn(`Factura ${fac.idfactura} no encontrada antes de actualizar`);
          return;
        }

        const upd = {
          ...facCompleta,
          ...cambio,
        };

        await this.facturaService.updateFacturaAsync(upd);
      } catch (err) {
        console.error(`Error actualizando factura ${fac.idfactura}:`, err);
        throw err;
      }
    };

    // 1) Facturas antiguas: quitar fecha de convenio
    const antiguas = (this.facViejas || []).filter((f) => f && f.fechaconvenio);
    for (const fac of antiguas) {
      updates.push(
        procesarFactura(fac, {
          fechaconvenio: null,
          // no tocar usuarioeliminacion/fechaeliminacion/razoneliminacion en facturas antiguas
        })
      );
    }

    // 2) Facturas nuevas no pagadas: registrar como eliminadas de convenio
    const nuevasNoPagadas = (this.facNuevas || []).filter((f) => f && !this.esPagadaNueva(f));
    for (const fac of nuevasNoPagadas) {
      updates.push(
        procesarFactura(fac, {
          fechaconvenio: hoy,
          usuarioeliminacion: userElimina,
          fechaeliminacion: hoy,
          razoneliminacion: razon,
        })
      );
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }
  }

  private async actualizarFacturasPorEliminacion(): Promise<void> {
    if (!this._convenio) return;

    const hoy = new Date();
    const userElimina = this.authService.idusuario || this._convenio.idresponsable || this._convenio.usucrea || 0;
    const razon = `Eliminación del convenio ${this._convenio.nroconvenio || this._convenio.idconvenio}`;
    const facturasActualizar = (this.facNuevas || []).filter((f) => f?.idfactura);

    for (const fac of facturasActualizar) {
      try {
        const facCompleta: any = await firstValueFrom(this.facturaService.getById(fac.idfactura));
        if (!facCompleta) {
          console.warn(`Factura ${fac.idfactura} no encontrada antes de actualizar por eliminación`);
          continue;
        }

        const upd = {
          ...facCompleta,
          usuarioeliminacion: userElimina,
          fechaeliminacion: hoy,
          razoneliminacion: razon,
        };

        await this.facturaService.updateFacturaAsync(upd);
      } catch (err) {
        console.error(`Error actualizando factura ${fac.idfactura} por eliminación:`, err);
        throw err;
      }
    }
  }

  // helper: convierte feccrea a Date (acepta Date, string ISO, "yyyy-MM-dd", etc.)
  private toDate(fecha: any): Date | null {
    if (!fecha) return null;
    if (fecha instanceof Date) return fecha;

    // si viene tipo "2025-12-23T10:15:00" o "2025-12-23"
    const d = new Date(fecha);
    if (!isNaN(d.getTime())) return d;

    // fallback para "dd/MM/yyyy" (si tu API lo manda así)
    if (typeof fecha === 'string' && fecha.includes('/')) {
      const [dd, mm, yyyy] = fecha.split('/').map(Number);
      if (dd && mm && yyyy) return new Date(yyyy, mm - 1, dd);
    }

    return null;
  }

  private isVencidaByFeccrea(f: any): boolean {
    // si está pagada no la consideramos vencida (opcional)
    if (f?.pagado === 1) return false;

    const feccrea = this.toDate(f?.feccrea);
    if (!feccrea) return false;

    const venc = new Date(feccrea);
    venc.setDate(venc.getDate() + this.DIAS_VENCIMIENTO);

    const hoy = new Date();
    return hoy > venc;
  }

  private recalcularVencidas() {
    const vencidas = (this.facNuevas || []).filter((f) =>
      this.isVencidaByFeccrea(f)
    );
    this.cantVencidasNuevas = vencidas.length;
    this.tieneFacturaVencidaNueva = vencidas.length > 0;
  }
}
