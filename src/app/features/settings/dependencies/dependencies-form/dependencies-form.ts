import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormControl,
  FormGroup,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { Dependencia } from '../../../../core/models/dependencia';
import { DependencyApi } from '../../../../core/api/dependency-api';

const ENTITY_CODE = 'EPMAPA-T';

type DependencyFormGroup = FormGroup<{
  codigo: FormControl<string>;
  nombre: FormControl<string>;
  padre_id: FormControl<string | null>;
}>;

@Component({
  standalone: true,
  selector: 'app-dependency-form',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './dependencies-form.html',
})
export class DependencyFormComponent implements OnInit {
  loading = true;
  saving = false;
  error: string | null = null;

  id: string | null = null;
  dependencies: Dependencia[] = [];
  title = 'Nueva dependencia';

  form: DependencyFormGroup;

  constructor(
    private fb: FormBuilder,
    private api: DependencyApi,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      codigo: this.fb.control('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(10),
          Validators.pattern(/^[A-Z0-9_-]+$/),
        ],
      }),
      nombre: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(3), Validators.maxLength(120)],
      }),
      padre_id: this.fb.control<string | null>(null),
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.id = id;
    this.title = this.id ? 'Editar dependencia' : 'Nueva dependencia';

    this.api.list(ENTITY_CODE).subscribe({
      next: (deps) => {
        this.dependencies = deps ?? [];

        if (!id) {
          this.loading = false;
          return;
        }

        this.api.get(id).subscribe({
          next: (d) => {
            this.form.patchValue({
              codigo: (d.codigo ?? '').toString(),
              nombre: (d.nombre ?? '').toString(),
              padre_id: d.padre_id ?? null,
            });
            this.loading = false;
          },
          error: (e) => this.fail(e),
        });
      },
      error: (e) => this.fail(e),
    });
  }

  save(): void {
    this.error = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;

    const raw = this.form.getRawValue();
    const payload = {
      entity_code: ENTITY_CODE,
      codigo: (raw.codigo ?? '').trim().toUpperCase(),
      nombre: (raw.nombre ?? '').trim(),
      padre_id: raw.padre_id || null,
    };

    const currentId = this.id;
    if (currentId && payload.padre_id === currentId) {
      this.saving = false;
      this.error = 'Una dependencia no puede ser su propio padre.';
      return;
    }

    const req$ = currentId ? this.api.update(currentId, payload) : this.api.create(payload);

    req$.subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/dependencies']);
      },
      error: (e) => this.fail(e, true),
    });
  }

  cancel(): void {
    this.router.navigate(['/dependencies']);
  }

  private fail(e: any, isSaving = false): void {
    if (isSaving) this.saving = false;
    this.loading = false;
    this.error = e?.error?.detail || e?.message || 'Error inesperado';
  }
}

