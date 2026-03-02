import { Component, OnInit } from '@angular/core';
import { PersonalService } from 'src/app/servicios/rrhh/personal.service';
import { ThLeaveService } from 'src/app/servicios/rrhh/th-leave.service';

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
  estadoFiltro: string = 'TODAS';
  selectedRequest: any = null;

  msg = '';
  error = '';

  aprobadorId: number = 1;

  balanceModel: any = { idpersonal_personal: { idpersonal: 0 }, anio: new Date().getFullYear(), dias_asignados: 15, dias_usados: 0, dias_disponibles: 15, usucrea: 1 };
  requestModel: any = { idpersonal_personal: { idpersonal: 0 }, tipolicencia: 'VACACION', fechainicio: '', fechafin: '', motivo: '', usucrea: 1 };

  page = 1;
  pageSize = 8;

  constructor(private service: ThLeaveService, private personalService: PersonalService) {}

  ngOnInit(): void {
    const uid = Number(sessionStorage.getItem('idusuario') || sessionStorage.getItem('idUsuario') || '1');
    this.aprobadorId = isNaN(uid) ? 1 : uid;
    this.requestModel.usucrea = this.aprobadorId;
    this.balanceModel.usucrea = this.aprobadorId;

    this.personalService.getAllPersonal().subscribe({
      next: (d: any) => {
        this.personalList = d || [];
        if (this.personalList.length > 0) {
          this.idpersonal = this.personalList[0].idpersonal;
          this.cargar();
        }
      },
      error: (e) => console.error(e)
    });
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
    let base = this.estadoFiltro === 'TODAS' ? this.requests : this.requests.filter(r => r.estado === this.estadoFiltro);
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
    const d = new Date(fecha);
    return isNaN(d.getTime()) ? fecha : d.toLocaleDateString('es-EC');
  }

  refreshAll() {
    this.msg = '';
    this.error = '';
    this.selectedRequest = null;
    this.cargar();
  }

  cargar() {
    if (!this.idpersonal) return;
    this.service.getBalancesByPersonal(this.idpersonal).subscribe((d: any) => this.balances = d || []);
    this.service.getRequestsByPersonal(this.idpersonal).subscribe((d: any) => this.requests = d || []);
  }

  verDetalle(r: any) {
    this.selectedRequest = r;
  }

  crearBalance() {
    this.msg = ''; this.error = '';
    this.balanceModel.idpersonal_personal = { idpersonal: this.idpersonal };
    this.balanceModel.usucrea = this.aprobadorId;
    this.service.createBalance(this.balanceModel).subscribe({
      next: () => { this.msg = 'Balance creado'; this.cargar(); },
      error: (e) => { this.error = e?.error?.message || 'Error al crear balance'; console.error(e); }
    });
  }

  crearRequest() {
    this.msg = ''; this.error = '';
    if (!this.requestModel.fechainicio || !this.requestModel.fechafin) {
      this.error = 'Fecha inicio y fecha fin son obligatorias';
      return;
    }
    if (new Date(this.requestModel.fechainicio) > new Date(this.requestModel.fechafin)) {
      this.error = 'La fecha inicio no puede ser mayor que la fecha fin';
      return;
    }
    this.requestModel.idpersonal_personal = { idpersonal: this.idpersonal };
    this.requestModel.usucrea = this.aprobadorId;
    this.requestModel.dias_solicitados = this.diasSolicitadosPreview;

    this.service.createRequest(this.requestModel).subscribe({
      next: () => { this.msg = 'Solicitud creada'; this.cargar(); },
      error: (e) => { this.error = e?.error?.message || 'Error al crear solicitud'; console.error(e); }
    });
  }

  aprobar(idrequest: number) {
    if (!confirm('¿Confirmas aprobar esta solicitud?')) return;
    const observacion = prompt('Observación de aprobación:', 'Aprobado FE') || 'Aprobado FE';
    this.service.aprobar(idrequest, { aprobadorId: this.aprobadorId, observacion }).subscribe({
      next: () => { this.msg = 'Solicitud aprobada'; this.cargar(); },
      error: (e) => { this.error = e?.error?.message || 'Error al aprobar'; }
    });
  }

  rechazar(idrequest: number) {
    if (!confirm('¿Confirmas rechazar esta solicitud?')) return;
    const observacion = prompt('Motivo/observación de rechazo:', 'Rechazado FE') || 'Rechazado FE';
    this.service.rechazar(idrequest, { aprobadorId: this.aprobadorId, observacion }).subscribe({
      next: () => { this.msg = 'Solicitud rechazada'; this.cargar(); },
      error: (e) => { this.error = e?.error?.message || 'Error al rechazar'; }
    });
  }
}
