import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Condmultaintereses } from 'src/app/modelos/condmultasintereses';
import { CondmultasinteresesService } from 'src/app/servicios/condmultasintereses.service';
import { LoadingService } from 'src/app/servicios/loading.service';

@Component({ selector: 'app-condonaciones-pendientes', templateUrl: './condonaciones-pendientes.component.html', styleUrls: ['./condonaciones-pendientes.component.css'] })
export class CondonacionesPendientesComponent implements OnInit {
  filtroForm!: FormGroup;
  solicitudes: Condmultaintereses[] = [];
  solicitudSeleccionada: Condmultaintereses | null = null;
  puedeVer = false;
  puedeAprobar = false;

  constructor(
    private fb: FormBuilder,
    private coloresService: ColoresService,
    private condonacionesService: CondmultasinteresesService,
    private authService: AutorizaService,
    private loadingService: LoadingService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    const coloresJSON = sessionStorage.getItem('/condonaciones');
    if (coloresJSON) {
      const colores = JSON.parse(coloresJSON);
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    }
    this.filtroForm = this.fb.group({ estado: [''], cuenta: [''], nrofactura: [''], usucrea: [''], feccreaDesde: [''], feccreaHasta: [''] });
    await this.validarAcceso();
    if (this.puedeVer) this.buscar();
  }

  private async validarAcceso(): Promise<void> {
    if (this.authService.idusuario === 1) {
      this.puedeVer = true;
      this.puedeAprobar = true;
      return;
    }
    try {
      const [permisoCondonaciones, permisoAprobacion] = await Promise.all([
        this.coloresService.getRolePermission(this.authService.idusuario, 'condonaciones'),
        this.coloresService.getRolePermission(this.authService.idusuario, 'condonaciones-pendientes'),
      ]);
      this.puedeVer = permisoCondonaciones >= 1 || permisoAprobacion >= 1;
      this.puedeAprobar = permisoAprobacion >= 3;
    } catch {
      this.puedeVer = false;
      this.puedeAprobar = false;
    }
    if (!this.puedeVer) {
      this.authService.swal('warning', 'No tiene permiso para consultar exoneraciones.');
      this.router.navigate(['/condonaciones']);
    }
  }

  buscar(): void {
    if (!this.puedeVer) return;
    this.loadingService.showLoading();
    this.condonacionesService.listar(this.filtroForm.value).subscribe({
      next: (data) => {
        this.solicitudes = data || [];
        this.solicitudSeleccionada = this.solicitudes.length ? this.solicitudes[0] : null;
        this.loadingService.hideLoading();
      },
      error: (error) => {
        console.error(error);
        this.loadingService.hideLoading();
        this.authService.swal('error', 'No se pudieron cargar las exoneraciones.');
      },
    });
  }

  seleccionar(item: Condmultaintereses): void {
    this.solicitudSeleccionada = item;
    if (!item?.idcondmultainteres) return;
    this.condonacionesService.getById(item.idcondmultainteres).subscribe({ next: (detalle) => this.solicitudSeleccionada = detalle, error: (error) => console.error(error) });
  }

  get totalIntereses(): number { return this.solicitudes.reduce((total, item) => total + Number(item.totalinteres || 0), 0); }
  get totalMultas(): number { return this.solicitudes.reduce((total, item) => total + Number(item.totalmultas || 0), 0); }
  get totalExonerado(): number { return this.totalIntereses + this.totalMultas; }
  get aprobadas(): number { return this.solicitudes.filter((item) => item.estado === 'APROBADO').length; }
  get pendientes(): number { return this.solicitudes.filter((item) => item.estado === 'PENDIENTE').length; }
  get pendientesAprobables(): Condmultaintereses[] { return this.solicitudes.filter((item) => item.estado === 'PENDIENTE'); }

  imprimirReporte(): void {
    const ventana = window.open('', '_blank', 'width=1100,height=800');
    if (!ventana) {
      this.authService.swal('warning', 'El navegador bloqueo la ventana de impresion.');
      return;
    }
    const moneda = new Intl.NumberFormat('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const filas = this.solicitudes.map((item) => `<tr><td>${this.escapeHtml(item.idcondmultainteres)}</td><td>${this.escapeHtml(item.nrofactura || item.idfactura)}</td><td>${this.escapeHtml(item.abonado || '-')}</td><td>${this.escapeHtml(item.cuenta || '-')}</td><td class="amount">${moneda.format(Number(item.totalinteres || 0))}</td><td class="amount">${moneda.format(Number(item.totalmultas || 0))}</td><td>${this.escapeHtml(this.formatearFecha(item.feccrea))}</td><td>${this.escapeHtml(item.estado || '-')}</td></tr>`).join('');
    ventana.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Reporte de exoneraciones</title><style>body{font-family:Arial,sans-serif;color:#172033;margin:28px;font-size:12px}h1{margin:0 0 4px;color:#0f5f5b;font-size:20px}.meta{color:#52606d;margin-bottom:18px}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:18px}.summary div{border:1px solid #cbd5e1;border-radius:4px;padding:8px}.summary small,.summary strong{display:block}.summary strong{margin-top:3px;font-size:14px}table{border-collapse:collapse;width:100%}th{background:#0f766e;color:white}th,td{border:1px solid #cbd5e1;padding:6px;text-align:left}.amount{text-align:right}@media print{body{margin:12mm}}</style></head><body><h1>Reporte de exoneraciones</h1><div class="meta">Generado: ${this.escapeHtml(this.formatearFecha(new Date()))}</div><div class="summary"><div><small>Solicitudes</small><strong>${this.solicitudes.length}</strong></div><div><small>Aprobadas</small><strong>${this.aprobadas}</strong></div><div><small>Pendientes</small><strong>${this.pendientes}</strong></div><div><small>Total intereses</small><strong>$ ${moneda.format(this.totalIntereses)}</strong></div><div><small>Total multas</small><strong>$ ${moneda.format(this.totalMultas)}</strong></div><div><small>Total exonerado</small><strong>$ ${moneda.format(this.totalExonerado)}</strong></div></div><table><thead><tr><th>ID</th><th>Factura</th><th>Abonado</th><th>Cuenta</th><th>Interes</th><th>Multa</th><th>Fecha</th><th>Estado</th></tr></thead><tbody>${filas || '<tr><td colspan="8">No hay registros para los filtros seleccionados.</td></tr>'}</tbody></table></body></html>`);
    ventana.document.close();
    ventana.focus();
    setTimeout(() => ventana.print(), 250);
  }

  async aprobar(): Promise<void> {
    if (!this.puedeAprobar || !this.solicitudSeleccionada?.idcondmultainteres) return;
    const confirmado = await Swal.fire({ title: 'Aprobar exoneracion', text: 'La exoneracion se aplicara definitivamente a la factura.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Aprobar', cancelButtonText: 'Cancelar' });
    if (!confirmado.isConfirmed) return;
    this.loadingService.showLoading();
    this.condonacionesService.aprobar(this.solicitudSeleccionada.idcondmultainteres, this.authService.idusuario).subscribe({ next: () => { this.loadingService.hideLoading(); this.authService.swal('success', 'Solicitud aprobada correctamente.'); this.buscar(); }, error: (error) => { this.loadingService.hideLoading(); console.error(error); this.authService.swal('error', error?.error?.message || 'No se pudo aprobar la solicitud.'); } });
  }

  async aprobarTodas(): Promise<void> {
    const pendientes = this.pendientesAprobables;
    if (!this.puedeAprobar || !pendientes.length) return;
    const confirmado = await Swal.fire({ title: 'Aprobar solicitudes pendientes', text: `Se procesaran ${pendientes.length} solicitudes visibles. Las creadas por usted se omitiran.`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Aprobar todas', cancelButtonText: 'Cancelar' });
    if (!confirmado.isConfirmed) return;
    this.loadingService.showLoading();
    this.condonacionesService.aprobarLote(pendientes.map((item) => item.idcondmultainteres), this.authService.idusuario).subscribe({
      next: (resultado) => {
        this.loadingService.hideLoading();
        const aprobadas = resultado?.aprobadas?.length || 0;
        const omitidas = resultado?.omitidas?.length || 0;
        Swal.fire({ icon: omitidas ? 'info' : 'success', title: 'Aprobacion masiva finalizada', text: `Aprobadas: ${aprobadas}. Omitidas: ${omitidas}.` });
        this.buscar();
      },
      error: (error) => {
        this.loadingService.hideLoading();
        console.error(error);
        this.authService.swal('error', error?.error?.message || 'No se pudieron aprobar las solicitudes.');
      },
    });
  }

  async rechazar(): Promise<void> {
    if (!this.puedeAprobar || !this.solicitudSeleccionada?.idcondmultainteres) return;
    const resultado = await Swal.fire({ title: 'Rechazar solicitud', input: 'textarea', inputLabel: 'Motivo de rechazo', inputValidator: (value) => (!value ? 'Debe ingresar una observacion.' : null), showCancelButton: true, confirmButtonText: 'Rechazar', cancelButtonText: 'Cancelar' });
    if (!resultado.isConfirmed) return;
    this.loadingService.showLoading();
    this.condonacionesService.rechazar(this.solicitudSeleccionada.idcondmultainteres, this.authService.idusuario, resultado.value).subscribe({ next: () => { this.loadingService.hideLoading(); this.authService.swal('success', 'Solicitud rechazada correctamente.'); this.buscar(); }, error: (error) => { this.loadingService.hideLoading(); console.error(error); this.authService.swal('error', error?.error?.message || 'No se pudo rechazar la solicitud.'); } });
  }

  private formatearFecha(valor: Date | string | null | undefined): string {
    if (!valor) return '-';
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? '-' : fecha.toLocaleString('es-EC');
  }

  private escapeHtml(valor: unknown): string {
    return String(valor ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character] || character));
  }
}
