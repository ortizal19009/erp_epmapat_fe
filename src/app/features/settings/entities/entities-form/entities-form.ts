import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EntitiesApi } from '../../../../core/api/entities-api';

@Component({
  standalone: true,
  selector: 'app-entities-form',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './entities-form.html',
})
export class EntitiesFormComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);

  id = signal<string | null>(null);
  title = computed(() => (this.id() ? 'Editar entidad' : 'Nueva entidad'));
  form: any;

  constructor(
    private fb: FormBuilder,
    private api: EntitiesApi,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      codigo: ['', [Validators.required, Validators.minLength(2)]],
      nombre: ['', [Validators.required, Validators.minLength(3)]],
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
      next: (e) => {
        console.log('Loaded entity:', e);
        this.form.patchValue({ codigo: e.codigo, nombre: e.nombre });
        this.loading.set(false);
      },
      error: (err) => this.fail(err),
    });
  }

  save(): void {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const payload = this.form.getRawValue();
    const id = this.id();

    const req$ = id ? this.api.update(id, payload) : this.api.create(payload);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/settings/entities']);
      },
      error: (e) => this.fail(e, true),
    });
  }

  cancel(): void {
    this.router.navigate(['/settings/entities']);
  }

  private fail(e: any, isSaving = false) {
    if (isSaving) this.saving.set(false);
    this.loading.set(false);
    this.error.set(e?.error?.detail || e?.message || 'Error inesperado');
  }
}
