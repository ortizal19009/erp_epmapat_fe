import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { ColoresService } from 'src/app/compartida/colores.service';
import { PersonalService } from 'src/app/servicios/rrhh/personal.service';
import { ThActionsService } from 'src/app/servicios/rrhh/th-actions.service';
import { ThAuditService } from 'src/app/servicios/rrhh/th-audit.service';
import { ThFilesService } from 'src/app/servicios/rrhh/th-files.service';
import { ThLeaveService } from 'src/app/servicios/rrhh/th-leave.service';
import { PerformanceReview, ThPerformanceService } from 'src/app/servicios/rrhh/th-performance.service';
import { linkedUserState } from '../../shared/personal-user-state';

@Component({
  selector: 'app-info-personal',
  templateUrl: './info-personal.component.html',
  styleUrls: ['./info-personal.component.css'],
})
export class InfoPersonalComponent implements OnInit {
  personal: any = {};
  personalId: number;
  cargando = true;
  activeTab = 'resumen';
  vacaciones: any[] = [];
  solicitudesVacaciones: any[] = [];
  historial: any[] = [];
  documentos: any[] = [];
  auditoria: any[] = [];
  evaluaciones: PerformanceReview[] = [];
  errorEvaluaciones = '';

  tabs = [
    { id: 'resumen', label: 'Resumen', icon: 'bi-grid-1x2' },
    { id: 'vacaciones', label: 'Vacaciones', icon: 'bi-calendar2-week' },
    { id: 'historial', label: 'Historial', icon: 'bi-clock-history' },
    { id: 'documentos', label: 'Documentos', icon: 'bi-folder2-open' },
    { id: 'usuario', label: 'Usuario', icon: 'bi-person-gear' },
    { id: 'evaluacion', label: 'Evaluacion', icon: 'bi-graph-up-arrow' },
  ];

  constructor(
    private router: Router,
    private s_personal: PersonalService,
    private coloresService: ColoresService,
    private leaveService: ThLeaveService,
    private filesService: ThFilesService,
    private actionsService: ThActionsService,
    private auditService: ThAuditService,
    private route: ActivatedRoute,
    private performanceService: ThPerformanceService
  ) {}

  ngOnInit(): void {
    const requested = this.route.snapshot.queryParamMap.get('idpersonal');
    const id = Number(requested ?? sessionStorage.getItem('idpersonalToInfo'));
    this.personalId = Number.isSafeInteger(id) && id > 0 ? id : 0;
    if (this.personalId) sessionStorage.setItem('idpersonalToInfo', String(this.personalId));
    sessionStorage.setItem('ventana', '/personal');
    const coloresJSON = sessionStorage.getItem('/personal');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    if (this.personalId) this.loadDashboard();
    else this.cargando = false;
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
  }

  loadDashboard() {
    this.cargando = true;
    this.errorEvaluaciones = '';
    forkJoin({
      personal: this.s_personal.getPersonalById(this.personalId).pipe(catchError(() => of({}))),
      vacaciones: this.leaveService
        .getBalancesByPersonal(this.personalId)
        .pipe(catchError(() => of([]))),
      solicitudes: this.leaveService
        .getRequestsByPersonal(this.personalId)
        .pipe(catchError(() => of([]))),
      historial: this.actionsService
        .getByPersonal(this.personalId)
        .pipe(catchError(() => of([]))),
      documentos: this.filesService
        .byPersonal(this.personalId)
        .pipe(catchError(() => of([]))),
      auditoria: this.auditService
        .byEntidadRegistro('PERSONAL', this.personalId)
        .pipe(catchError(() => of([]))),
      evaluaciones: this.performanceService.byPersonal(this.personalId, 0, 5).pipe(catchError(() => {
        this.errorEvaluaciones = 'No se pudieron consultar las evaluaciones o no tiene acceso a ellas.';
        return of({ content: [] });
      })),
    }).subscribe({
      next: (data: any) => {
        this.personal = data.personal || {};
        this.vacaciones = this.toArray(data.vacaciones);
        this.solicitudesVacaciones = this.toArray(data.solicitudes);
        this.historial = this.toArray(data.historial);
        this.documentos = this.toArray(data.documentos);
        this.auditoria = this.toArray(data.auditoria);
        this.evaluaciones = this.toArray(data.evaluaciones);
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      },
    });
  }

  regresar() {
    this.router.navigate(['/personal']);
  }

  abrirGestion(destino: 'th-leave' | 'th-files' | 'th-performance') {
    if (!this.personalId) return;
    this.router.navigate([`/${destino}`], { queryParams: { idpersonal: this.personalId } });
  }

  editar() {
    sessionStorage.setItem('idpersonalToModi', String(this.personalId));
    this.router.navigate(['/modi-personal']);
  }

  imprimir() {
    window.print();
  }

  crearUsuario() {
    if (this.activeTab !== 'usuario' || !this.personalId || linkedUserState(this.personal) !== false) return;
    this.s_personal.crearUsuarioSistema(this.personalId).subscribe({
      next: () => { this.loadDashboard(); alert('Solicitud de usuario enviada.'); },
      error: () => alert('Endpoint de usuario pendiente en backend.'),
    });
  }

  resetPassword() {
    if (this.activeTab !== 'usuario' || !this.personalId || linkedUserState(this.personal) !== true) return;
    this.s_personal.resetearPassword(this.personalId).subscribe({
      next: () => alert('Password reseteado correctamente.'),
      error: () => alert('Endpoint de reset pendiente en backend.'),
    });
  }

  get estadoUsuarioVinculado(): boolean | null { return linkedUserState(this.personal); }

  nombreCompleto(): string {
    return `${this.personal?.apellidos || ''} ${this.personal?.nombres || ''}`.trim();
  }

  iniciales(): string {
    return this.nombreCompleto()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((item) => item[0])
      .join('')
      .toUpperCase();
  }

  cargo(): string {
    return (
      this.personal?.cargoActual ||
      this.personal?.cargo ||
      this.personal?.idcargo_cargos?.descripcion ||
      'Sin cargo asignado'
    );
  }

  tipoContrato(): string {
    return (
      this.personal?.tipoContrato ||
      this.personal?.idtpcontrato_tpcontratos?.descripcion ||
      'No definido'
    );
  }

  estadoLaboral(): string {
    if (this.personal?.estadoLaboral) return this.personal.estadoLaboral;
    if (this.personal?.estado === false) return 'Desvinculado';
    return 'Activo';
  }

  edad(): string {
    if (!this.personal?.fecnacimiento) return 'N/D';
    return `${this.calcularAnios(this.personal.fecnacimiento)} anios`;
  }

  antiguedad(): string {
    const inicio = this.personal?.fecinicio || this.personal?.fechaIngreso;
    if (!inicio) return 'N/D';
    return `${this.calcularAnios(inicio)} anios`;
  }

  diasGanados(): number {
    return this.sumBy(['dias_asignados', 'diasGanados', 'ganados', 'totalDias']);
  }

  diasUsados(): number {
    return this.sumBy(['dias_usados', 'diasUsados', 'usados', 'diasTomados']);
  }

  diasPendientes(): number {
    const explicit = this.sumBy(['dias_disponibles', 'diasPendientes', 'pendientes', 'saldo']);
    return explicit || Math.max(0, this.diasGanados() - this.diasUsados());
  }

  avanceVacaciones(): number {
    const total = this.diasGanados();
    if (!total) return 0;
    return Math.min(100, Math.round((this.diasUsados() / total) * 100));
  }

  kpis() {
    return [
      { label: 'Dias vacaciones', value: this.diasPendientes(), hint: 'pendientes', icon: 'bi-umbrella' },
      { label: 'Historial', value: this.historial.length, hint: 'eventos', icon: 'bi-clock-history' },
      { label: 'Documentos', value: this.documentos.length, hint: 'archivos', icon: 'bi-folder-check' },
      { label: 'Auditoria', value: this.auditoria.length, hint: 'movimientos', icon: 'bi-shield-check' },
    ];
  }

  private calcularAnios(dateValue: string): number {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 0;
    const today = new Date();
    let years = today.getFullYear() - date.getFullYear();
    const monthDelta = today.getMonth() - date.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < date.getDate())) years--;
    return Math.max(0, years);
  }

  private sumBy(keys: string[]): number {
    return this.vacaciones.reduce((total, item) => {
      const key = keys.find((candidate) => item?.[candidate] !== undefined);
      return total + Number(key ? item[key] : 0);
    }, 0);
  }

  private toArray(value: any): any[] {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.content)) return value.content;
    return [];
  }
}
