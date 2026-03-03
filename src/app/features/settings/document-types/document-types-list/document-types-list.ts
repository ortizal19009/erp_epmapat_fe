import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TipoDocumento } from '../../../../core/models/tipo-documento';
import { DocumentTypeApi } from '../../../../core/api/document-type-api';

const ENTITY_CODE = 'EPMAPA-T';

@Component({
  standalone: true,
  selector: 'app-document-types-list',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './document-types-list.html',
})
export class DocumentTypesListComponent implements OnInit {
  entityCode = ENTITY_CODE;

  items: TipoDocumento[] = [];
  loading = false;
  error: string | null = null;

  q = '';
  flow: '' | 'INGRESO' | 'SALIDA' = '';

  constructor(private api: DocumentTypeApi, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;

    this.api.list(this.entityCode).subscribe({
      next: (res) => {
        const all = res ?? [];
        const term = this.q.trim().toLowerCase();

        this.items = all.filter(x => {
          const okText =
            !term ||
            (x.codigo || '').toLowerCase().includes(term) ||
            (x.nombre || '').toLowerCase().includes(term);

          const okFlow = !this.flow || x.flujo === this.flow;
          return okText && okFlow;
        });
      },
      error: (e) => {
        console.error(e);
        this.error = e?.error?.detail || e?.message || 'Error cargando tipos de documento';
      },
      complete: () => (this.loading = false),
    });
  }

  clear(): void {
    this.q = '';
    this.flow = '';
    this.load();
  }

  goNew(): void {
    this.router.navigate(['/document-types/new']);
  }

  edit(item: TipoDocumento): void {
    this.router.navigate(['/document-types', item.id, 'edit']);
  }

  toggleActive(item: TipoDocumento): void {
    const next = !item.activo;
    this.api.setStatus(item.id, next).subscribe({
      next: () => {
        item.activo = next;
      },
      error: (e) => alert(e?.error?.detail || 'Error actualizando estado'),
    });
  }

  badgeFlow(flow: string): string {
    return flow === 'INGRESO' ? 'bg-info text-dark' : 'bg-primary';
  }
}
