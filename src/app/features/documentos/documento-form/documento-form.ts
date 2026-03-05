import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { DocumentosApi } from '../../../core/api/documentos-api';
import { DependencyApi } from '../../../core/api/dependency-api';
import { DocumentTypeApi } from '../../../core/api/document-type-api';
import { CcdApi } from '../../../core/api/ccd-api';
import { UiFeedbackService } from '../shared/ui-feedback.service';

const ENTITY_CODE = 'EPMAPA-T';

@Component({
  selector: 'app-documento-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './documento-form.html',
  styleUrls: ['./documento-form.css']
})
export class DocumentoFormComponent implements OnInit {
  loading = true;
  saving = false;
  error: string | null = null;

  id: string | null = null;
  title = 'Nuevo documento';
  currentState = 'BORRADOR';

  dependencies: any[] = [];
  docTypes: any[] = [];
  series: any[] = [];
  subseries: any[] = [];

  selectedFile: File | null = null;
  uploadOnCreate = true;

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
    remitente_externo: [''],
    cuerpo: [''],
    observaciones: [''],
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
    private router: Router,
    private ui: UiFeedbackService
  ) {}


  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') || this.route.snapshot.queryParamMap.get('id');
    this.title = this.id ? 'Editar documento' : 'Nuevo documento';

    this.loadCatalogs();

    if (!this.id) {
      this.form.patchValue({ fecha_elaboracion: this.today() });
      this.loading = false;
      if (!this.canCreate()) this.error = 'Tu rol no tiene permisos para crear documentos.';
      return;
    }

    this.api.get(this.id).subscribe({
      next: (doc) => {
        this.currentState = doc?.estado || 'BORRADOR';
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
          remitente_externo: doc?.remitente_externo || '',
          cuerpo: doc?.cuerpo || '',
          observaciones: doc?.observaciones || '',
          requiere_respuesta: !!doc?.requiere_respuesta,
          prioridad: doc?.prioridad || 'MEDIA'
        });
        if (doc?.series_id) this.loadSubseries(doc.series_id);

        if (!this.canEditByState()) {
          this.form.disable();
          this.error = `No se puede editar un documento en estado ${this.currentState}.`;
        }
        this.loading = false;
      },
      error: (e) => {
        this.error = e?.error?.detail || e?.message || 'No se pudo cargar el documento';
        this.loading = false;
      }
    });
  }

  get currentRole(): string {
    try { return (globalThis.localStorage?.getItem('gd.role') || 'ADMIN').toUpperCase(); }
    catch { return 'ADMIN'; }
  }

  hasRole(...roles: string[]): boolean {
    return roles.includes(this.currentRole);
  }

  canCreate(): boolean {
    return this.hasRole('RECEPCION', 'RESPONSABLE', 'SUPERVISOR', 'ADMIN');
  }

  canEditByState(): boolean {
    return this.hasRole('RECEPCION', 'RESPONSABLE', 'SUPERVISOR', 'ADMIN')
      && (this.currentState === 'BORRADOR' || this.currentState === 'EN_REVISION');
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;
  }

  async save(): Promise<void> {
    this.error = null;
    if (!this.id && !this.canCreate()) {
      this.error = 'Tu rol no tiene permisos para crear documentos.';
      this.ui.toast('warning', this.error);
      return;
    }
    if (this.id && !this.canEditByState()) {
      this.error = `No se puede editar un documento en estado ${this.currentState}.`;
      this.ui.toast('warning', this.error);
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.ui.toast('warning', 'Completa los campos obligatorios.');
      return;
    }

    const raw = this.form.getRawValue();
    if (raw?.requiere_respuesta && !raw?.fecha_plazo) {
      this.ui.toast('warning', 'Si requiere respuesta, debes ingresar fecha de plazo.');
      return;
    }

    const ok = await this.ui.confirm(this.id ? 'Guardar cambios' : 'Crear documento', this.id ? 'Se actualizará la información del documento.' : 'Se creará un nuevo documento en borrador.', this.id ? 'Guardar' : 'Crear');
    if (!ok) return;
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
      remitente_externo: raw.remitente_externo || null,
      body: raw.cuerpo || null,
      observaciones: raw.observaciones || null,
      requires_response: !!raw.requiere_respuesta,
      priority: raw.prioridad
    };

    this.saving = true;

    const req = this.id ? this.api.update(this.id, payload) : this.api.create(payload);
    req.subscribe({
      next: (res) => {
        const id = this.id || res?.id;

        const finish = () => {
          this.saving = false;
          this.ui.toast('success', this.id ? 'Documento actualizado' : 'Documento creado');
          if (id) this.router.navigate(['/gd/documentos', id]);
          else this.router.navigate(['/gd/documentos']);
        };

        if (!this.id && id && this.uploadOnCreate && this.selectedFile) {
          this.api.uploadFile(id, this.selectedFile).subscribe({
            next: () => {
              this.ui.toast('success', 'Archivo escaneado adjuntado');
              finish();
            },
            error: (e) => {
              this.ui.toast('warning', e?.error?.detail || 'Documento creado, pero no se pudo adjuntar el archivo');
              finish();
            }
          });
          return;
        }

        finish();
      },
      error: (e) => {
        this.error = e?.error?.detail || e?.message || 'No se pudo guardar el documento';
        this.saving = false;
        this.ui.toast('error', this.error || 'Error');
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

