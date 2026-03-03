import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { DocumentosApi } from '../../../core/api/documentos-api';
import { DependencyApi } from '../../../core/api/dependency-api';
import { DocumentTypeApi } from '../../../core/api/document-type-api';
import { CcdApi } from '../../../core/api/ccd-api';

const ENTITY_CODE = 'EPMAPA-T';

@Component({
  selector: 'app-documento-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './documento-form.html',
  styleUrls: ['./documento-form.css']
})
export class DocumentoFormComponent implements OnInit {
  loading = true;
  saving = false;
  error: string | null = null;

  id: string | null = null;
  title = 'Nuevo documento';

  dependencies: any[] = [];
  docTypes: any[] = [];
  series: any[] = [];
  subseries: any[] = [];

  form = this.fb.group({
    tipo_doc_id: ['', Validators.required],
    dependencia_emisora_id: ['', Validators.required],
    series_id: [''],
    subseries_id: [''],
    flujo: ['SALIDA', Validators.required],
    origen: ['INTERNO'],
    fecha_elaboracion: ['', Validators.required],
    fecha_plazo: [''],
    asunto: ['', [Validators.required, Validators.minLength(5)]],
    referencia: [''],
    requiere_respuesta: [false],
    prioridad: ['MEDIA']
  });

  constructor(
    private fb: FormBuilder,
    private api: DocumentosApi,
    private depsApi: DependencyApi,
    private typesApi: DocumentTypeApi,
    private ccdApi: CcdApi,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') || this.route.snapshot.queryParamMap.get('id');
    this.title = this.id ? 'Editar documento' : 'Nuevo documento';

    this.loadCatalogs();

    if (!this.id) {
      this.form.patchValue({ fecha_elaboracion: this.today() });
      this.loading = false;
      return;
    }

    this.api.get(this.id).subscribe({
      next: (doc) => {
        this.form.patchValue({
          tipo_doc_id: doc?.tipo_doc_id || doc?.type_id || '',
          dependencia_emisora_id: doc?.dependencia_emisora_id || doc?.dependency_id || '',
          series_id: doc?.series_id || '',
          subseries_id: doc?.subseries_id || '',
          flujo: doc?.flujo || 'SALIDA',
          origen: doc?.origen || 'INTERNO',
          fecha_elaboracion: this.toDateInput(doc?.fecha_elaboracion),
          fecha_plazo: this.toDateInput(doc?.fecha_plazo),
          asunto: doc?.asunto || '',
          referencia: doc?.referencia || '',
          requiere_respuesta: !!doc?.requiere_respuesta,
          prioridad: doc?.prioridad || 'MEDIA'
        });
        if (doc?.series_id) this.loadSubseries(doc.series_id);
        this.loading = false;
      },
      error: (e) => {
        this.error = e?.error?.detail || e?.message || 'No se pudo cargar el documento';
        this.loading = false;
      }
    });
  }

  loadCatalogs(): void {
    this.depsApi.list(ENTITY_CODE).subscribe({ next: (r) => this.dependencies = r || [] });
    this.typesApi.list(ENTITY_CODE).subscribe({ next: (r) => this.docTypes = r || [] });
    this.ccdApi.listSeries(ENTITY_CODE).subscribe({ next: (r) => this.series = r || [] });
  }

  onSeriesChange(): void {
    const seriesId = this.form.value.series_id || '';
    this.form.patchValue({ subseries_id: '' });
    if (!seriesId) {
      this.subseries = [];
      return;
    }
    this.loadSubseries(seriesId);
  }

  loadSubseries(seriesId: string): void {
    this.ccdApi.listSubseries(seriesId).subscribe({ next: (r) => this.subseries = r || [] });
  }

  save(): void {
    this.error = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: any = {
      entity_code: ENTITY_CODE,
      type_id: raw.tipo_doc_id,
      dependency_id: raw.dependencia_emisora_id,
      series_id: raw.series_id || null,
      subseries_id: raw.subseries_id || null,
      flow: raw.flujo,
      origin: raw.origen,
      draft_date: raw.fecha_elaboracion,
      due_date: raw.fecha_plazo || null,
      subject: raw.asunto,
      reference: raw.referencia || null,
      requires_response: !!raw.requiere_respuesta,
      priority: raw.prioridad
    };

    this.saving = true;

    const req = this.id ? this.api.update(this.id, payload) : this.api.create(payload);
    req.subscribe({
      next: (res) => {
        const id = this.id || res?.id;
        this.saving = false;
        if (id) this.router.navigate(['/gd/documentos', id]);
        else this.router.navigate(['/gd/documentos']);
      },
      error: (e) => {
        this.error = e?.error?.detail || e?.message || 'No se pudo guardar el documento';
        this.saving = false;
      }
    });
  }

  cancel(): void {
    if (this.id) this.router.navigate(['/gd/documentos', this.id]);
    else this.router.navigate(['/gd/documentos']);
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private toDateInput(value?: string): string {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  }
}
