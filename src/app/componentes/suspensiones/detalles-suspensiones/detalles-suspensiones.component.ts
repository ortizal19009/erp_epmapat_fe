import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { AboxsuspensionService } from 'src/app/servicios/aboxsuspension.service';
import { SuspensionesService } from 'src/app/servicios/suspensiones.service';

@Component({
  selector: 'app-detalles-suspensiones',
  templateUrl: './detalles-suspensiones.component.html',
  styleUrls: ['./detalles-suspensiones.component.css', '../../../compartida/gestion-cuentas.css']
})
export class DetallesSuspensionesComponent implements OnInit, OnDestroy {
  filterTerm = '';
  filtroEstado = 'todos';
  detalleSuspension: any = null;
  cuentas: any[] = [];
  seleccionadas = new Set<number>();
  cargando = false;
  procesando = false;
  error = '';
  ultimoRetiro: any = null;
  private consulta?: Subscription;
  private actualizacion?: Subscription;

  constructor(
    private aboxsuspService: AboxsuspensionService,
    private router: Router,
    private aboService: AbonadosService,
    private authService: AutorizaService,
    private suspensionesService: SuspensionesService
  ) {}

  ngOnInit() { this.listarAboxSusp(); }
  ngOnDestroy() { this.consulta?.unsubscribe(); this.actualizacion?.unsubscribe(); }

  get esHabilitacion(): boolean {
    return this.detalleSuspension ? Number(this.detalleSuspension.tipo) === 1
      : sessionStorage.getItem('retornoSuspensionesInfo') === 'habilitaciones';
  }
  get titulo(): string { return this.esHabilitacion ? 'Detalle de habilitaci\u00f3n' : 'Detalle de suspensi\u00f3n'; }
  get totalCuentas(): number { return this.cuentas.length; }
  get cuentasSuspension(): any[] { return this.cuentas.filter(i => Number(i.idabonado_abonados?.estado) === 2); }
  get cuentasRetiro(): any[] { return this.cuentas.filter(i => Number(i.idabonado_abonados?.estado) === 3); }
  get cuentasActivas(): any[] { return this.cuentas.filter(i => Number(i.idabonado_abonados?.estado) === 1); }
  get cuentasFiltradas(): any[] {
    return this.cuentas.filter(i => this.filtroEstado === 'todos' || String(i.idabonado_abonados?.estado) === this.filtroEstado);
  }

  listarAboxSusp() {
    const id = Number(sessionStorage.getItem('idsuspensionToInfo'));
    if (!Number.isFinite(id) || id <= 0) { this.error = 'Seleccione un registro desde el listado.'; return; }
    this.consulta?.unsubscribe();
    this.cargando = true;
    this.error = '';
    this.seleccionadas.clear();
    this.consulta = forkJoin({
      registro: this.suspensionesService.getById(id),
      cuentas: this.aboxsuspService.getByIdsuspension(id)
    }).subscribe({
      next: ({ registro, cuentas }) => {
        this.detalleSuspension = registro;
        const unicas = new Map<number, any>();
        (cuentas || []).forEach(item => {
          const cuenta = Number(item.idabonado_abonados?.idabonado);
          if (cuenta > 0) unicas.set(cuenta, item);
        });
        this.cuentas = [...unicas.values()];
        this.cargando = false;
      },
      error: () => { this.cargando = false; this.error = 'No se pudo cargar la informacion del registro. Intente nuevamente.'; }
    });
  }

  regresar() {
    const origen = sessionStorage.getItem('retornoSuspensionesInfo');
    const destino = this.detalleSuspension ? (this.esHabilitacion ? 'habilitaciones' : 'suspensiones')
      : origen === 'habilitaciones' ? 'habilitaciones' : 'suspensiones';
    this.router.navigate([destino]);
  }

  abrirCuenta(cuenta: number) {
    sessionStorage.setItem('idabonadoToFactura', String(cuenta));
    this.router.navigate(['detalles-abonado']);
  }

  seleccionar(cuenta: number, checked: boolean) {
    if (checked) this.seleccionadas.add(cuenta);
    else this.seleccionadas.delete(cuenta);
  }

  retirarMedidor() {
    if (this.procesando || this.esHabilitacion) return;
    const cuentas = this.cuentasSuspension.filter(i => this.seleccionadas.has(i.idabonado_abonados.idabonado));
    if (!cuentas.length) return;
    this.procesando = true;
    this.error = '';
    this.actualizacion = this.suspensionesService.retirarMedidores(
      this.detalleSuspension.idsuspension, cuentas.map(i => i.idabonado_abonados.idabonado),
      Number(this.authService.idusuario)
    ).subscribe({
      next: registro => { this.ultimoRetiro = registro; this.procesando = false; this.listarAboxSusp(); },
      error: respuesta => {
        this.procesando = false;
        this.error = respuesta.error?.message || 'No se pudo registrar el retiro. Recargue el detalle e intente nuevamente.';
      }
    });
  }

  getEstadoLabel(estado: number): string {
    return ({ 0: 'Inactivo', 1: 'Activo', 2: 'Suspendido', 3: 'Suspendido y retirado' } as any)[Number(estado)] || 'Sin definir';
  }
}
