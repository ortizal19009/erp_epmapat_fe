import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Dependencia } from '../../../../core/models/dependencia';
import { DependencyApi } from '../../../../core/api/dependency-api';
import { FormsModule, NgModel } from '@angular/forms';

const ENTITY_CODE = 'EPMAPA-T';

@Component({
  standalone: true,
  selector: 'app-dependencies-list',
  imports: [CommonModule, RouterModule,FormsModule],
  templateUrl: './dependencies-list.html',
})
export class DependenciesListComponent implements OnInit {
  items: Dependencia[] = [];
  loading = false;
  error: string | null = null;
  q = '';
  status: '' | 'active' | 'inactive' = '';
  constructor(
    private api: DependencyApi,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;

    this.api.list(ENTITY_CODE).subscribe({
      next: (res) => this.items = res,
      error: (e) => {
        console.error(e);
        this.error = e?.error?.detail || 'Error cargando dependencias';
      },
      complete: () => this.loading = false
    });
  }

  new(): void {
    this.router.navigate(['/dependencies/new']);
  }

  edit(item: Dependencia): void {
    this.router.navigate(['/dependencies', item.id, 'edit']);
  }

  toggle(item: Dependencia): void {
    const active = !item.activo;

    this.api.setStatus(item.id, active).subscribe({
      next: () => {
        item.activo = active;
      },
      error: (e) => {
        alert(e?.error?.detail || 'Error actualizando estado');
      }
    });
  }
  filteredItems() {
    const q = this.q.trim().toLowerCase();
    return this.items.filter(d => {
      const matchQ =
        !q ||
        (d.codigo || '').toLowerCase().includes(q) ||
        (d.nombre || '').toLowerCase().includes(q);

      const matchStatus =
        !this.status ||
        (this.status === 'active' && d.activo) ||
        (this.status === 'inactive' && !d.activo);

      return matchQ && matchStatus;
    });
  }

  clearFilters() {
    this.q = '';
    this.status = '';
    this.load();
  }
}
