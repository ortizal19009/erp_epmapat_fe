import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { DocumentosApi } from '../../../core/api/documentos-api';

@Component({
  selector: 'app-documento-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './documento-detalle.html',
  styleUrls: ['./documento-detalle.css']
})
export class DocumentoDetalleComponent implements OnInit {
  id = '';
  loading = true;
  error: string | null = null;

  doc: any = null;
  timeline: any[] = [];
  files: any[] = [];
  derivations: any[] = [];

  uploading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: DocumentosApi
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    if (!this.id) {
      this.error = 'Documento no encontrado';
      this.loading = false;
      return;
    }
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.error = null;

    this.api.get(this.id).subscribe({
      next: (doc) => {
        this.doc = doc;
        this.loading = false;
      },
      error: (e) => {
        this.error = e?.error?.detail || e?.message || 'No se pudo cargar el documento';
        this.loading = false;
      }
    });

    this.api.timeline(this.id).subscribe({ next: (r) => this.timeline = r || [], error: () => this.timeline = [] });
    this.api.listFiles(this.id).subscribe({ next: (r) => this.files = r || [], error: () => this.files = [] });
    this.api.listDerivations(this.id).subscribe({ next: (r) => this.derivations = r || [], error: () => this.derivations = [] });
  }

  back(): void {
    this.router.navigate(['/gd/documentos']);
  }

  edit(): void {
    this.router.navigate(['/gd/documentos', this.id, 'editar']);
  }

  emit(): void {
    if (!confirm('¿Emitir este documento?')) return;
    this.api.emit(this.id, null).subscribe({
      next: () => this.loadAll(),
      error: (e) => alert(e?.error?.detail || 'No se pudo emitir')
    });
  }

  receive(): void {
    const depId = prompt('dependency_id de recepción:', '');
    if (!depId) return;
    this.api.receive(this.id, { dependencia_id: depId, comentario: 'Recibido desde detalle', usuario_id: null }).subscribe({
      next: () => this.loadAll(),
      error: (e) => alert(e?.error?.detail || 'No se pudo registrar recepción')
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading = true;
    this.api.uploadFile(this.id, file).subscribe({
      next: () => {
        this.uploading = false;
        input.value = '';
        this.api.listFiles(this.id).subscribe({ next: (r) => this.files = r || [] });
      },
      error: (e) => {
        this.uploading = false;
        alert(e?.error?.detail || 'No se pudo subir el archivo');
      }
    });
  }

  fileDownloadUrl(file: any): string {
    return this.api.downloadFile(this.id, file.id);
  }
}
