import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl, FormGroup } from '@angular/forms';
import { DocumentTypeApi } from '../../../../core/api/document-type-api';

const ENTITY_CODE = 'EPMAPA-T';

type Flow = 'INGRESO' | 'SALIDA';

type DocumentTypeForm = FormGroup<{
  codigo: FormControl<string>;
  nombre: FormControl<string>;
  flujo: FormControl<Flow>;
  activo: FormControl<boolean>;
}>;

@Component({
  standalone: true,
  selector: 'app-document-type-form',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './document-types-form.html',
})
export class DocumentTypeFormComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);

  id = signal<string | null>(null);
  title = computed(() => (this.id() ? 'Editar tipo de documento' : 'Nuevo tipo de documento'));

  form: DocumentTypeForm;

  constructor(
    private fb: FormBuilder,
    private api: DocumentTypeApi,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      codigo: this.fb.control('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
      nombre: this.fb.control('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
      flujo: this.fb.control<Flow>('SALIDA', { nonNullable: true, validators: [Validators.required] }),
      activo: this.fb.control(true, { nonNullable: true }),
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (!id) {
      this.loading.set(false);
      return;
    }

    this.api.get(id).subscribe({
      next: (t: any) => {
        this.form.patchValue({
          codigo: t.codigo ?? '',
          nombre: t.nombre ?? '',
          flujo: (t.flujo ?? 'SALIDA') as Flow,
          activo: !!t.activo,
        });
        this.loading.set(false);
      },
      error: (e) => this.fail(e),
    });
  }

  save(): void {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const id = this.id();
    const raw = this.form.getRawValue();

    if (!id) {
      const payload = {
        entity_code: ENTITY_CODE,
        codigo: raw.codigo,
        nombre: raw.nombre,
        flujo: raw.flujo,
        active: raw.activo,
      };

      this.api.create(payload).subscribe({
        next: () => this.done(),
        error: (e) => this.fail(e, true),
      });
      return;
    }

    const payload = {
      codigo: raw.codigo,
      nombre: raw.nombre,
      flujo: raw.flujo,
    };

    this.api.update(id, payload).subscribe({
      next: () => this.done(),
      error: (e) => this.fail(e, true),
    });
  }

  cancel(): void {
    this.router.navigate(['/document-types']);
  }

  private done(): void {
    this.saving.set(false);
    this.router.navigate(['/document-types']);
  }

  private fail(e: any, isSaving = false): void {
    if (isSaving) this.saving.set(false);
    this.loading.set(false);
    this.error.set(e?.error?.detail || e?.message || 'Error inesperado');
  }
}

