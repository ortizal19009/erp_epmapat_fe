import { Component, OnInit } from '@angular/core';
import { ColoresService } from 'src/app/compartida/colores.service';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { PersonalService } from 'src/app/servicios/rrhh/personal.service';
import { ThActionsService } from 'src/app/servicios/rrhh/th-actions.service';

@Component({
  selector: 'app-th-actions',
  templateUrl: './th-actions.component.html',
  styleUrls: ['./th-actions.component.css']
})
export class ThActionsComponent implements OnInit {
  idpersonal: number = 0;
  personalList: any[] = [];
  acciones: any[] = [];
  loading = false;
  msg = '';
  error = '';
  ventana = 'th-actions';

  tipoFiltro: string = 'TODOS';
  estadoFiltro: string = 'TODOS';
  page = 1;
  pageSize = 8;

  model: any = {
    idpersonal_personal: { idpersonal: 0 },
    tipoaccion: 'INGRESO',
    motivo: '',
    observacion: '',
    fecvigencia: '',
    usucrea: 1,
  };

  constructor(
    private service: ThActionsService,
    private personalService: PersonalService,
    private coloresService: ColoresService,
    public authService: AutorizaService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', `/${this.ventana}`);
    const coloresJSON = sessionStorage.getItem(`/${this.ventana}`);
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    this.cargarPersonal();
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
    document.querySelectorAll('.cabecera').forEach((el) => el.classList.add('nuevoBG1'));
    document.querySelectorAll('.detalle').forEach((el) => el.classList.add('nuevoBG2'));
  }

  get accionesFiltradas(): any[] {
    let base = [...this.acciones];
    if (this.tipoFiltro !== 'TODOS') base = base.filter(a => a.tipoaccion === this.tipoFiltro);
    if (this.estadoFiltro !== 'TODOS') {
      const est = this.estadoFiltro === 'ACTIVO';
      base = base.filter(a => !!a.estado === est);
    }
    const start = (this.page - 1) * this.pageSize;
    return base.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    let total = this.acciones.length;
    if (this.tipoFiltro !== 'TODOS') total = this.acciones.filter(a => a.tipoaccion === this.tipoFiltro).length;
    if (this.estadoFiltro !== 'TODOS') {
      const est = this.estadoFiltro === 'ACTIVO';
      total = this.acciones.filter(a => (this.tipoFiltro === 'TODOS' || a.tipoaccion === this.tipoFiltro) && (!!a.estado === est)).length;
    }
    return Math.max(1, Math.ceil(total / this.pageSize));
  }

  estadoClass(estado: boolean): string { return estado ? 'badge badge-success' : 'badge badge-secondary'; }
  formatFecha(fecha: string): string { if (!fecha) return ''; const d = new Date(fecha); return isNaN(d.getTime()) ? fecha : d.toLocaleDateString('es-EC'); }
  cambiarFiltros() { this.page = 1; }
  prevPage() { if (this.page > 1) this.page--; }
  nextPage() { if (this.page < this.totalPages) this.page++; }

  refreshAll() { this.msg = ''; this.error = ''; this.buscar(); }

  cargarPersonal() {
    this.personalService.getAllPersonal().subscribe({
      next: (data: any) => {
        this.personalList = data || [];
        if (this.personalList.length > 0 && !this.idpersonal) {
          this.idpersonal = this.personalList[0].idpersonal;
          this.buscar();
        }
      },
      error: (e) => { this.error = 'No se pudo cargar personal'; console.error(e); },
    });
  }

  buscar() {
    if (!this.idpersonal) return;
    this.loading = true; this.error = '';
    this.service.getByPersonal(this.idpersonal).subscribe({
      next: (data: any) => { this.acciones = data || []; this.loading = false; },
      error: (e) => { this.error = 'No se pudo consultar acciones'; this.loading = false; console.error(e); },
    });
  }

  guardar(): void {
    this.msg = ''; this.error = '';
    if (!this.idpersonal) { this.error = 'Seleccione un personal'; return; }
    if (!this.model.fecvigencia) { this.error = 'La fecha de vigencia es obligatoria'; return; }

    this.model.idpersonal_personal = { idpersonal: this.idpersonal };
    this.model.usucrea = Number(this.authService?.idusuario || 1);
    this.service.save(this.model).subscribe({
      next: () => {
        this.msg = 'Acción guardada correctamente';
        this.model.motivo = ''; this.model.observacion = ''; this.model.fecvigencia = '';
        this.buscar();
      },
      error: (e) => { this.error = e?.error?.message || 'No se pudo guardar la acción'; console.error(e); },
    });
  }
}

