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

  msg = '';
  error = '';

  balanceModel: any = { idpersonal_personal: { idpersonal: 0 }, anio: new Date().getFullYear(), dias_asignados: 15, dias_usados: 0, dias_disponibles: 15, usucrea: 1 };
  requestModel: any = { idpersonal_personal: { idpersonal: 0 }, tipolicencia: 'VACACION', fechainicio: '', fechafin: '', motivo: '', usucrea: 1 };

  page = 1;
  pageSize = 8;

  constructor(private service: ThLeaveService, private personalService: PersonalService) {}

  ngOnInit(): void {
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

  get requestsFiltradas(): any[] {
    const base = this.estadoFiltro === 'TODAS' ? this.requests : this.requests.filter(r => r.estado === this.estadoFiltro);
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

  cargar() {
    if (!this.idpersonal) return;
    this.service.getBalancesByPersonal(this.idpersonal).subscribe((d: any) => this.balances = d || []);
    this.service.getRequestsByPersonal(this.idpersonal).subscribe((d: any) => this.requests = d || []);
  }

  crearBalance() {
    this.msg = ''; this.error = '';
    this.balanceModel.idpersonal_personal = { idpersonal: this.idpersonal };
    this.service.createBalance(this.balanceModel).subscribe({
      next: () => { this.msg = 'Balance creado'; this.cargar(); },
      error: (e) => { this.error = e?.error?.message || 'Error al crear balance'; console.error(e); }
    });
  }

  crearRequest() {
    this.msg = ''; this.error = '';
    this.requestModel.idpersonal_personal = { idpersonal: this.idpersonal };
    this.service.createRequest(this.requestModel).subscribe({
      next: () => { this.msg = 'Solicitud creada'; this.cargar(); },
      error: (e) => { this.error = e?.error?.message || 'Error al crear solicitud'; console.error(e); }
    });
  }

  aprobar(idrequest: number) {
    if (!confirm('¿Confirmas aprobar esta solicitud?')) return;
    this.service.aprobar(idrequest, { aprobadorId: 1, observacion: 'Aprobado FE' }).subscribe({
      next: () => { this.msg = 'Solicitud aprobada'; this.cargar(); },
      error: (e) => { this.error = e?.error?.message || 'Error al aprobar'; }
    });
  }

  rechazar(idrequest: number) {
    if (!confirm('¿Confirmas rechazar esta solicitud?')) return;
    this.service.rechazar(idrequest, { aprobadorId: 1, observacion: 'Rechazado FE' }).subscribe({
      next: () => { this.msg = 'Solicitud rechazada'; this.cargar(); },
      error: (e) => { this.error = e?.error?.message || 'Error al rechazar'; }
    });
  }

  estadoClass(estado: string): string {
    switch ((estado || '').toUpperCase()) {
      case 'APROBADA': return 'badge badge-success';
      case 'RECHAZADA': return 'badge badge-danger';
      case 'SOLICITADA': return 'badge badge-warning';
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
    this.cargar();
  }
}
