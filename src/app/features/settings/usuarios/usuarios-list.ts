import { CommonModule } from '@angular/common';
import { InfoHelpComponent } from '../../../shared/help/info-help';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LookupsApi } from '../../../core/api/lookups-api';

const ENTITY_CODE = 'EPMAPA-T';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [CommonModule, FormsModule, InfoHelpComponent],
  templateUrl: './usuarios-list.html',
  styleUrls: ['./usuarios-list.css'],
})
export class UsuariosListComponent implements OnInit {
  q = '';
  roleFilter = '';
  activeFilter = '';
  rows: any[] = [];
  auditRows: any[] = [];
  loading = false;
  error: string | null = null;

  roles = ['RECEPCION','RESPONSABLE','SUPERVISOR','ADMIN','CONSULTA'];

  constructor(private api: LookupsApi) {}

  ngOnInit(): void { this.load(); this.loadAudit(); }

  loadAudit(): void {
    this.api.adminAudit(ENTITY_CODE, 1, 50).subscribe({
      next: (r) => this.auditRows = r?.items || [],
      error: () => this.auditRows = [],
    });
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.api.users(ENTITY_CODE, this.q || undefined, 1, 300).subscribe({
      next: (r: any) => {
        let items = r?.items || [];
        if (this.roleFilter) items = items.filter((x: any) => (x.rol || '').toUpperCase() === this.roleFilter);
        if (this.activeFilter === '1') items = items.filter((x: any) => x.activo === true);
        if (this.activeFilter === '0') items = items.filter((x: any) => x.activo === false);
        this.rows = items;
      },
      error: (e: any) => this.error = e?.error?.detail || e?.message || 'Error cargando usuarios',
      complete: () => this.loading = false,
    });
  }

  setRole(u: any, role: string): void {
    this.api.updateUser(u.id, { role }, ENTITY_CODE).subscribe({
      next: (r: any) => { if (!r?.ok) alert(r?.detail || 'No se pudo actualizar rol'); this.load(); this.loadAudit(); },
      error: (e: any) => alert(e?.error?.detail || 'Error actualizando rol')
    });
  }

  toggleActive(u: any): void {
    this.api.updateUser(u.id, { active: !u.activo }, ENTITY_CODE).subscribe({
      next: (r: any) => { if (!r?.ok) alert(r?.detail || 'No se pudo actualizar estado'); this.load(); this.loadAudit(); },
      error: (e: any) => alert(e?.error?.detail || 'Error actualizando estado')
    });
  }
}



