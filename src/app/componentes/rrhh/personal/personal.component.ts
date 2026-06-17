import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ColoresService } from 'src/app/compartida/colores.service';
import { CargosService } from 'src/app/servicios/rrhh/cargos.service';
import { PersonalService } from 'src/app/servicios/rrhh/personal.service';
import { TpcontratosService } from 'src/app/servicios/rrhh/tpcontratos.service';

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
  _cargos: any[] = [];
  _tpcontratos: any[] = [];
  cargando = false;
  errorListado = '';
  filtrosAvanzados = false;
  cargoMap = new Map<number, string>();
  contratoMap = new Map<number, string>();

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
  tiposBusqueda = [
    { value: 'general', label: 'Búsqueda general' },
    { value: 'cargo', label: 'Cargo / puesto' },
    { value: 'contrato', label: 'Tipo de contrato' },
    { value: 'estado', label: 'Estado laboral' },
  ];
  camposBusquedaDisponibles = [
    { key: 'nombres', label: 'Nombres' },
    { key: 'apellidos', label: 'Apellidos' },
    { key: 'identificacion', label: 'Identificación' },
    { key: 'email', label: 'Correo' },
    { key: 'celular', label: 'Celular' },
    { key: 'cargo', label: 'Cargo' },
    { key: 'tipoContrato', label: 'Contrato' },
    { key: 'direccion', label: 'Dirección' },
  ];
  camposBusquedaSeleccionados: string[] = ['nombres', 'apellidos', 'identificacion', 'cargo'];
  estadosLaborales = ['Activo', 'Vacaciones', 'Suspendido', 'Encargado', 'Comision', 'Desvinculado'];

  constructor(
    private s_personal: PersonalService,
    private coloresService: ColoresService,
    private fb: FormBuilder,
    private router: Router,
    private cargosService: CargosService,
    private tpcontratosService: TpcontratosService
  ) {}

  ngOnInit(): void {
    this.f_personal = this.fb.group({
      tipoBusqueda: ['general'],
      q: [''],
      cargo: [''],
      tipoContrato: [''],
      estadoLaboral: [''],
    });

    sessionStorage.setItem('ventana', '/personal');
    const coloresJSON = sessionStorage.getItem('/personal');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();
    this.configurarReaccionesFormulario();
    void this.cargarCatalogosYPersonal();
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

  private async cargarCatalogosYPersonal(): Promise<void> {
    this.cargando = true;
    this.errorListado = '';
    try {
      const [cargos, contratos, personal] = await Promise.all([
        firstValueFrom(this.cargosService.getAllCargos()),
        firstValueFrom(this.tpcontratosService.getAllTpcontratos()),
        firstValueFrom(this.s_personal.getAllPersonal()),
      ]);
      this._cargos = Array.isArray(cargos) ? cargos : [];
      this._tpcontratos = Array.isArray(contratos) ? contratos : [];
      this.cargoMap = new Map(
        this._cargos.map((item: any) => [Number(item?.idcargo), String(item?.descripcion || '')])
      );
      this.contratoMap = new Map(
        this._tpcontratos.map((item: any) => [Number(item?.idtpcontratos), String(item?.descripcion || '')])
      );
      this.hidratarListado(personal);
    } catch (error: any) {
      console.error(error);
      this.errorListado = 'No se pudo cargar el listado de personal.';
      this._personal = [];
      this.personalFiltrado = [];
      this.personalPagina = [];
    } finally {
      this.cargando = false;
    }
  }

  hidratarListado(datos: any) {
    const pageContent = Array.isArray(datos?.content) ? datos.content : null;
    const rows = (pageContent || (Array.isArray(datos) ? datos : [])).map((item: any) =>
      this.normalizarPersonal(item)
    );

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
    this.aplicarFiltrosLocales();
  }

  cambiarPagina(page: number) {
    if (page < 0 || page > this.totalPages - 1) return;
    this.page = page;
    this.aplicarFiltrosLocales();
  }

  cambiarTamanoPagina() {
    this.page = 0;
    this.aplicarFiltrosLocales();
  }

  limpiar() {
    this.f_personal.reset({
      tipoBusqueda: 'general',
      q: '',
      cargo: '',
      tipoContrato: '',
      estadoLaboral: '',
    });
    this.camposBusquedaSeleccionados = ['nombres', 'apellidos', 'identificacion', 'cargo'];
    this.aplicarFiltrosLocales();
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

  buscarPersonal(resetPage = true) {
    if (resetPage) this.page = 0;
    this.aplicarFiltrosLocales();
  }

  get paginasVisibles(): number[] {
    const start = Math.max(0, this.page - 2);
    const end = Math.min(this.totalPages, start + 5);
    return Array.from({ length: end - start }, (_, index) => start + index);
  }

  get totalActivos(): number {
    return this.personalFiltrado.filter((item) => this.esActivo(item)).length;
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
      this.cargoMap.get(this.obtenerIdRelacionado(personal?.idcargo_cargos, 'idcargo')) ||
      'Sin cargo'
    );
  }

  tipoContrato(personal: any): string {
    return (
      personal?.tipoContrato ||
      personal?.idtpcontrato_tpcontratos?.descripcion ||
      this.contratoMap.get(
        this.obtenerIdRelacionado(personal?.idtpcontrato_tpcontratos, 'idtpcontratos')
      ) ||
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
    const tipoBusqueda = filtros.tipoBusqueda || 'general';
    const fieldMap: any = {
      nombres: personal?.nombres,
      apellidos: personal?.apellidos,
      identificacion: personal?.identificacion,
      email: personal?.email,
      celular: personal?.celular,
      cargo: this.cargo(personal),
      direccion: personal?.direccion,
      tipoContrato: this.tipoContrato(personal),
      estadoLaboral: this.estadoLaboral(personal),
    };

    if (tipoBusqueda === 'cargo') {
      const cargoFiltro = this.normalizar(filtros.cargo);
      return !cargoFiltro || this.normalizar(this.cargo(personal)).includes(cargoFiltro);
    }

    if (tipoBusqueda === 'contrato') {
      const contratoFiltro = this.normalizar(filtros.tipoContrato);
      return !contratoFiltro || this.normalizar(this.tipoContrato(personal)).includes(contratoFiltro);
    }

    if (tipoBusqueda === 'estado') {
      const estadoFiltro = this.normalizar(filtros.estadoLaboral);
      return !estadoFiltro || this.normalizar(this.estadoLaboral(personal)).includes(estadoFiltro);
    }

    if (!q) {
      return true;
    }

    const campos = this.camposBusquedaSeleccionados.length
      ? this.camposBusquedaSeleccionados
      : ['nombres', 'apellidos', 'identificacion', 'cargo'];

    return campos.some((key) => this.normalizar(fieldMap[key]).includes(q));
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

  toggleCampoBusqueda(key: string): void {
    if (this.camposBusquedaSeleccionados.includes(key)) {
      if (this.camposBusquedaSeleccionados.length === 1) {
        return;
      }
      this.camposBusquedaSeleccionados = this.camposBusquedaSeleccionados.filter((item) => item !== key);
    } else {
      this.camposBusquedaSeleccionados = [...this.camposBusquedaSeleccionados, key];
    }
    this.aplicarFiltrosLocales();
  }

  campoBusquedaActivo(key: string): boolean {
    return this.camposBusquedaSeleccionados.includes(key);
  }

  get usaBusquedaGeneral(): boolean {
    return this.f_personal?.get('tipoBusqueda')?.value === 'general';
  }

  get usaBusquedaCargo(): boolean {
    return this.f_personal?.get('tipoBusqueda')?.value === 'cargo';
  }

  get usaBusquedaContrato(): boolean {
    return this.f_personal?.get('tipoBusqueda')?.value === 'contrato';
  }

  get usaBusquedaEstado(): boolean {
    return this.f_personal?.get('tipoBusqueda')?.value === 'estado';
  }

  private configurarReaccionesFormulario(): void {
    this.f_personal.valueChanges.subscribe(() => {
      this.page = 0;
      this.aplicarFiltrosLocales();
    });
  }

  private normalizarPersonal(personal: any): any {
    return {
      ...personal,
      cargoActual:
        personal?.cargoActual ||
        personal?.cargo ||
        personal?.idcargo_cargos?.descripcion ||
        this.cargoMap.get(this.obtenerIdRelacionado(personal?.idcargo_cargos, 'idcargo')) ||
        '',
      tipoContrato:
        personal?.tipoContrato ||
        personal?.idtpcontrato_tpcontratos?.descripcion ||
        this.contratoMap.get(
          this.obtenerIdRelacionado(personal?.idtpcontrato_tpcontratos, 'idtpcontratos')
        ) ||
        '',
    };
  }

  private obtenerIdRelacionado(value: any, idField: string): number {
    if (value == null) {
      return 0;
    }
    if (typeof value === 'object') {
      const id = Number(value?.[idField] ?? value?.id ?? 0);
      return Number.isFinite(id) ? id : 0;
    }
    const id = Number(value);
    return Number.isFinite(id) ? id : 0;
  }
}
