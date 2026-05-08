import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ColoresService } from 'src/app/compartida/colores.service';
import {
  PersonalSearchParams,
  PersonalService,
} from 'src/app/servicios/rrhh/personal.service';

interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-personal',
  templateUrl: './personal.component.html',
  styleUrls: ['./personal.component.css'],
})
export class PersonalComponent implements OnInit {
  f_personal: FormGroup;
  _personal: any[] = [];
  personalFiltrado: any[] = [];
  personalPagina: any[] = [];
  cargando = false;
  errorListado = '';
  filtrosAvanzados = false;

  page = 0;
  size = 10;
  totalElements = 0;
  totalPages = 0;
  pageSizes = [10, 20, 50, 100];
  sort: SortState = { field: 'apellidos', direction: 'asc' };

  quickActions = [
    { icon: 'bi-person-check', label: 'Crear usuario' },
    { icon: 'bi-key', label: 'Resetear contraseña' },
    { icon: 'bi-calendar2-check', label: 'Vacaciones' },
    { icon: 'bi-clock-history', label: 'Historial laboral' },
    { icon: 'bi-folder2-open', label: 'Expediente' },
  ];

  constructor(
    private s_personal: PersonalService,
    private coloresService: ColoresService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.f_personal = this.fb.group({
      q: [''],
      nombres: [''],
      apellidos: [''],
      identificacion: [''],
      email: [''],
      celular: [''],
      cargo: [''],
      departamento: [''],
      direccion: [''],
      estadoLaboral: [''],
      tipoContrato: [''],
      usuarioSistema: [''],
      fechaIngresoDesde: [''],
      fechaIngresoHasta: [''],
      area: [''],
      sucursal: [''],
    });

    sessionStorage.setItem('ventana', '/personal');
    const coloresJSON = sessionStorage.getItem('/personal');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();
    this.buscarPersonal();
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, 'abonados');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/personal', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
  }

  buscarPersonal(resetPage = true) {
    if (resetPage) this.page = 0;
    this.cargando = true;
    this.errorListado = '';

    const params: PersonalSearchParams = {
      ...this.limpiarFiltros(this.f_personal.value),
      page: this.page,
      size: this.size,
      sort: this.sort.field,
      direction: this.sort.direction,
    };

    this.s_personal.searchPersonal(params).subscribe({
      next: (datos: any) => {
        this.hidratarListado(datos);
        this.cargando = false;
      },
      error: (error: any) => {
        console.error(error);
        this.errorListado =
          'No se pudo consultar con filtros server-side. Se intentara cargar el listado base.';
        this.cargarListadoBase();
      },
    });
  }

  cargarListadoBase() {
    this.s_personal.getAllPersonal().subscribe({
      next: (datos: any) => {
        this.hidratarListado(datos);
        this.cargando = false;
      },
      error: (error: any) => {
        console.error(error);
        this.errorListado = 'No se pudo cargar el listado de personal.';
        this.cargando = false;
      },
    });
  }

  hidratarListado(datos: any) {
    const pageContent = Array.isArray(datos?.content) ? datos.content : null;
    const rows = pageContent || (Array.isArray(datos) ? datos : []);

    this._personal = rows;
    this.totalElements = Number(datos?.totalElements ?? rows.length);
    this.totalPages = Number(
      datos?.totalPages ?? Math.max(1, Math.ceil(this.totalElements / this.size))
    );

    if (pageContent) {
      this.personalFiltrado = rows;
      this.personalPagina = rows;
    } else {
      this.aplicarFiltrosLocales();
    }
  }

  aplicarFiltrosLocales() {
    const filtros = this.limpiarFiltros(this.f_personal.value);
    const rows = [...this._personal]
      .filter((personal) => this.coincideConFiltros(personal, filtros))
      .sort((a, b) => this.comparar(a, b));

    this.personalFiltrado = rows;
    this.totalElements = rows.length;
    this.totalPages = Math.max(1, Math.ceil(rows.length / this.size));
    if (this.page > this.totalPages - 1) this.page = this.totalPages - 1;
    const from = this.page * this.size;
    this.personalPagina = rows.slice(from, from + this.size);
  }

  ordenar(field: string) {
    if (this.sort.field === field) {
      this.sort.direction = this.sort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sort = { field, direction: 'asc' };
    }
    this.buscarPersonal(false);
  }

  cambiarPagina(page: number) {
    if (page < 0 || page > this.totalPages - 1) return;
    this.page = page;
    this.buscarPersonal(false);
  }

  cambiarTamanoPagina() {
    this.page = 0;
    this.buscarPersonal(false);
  }

  limpiar() {
    this.f_personal.reset({
      q: '',
      nombres: '',
      apellidos: '',
      identificacion: '',
      email: '',
      celular: '',
      cargo: '',
      departamento: '',
      direccion: '',
      estadoLaboral: '',
      tipoContrato: '',
      usuarioSistema: '',
      fechaIngresoDesde: '',
      fechaIngresoHasta: '',
      area: '',
      sucursal: '',
    });
    this.buscarPersonal();
  }

  onEditPersonal(personal: any) {
    sessionStorage.setItem('idpersonalToModi', personal.idpersonal.toString());
    this.router.navigate(['/modi-personal']);
  }

  onInfoPersonal(personal: any) {
    sessionStorage.setItem('idpersonalToInfo', personal.idpersonal.toString());
    this.router.navigate(['/info-personal']);
  }

  onDeletePersonal(personal: any) {
    if (!personal?.idpersonal) return;
    const nextState = !this.esActivo(personal);
    const label = nextState ? 'activar' : 'desactivar';
    const confirmDelete = window.confirm(
      `Desea ${label} a ${personal.apellidos || ''} ${personal.nombres || ''}?`
    );
    if (!confirmDelete) return;

    this.s_personal.toggleEstado(personal.idpersonal, nextState).subscribe({
      next: () => this.buscarPersonal(false),
      error: () => {
        this.s_personal.deletePersonal(personal.idpersonal).subscribe({
          next: () => this.buscarPersonal(false),
          error: (error: any) => {
            console.error('Error cambiando estado de personal:', error);
            alert('No se pudo cambiar el estado del empleado.');
          },
        });
      },
    });
  }

  accionRapida(personal: any, accion: string) {
    if (accion === 'Crear usuario') {
      this.s_personal.crearUsuarioSistema(personal.idpersonal).subscribe({
        next: () => alert('Solicitud de usuario enviada.'),
        error: () => alert('Endpoint de creacion de usuario pendiente en backend.'),
      });
      return;
    }

    if (accion === 'Resetear contraseña') {
      this.s_personal.resetearPassword(personal.idpersonal).subscribe({
        next: () => alert('Password reseteado correctamente.'),
        error: () => alert('Endpoint de reset pendiente en backend.'),
      });
      return;
    }

    this.onInfoPersonal(personal);
  }

  imprimirFicha(personal: any) {
    this.onInfoPersonal(personal);
    setTimeout(() => window.print(), 300);
  }

  exportarCsv() {
    const headers = [
      'Codigo',
      'Apellidos',
      'Nombres',
      'Identificacion',
      'Email',
      'Telefono',
      'Cargo',
      'Contrato',
      'Estado',
    ];
    const rows = this.personalFiltrado.map((p) => [
      p.codigo || '',
      p.apellidos || '',
      p.nombres || '',
      p.identificacion || '',
      p.email || '',
      p.celular || '',
      this.cargo(p),
      this.tipoContrato(p),
      this.estadoLaboral(p),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'personal_rrhh.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  get paginasVisibles(): number[] {
    const start = Math.max(0, this.page - 2);
    const end = Math.min(this.totalPages, start + 5);
    return Array.from({ length: end - start }, (_, index) => start + index);
  }

  nombreCompleto(personal: any): string {
    return `${personal?.apellidos || ''} ${personal?.nombres || ''}`.trim();
  }

  iniciales(personal: any): string {
    const nombres = `${personal?.nombres || ''} ${personal?.apellidos || ''}`
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    return nombres
      .slice(0, 2)
      .map((name) => name[0])
      .join('')
      .toUpperCase();
  }

  cargo(personal: any): string {
    return (
      personal?.cargoActual ||
      personal?.cargo ||
      personal?.idcargo_cargos?.descripcion ||
      'Sin cargo'
    );
  }

  tipoContrato(personal: any): string {
    return (
      personal?.tipoContrato ||
      personal?.idtpcontrato_tpcontratos?.descripcion ||
      'No definido'
    );
  }

  estadoLaboral(personal: any): string {
    if (personal?.estadoLaboral) return personal.estadoLaboral;
    if (personal?.estado === false) return 'Desvinculado';
    return 'Activo';
  }

  esActivo(personal: any): boolean {
    return this.estadoLaboral(personal).toLowerCase() !== 'desvinculado';
  }

  badgeEstado(personal: any): string {
    const estado = this.estadoLaboral(personal).toLowerCase();
    if (estado.includes('vacacion')) return 'badge-info';
    if (estado.includes('suspend')) return 'badge-warning';
    if (estado.includes('desvinc')) return 'badge-secondary';
    return 'badge-success';
  }

  sortIcon(field: string): string {
    if (this.sort.field !== field) return 'bi-arrow-down-up';
    return this.sort.direction === 'asc' ? 'bi-sort-up' : 'bi-sort-down';
  }

  trackByPersonal(index: number, personal: any) {
    return personal?.idpersonal || index;
  }

  private limpiarFiltros(values: any) {
    return Object.keys(values || {}).reduce((acc: any, key) => {
      const value = values[key];
      acc[key] = typeof value === 'string' ? value.trim() : value;
      return acc;
    }, {});
  }

  private coincideConFiltros(personal: any, filtros: any): boolean {
    const q = this.normalizar(filtros.q);
    const searchBlob = this.normalizar(
      [
        personal?.nombres,
        personal?.apellidos,
        personal?.identificacion,
        personal?.email,
        personal?.celular,
        personal?.direccion,
        this.cargo(personal),
        this.tipoContrato(personal),
        personal?.departamento,
        personal?.area,
        personal?.sucursal,
        personal?.usuarioSistema,
        this.estadoLaboral(personal),
      ].join(' ')
    );
    if (q && !searchBlob.includes(q)) return false;

    const fieldMap: any = {
      nombres: personal?.nombres,
      apellidos: personal?.apellidos,
      identificacion: personal?.identificacion,
      email: personal?.email,
      celular: personal?.celular,
      cargo: this.cargo(personal),
      departamento: personal?.departamento,
      direccion: personal?.direccion,
      estadoLaboral: this.estadoLaboral(personal),
      tipoContrato: this.tipoContrato(personal),
      usuarioSistema: personal?.usuarioSistema,
      area: personal?.area,
      sucursal: personal?.sucursal,
    };

    return Object.keys(fieldMap).every((key) => {
      const filtro = this.normalizar(filtros[key]);
      if (!filtro) return true;
      return this.normalizar(fieldMap[key]).includes(filtro);
    });
  }

  private comparar(a: any, b: any): number {
    const av = this.valorOrden(a, this.sort.field);
    const bv = this.valorOrden(b, this.sort.field);
    const result = av.localeCompare(bv, 'es', { numeric: true });
    return this.sort.direction === 'asc' ? result : -result;
  }

  private valorOrden(personal: any, field: string): string {
    const values: any = {
      apellidos: personal?.apellidos,
      nombres: personal?.nombres,
      identificacion: personal?.identificacion,
      email: personal?.email,
      cargo: this.cargo(personal),
      tipoContrato: this.tipoContrato(personal),
      estadoLaboral: this.estadoLaboral(personal),
      fecinicio: personal?.fecinicio,
    };
    return String(values[field] ?? '').toLowerCase();
  }

  private normalizar(value: any): string {
    return String(value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}
