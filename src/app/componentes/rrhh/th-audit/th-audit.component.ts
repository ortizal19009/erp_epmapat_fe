import { Component } from '@angular/core';
import { ThAuditService } from 'src/app/servicios/rrhh/th-audit.service';

@Component({
  selector: 'app-th-audit',
  templateUrl: './th-audit.component.html',
  styleUrls: ['./th-audit.component.css']
})
export class ThAuditComponent {
  entidad = 'TH_LEAVE_REQUEST';
  idregistro: number | null = null;
  logs: any[] = [];
  error = '';

  entidades = ['TH_LEAVE_REQUEST', 'TH_ACTION', 'TH_EMPLOYEE_FILE'];

  constructor(private service: ThAuditService) {}

  buscar() {
    this.error = '';
    const obs = this.idregistro
      ? this.service.byEntidadRegistro(this.entidad, this.idregistro)
      : this.service.byEntidad(this.entidad);

    obs.subscribe({
      next: (d: any) => this.logs = d || [],
      error: (e) => {
        this.error = e?.error?.message || 'No se pudo consultar auditoría';
        this.logs = [];
      }
    });
  }
}
