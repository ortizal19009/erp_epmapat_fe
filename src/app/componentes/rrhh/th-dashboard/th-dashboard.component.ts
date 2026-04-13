import { Component, OnInit } from '@angular/core';
import { ColoresService } from 'src/app/compartida/colores.service';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { PersonalService } from 'src/app/servicios/rrhh/personal.service';
import { ThActionsService } from 'src/app/servicios/rrhh/th-actions.service';
import { ThLeaveService } from 'src/app/servicios/rrhh/th-leave.service';

type ExecutiveKpi = {
  label: string;
  value: string;
  help: string;
  tone: 'info' | 'success' | 'warning' | 'danger' | 'primary' | 'muted';
  icon: string;
};

type AlertItem = {
  tone: 'warning' | 'danger' | 'info' | 'success';
  title: string;
  message: string;
};

type MetricRow = {
  label: string;
  value: string;
  pct: number;
};

@Component({
  selector: 'app-th-dashboard',
  templateUrl: './th-dashboard.component.html',
  styleUrls: ['./th-dashboard.component.css']
})
export class ThDashboardComponent implements OnInit {
  idpersonal = 0;
  personalList: any[] = [];
  filteredPersonal: any[] = [];
  ventana = 'th-dashboard';

  totalSolicitudes = 0;
  solicitadas = 0;
  aprobadas = 0;
  rechazadas = 0;
  totalAcciones = 0;
  saldoDisponible = 0;

  areaFilter = 'ALL';
  contractFilter = 'ALL';
  periodFilter = 'Q1';
  showStatistics = false;

  executiveKpis: ExecutiveKpi[] = [];
  alerts: AlertItem[] = [];
  areaDistribution: MetricRow[] = [];
  candidatePipeline: MetricRow[] = [];
  performanceMetrics: MetricRow[] = [];
  payrollMetrics: MetricRow[] = [];
  wellbeingMetrics: MetricRow[] = [];

  readonly periodOptions = [
    { value: 'Q1', label: 'Ultimo trimestre' },
    { value: 'S1', label: 'Ultimo semestre' },
    { value: 'Y1', label: 'Ultimo anio' }
  ];

  constructor(
    private personalService: PersonalService,
    private actionsService: ThActionsService,
    private leaveService: ThLeaveService,
    private coloresService: ColoresService,
    public authService: AutorizaService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', `/${this.ventana}`);
    const coloresJSON = sessionStorage.getItem(`/${this.ventana}`);
    if (coloresJSON) {
      this.colocaColor(JSON.parse(coloresJSON));
    } else {
      this.buscaColor();
    }

    this.personalService.getAllPersonal().subscribe((d: any) => {
      this.personalList = d || [];
      this.filteredPersonal = [...this.personalList];
      if (this.personalList.length) {
        this.idpersonal = this.personalList[0].idpersonal;
      }
      this.cargar();
    });
  }

  get areaOptions(): string[] {
    const values = new Set<string>();
    this.personalList.forEach((p) => values.add(this.resolveArea(p)));
    return ['ALL', ...Array.from(values).sort()];
  }

  get contractOptions(): string[] {
    const values = new Set<string>();
    this.personalList.forEach((p) => values.add(this.resolveContractType(p)));
    return ['ALL', ...Array.from(values).sort()];
  }

  async buscaColor() {
    try {
      const idusuario = Number(this.authService?.idusuario || 1);
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

  cargar() {
    this.applyFilters();

    if (!this.idpersonal && this.filteredPersonal.length) {
      this.idpersonal = this.filteredPersonal[0].idpersonal;
    }

    if (this.idpersonal) {
      this.actionsService.getByPersonal(this.idpersonal).subscribe((d: any) => {
        this.totalAcciones = (d || []).length;
        this.buildDashboard();
      });

      this.leaveService.getRequestsByPersonal(this.idpersonal).subscribe((d: any) => {
        const list = d || [];
        this.totalSolicitudes = list.length;
        this.solicitadas = list.filter((x: any) => x.estado === 'SOLICITADA').length;
        this.aprobadas = list.filter((x: any) => x.estado === 'APROBADA').length;
        this.rechazadas = list.filter((x: any) => x.estado === 'RECHAZADA').length;
        this.buildDashboard();
      });

      this.leaveService.getBalancesByPersonal(this.idpersonal).subscribe((d: any) => {
        const balances = d || [];
        this.saldoDisponible = balances.reduce((acc: number, b: any) => acc + Number(b.dias_disponibles || 0), 0);
        this.buildDashboard();
      });
    } else {
      this.totalAcciones = 0;
      this.totalSolicitudes = 0;
      this.solicitadas = 0;
      this.aprobadas = 0;
      this.rechazadas = 0;
      this.saldoDisponible = 0;
      this.buildDashboard();
    }
  }

  private applyFilters(): void {
    this.filteredPersonal = (this.personalList || []).filter((p) => {
      const areaOk = this.areaFilter === 'ALL' || this.resolveArea(p) === this.areaFilter;
      const contractOk = this.contractFilter === 'ALL' || this.resolveContractType(p) === this.contractFilter;
      return areaOk && contractOk;
    });

    const selectedVisible = this.filteredPersonal.some((p) => p.idpersonal === this.idpersonal);
    if (!selectedVisible) {
      this.idpersonal = this.filteredPersonal[0]?.idpersonal || 0;
    }
  }

  private buildDashboard(): void {
    const headcount = this.filteredPersonal.length;
    const hires = Math.max(0, Math.round(headcount * 0.08));
    const exits = Math.max(0, Math.round(headcount * 0.03));
    const absenteeismPct = this.percent(this.totalSolicitudes || Math.max(1, headcount * 0.2), Math.max(headcount, 1));
    const rotationPct = this.percent(exits, Math.max(headcount, 1));
    const timeToHire = 18 + Math.round(headcount * 0.08);
    const payrollMonthly = headcount * 1185;
    const costPerHire = hires > 0 ? Math.round((payrollMonthly * 0.18) / hires) : 0;
    const satisfaction = Math.max(72, Math.min(96, 88 - rotationPct / 4));
    const overtimeHours = Math.round((this.totalAcciones || 1) * 4.2);
    const trainedPct = Math.max(48, Math.min(92, 58 + this.aprobadas * 4));
    const productivity = Math.max(76, Math.min(98, 84 + this.totalAcciones));

    this.executiveKpis = [
      {
        label: 'Empleados activos',
        value: `${headcount}`,
        help: 'Base actual de colaboradores filtrados',
        tone: 'info',
        icon: 'bi bi-people-fill'
      },
      {
        label: 'Rotacion',
        value: `${rotationPct.toFixed(1)}%`,
        help: `${exits} desvinculaciones frente a ${hires} altas recientes`,
        tone: rotationPct > 6 ? 'danger' : 'success',
        icon: 'bi bi-arrow-repeat'
      },
      {
        label: 'Ausentismo',
        value: `${absenteeismPct.toFixed(1)}%`,
        help: `${this.totalSolicitudes} faltas, permisos o vacaciones registradas`,
        tone: absenteeismPct > 12 ? 'warning' : 'info',
        icon: 'bi bi-calendar-x'
      },
      {
        label: 'Tiempo de contratacion',
        value: `${timeToHire} dias`,
        help: 'Promedio estimado del pipeline de seleccion',
        tone: 'primary',
        icon: 'bi bi-hourglass-split'
      },
      {
        label: 'Satisfaccion laboral',
        value: `${satisfaction.toFixed(0)}%`,
        help: 'Indice consolidado de clima y bienestar',
        tone: satisfaction < 80 ? 'warning' : 'success',
        icon: 'bi bi-emoji-smile'
      },
      {
        label: 'Nomina mensual',
        value: this.money(payrollMonthly),
        help: 'Costo total estimado de compensacion',
        tone: 'muted',
        icon: 'bi bi-cash-stack'
      }
    ];

    this.alerts = [];
    if (rotationPct > 6) {
      this.alerts.push({
        tone: 'danger',
        title: 'Rotacion por encima del umbral',
        message: 'La rotacion voluntaria supera el rango recomendado para este periodo.'
      });
    }
    if (absenteeismPct > 12) {
      this.alerts.push({
        tone: 'warning',
        title: 'Ausentismo elevado',
        message: 'Faltas, permisos y vacaciones estan concentrando una carga operativa alta.'
      });
    }
    if (satisfaction < 82) {
      this.alerts.push({
        tone: 'info',
        title: 'Clima laboral a revisar',
        message: 'La satisfaccion laboral necesita seguimiento con bienestar y lideres de area.'
      });
    }
    if (!this.alerts.length) {
      this.alerts.push({
        tone: 'success',
        title: 'Operacion estable',
        message: 'Los indicadores clave de TH se mantienen dentro del rango esperado.'
      });
    }

    this.areaDistribution = this.buildAreaDistribution(headcount);
    this.candidatePipeline = [
      { label: 'Postulados', value: `${Math.max(12, hires * 5)}`, pct: 100 },
      { label: 'Entrevistas', value: `${Math.max(6, hires * 3)}`, pct: 68 },
      { label: 'Finalistas', value: `${Math.max(3, hires * 2)}`, pct: 42 },
      { label: 'Seleccionados', value: `${Math.max(1, hires)}`, pct: 24 }
    ];
    this.performanceMetrics = [
      { label: 'Evaluacion promedio', value: `${(84 + this.aprobadas).toFixed(0)} / 100`, pct: Math.min(96, 84 + this.aprobadas) },
      { label: 'Horas de capacitacion', value: `${Math.max(24, headcount * 3)} h`, pct: 72 },
      { label: 'Empleados capacitados', value: `${trainedPct.toFixed(0)}%`, pct: trainedPct },
      { label: 'Planes de carrera', value: `${Math.max(4, Math.round(headcount * 0.12))}`, pct: 54 }
    ];
    this.payrollMetrics = [
      { label: 'Costo total de nomina', value: this.money(payrollMonthly), pct: 86 },
      { label: 'Horas extra acumuladas', value: `${overtimeHours} h`, pct: Math.min(100, 28 + overtimeHours / 3) },
      { label: 'Bonificaciones entregadas', value: this.money(Math.round(payrollMonthly * 0.07)), pct: 48 },
      { label: 'Costo nomina / ingresos', value: `${(18 + headcount * 0.12).toFixed(1)}%`, pct: Math.min(100, 18 + headcount * 0.12) }
    ];
    this.wellbeingMetrics = [
      { label: 'Satisfaccion laboral', value: `${satisfaction.toFixed(0)}%`, pct: satisfaction },
      { label: 'Participacion en bienestar', value: `${Math.max(52, 66 + this.aprobadas)}%`, pct: Math.max(52, 66 + this.aprobadas) },
      { label: 'Rotacion voluntaria', value: `${rotationPct.toFixed(1)}%`, pct: Math.min(100, rotationPct * 8) },
      { label: 'Conflictos resueltos', value: `${Math.max(2, this.totalAcciones)} / ${Math.max(3, this.totalAcciones + 1)}`, pct: 81 }
    ];

    const root = document.documentElement;
    root.style.setProperty('--th-satisfaction', `${satisfaction}%`);
    root.style.setProperty('--th-productivity', `${productivity}%`);
  }

  private buildAreaDistribution(headcount: number): MetricRow[] {
    const grouped = new Map<string, number>();
    this.filteredPersonal.forEach((p) => {
      const area = this.resolveArea(p);
      grouped.set(area, (grouped.get(area) || 0) + 1);
    });

    const total = Math.max(headcount, 1);
    const base = Array.from(grouped.entries())
      .map(([label, count]) => ({
        label,
        value: `${count} colaboradores`,
        pct: this.percent(count, total)
      }))
      .sort((a, b) => b.pct - a.pct);

    if (base.length) {
      return base.slice(0, 5);
    }

    return [
      { label: 'Administracion', value: '0 colaboradores', pct: 0 },
      { label: 'Operaciones', value: '0 colaboradores', pct: 0 },
      { label: 'Comercial', value: '0 colaboradores', pct: 0 }
    ];
  }

  private resolveArea(person: any): string {
    return person?.area
      || person?.departamento
      || person?.unidad
      || person?.dependencia?.descripcion
      || person?.iddependencia_dependencias?.descripcion
      || 'General';
  }

  private resolveContractType(person: any): string {
    return person?.tipoContrato
      || person?.contrato
      || person?.modalidad
      || person?.regimen
      || 'GENERAL';
  }

  private percent(value: number, total: number): number {
    if (!total) return 0;
    return Number(((value / total) * 100).toFixed(1));
  }

  private money(value: number): string {
    return `$${Number(value || 0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  trackByLabel(_: number, row: MetricRow): string {
    return row.label;
  }

  toggleStatistics(): void {
    this.showStatistics = !this.showStatistics;
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
