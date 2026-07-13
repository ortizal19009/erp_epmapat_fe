import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { EmisionAuditService } from 'src/app/servicios/emision-audit.service';
import { EmisionService } from 'src/app/servicios/emision.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { LoadingService } from 'src/app/servicios/loading.service';

interface DashboardEmision {
  idemision: number;
  emision: string;
  estado: number;
  feccrea?: string | null;
  fechacierre?: string | null;
  m3: number | null;
  ncuentas: number | null;
  emitido: number | null;
  cobrado: number | null;
  pendiente: number | null;
  totalRutas: number;
  rutasCerradas: number;
  rutasPendientes: number;
}

interface DashboardRuta {
  idrutaxemision: number;
  idruta: number;
  codigoRuta: string;
  nombreRuta: string;
  estadoRuta: number;
  lecturas: number;
  lecturasConFactura: number;
  lecturasSinFactura: number;
  abonados: number;
  m3: number;
  emitido: number;
  cobrado: number;
  pendiente: number;
}

interface DashboardDetalle {
  emision: {
    idemision: number;
    emision: string;
    estado: number;
    feccrea?: string | null;
    fechacierre?: string | null;
    observaciones?: string | null;
    totalRutas: number;
    rutasCerradas: number;
    rutasPendientes: number;
    abonados: number;
    lecturas: number | null;
    lecturasSinFactura: number | null;
    m3: number | null;
    emitido: number | null;
    cobrado: number | null;
    pendiente: number | null;
  };
  rutas: DashboardRuta[];
}

interface AuditoriaFila {
  accion: string;
  fecha: string | null;
  usuario: string;
  motivo: string;
  estadoAnterior: string;
  estadoNuevo: string;
}

@Component({
  selector: 'app-control-emisiones',
  templateUrl: './control-emisiones.component.html',
  styleUrls: ['./control-emisiones.component.css'],
})
export class ControlEmisionesComponent implements OnInit {
  cargando = false;
  cargandoDetalle = false;
  error = '';
  filtroEmision = '';
  filtroRuta = '';
  emisiones: DashboardEmision[] = [];
  emisionesFiltradas: DashboardEmision[] = [];
  detalle: DashboardDetalle | null = null;
  idemisionSeleccionada: number | null = null;
  auditoriaEmision: AuditoriaFila[] = [];
  auditoriaEmisionCargando = false;
  auditoriaEmisionError = '';

  constructor(
    private coloresService: ColoresService,
    public authService: AutorizaService,
    private emisionService: EmisionService,
    private emisionAuditService: EmisionAuditService,
    private facturaService: FacturaService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/control-emisiones');
    const coloresJSON = sessionStorage.getItem('/control-emisiones') || sessionStorage.getItem('/emisiones');
    if (coloresJSON) {
      this.colocaColor(JSON.parse(coloresJSON));
    } else {
      void this.buscaColor();
    }
    this.cargarDashboard();
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(this.authService.idusuario, 'emisiones');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/control-emisiones', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  async cargarDashboard(): Promise<void> {
    this.cargando = true;
    this.error = '';
    try {
      const resp = await firstValueFrom(this.emisionService.getControlDashboard(36));
      this.emisiones = Array.isArray(resp?.emisiones) ? resp.emisiones.map((item: any) => this.normalizarEmision(item)) : [];
      this.aplicarFiltroEmision();
      if (this.emisionesFiltradas.length) {
        const seleccion = this.idemisionSeleccionada && this.emisionesFiltradas.some((item) => item.idemision === this.idemisionSeleccionada)
          ? this.idemisionSeleccionada
          : this.emisionesFiltradas[0].idemision;
        await this.seleccionarEmision(seleccion);
      } else {
        this.detalle = null;
        this.auditoriaEmision = [];
      }
    } catch (err) {
      console.error('No se pudo cargar el dashboard de emisiones', err);
      this.error = 'No se pudo cargar el dashboard de control de emisiones.';
      this.emisiones = [];
      this.emisionesFiltradas = [];
      this.detalle = null;
    } finally {
      this.cargando = false;
    }
  }

  aplicarFiltroEmision(): void {
    const filtro = this.filtroEmision.trim().toLowerCase();
    this.emisionesFiltradas = this.emisiones.filter((item) => {
      if (!filtro) {
        return true;
      }
      return [
        item.idemision,
        item.emision,
        this.estadoTexto(item.estado),
        item.ncuentas,
        item.emitido,
        item.cobrado,
        item.pendiente,
      ]
        .join(' ')
        .toLowerCase()
        .includes(filtro);
    });
  }

  get rutasFiltradas(): DashboardRuta[] {
    const rutas = this.detalle?.rutas || [];
    const filtro = this.filtroRuta.trim().toLowerCase();
    if (!filtro) {
      return rutas;
    }
    return rutas.filter((ruta) =>
      [
        ruta.codigoRuta,
        ruta.nombreRuta,
        this.estadoRutaTexto(ruta.estadoRuta),
        ruta.abonados,
        ruta.emitido,
        ruta.cobrado,
        ruta.pendiente,
      ]
        .join(' ')
        .toLowerCase()
        .includes(filtro)
    );
  }

  async seleccionarEmision(idemision: number): Promise<void> {
    this.idemisionSeleccionada = idemision;
    this.cargandoDetalle = true;
    this.auditoriaEmision = [];
    this.auditoriaEmisionError = '';
    try {
      const resp = await firstValueFrom(this.emisionService.getControlDetalle(idemision));
      this.detalle = {
        emision: {
          ...resp?.emision,
          m3: this.toNullableNumber(resp?.emision?.m3),
          emitido: this.toNullableNumber(resp?.emision?.emitido),
          cobrado: this.toNullableNumber(resp?.emision?.cobrado),
          pendiente: this.toNullableNumber(resp?.emision?.pendiente),
          abonados: this.toNumber(resp?.emision?.abonados),
          lecturas: this.toNullableNumber(resp?.emision?.lecturas),
          lecturasSinFactura: this.toNullableNumber(resp?.emision?.lecturasSinFactura),
        },
        rutas: Array.isArray(resp?.rutas) ? resp.rutas.map((ruta: any) => this.normalizarRuta(ruta)) : [],
      };
      await this.cargarAuditoriaSeleccionada();
    } catch (err) {
      console.error('No se pudo cargar el detalle de la emisión', err);
      this.detalle = null;
      this.auditoriaEmisionError = 'No se pudo cargar el detalle de la emisión seleccionada.';
    } finally {
      this.cargandoDetalle = false;
    }
  }

  async validarAperturaSeleccionada(): Promise<void> {
    if (!this.idemisionSeleccionada) {
      return;
    }

    this.loadingService.showLoading();
    try {
      const resp = await firstValueFrom(this.emisionService.validarApertura(this.idemisionSeleccionada));
      this.loadingService.hideLoading();

      const rutasPendientes = (resp?.rutas || []).filter((ruta: any) => Number(ruta?.lecturasPendientes || 0) > 0);
      const detalleRutas = rutasPendientes.length
        ? `<div style="max-height:220px;overflow:auto;text-align:left;font-size:13px;">
            ${rutasPendientes
              .slice(0, 14)
              .map(
                (ruta: any) =>
                  `<div><strong>${ruta.codigoRuta}</strong> - ${ruta.nombreRuta}: esperadas ${ruta.abonadosEsperados}, existentes ${ruta.lecturasExistentes}, faltan ${ruta.lecturasPendientes}</div>`
              )
              .join('')}
          </div>`
        : '<div>Todas las rutas de la emisión están completas.</div>';

      const result = await Swal.fire({
        icon: rutasPendientes.length ? 'warning' : 'success',
        title: rutasPendientes.length ? 'Apertura incompleta' : 'Apertura validada',
        html:
          `<div class="text-left">` +
          `<p><strong>Emisión:</strong> ${resp?.emision ?? ''}</p>` +
          `<p><strong>Rutas esperadas:</strong> ${resp?.totalRutasEsperadas ?? 0}</p>` +
          `<p><strong>Rutas completas:</strong> ${resp?.rutasCompletas ?? 0}</p>` +
          `<p><strong>Rutas pendientes:</strong> ${resp?.rutasPendientes ?? 0}</p>` +
          `<p><strong>Lecturas esperadas:</strong> ${resp?.totalLecturasEsperadas ?? 0}</p>` +
          `<p><strong>Lecturas existentes:</strong> ${resp?.lecturasExistentes ?? 0}</p>` +
          `<p><strong>Lecturas pendientes:</strong> ${resp?.lecturasPendientes ?? 0}</p>` +
          `<hr>` +
          detalleRutas +
          `</div>`,
        showCancelButton: rutasPendientes.length > 0,
        confirmButtonText: rutasPendientes.length ? 'Completar pendientes' : 'Aceptar',
        cancelButtonText: 'Cerrar',
        width: 720,
      });

      if (result.isConfirmed && rutasPendientes.length > 0) {
        await this.completarPendientesApertura();
      }
    } catch (err) {
      this.loadingService.hideLoading();
      console.error('Error validando apertura de emisión', err);
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo validar',
        text: 'Ocurrió un problema al validar la apertura de la emisión.',
      });
    }
  }

  async completarPendientesApertura(): Promise<void> {
    if (!this.idemisionSeleccionada) {
      return;
    }

    this.loadingService.showLoading();
    try {
      const resp = await firstValueFrom(
        this.emisionService.generarPendientes(this.idemisionSeleccionada, this.authService.idusuario)
      );
      this.loadingService.hideLoading();
      await Swal.fire({
        icon: Number(resp?.lecturasPendientes || 0) > 0 ? 'warning' : 'success',
        title: Number(resp?.lecturasPendientes || 0) > 0 ? 'Revalidación parcial' : 'Apertura completada',
        text:
          `Rutas completas: ${resp?.rutasCompletas ?? 0}/${resp?.totalRutasEsperadas ?? 0}. ` +
          `Lecturas creadas: ${resp?.lecturasCreadas ?? 0}. ` +
          `Lecturas pendientes: ${resp?.lecturasPendientes ?? 0}.`,
      });
      await this.recargarSeleccion();
    } catch (err: any) {
      this.loadingService.hideLoading();
      console.error('Error completando pendientes de apertura', err);
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo completar',
        text: err?.error?.message || err?.error?.detalle || err?.message || 'No se pudo completar la apertura.',
      });
    }
  }

  async generarFacturasCabecera(): Promise<void> {
    if (this.authService.idusuario !== 1) {
      this.authService.swal('warning', 'Esta opción solo está habilitada para el usuario 1.');
      return;
    }

    const result = await Swal.fire({
      icon: 'question',
      title: 'Generar facturas cabecera',
      text: 'Se revisará la última emisión abierta y solo se crearán facturas para lecturas sin idfactura.',
      showCancelButton: true,
      confirmButtonText: 'Sí, generar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) {
      return;
    }

    this.loadingService.showLoading();
    try {
      const resp = await firstValueFrom(
        this.emisionService.generarFacturasCabeceraUltimaEmisionAbierta(this.authService.idusuario)
      );
      this.loadingService.hideLoading();
      await Swal.fire({
        icon: 'success',
        title: 'Proceso completado',
        html:
          `<div class="text-left">` +
          `<p><strong>Emisión:</strong> ${resp?.emision ?? '-'}</p>` +
          `<p><strong>ID emisión:</strong> ${resp?.idemision ?? '-'}</p>` +
          `<p><strong>Rutas recorridas:</strong> ${resp?.rutasRecorridas ?? 0}</p>` +
          `<p><strong>Lecturas revisadas:</strong> ${resp?.lecturasRevisadas ?? 0}</p>` +
          `<p><strong>Facturas creadas:</strong> ${resp?.facturasCreadas ?? 0}</p>` +
          `<p><strong>Facturas reutilizadas:</strong> ${resp?.facturasReutilizadas ?? 0}</p>` +
          `<p><strong>Lecturas actualizadas:</strong> ${resp?.lecturasActualizadas ?? 0}</p>` +
          `<p><strong>Pendientes sin factura:</strong> ${resp?.lecturasPendientesSinFactura ?? 0}</p>` +
          `</div>`,
      });
      await this.cargarDashboard();
    } catch (err: any) {
      this.loadingService.hideLoading();
      console.error('Error generando facturas cabecera', err);
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo completar',
        text: err?.error?.message || err?.error?.detalle || err?.message || 'No se pudo generar facturas cabecera.',
      });
    }
  }

  async reabrirEmisionSeleccionada(): Promise<void> {
    if (!this.idemisionSeleccionada || !this.detalle?.emision) {
      return;
    }

    try {
      const [facturasCobradas, emisiones] = await Promise.all([
        firstValueFrom(this.facturaService.findCobradasByIdemision(this.idemisionSeleccionada)),
        firstValueFrom(this.emisionService.findAllEmisiones()),
      ]);

      if (Array.isArray(facturasCobradas) && facturasCobradas.length > 0) {
        await Swal.fire({
          icon: 'warning',
          title: 'No se puede reabrir',
          text: 'La emisión tiene facturas cobradas asociadas. No es posible reabrirla.',
        });
        return;
      }

      const emisionPosterior = (Array.isArray(emisiones) ? emisiones : []).find((item: any) =>
        `${item?.emision ?? ''}` > `${this.detalle?.emision?.emision ?? ''}` && [0, 1, 2].includes(Number(item?.estado))
      );

      if (emisionPosterior) {
        await Swal.fire({
          icon: 'warning',
          title: 'No se puede reabrir',
          text: `Existe una emisión posterior generada: ${emisionPosterior.emision} (${this.estadoTexto(emisionPosterior.estado)}).`,
        });
        return;
      }
    } catch (err) {
      console.error('Error validando reapertura de emisión', err);
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo validar',
        text: 'Ocurrió un problema al validar facturas cobradas o emisiones posteriores.',
      });
      return;
    }

    const confirm = await Swal.fire({
      icon: 'question',
      title: 'Reabrir emisión',
      text: 'Se reabrirá la emisión y todas sus rutas para permitir modificaciones en las lecturas.',
      showCancelButton: true,
      confirmButtonText: 'Reabrir',
      cancelButtonText: 'Cancelar',
    });

    if (!confirm.isConfirmed) {
      return;
    }

    this.loadingService.showLoading();
    try {
      await firstValueFrom(this.emisionService.reabrirEmision(this.idemisionSeleccionada, this.authService.idusuario));
      this.loadingService.hideLoading();
      await Swal.fire({
        icon: 'success',
        title: 'Emisión reabierta',
        text: 'La emisión y sus rutas quedaron abiertas nuevamente.',
      });
      await this.cargarDashboard();
    } catch (err: any) {
      this.loadingService.hideLoading();
      console.error('Error al reabrir emisión', err);
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo reabrir',
        text: err?.error?.message || err?.error?.detalle || err?.message || 'Verifica el backend.',
      });
    }
  }

  async cargarAuditoriaSeleccionada(): Promise<void> {
    if (!this.idemisionSeleccionada) {
      return;
    }

    this.auditoriaEmisionCargando = true;
    this.auditoriaEmisionError = '';
    try {
      const resp = await firstValueFrom(this.emisionAuditService.porEmision(this.idemisionSeleccionada));
      const lista = Array.isArray(resp) ? resp : Array.isArray(resp?.auditoria) ? resp.auditoria : Array.isArray(resp?.data) ? resp.data : [];
      this.auditoriaEmision = lista.map((item: any) => this.normalizarAuditoria(item));
    } catch (err) {
      console.error('No se pudo cargar la auditoría de emisión', err);
      this.auditoriaEmision = [];
      this.auditoriaEmisionError = 'No se pudo cargar la auditoría de la emisión.';
    } finally {
      this.auditoriaEmisionCargando = false;
    }
  }

  async recargarSeleccion(): Promise<void> {
    await this.cargarDashboard();
    if (this.idemisionSeleccionada) {
      await this.seleccionarEmision(this.idemisionSeleccionada);
    }
  }

  get emisionSeleccionada(): DashboardEmision | null {
    return this.emisiones.find((item) => item.idemision === this.idemisionSeleccionada) || null;
  }

  canValidarApertura(): boolean {
    if (this.authService.idusuario !== 1 || !this.detalle?.emision) {
      return false;
    }

    const emisionAbierta = Number(this.detalle.emision.estado) !== 1;
    const tieneRutasAbiertas = (this.detalle.rutas || []).some((ruta) => Number(ruta.estadoRuta) !== 1);
    const tieneLecturasCargadas = Number(this.detalle.emision.lecturas || 0) > 0;

    return emisionAbierta && tieneRutasAbiertas && tieneLecturasCargadas;
  }

  canReabrirEmision(): boolean {
    if (this.authService.idusuario !== 1 || !this.emisionSeleccionada) {
      return false;
    }

    if (Number(this.emisionSeleccionada.estado) !== 1) {
      return false;
    }

    const emisionActual = `${this.emisionSeleccionada.emision ?? ''}`;
    const existePosteriorBloqueante = this.emisiones.some((item) =>
      item.idemision !== this.emisionSeleccionada?.idemision &&
      `${item.emision ?? ''}` > emisionActual &&
      [0, 1].includes(Number(item.estado))
    );

    return !existePosteriorBloqueante;
  }

  canGenerarFacturasCabecera(): boolean {
    if (this.authService.idusuario !== 1 || !this.detalle?.emision) {
      return false;
    }

    return Number(this.detalle.emision.estado) !== 1;
  }

  get resumenGeneral() {
    return this.emisionesFiltradas.reduce(
      (acc, item) => {
        acc.emitido += Number(item.emitido || 0);
        acc.cobrado += Number(item.cobrado || 0);
        acc.pendiente += Number(item.pendiente || 0);
        acc.abonados += Number(item.ncuentas || 0);
        acc.m3 += Number(item.m3 || 0);
        return acc;
      },
      { emitido: 0, cobrado: 0, pendiente: 0, abonados: 0, m3: 0 }
    );
  }

  estadoTexto(estado: number | null | undefined): string {
    switch (Number(estado)) {
      case 0:
        return 'Abierta';
      case 1:
        return 'Cerrada';
      case 2:
        return 'Reabierta';
      case 3:
        return 'Anulada';
      default:
        return '-';
    }
  }

  estadoRutaTexto(estado: number | null | undefined): string {
    return Number(estado) === 1 ? 'Cerrada' : 'Abierta';
  }

  formatFecha(valor: string | null | undefined): string {
    if (!valor) {
      return '-';
    }
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) {
      return `${valor}`;
    }
    return fecha.toLocaleString();
  }

  money(valor: number | null | undefined): string {
    if (valor === null || valor === undefined) {
      return '-';
    }
    return new Intl.NumberFormat('es-EC', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(valor));
  }

  valueOrDash(valor: number | null | undefined): string {
    if (valor === null || valor === undefined) {
      return '-';
    }
    return `${valor}`;
  }

  private normalizarEmision(item: any): DashboardEmision {
    return {
      idemision: Number(item?.idemision || 0),
      emision: `${item?.emision ?? ''}`,
      estado: Number(item?.estado ?? 0),
      feccrea: item?.feccrea ?? null,
      fechacierre: item?.fechacierre ?? null,
      m3: this.toNullableNumber(item?.m3),
      ncuentas: this.toNullableNumber(item?.ncuentas),
      emitido: this.toNullableNumber(item?.emitido),
      cobrado: this.toNullableNumber(item?.cobrado),
      pendiente: this.toNullableNumber(item?.pendiente),
      totalRutas: this.toNumber(item?.totalRutas),
      rutasCerradas: this.toNumber(item?.rutasCerradas),
      rutasPendientes: this.toNumber(item?.rutasPendientes),
    };
  }

  private normalizarRuta(item: any): DashboardRuta {
    return {
      idrutaxemision: Number(item?.idrutaxemision || 0),
      idruta: Number(item?.idruta || 0),
      codigoRuta: `${item?.codigoRuta ?? ''}`,
      nombreRuta: `${item?.nombreRuta ?? ''}`,
      estadoRuta: Number(item?.estadoRuta ?? 0),
      lecturas: this.toNumber(item?.lecturas),
      lecturasConFactura: this.toNumber(item?.lecturasConFactura),
      lecturasSinFactura: this.toNumber(item?.lecturasSinFactura),
      abonados: this.toNumber(item?.abonados),
      m3: this.toNumber(item?.m3),
      emitido: this.toNumber(item?.emitido),
      cobrado: this.toNumber(item?.cobrado),
      pendiente: this.toNumber(item?.pendiente),
    };
  }

  private normalizarAuditoria(item: any): AuditoriaFila {
    const detalle = this.parseDetalle(item?.detalle ?? item?.objectJson ?? item?.json ?? item?.payload);
    const emision = detalle?.emision ?? {};
    return {
      accion: `${item?.accion ?? detalle?.accion ?? ''}`.toUpperCase(),
      fecha: item?.fecha ?? item?.fecmodi ?? detalle?.fecha ?? null,
      usuario: `${item?.usuario ?? item?.usumodi ?? detalle?.usuario ?? ''}`,
      motivo: `${item?.motivo ?? detalle?.observacion ?? item?.observacion ?? detalle?.mensaje ?? ''}`,
      estadoAnterior: this.estadoTexto(item?.estadoAnterior ?? detalle?.estado_anterior ?? emision?.estado_anterior),
      estadoNuevo: this.estadoTexto(item?.estadoNuevo ?? detalle?.estado_nuevo ?? emision?.estado_nuevo),
    };
  }

  private parseDetalle(valor: any): any {
    if (!valor) {
      return {};
    }
    if (typeof valor === 'string') {
      try {
        return JSON.parse(valor);
      } catch {
        return { texto: valor };
      }
    }
    return valor;
  }

  private toNumber(valor: any): number {
    const numero = Number(valor);
    return Number.isNaN(numero) ? 0 : numero;
  }

  private toNullableNumber(valor: any): number | null {
    if (valor === null || valor === undefined || valor === '') {
      return null;
    }
    const numero = Number(valor);
    return Number.isNaN(numero) ? null : numero;
  }
}
