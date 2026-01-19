import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Component, OnInit } from '@angular/core';
import { PageResponse } from 'src/app/interfaces/page-response';
import { Abonados } from 'src/app/modelos/abonados';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { UsuarioService } from 'src/app/servicios/administracion/usuario.service';
import { EmisionService } from 'src/app/servicios/emision.service';
import { RecargosxcuentaService } from 'src/app/servicios/recargosxcuenta.service';
import { RutasService } from 'src/app/servicios/rutas.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-recargosxcuenta',
  templateUrl: './recargosxcuenta.component.html',
  styleUrls: ['./recargosxcuenta.component.css'],
})
export class RecargosxcuentaComponent implements OnInit {
  titulo = 'Recargos por cuenta';

  // data
  _recargosxcuenta: any[] = [];
  _abonados: any[] = [];
  _rutas: any[] = [];

  // filtros UI
  filterTerm = '';

  filtroRuta: string | null = null;
  filtroRutaDescripcion: string = '';
  filtroRutaId: number | null = null;

  filtroResponsable: string | null = null;
  filtroCedula: string | null = null;
  filtroCuenta: number | null = null;

  activeFiltro: 'cuenta' | 'ruta' | 'responsable' | 'cedula' | null = null;

  // ✅ fecha (input date necesita string YYYY-MM-DD)
  fechaNotificaStr: string = '';

  // paginación
  page = 0;
  size = 20;
  totalElements = 0;
  totalPages = 0;

  // emisiones
  _emisiones: any[] = [];
  emisionSelected: any;
  lastEmision: any;

  //recargos
  _recargosList: any[] = [];

  // usuarios
  _usuarios: any[] = [];
  usuarioNombre: string = ''; // lo que se ve en el datalist
  usuarioId: number | null = null; // lo que se envía en usuresp

  validando = false;
  guardando = false;
  erroresValidacion: Array<{
    idabonado: number;
    tipo: number;
    motivo: string;
    detalle?: string;
  }> = [];

  /**
   * ✅ Store global para mantener selección entre páginas
   * key = idabonado
   */
  selectedStore = new Map<
    number,
    { selected: boolean; swNotificacion: boolean; swInspeccion: boolean }
  >();

  // ✅ lista para modal “ver seleccionados”
  selectedList: Array<{
    idabonado: number;
    swNotificacion: boolean;
    swInspeccion: boolean;
  }> = [];

  constructor(
    private abonadosService: AbonadosService,
    private emisionService: EmisionService,
    private recargosxcuentaService: RecargosxcuentaService,
    private rutasService: RutasService,
    private usuarioService: UsuarioService,
    private authService: AutorizaService,
  ) {}

  ngOnInit(): void {
    // ✅ fecha por defecto = hoy
    this.fechaNotificaStr = this.toYMD(new Date());

    this.cargarAbonados();
    this.cargarRutas();
    this.cargarEmisiones();
    this.cargarUsuario();
  }

  /**
   * ✅ Cuenta seleccionados de TODAS las páginas
   */
  get selectedCount(): number {
    let count = 0;
    for (const v of this.selectedStore.values()) {
      if (v.selected) count++;
    }
    return count;
  }
  cagarRecargosxemision(idemision: number) {
    this.recargosxcuentaService
      .getRecargosxcuentaByEmision(idemision)
      .subscribe({
        next: (datos: any) => {
          console.log(datos);
          this._recargosxcuenta = datos;
        },
        error: (e: any) => console.error(e.error),
      });
  }

  cargarAbonados(): void {
    this.abonadosService
      .getAbonadosPage(this.page, this.size, 'idabonado,desc', {
        idruta: this.filtroRutaId,
        responsable: this.filtroResponsable,
        cedula: this.filtroCedula,
        cuenta: this.filtroCuenta,
      })
      .subscribe({
        next: (res: PageResponse<Abonados>) => {
          this._abonados = (res.content || []).map((x: any) => {
            const saved = this.selectedStore.get(x.idabonado);
            return {
              ...x,
              selected: saved?.selected ?? false,
              swNotificacion: saved?.swNotificacion ?? false,
              swInspeccion: saved?.swInspeccion ?? false,

              // ✅ flags de bloqueo UI
              bloqNotif: false,
              bloqInsp: false,
              motivoNotif: '',
              motivoInsp: '',
            };
          });

          this.totalElements = res.totalElements;
          this.totalPages = res.totalPages;
          this.page = res.number;
          this.size = res.size;

          // ✅ validar lo que se ve en esta página del modal
          this.validarAbonadosEnPagina();
        },
        error: (err: any) => console.error(err?.error ?? err),
      });
  }
  private validarAbonadosEnPagina(): void {
    if (!this.lastEmision?.idemision) return;

    // fecha escogida en modal
    const fecha = this.fechaNotificaStr
      ? new Date(this.fechaNotificaStr + 'T00:00:00')
      : new Date();

    // items: por cada abonado visible, consulto tipo 1 y tipo 2
    const items: Array<{ idabonado: number; tipo: 1 | 2 }> = [];
    for (const a of this._abonados) {
      items.push({ idabonado: Number(a.idabonado), tipo: 1 });
      items.push({ idabonado: Number(a.idabonado), tipo: 2 });
    }

    const reqValidacion = {
      idemision: Number(this.lastEmision.idemision),
      fecha: fecha.toISOString(),
      items,
    };

    this.recargosxcuentaService.validarBatch(reqValidacion).subscribe({
      next: (resp: any) => {
        // Soporta 2 formas comunes de respuesta
        const bloqueos: Array<{
          idabonado: number;
          tipo: number;
          motivo: string;
        }> = resp?.bloqueados ?? resp?.errores ?? [];

        const mapBloq = new Map<string, string>(); // key: `${id}-${tipo}` => motivo
        for (const b of bloqueos) {
          mapBloq.set(
            `${Number(b.idabonado)}-${Number(b.tipo)}`,
            b.motivo || 'Bloqueado',
          );
        }

        // setear flags en cada fila
        for (const a of this._abonados) {
          const id = Number(a.idabonado);

          const m1 = mapBloq.get(`${id}-1`);
          const m2 = mapBloq.get(`${id}-2`);

          a.bloqNotif = !!m1;
          a.bloqInsp = !!m2;

          a.motivoNotif = m1 || '';
          a.motivoInsp = m2 || '';

          // ✅ si está bloqueado, NO permito marcar ese tipo
          if (a.bloqNotif) a.swNotificacion = false;
          if (a.bloqInsp) a.swInspeccion = false;

          // ✅ si ambos están bloqueados, no tiene sentido seleccionar la fila
          if (a.bloqNotif && a.bloqInsp) {
            a.selected = false;
            this.selectedStore.set(id, {
              selected: false,
              swNotificacion: false,
              swInspeccion: false,
            });
          }
        }
      },
      error: (e: any) => console.error(e),
    });
  }

  cargarRutas(): void {
    this.rutasService.getListaRutas().subscribe({
      next: (data: any) => (this._rutas = data ?? []),
      error: (e: any) => console.error(e?.error ?? e),
    });
  }

  cargarEmisiones(): void {
    this.emisionService.findAllEmisiones().subscribe({
      next: (datos: any) => {
        this._emisiones = datos ?? [];
        this.emisionSelected = this._emisiones?.[0];
        this.lastEmision = datos[0];
        this.cagarRecargosxemision(datos[0].idemision);
      },
      error: (e: any) => console.error(e?.error ?? e),
    });
  }

  cargarUsuario(): void {
    this.usuarioService.getByCargos(46).subscribe({
      next: (datos: any) => (this._usuarios = datos ?? []),
      error: (e: any) => console.error(e?.error ?? e),
    });
  }

  /**
   * ✅ usuario: del nombre -> idusuario
   */
  onUsuarioChange(valor: string): void {
    this.usuarioNombre = valor;

    const usuario = this._usuarios.find((u: any) => u.nomusu === valor);
    this.usuarioId = usuario ? Number(usuario.idusuario) : null;
  }

  changeEmision(emision: any): void {
    if (!emision?.idemision) return;

    // mantener consistencia en el componente
    this.lastEmision = emision;

    // cargar recargos de esa emisión
    this.cagarRecargosxemision(Number(emision.idemision));
  }

  /**
   * ✅ Guardar estado UI por fila
   */
  persistRowState(cuenta: any): void {
    const id = Number(cuenta.idabonado);

    // si ambos están bloqueados => no se puede seleccionar
    if (cuenta.bloqNotif && cuenta.bloqInsp) {
      cuenta.selected = false;
    }

    if (!cuenta.selected) {
      cuenta.swNotificacion = false;
      cuenta.swInspeccion = false;
    }

    // si está bloqueado un tipo, apaga ese check
    if (cuenta.bloqNotif) cuenta.swNotificacion = false;
    if (cuenta.bloqInsp) cuenta.swInspeccion = false;

    this.selectedStore.set(id, {
      selected: !!cuenta.selected,
      swNotificacion: !!cuenta.swNotificacion,
      swInspeccion: !!cuenta.swInspeccion,
    });
  }

  aplicarFiltrosServidor(): void {
    this.page = 0;
    this.cargarAbonados();
  }

  limpiarFiltrosServidor(): void {
    this.filtroRuta = null;
    this.filtroRutaDescripcion = '';
    this.filtroRutaId = null;

    this.filtroResponsable = null;
    this.filtroCedula = null;
    this.filtroCuenta = null;

    this.page = 0;
    this.cargarAbonados();
  }

  onRutaChange(valor: string): void {
    const ruta = this._rutas.find((r: any) => r.descripcion === valor);
    this.filtroRutaId = ruta ? Number(ruta.idruta) : null;
    if (!ruta) this.filtroRutaId = null;
  }

  prevPage(): void {
    if (this.page > 0) {
      this.page--;
      this.cargarAbonados();
    }
  }

  nextPage(): void {
    if (this.page + 1 < this.totalPages) {
      this.page++;
      this.cargarAbonados();
    }
  }

  /**
   * ✅ Seleccionar todo SOLO la página actual
   */
  toggleSelectAll(ev: any): void {
    const checked = !!ev?.target?.checked;

    this._abonados.forEach((a: any) => {
      // si ambos bloqueados, no tocar
      if (a.bloqNotif && a.bloqInsp) {
        a.selected = false;
        a.swNotificacion = false;
        a.swInspeccion = false;
        this.persistRowState(a);
        return;
      }

      a.selected = checked;

      if (!checked) {
        a.swNotificacion = false;
        a.swInspeccion = false;
      }

      // si checked pero un tipo está bloqueado, se mantiene apagado
      if (a.bloqNotif) a.swNotificacion = false;
      if (a.bloqInsp) a.swInspeccion = false;

      this.persistRowState(a);
    });
  }

  /**
   * ✅ modal: refrescar lista de seleccionados
   */
  refreshSelectedList(): void {
    this.selectedList = [...this.selectedStore.entries()]
      .filter(([_, v]) => v.selected)
      .map(([id, v]) => ({
        idabonado: id,
        swNotificacion: v.swNotificacion,
        swInspeccion: v.swInspeccion,
      }))
      .sort((a, b) => a.idabonado - b.idabonado);
  }

  /**
   * ✅ quitar uno desde modal
   */
  unselectFromList(idabonado: number): void {
    this.selectedStore.set(idabonado, {
      selected: false,
      swNotificacion: false,
      swInspeccion: false,
    });

    // si el abonado está visible en la página, también lo actualizamos
    const row = this._abonados.find(
      (x: any) => Number(x.idabonado) === Number(idabonado),
    );
    if (row) {
      row.selected = false;
      row.swNotificacion = false;
      row.swInspeccion = false;
    }

    this.refreshSelectedList();
  }

  clearAllSelected(): void {
    // marcar todo como no seleccionado
    for (const [id] of this.selectedStore.entries()) {
      this.selectedStore.set(id, {
        selected: false,
        swNotificacion: false,
        swInspeccion: false,
      });
    }

    // limpiar pantalla actual
    this._abonados.forEach((row: any) => {
      row.selected = false;
      row.swNotificacion = false;
      row.swInspeccion = false;
    });

    this.refreshSelectedList();
  }

  /**
   * ✅ payload desde store (todas páginas)
   * ✅ valida usuarioId requerido
   * ✅ usuresp = usuarioId seleccionado
   * ✅ fecha = fechaNotificaStr
   */
  procesarSeleccionados(): void {
    if (!this.lastEmision) {
      this.swal('warning', 'Debe seleccionar una emisión.');
      return;
    }

    // ✅ Regla #1 (front): emisión abierta (estado = 0)
    if (this.lastEmision?.estado !== 0) {
      this.swal(
        'error',
        'La emisión está CERRADA. No se puede cargar valores.',
      );
      return;
    }

    if (!this.usuarioId) {
      this.swal('warning', 'Debe seleccionar un usuario notificador.');
      return;
    }

    const seleccionados = [...this.selectedStore.entries()]
      .filter(([_, v]) => v.selected)
      .map(([id, v]) => ({ idabonado: id, ...v }));

    if (seleccionados.length === 0) {
      this.swal('info', 'No hay abonados seleccionados.');
      return;
    }

    const sinTipo = seleccionados.filter(
      (a) => !a.swNotificacion && !a.swInspeccion,
    );
    if (sinTipo.length > 0) {
      this.swal(
        'warning',
        'Hay cuentas seleccionadas sin Notificación ni Inspección marcadas.',
      );
      return;
    }

    // ✅ fechas
    const usuarioCrea = this.authService.idusuario || 0;
    const ahora = new Date();
    const fecha = this.fechaNotificaStr
      ? new Date(this.fechaNotificaStr + 'T00:00:00')
      : ahora;

    // ==========================
    // 1) ARMAR ITEMS PARA VALIDAR (batch)
    // ==========================
    const items: Array<{ idabonado: number; tipo: 1 | 2 }> = [];
    for (const s of seleccionados) {
      if (s.swNotificacion) items.push({ idabonado: s.idabonado, tipo: 1 });
      if (s.swInspeccion) items.push({ idabonado: s.idabonado, tipo: 2 });
    }

    const reqValidacion = {
      idemision: Number(this.lastEmision.idemision),
      fecha: fecha.toISOString(),
      items,
    };

    // ==========================
    // 2) ARMAR PAYLOAD PARA GUARDAR
    // ==========================
    const payload: any[] = [];

    for (const s of seleccionados) {
      if (s.swNotificacion) {
        payload.push({
          idabonado: s.idabonado,
          tipo: 1,
          idemision: this.lastEmision.idemision,
          idrubro: 2154,
          observacion: 'NOTIFICACIÓN GENERADA DESDE SISTEMA',
          usucrea: usuarioCrea,
          feccrea: ahora.toISOString(),
          usumodi: null,
          fecmodi: null,
          usuresp: this.usuarioId, // ✅ usuario seleccionado
          fecha: fecha.toISOString(),
        });
      }

      if (s.swInspeccion) {
        payload.push({
          idabonado: s.idabonado,
          tipo: 2,
          idemision: this.lastEmision.idemision,
          idrubro: 2155,
          observacion: 'INSPECCIÓN GENERADA DESDE SISTEMA',
          usucrea: usuarioCrea,
          feccrea: ahora.toISOString(),
          usumodi: null,
          fecmodi: null,
          usuresp: this.usuarioId,
          fecha: fecha.toISOString(),
        });
      }
    }

    // ==========================
    // 3) CONSUMIR SERVICE: validar -> guardar
    // ==========================
    this.validando = true;
    this.erroresValidacion = [];

    this.recargosxcuentaService.validarBatch(reqValidacion).subscribe({
      next: (resp: any) => {
        this.validando = false;

        if (!resp?.ok) {
          this.erroresValidacion = resp?.errores ?? [];
          console.log('Errores de validación:', this.erroresValidacion);

          this.swal(
            'error',
            `No se puede guardar. Errores: ${this.erroresValidacion.length}`,
          );
          // ✅ opcional: abrir modal de errores
          // ($('#modalErrores') as any).modal('show');
          return;
        }

        // ✅ pasa validación -> guardar
        this.guardando = true;
        this.recargosxcuentaService.guardarBatch(payload).subscribe({
          next: () => {
            this.guardando = false;
            this.swal('success', 'Guardado OK');

            // 1) limpiar selección (store + pantalla)
            this.clearAllSelected();

            // 2) cerrar modal
            ($('#addRecargo') as any).modal('hide');

            // 3) opcional: recargar listas para ver cambios
            this.cargarAbonados(); // refresca modal (por si lo vuelven a abrir)
            this.cagarRecargosxemision(Number(this.lastEmision.idemision)); // refresca tabla principal
            this.filterTerm = '';
            this.filtroCuenta = null;
            this.filtroRutaDescripcion = '';
            this.filtroRutaId = null;
            this.filtroResponsable = null;
            this.filtroCedula = null;
          },

          error: (e: any) => {
            this.guardando = false;
            console.error(e);
            this.swal('error', 'Error al guardar batch');
          },
        });
      },
      error: (e: any) => {
        this.validando = false;
        console.error(e);
        this.swal('error', 'Error al validar batch');
      },
    });
  }

  onFocusFiltro(campo: 'cuenta' | 'ruta' | 'responsable' | 'cedula'): void {
    if (this.activeFiltro === campo) return;
    this.activeFiltro = campo;

    if (campo !== 'cuenta') this.filtroCuenta = null;

    if (campo !== 'ruta') {
      this.filtroRuta = null;
      this.filtroRutaDescripcion = '';
      this.filtroRutaId = null;
    }

    if (campo !== 'responsable') this.filtroResponsable = null;
    if (campo !== 'cedula') this.filtroCedula = null;

    // filterTerm NO lo limpio porque ahora está en el header y es “local”
  }

  // util: YYYY-MM-DD para input date
  private toYMD(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private swal(
    icon: 'success' | 'error' | 'info' | 'warning',
    mensaje: string,
  ) {
    Swal.fire({
      toast: true,
      icon,
      title: mensaje,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
    });
  }
}
