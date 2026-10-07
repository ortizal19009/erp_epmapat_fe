import { Component, OnInit } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ColoresService } from 'src/app/compartida/colores.service';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { PersonalService } from 'src/app/servicios/rrhh/personal.service';
import { ThLeaveService, ThLeaveMovement, ThLeaveReconciliation, ThLeaveInbox, ThLeaveInboxFilter, ThLeaveInboxRequest, ThLeaveHistory, ThLeaveBalanceState } from 'src/app/servicios/rrhh/th-leave.service';

@Component({
  selector: 'app-th-leave',
  templateUrl: './th-leave.component.html',
  styleUrls: ['./th-leave.component.css']
})
export class ThLeaveComponent implements OnInit {
  idpersonal: number = 0;
  personalList: any[] = [];
  balances: any[] = [];
  requests: any[] = [];
  movements: ThLeaveMovement[] = [];
  movementYear = 0;
  movementPage = 1;
  movementExporting = false;
  private movementExportSequence = 0;

  cambiarFiltroMovimientos() {
    ++this.movementExportSequence;
    this.movementExporting = false; this.movementPage = 1;
  }

  exportarLibro() {
    if (!this.permissionsReady || !this.idpersonal || !Number.isInteger(this.movementYear)
        || this.movementYear < 1900 || this.movementYear > 9999 || this.saving || this.loading || this.movementExporting) return;
    const sequence = ++this.movementExportSequence;
    const personal = this.idpersonal; const year = this.movementYear;
    this.movementExporting = true; this.error = '';
    this.service.exportarLibro(personal, year)
      .pipe(finalize(() => { if (sequence === this.movementExportSequence) this.movementExporting = false; }))
      .subscribe({
        next: blob => {
          if (sequence !== this.movementExportSequence || personal !== this.idpersonal || year !== this.movementYear) return;
          const url = URL.createObjectURL(blob); const link = document.createElement('a');
          link.href = url; link.download = `libro-rrhh-${personal}-${year}.csv`;
          document.body.appendChild(link);
          try { link.click(); } finally { link.remove(); URL.revokeObjectURL(url); }
        },
        error: async e => {
          if (e?.error instanceof Blob) {
            try { e = { status: e.status, error: JSON.parse(await e.error.text()) }; } catch { /* Use fallback. */ }
          }
          if (sequence === this.movementExportSequence && personal === this.idpersonal && year === this.movementYear)
            this.error = this.errorMessage(e, 'No se pudo exportar el libro de movimientos');
        }
      });
  }
  estadoFiltro: string = 'TODAS';
  selectedRequest: any = null;
  history: ThLeaveHistory | null = null;
  historyLoading = false;
  historyError = '';
  private historySequence = 0;
  private detailFromInbox = false;
  balanceStateHistory: ThLeaveBalanceState | null = null;
  balanceStateLoading = false;
  balanceStateError = '';
  private balanceStateSequence = 0;
  private selectedBalanceStateId = 0;

  msg = '';
  error = '';

  aprobadorId = 0;
  canWrite = false;
  permissionsReady = false;
  loading = false;
  saving = false;
  private loadSequence = 0;
  conciliacion: ThLeaveReconciliation | null = null;
  conciliacionYear = 0;
  checking = false;
  exporting = false;
  private reportSequence = 0;
  inboxVisible = false;
  inbox: ThLeaveInbox | null = null;
  inboxLoading = false;
  inboxExporting = false;
  inboxPage = 0;
  inboxSize = 20;
  inboxFilter: ThLeaveInboxFilter = { estado: 'SOLICITADA', tipo: 'TODAS', idpersonal: 0, desde: '', hasta: '' };
  private inboxSequence = 0;
  calendarVisible = false;
  calendarLoading = false;
  calendarError = '';
  calendar: ThLeaveInbox | null = null;
  calendarMode: 'MES' | 'SEMANA' = 'MES';
  calendarDate = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  calendarPersonal = 0;
  calendarType = 'TODAS';
  calendarDays: { fecha: string; semana: string; solicitudes: ThLeaveInboxRequest[] }[] = [];
  private calendarSequence = 0;
  ventana = 'th-leave';

  balanceModel: any = { idpersonal_personal: { idpersonal: 0 }, anio: new Date().getFullYear(), dias_asignados: 0 };
  requestModel: any = { idpersonal_personal: { idpersonal: 0 }, tipolicencia: 'VACACION', fechainicio: '', fechafin: '', motivo: '' };

  ajuste: { idbalance: number; dias: number | null; motivo: string } = { idbalance: 0, dias: null, motivo: '' };
  private ajusteIntent: { fingerprint: string; clave: string } | null = null;

  seleccionarAjuste(balance: any) {
    if (!this.canWrite || this.saving || this.loading || balance.estado === false) return;
    this.ajuste = { idbalance: balance.idbalance, dias: null, motivo: '' };
  }

  guardarAjuste() {
    if (!this.canWrite || this.saving || this.loading) return;
    const b = this.balances.find(row => row.idbalance === this.ajuste.idbalance);
    const dias = Number(this.ajuste.dias);
    const motivo = this.ajuste.motivo.trim();
    if (!b || b.estado === false || this.ajuste.dias === null || !Number.isFinite(dias) || dias === 0
        || Math.abs(dias * 100 - Math.round(dias * 100)) > 0.000001 || !motivo || motivo.length > 2000
        || Number(b.dias_disponibles) + dias < 0) {
      this.error = 'Indique días distintos de cero con hasta dos decimales y motivo; el disponible no puede ser negativo';
      return;
    }
    if (!confirm(`¿Confirma ajustar ${dias} día(s) del saldo ${b.anio}? Los días usados se conservan.`)) return;
    const fingerprint = JSON.stringify([b.idbalance, dias, motivo]);
    if (this.ajusteIntent?.fingerprint !== fingerprint) {
      const bytes = window.crypto.getRandomValues(new Uint8Array(16));
      bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
      const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
      this.ajusteIntent = { fingerprint, clave: `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}` };
    }
    this.execute(this.service.ajustarSaldo(b.idbalance, { dias, motivo, clave: this.ajusteIntent!.clave }), 'Ajuste registrado');
  }

  abrirLibro(balance: any) {
    if (!this.canWrite || this.saving || this.loading) return;
    if (!confirm('¿Registrar el saldo vigente como apertura? Se conservan los días usados anteriores.')) return;
    this.execute(this.service.abrirLibro(balance.idbalance), 'Apertura registrada');
  }

  cambiarEstadoSaldo(balance: any) {
    if (!this.canWrite || this.saving || this.loading) return;
    if (!Number.isSafeInteger(balance.version) || balance.version < 0) {
      this.error = 'Actualice los datos del saldo antes de cambiar su estado'; return;
    }
    const activo = balance.estado !== true;
    if (!confirm(activo ? `¿Activar el saldo de ${balance.anio} para permitir aprobaciones y ajustes?`
      : `¿Inactivar el saldo de ${balance.anio}? Se impedirán nuevas aprobaciones y ajustes; se conservarán historial y reintegros.`)) return;
    const motivo = prompt('Motivo del cambio de estado (obligatorio):', '');
    if (motivo === null) return;
    if (!motivo.trim() || motivo.length > 2000) { this.error = 'Indique un motivo de hasta 2000 caracteres'; return; }
    this.execute(this.service.cambiarEstadoSaldo(balance.idbalance, { activo, version: balance.version, motivo: motivo.trim() }),
      activo ? 'Saldo activado' : 'Saldo inactivado');
  }

  cerrarHistorialEstadoSaldo() {
    ++this.balanceStateSequence; this.selectedBalanceStateId = 0;
    this.balanceStateHistory = null; this.balanceStateError = ''; this.balanceStateLoading = false;
  }

  verHistorialEstadoSaldo(balance: any) {
    if (!this.permissionsReady || this.saving || this.loading) return;
    if (this.balanceStateLoading && this.selectedBalanceStateId === balance.idbalance) return;
    const sequence = ++this.balanceStateSequence;
    this.selectedBalanceStateId = balance.idbalance;
    this.balanceStateHistory = null; this.balanceStateError = ''; this.balanceStateLoading = true;
    this.service.historialEstadoSaldo(balance.idbalance)
      .pipe(finalize(() => { if (sequence === this.balanceStateSequence) this.balanceStateLoading = false; }))
      .subscribe({
        next: data => { if (sequence === this.balanceStateSequence) this.balanceStateHistory = data; },
        error: e => { if (sequence === this.balanceStateSequence) this.balanceStateError = this.errorMessage(e, 'No se pudo consultar el historial del saldo'); }
      });
  }

  page = 1;
  pageSize = 8;

  constructor(
    private service: ThLeaveService,
    private personalService: PersonalService,
    private coloresService: ColoresService,
    public authService: AutorizaService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', `/${this.ventana}`);
    const coloresJSON = sessionStorage.getItem(`/${this.ventana}`);
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    this.service.getPermissions().subscribe({
      next: (permissions) => {
        this.aprobadorId = permissions.userId;
        this.canWrite = permissions.canWrite;
        this.permissionsReady = true;
        this.personalService.getAllPersonal().subscribe({
          next: (data: any) => {
            this.personalList = data || [];
            if (this.personalList.length) {
              this.idpersonal = this.personalList[0].idpersonal;
              this.cargar();
            }
          },
          error: (e) => this.error = this.errorMessage(e, 'No se pudo cargar el personal')
        });
      },
      error: (e) => this.error = this.errorMessage(e, 'No se pudo verificar el acceso a RRHH')
    });
  }

  async buscaColor() {
    try {
      const idusuario = Number(this.authService?.idusuario || 0);
      if (!idusuario) return;
      const datos = await this.coloresService.setcolor(idusuario, this.ventana);
      sessionStorage.setItem(`/${this.ventana}`, JSON.stringify(datos));
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    this.aplicarContrasteCabecera(colores[0]);

    document.querySelectorAll('.cabecera').forEach((el) => el.classList.add('nuevoBG1'));
    document.querySelectorAll('.detalle').forEach((el) => el.classList.add('nuevoBG2'));
  }

  get diasSolicitadosPreview(): number {
    if (!this.requestModel.fechainicio || !this.requestModel.fechafin) return 0;
    const ini = new Date(this.requestModel.fechainicio);
    const fin = new Date(this.requestModel.fechafin);
    const ms = fin.getTime() - ini.getTime();
    if (isNaN(ms) || ms < 0) return 0;
    return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
  }

  get requestsFiltradas(): any[] {
    let base = this.estadoFiltro === 'TODAS' ? [...this.requests] : this.requests.filter(r => r.estado === this.estadoFiltro);
    base = base.sort((a, b) => (b.idrequest || 0) - (a.idrequest || 0));
    const start = (this.page - 1) * this.pageSize;
    return base.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    const total = this.estadoFiltro === 'TODAS' ? this.requests.length : this.requests.filter(r => r.estado === this.estadoFiltro).length;
    return Math.max(1, Math.ceil(total / this.pageSize));
  }

  cambiarFiltro() { this.page = 1; }
  prevPage() { if (this.page > 1) this.page--; }
  nextPage() { if (this.page < this.totalPages) this.page++; }

  estadoClass(estado: string): string {
    switch ((estado || '').toUpperCase()) {
      case 'APROBADA': return 'badge badge-success';
      case 'RECHAZADA': return 'badge badge-danger';
      case 'SOLICITADA': return 'badge badge-warning';
      case 'CANCELADA': return 'badge badge-secondary';
      case 'REVERTIDA': return 'badge badge-info';
      default: return 'badge badge-secondary';
    }
  }

  tipoClass(tipo: string): string {
    switch ((tipo || '').toUpperCase()) {
      case 'VACACION': return 'badge badge-info';
      case 'PERMISO': return 'badge badge-primary';
      case 'LICENCIA': return 'badge badge-dark';
      default: return 'badge badge-secondary';
    }
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(`${fecha.slice(0, 10)}T12:00:00`);
    return isNaN(d.getTime()) ? fecha : d.toLocaleDateString('es-EC');
  }

  refreshAll() {
    this.msg = '';
    this.error = '';
    this.limpiarDetalle();
    this.cargar();
  }

  cargar() {
    const sequence = ++this.loadSequence;
    this.cambiarFiltroMovimientos();
    this.cerrarHistorialEstadoSaldo();
    this.cambiarEjercicioConciliacion();
    this.limpiarDetalle();
    this.balances = [];
    this.requests = [];
    this.movements = [];
    this.movementYear = 0;
    this.movementPage = 1;
    this.page = 1;
    if (!this.idpersonal || !this.permissionsReady) { this.loading = false; return; }
    this.loading = true;
    forkJoin({
      balances: this.service.getBalancesByPersonal(this.idpersonal),
      requests: this.service.getRequestsByPersonal(this.idpersonal),
      movements: this.service.getMovementsByPersonal(this.idpersonal)
    }).pipe(finalize(() => { if (sequence === this.loadSequence) this.loading = false; }))
      .subscribe({
        next: (data: any) => {
          if (sequence !== this.loadSequence) return;
          this.balances = data.balances || [];
          this.requests = data.requests || [];
          this.movements = data.movements || [];
        },
        error: (e) => {
          if (sequence === this.loadSequence) this.error = this.errorMessage(e, 'No se pudieron cargar saldos, solicitudes y movimientos');
        }
      });
  }

  limpiarDetalle() {
    ++this.historySequence;
    this.selectedRequest = null;
    this.history = null;
    this.historyError = '';
    this.historyLoading = false;
    this.detailFromInbox = false;
  }

  verDetalle(r: any) {
    if (!this.permissionsReady || this.saving || !r?.idrequest) return;
    if (this.historyLoading && this.selectedRequest?.idrequest === r.idrequest) return;
    this.limpiarDetalle();
    this.selectedRequest = r;
    this.detailFromInbox = !!r.idpersonal;
    this.cargarHistorial();
  }

  cargarHistorial() {
    if (!this.permissionsReady || this.saving || this.historyLoading || !this.selectedRequest?.idrequest) return;
    const sequence = ++this.historySequence;
    const idrequest = this.selectedRequest.idrequest;
    this.history = null; this.historyError = ''; this.historyLoading = true;
    this.service.getHistorial(idrequest)
      .pipe(finalize(() => { if (sequence === this.historySequence) this.historyLoading = false; }))
      .subscribe({
        next: data => {
          if (sequence !== this.historySequence || this.selectedRequest?.idrequest !== idrequest) return;
          this.history = data;
          this.selectedRequest = data.solicitud;
        },
        error: e => {
          if (sequence === this.historySequence && this.selectedRequest?.idrequest === idrequest)
            this.historyError = this.errorMessage(e, 'No se pudo cargar el historial de la solicitud');
        }
      });
  }

  historyAction(accion: string | null): string {
    const labels: { [key: string]: string } = { CREATE: 'Creación', APPROVE: 'Aprobación', REJECT: 'Rechazo',
      CANCEL: 'Cancelación', REVERSE: 'Reversión', ACTIVATE: 'Activación de saldo', DEACTIVATE: 'Inactivación de saldo' };
    return labels[(accion || '').trim().toUpperCase()] || accion || 'Acción sin identificar';
  }

  toggleBandeja() {
    this.inboxVisible = !this.inboxVisible;
    this.invalidarBandeja();
    if (this.inboxVisible) this.cargarBandeja(0);
  }

  toggleCalendario() {
    this.calendarVisible = !this.calendarVisible;
    this.invalidarCalendario();
    if (this.calendarVisible) this.cargarCalendario();
  }

  invalidarCalendario() {
    ++this.calendarSequence;
    this.calendar = null; this.calendarDays = []; this.calendarLoading = false; this.calendarError = '';
  }

  cargarCalendario(pagina = 0) {
    if (!this.permissionsReady || !this.calendarVisible || this.saving || this.calendarLoading) return;
    const anchor = new Date(`${this.calendarDate}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(this.calendarDate) || Number.isNaN(anchor.getTime())
        || anchor.toISOString().slice(0, 10) !== this.calendarDate || anchor.getUTCFullYear() < 1900
        || anchor.getUTCFullYear() > 9999) {
      this.invalidarCalendario(); this.calendarError = 'Seleccione una fecha válida entre 1900 y 9999'; return;
    }
    const start = new Date(anchor);
    const end = new Date(anchor);
    if (this.calendarMode === 'MES') {
      start.setUTCDate(1); end.setUTCMonth(end.getUTCMonth() + 1, 0);
    } else {
      start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7);
      end.setTime(start.getTime()); end.setUTCDate(end.getUTCDate() + 6);
    }
    if (start.getUTCFullYear() < 1900 || end.getUTCFullYear() > 9999) {
      this.invalidarCalendario(); this.calendarError = 'El período debe estar entre 1900 y 9999'; return;
    }
    const dates: string[] = [];
    for (const day = new Date(start); day <= end; day.setUTCDate(day.getUTCDate() + 1)) dates.push(day.toISOString().slice(0, 10));
    const sequence = ++this.calendarSequence;
    this.calendarLoading = true; this.calendar = null; this.calendarDays = []; this.calendarError = '';
    this.service.getCalendario(this.calendarType, this.calendarPersonal, dates[0], dates[dates.length - 1], pagina)
      .pipe(finalize(() => { if (sequence === this.calendarSequence) this.calendarLoading = false; }))
      .subscribe({
        next: data => {
          if (sequence !== this.calendarSequence) return;
          this.calendar = data;
          this.calendarDays = dates.map(fecha => ({ fecha,
            semana: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][new Date(`${fecha}T00:00:00Z`).getUTCDay()],
            solicitudes: data.contenido.filter(row =>
            !!row.fechainicio && !!row.fechafin && row.fechainicio <= fecha && row.fechafin >= fecha) }));
        },
        error: e => {
          if (sequence === this.calendarSequence) this.calendarError = this.errorMessage(e, 'No se pudo cargar el calendario');
        }
      });
  }

  invalidarBandeja() {
    if (this.detailFromInbox) this.limpiarDetalle();
    ++this.inboxSequence;
    this.inboxExporting = false;
    this.inbox = null;
    this.inboxLoading = false;
    this.inboxPage = 0;
  }

  cargarBandeja(pagina = 0, afterMutation = false) {
    if (!this.permissionsReady || !this.inboxVisible || ((this.saving || this.inboxLoading) && !afterMutation)) return;
    if (this.inboxFilter.desde && this.inboxFilter.hasta && this.inboxFilter.desde > this.inboxFilter.hasta) {
      this.invalidarBandeja(); this.error = 'La fecha desde no puede ser posterior a la fecha hasta'; return;
    }
    const sequence = ++this.inboxSequence;
    this.inboxExporting = false;
    this.inboxLoading = true; this.inbox = null; this.error = afterMutation ? this.error : '';
    this.inboxPage = pagina;
    this.service.getBandeja({ ...this.inboxFilter }, pagina, this.inboxSize)
      .pipe(finalize(() => { if (sequence === this.inboxSequence) this.inboxLoading = false; }))
      .subscribe({
        next: data => {
          if (sequence !== this.inboxSequence) return;
          // A resolved item may remove the last row of the last page.
          if (pagina > 0 && data.contenido.length === 0) {
            this.inboxLoading = false;
            this.cargarBandeja(Math.max(0, data.total_paginas - 1), afterMutation); return;
          }
          this.inbox = data;
        },
        error: e => {
          if (sequence === this.inboxSequence) this.error = this.errorMessage(e, 'No se pudo cargar la bandeja');
        }
      });
  }

  exportarBandeja() {
    if (!this.permissionsReady || !this.inboxVisible || !this.inbox?.contenido.length
        || this.inboxLoading || this.inboxExporting || this.saving) return;
    const sequence = this.inboxSequence;
    const pagina = this.inbox.pagina;
    this.inboxExporting = true; this.error = '';
    this.service.exportarBandeja({ ...this.inboxFilter }, pagina, this.inbox.tamano)
      .pipe(finalize(() => { if (sequence === this.inboxSequence) this.inboxExporting = false; }))
      .subscribe({
        next: blob => {
          if (sequence !== this.inboxSequence || !this.inboxVisible) return;
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url; link.download = `solicitudes-rrhh-pagina-${pagina + 1}.csv`;
          document.body.appendChild(link);
          try { link.click(); } finally { link.remove(); URL.revokeObjectURL(url); }
        },
        error: async e => {
          if (e?.error instanceof Blob) {
            try { e = { status: e.status, error: JSON.parse(await e.error.text()) }; } catch { /* Use fallback. */ }
          }
          if (sequence === this.inboxSequence) this.error = this.errorMessage(e, 'No se pudo exportar la página de solicitudes');
        }
      });
  }

  resolverBandeja(row: ThLeaveInboxRequest, approve: boolean) {
    if (this.inboxLoading || !this.inboxVisible || !this.inbox?.contenido.some(r => r.idrequest === row.idrequest)) return;
    this.resolver(row.idrequest, approve, row);
  }

  verEmpleadoBandeja(row: ThLeaveInboxRequest) {
    if (this.saving || this.loading || !row.idpersonal) return;
    this.idpersonal = row.idpersonal;
    this.cargar();
  }

  get reconciliationYears(): number[] {
    return [...new Set([...this.balances.map(b => b.anio),
      ...this.requests.map(r => Number(r.fechainicio?.slice(0, 4)))])]
      .filter(year => Number.isInteger(year) && year >= 1900 && year <= 9999).sort((a, b) => b - a);
  }

  cambiarEjercicioConciliacion() {
    ++this.reportSequence;
    this.conciliacion = null;
    this.checking = false;
    this.exporting = false;
  }

  verificarConciliacion() {
    if (!this.permissionsReady || !this.idpersonal || this.saving || this.loading || this.checking || this.exporting) return;
    const sequence = ++this.reportSequence;
    const personal = this.idpersonal;
    this.checking = true;
    this.conciliacion = null;
    this.error = '';
    this.service.verificarConciliacion(personal, this.conciliacionYear || undefined)
      .pipe(finalize(() => { if (sequence === this.reportSequence) this.checking = false; }))
      .subscribe({
        next: report => {
          if (sequence === this.reportSequence && personal === this.idpersonal) this.conciliacion = report;
        },
        error: e => {
          if (sequence === this.reportSequence && personal === this.idpersonal)
            this.error = this.errorMessage(e, 'No se pudo verificar el saldo');
        }
      });
  }

  exportarConciliacion() {
    if (!this.permissionsReady || !this.idpersonal || !this.conciliacion || this.saving || this.loading || this.checking || this.exporting) return;
    const sequence = this.reportSequence;
    const personal = this.idpersonal;
    this.exporting = true;
    this.error = '';
    this.service.exportarConciliacion(personal, this.conciliacionYear || undefined)
      .pipe(finalize(() => { if (sequence === this.reportSequence) this.exporting = false; }))
      .subscribe({
        next: blob => {
          if (sequence !== this.reportSequence || personal !== this.idpersonal) return;
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `conciliacion-rrhh-${personal}.csv`;
          document.body.appendChild(link);
          try { link.click(); }
          finally { link.remove(); URL.revokeObjectURL(url); }
        },
        error: async e => {
          if (e?.error instanceof Blob) {
            try { e = { status: e.status, error: JSON.parse(await e.error.text()) }; } catch { /* Use fallback below. */ }
          }
          if (sequence === this.reportSequence && personal === this.idpersonal)
            this.error = this.errorMessage(e, 'No se pudo exportar la verificación');
        }
      });
  }

  reconciliationLabel(status: string): string {
    const labels: { [key: string]: string } = {
      COINCIDE: 'Coincide con el libro', DIFERENCIA: 'Requiere revisión', SIN_LIBRO: 'Sin apertura del libro',
      SIN_SALDO: 'Sin saldo registrado', SALDO_INVALIDO: 'Saldo inválido'
    };
    return labels[status] || status;
  }

  get canSubmitRequest(): boolean {
    return this.canWrite && !this.saving && !this.loading && !!this.idpersonal
      && this.diasSolicitadosPreview > 0 && !this.crossYearVacation;
  }

  get crossYearVacation(): boolean {
    return this.requestModel.tipolicencia === 'VACACION'
      && !!this.requestModel.fechainicio && !!this.requestModel.fechafin
      && this.requestModel.fechainicio.slice(0, 4) !== this.requestModel.fechafin.slice(0, 4);
  }

  crearBalance() {
    if (!this.canWrite || this.saving || this.loading) return;
    const anio = Number(this.balanceModel.anio);
    const dias = Number(this.balanceModel.dias_asignados);
    if (!this.idpersonal || !Number.isInteger(anio) || anio < 1900 || anio > 9999
        || !Number.isFinite(dias) || dias < 0 || this.balanceModel.dias_asignados === null) {
      this.error = 'Seleccione personal, un año válido y días asignados no negativos';
      return;
    }
    this.execute(this.service.createBalance({
      idpersonal_personal: { idpersonal: this.idpersonal }, anio, dias_asignados: dias
    }), 'Saldo creado');
  }

  crearRequest() {
    if (!this.canWrite || this.saving || this.loading) return;
    if (!this.canSubmitRequest) {
      this.error = this.crossYearVacation ? 'Registre las vacaciones en solicitudes separadas por año'
        : 'Seleccione personal y un rango de fechas válido';
      return;
    }
    this.execute(this.service.createRequest({
      idpersonal_personal: { idpersonal: this.idpersonal },
      tipolicencia: this.requestModel.tipolicencia,
      fechainicio: this.requestModel.fechainicio,
      fechafin: this.requestModel.fechafin,
      motivo: this.requestModel.motivo
    }), 'Solicitud creada', true);
  }

  aprobar(idrequest: number) { this.resolver(idrequest, true); }
  rechazar(idrequest: number) { this.resolver(idrequest, false); }

  cancelar(idrequest: number) { this.retirar(idrequest, false); }
  revertir(idrequest: number) { this.retirar(idrequest, true); }

  private retirar(idrequest: number, reverse: boolean) {
    if (!this.canWrite || this.saving || this.loading) return;
    const request = this.requests.find(r => r.idrequest === idrequest);
    if (!request || request.estado !== (reverse ? 'APROBADA' : 'SOLICITADA')) return;
    const message = reverse && request.tipolicencia === 'VACACION'
      ? '¿Confirma revertir la aprobación y reintegrar el consumo registrado al saldo de vacaciones?'
      : reverse ? '¿Confirma revertir esta aprobación?' : '¿Confirma cancelar esta solicitud pendiente?';
    if (!confirm(message)) return;
    const motivo = prompt(reverse ? 'Motivo de la reversión (obligatorio):' : 'Motivo de la cancelación (obligatorio):', '');
    if (motivo === null) return;
    if (!motivo.trim()) { this.error = 'Indique un motivo para continuar'; return; }
    const payload = { motivo: motivo.trim() };
    this.execute(reverse ? this.service.revertir(idrequest, payload) : this.service.cancelar(idrequest, payload),
      reverse ? 'Aprobación revertida' : 'Solicitud cancelada');
  }

  get movementYears(): number[] {
    return [...new Set(this.movements.map(m => m.anio))].sort((a, b) => b - a);
  }

  get filteredMovements(): ThLeaveMovement[] {
    const rows = this.movementYear ? this.movements.filter(m => m.anio === this.movementYear) : this.movements;
    return rows.slice((this.movementPage - 1) * this.pageSize, this.movementPage * this.pageSize);
  }

  get movementTotalPages(): number {
    const count = this.movementYear ? this.movements.filter(m => m.anio === this.movementYear).length : this.movements.length;
    return Math.max(1, Math.ceil(count / this.pageSize));
  }

  private resolver(idrequest: number, approve: boolean, inboxRequest?: ThLeaveInboxRequest) {
    if (!this.canWrite || this.saving || this.loading) return;
    const request = inboxRequest || this.requests.find(r => r.idrequest === idrequest);
    if (!request || request.estado !== 'SOLICITADA') return;
    const persona = inboxRequest ? ` de ${inboxRequest.apellidos || ''} ${inboxRequest.nombres || ''}` : '';
    if (!confirm(`¿Confirma ${approve ? 'aprobar' : 'rechazar'} la solicitud #${idrequest}${persona}?`)) return;
    const observacion = prompt(approve ? 'Observación de aprobación:' : 'Motivo del rechazo:', '');
    if (observacion === null) return;
    if (!approve && !observacion.trim()) { this.error = 'Indique el motivo del rechazo'; return; }
    const payload = { observacion: observacion.trim() };
    this.execute(approve ? this.service.aprobar(idrequest, payload) : this.service.rechazar(idrequest, payload),
      approve ? 'Solicitud aprobada' : 'Solicitud rechazada');
  }

  private execute(operation: Observable<any>, message: string, resetRequest = false) {
    this.msg = ''; this.error = ''; this.saving = true;
    operation.pipe(finalize(() => this.saving = false)).subscribe({
      next: () => {
        this.msg = message;
        this.invalidarCalendario();
        this.ajuste = { idbalance: 0, dias: null, motivo: '' };
        this.ajusteIntent = null;
        if (resetRequest) this.requestModel = {
          idpersonal_personal: { idpersonal: this.idpersonal }, tipolicencia: 'VACACION',
          fechainicio: '', fechafin: '', motivo: ''
        };
        this.cargar();
        if (this.inboxVisible) this.cargarBandeja(this.inboxPage, true);
      },
      error: (e) => {
        this.error = this.errorMessage(e, 'No se pudo completar la operación');
        if (e?.status === 401 || e?.status === 403) this.canWrite = false;
        if (e?.status === 409) {
          this.invalidarCalendario();
          this.cargar();
          if (this.inboxVisible) this.cargarBandeja(this.inboxPage, true);
        }
      }
    });
  }

  private errorMessage(error: any, fallback: string): string {
    if (error?.status === 401) return 'La sesión expiró. Inicie sesión nuevamente.';
    if (error?.status === 403) return 'No tiene permiso para esta operación.';
    return error?.error?.message || fallback;
  }
  private aplicarContrasteCabecera(color: string) {
    const rgb = this.toRgb(color);
    if (!rgb) return;
    const [r, g, b] = rgb;
    const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const textColor = luminancia > 0.6 ? '#212529' : '#ffffff';
    document.documentElement.style.setProperty('--header-text-color', textColor);
  }

  private toRgb(color: string): [number, number, number] | null {
    if (!color) return null;
    const c = color.trim();
    if (c.startsWith('#')) {
      const hex = c.slice(1);
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        return [r, g, b];
      }
      if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return [r, g, b];
      }
    }
    const m = c.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
    return null;
  }
}

