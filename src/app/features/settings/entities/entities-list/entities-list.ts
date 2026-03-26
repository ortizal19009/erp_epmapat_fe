import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EntitiesApi, Entity } from '../../../../core/api/entities-api';

@Component({
  standalone: true,
  selector: 'app-entities-list',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './entities-list.html',
})
export class EntitiesListComponent implements OnInit {
  items: Entity[] = [];
  loading = false;
  error: string | null = null;

  q = '';

  constructor(private api: EntitiesApi, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;

    this.api.list(this.q).subscribe({
      next: (res) => (this.items = res),
      error: (e) => {
        console.error(e);
        this.error = e?.error?.detail || e?.message || 'Error cargando entidades';
      },
      complete: () => (this.loading = false),
    });
  }

  clear(): void {
    this.q = '';
    this.load();
  }

  goNew(): void {
    this.router.navigate(['/settings/entities/new']);
  }

  edit(item: Entity): void {
    this.router.navigate(['/settings/entities', item.id]);
  }

  toggle(item: Entity): void {
    const next = !item.activo;
    this.api.setStatus(item.id, next).subscribe({
      next: () => {
        item.activo = next; // optimistic
      },
      error: (e) => {
        console.error(e);
        alert(e?.error?.detail || 'Error actualizando estado');
      },
    });
  }
}

