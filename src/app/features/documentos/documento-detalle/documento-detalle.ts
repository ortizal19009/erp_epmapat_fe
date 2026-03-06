import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { DocumentosApi } from '../../../core/api/documentos-api';
import { DependencyApi } from '../../../core/api/dependency-api';
import { LookupsApi } from '../../../core/api/lookups-api';
import { UiFeedbackService } from '../shared/ui-feedback.service';

const ENTITY_CODE = 'EPMAPA-T';

@Component({
  selector: 'app-documento-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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

  dependencies: any[] = [];
  users: any[] = [];

  uploading = false;
  actionError: string | null = null;

  receivePayload = { dependencia_id: '', receptor_id: '', comentario: '' };
  derivePayload = { to_dependency_id: '', to_user_id: '', comment: '', due_at: '' };
  respondPayload = { derivation_id: '', subject: '', body: '', nested: true };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: DocumentosApi,
    private depsApi: DependencyApi,
    private lookupsApi: LookupsApi,
    private ui: UiFeedbackService
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    if (!this.id) {
      this.error = 'Documento no encontrado';
      this.loading = false;
      return;
    }

    this.depsApi.list(ENTITY_CODE).subscribe({ next: (r) => this.dependencies = r || [] });
    this.lookupsApi.users(ENTITY_CODE, '', 1, 200).subscribe({ next: (r) => this.users = r?.items || [] });

    this.loadAll();
  }


  get currentRole(): string {
    try { return (globalThis.localStorage?.getItem('gd.role') || 'ADMIN').toUpperCase(); }
    catch { return 'ADMIN'; }
  }

  get currentUserId(): string | null {
    try { return globalThis.localStorage?.getItem('gd.user_id'); }
    catch { return null; }
  }

  hasRole(...roles: string[]): boolean {
    return roles.includes(this.currentRole);
  }

  canEdit(): boolean {
    if (!this.doc) return false;
    if (!this.hasRole('RECEPCION', 'RESPONSABLE', 'SUPERVISOR', 'ADMIN')) return false;
    return this.doc.estado === 'BORRADOR' || this.doc.estado === 'EN_REVISION';
  }

  canEmit(): boolean {
    if (!this.doc) return false;
    if (!this.hasRole('SUPERVISOR', 'ADMIN')) return false;
    return this.doc.estado === 'BORRADOR' || this.doc.estado === 'EN_REVISION';
  }

  canReceive(): boolean {
    if (!this.doc) return false;
    if (!this.hasRole('RECEPCION', 'SUPERVISOR', 'ADMIN')) return false;
    return this.doc.estado === 'EMITIDO' || this.doc.estado === 'DERIVADO';
  }

  canDerive(): boolean {
    if (!this.doc) return false;
    if (!this.hasRole('RESPONSABLE', 'SUPERVISOR', 'ADMIN')) return false;
    return this.doc.estado === 'RECIBIDO' || this.doc.estado === 'EN_REVISION';
  }

  canRespond(): boolean {
    if (!this.doc) return false;
    if (!this.hasRole('RESPONSABLE', 'SUPERVISOR', 'ADMIN')) return false;
    return this.doc.estado === 'RECIBIDO' || this.doc.estado === 'DERIVADO' || this.doc.estado === 'EN_REVISION';
  }

  loadAll(): void {
    this.loading = true;
    this.error = null;
    this.actionError = null;

    this.api.get(this.id, this.currentUserId).subscribe({
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

  back(): void { this.router.navigate(['/gd/documentos']); }

  edit(): void {
    if (!this.canEdit()) return;
    this.router.navigate(['/gd/documentos', this.id, 'editar']);
  }

  async emit(): Promise<void> {
    this.actionError = null;
    if (!this.canEmit()) return;

    const ok = await this.ui.confirm('Emitir documento', 'Se generará/confirmará su número oficial.', 'Emitir');
    if (!ok) return;

    this.api.emit(this.id, this.currentUserId, this.currentRole).subscribe({
      next: () => {
        this.ui.toast('success', 'Documento emitido correctamente');
        this.loadAll();
      },
      error: (e) => {
        this.actionError = e?.error?.detail || 'No se pudo emitir';
        this.ui.toast('error', this.actionError || 'Error');
      }
    });
  }

  async receive(): Promise<void> {
    this.actionError = null;
    if (!this.canReceive()) return;

    if (!this.receivePayload.dependencia_id && !this.receivePayload.receptor_id) {
      this.actionError = 'Selecciona una dependencia o un usuario receptor.';
      this.ui.toast('warning', this.actionError);
      return;
    }

    const ok = await this.ui.confirm('Registrar recepción', 'Se marcará el documento como recibido.', 'Registrar');
    if (!ok) return;

    this.api.receive(this.id, {
      dependencia_id: this.receivePayload.dependencia_id || undefined,
      receptor_id: this.receivePayload.receptor_id || undefined,
      comentario: this.receivePayload.comentario || 'Recibido desde detalle',
      usuario_id: this.currentUserId || null,
      user_role: this.currentRole
    }).subscribe({
      next: () => {
        this.receivePayload = { dependencia_id: '', receptor_id: '', comentario: '' };
        this.ui.toast('success', 'Recepción registrada');
        this.loadAll();
      },
      error: (e) => {
        this.actionError = e?.error?.detail || 'No se pudo registrar recepción';
        this.ui.toast('error', this.actionError || 'Error');
      }
    });
  }

  async derive(): Promise<void> {
    this.actionError = null;
    if (!this.canDerive()) return;

    if (!this.derivePayload.to_dependency_id && !this.derivePayload.to_user_id) {
      this.actionError = 'Selecciona un destino de derivación (dependencia o usuario).';
      this.ui.toast('warning', this.actionError);
      return;
    }

    const ok = await this.ui.confirm('Derivar documento', 'Se enviará al destino seleccionado.', 'Derivar');
    if (!ok) return;

    this.api.derive(this.id, {
      to_dependency_id: this.derivePayload.to_dependency_id || undefined,
      to_user_id: this.derivePayload.to_user_id || undefined,
      comment: this.derivePayload.comment || undefined,
      due_at: this.derivePayload.due_at || undefined,
      user_id: this.currentUserId || undefined,
      user_role: this.currentRole
    }).subscribe({
      next: () => {
        this.derivePayload = { to_dependency_id: '', to_user_id: '', comment: '', due_at: '' };
        this.ui.toast('success', 'Documento derivado');
        this.loadAll();
      },
      error: (e) => {
        this.actionError = e?.error?.detail || 'No se pudo derivar';
        this.ui.toast('error', this.actionError || 'Error');
      }
    });
  }

  attendDerivation(derivationId: string): void {
    this.actionError = null;
    if (!derivationId) return;
    this.api.attendDerivation(derivationId, { user_id: this.currentUserId, note: 'Atendido desde detalle' }).subscribe({
      next: () => {
        this.ui.toast('success', 'Derivación marcada en gestión');
        this.api.listDerivations(this.id).subscribe({ next: (r) => this.derivations = r || [] });
      },
      error: (e) => {
        this.actionError = e?.error?.detail || 'No se pudo marcar como atendida';
        this.ui.toast('error', this.actionError || 'Error');
      }
    });
  }

  async respondDerivation(): Promise<void> {
    this.actionError = null;
    if (!this.canRespond()) return;
    if (!this.respondPayload.derivation_id) {
      this.actionError = 'Selecciona una derivación para responder.';
      this.ui.toast('warning', this.actionError);
      return;
    }
    if (!this.respondPayload.subject || !this.respondPayload.body) {
      this.actionError = 'Completa asunto y cuerpo de la respuesta.';
      this.ui.toast('warning', this.actionError);
      return;
    }

    const ok = await this.ui.confirm('Responder derivación', 'Se registrará la respuesta y se cerrará la derivación.', 'Responder');
    if (!ok) return;

    const payload = {
      derivation_id: this.respondPayload.derivation_id,
      subject: this.respondPayload.subject,
      body: this.respondPayload.body,
      responded_by_user_id: this.currentUserId || undefined,
      user_id: this.currentUserId || undefined,
      user_role: this.currentRole,
      nested_subject: this.respondPayload.subject,
      nested_body: this.respondPayload.body
    };

    const req = this.respondPayload.nested
      ? this.api.respondNested(this.id, payload)
      : this.api.respond(this.id, payload);

    req.subscribe({
      next: () => {
        this.respondPayload = { derivation_id: '', subject: '', body: '', nested: true };
        this.ui.toast('success', 'Respuesta registrada');
        this.loadAll();
      },
      error: (e) => {
        this.actionError = e?.error?.detail || 'No se pudo registrar respuesta';
        this.ui.toast('error', this.actionError || 'Error');
      }
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
        this.ui.toast('success', 'Archivo subido correctamente');
        this.api.listFiles(this.id).subscribe({ next: (r) => this.files = r || [] });
      },
      error: (e) => {
        this.uploading = false;
        this.actionError = e?.error?.detail || 'No se pudo subir el archivo';
        this.ui.toast('error', this.actionError || 'Error');
      }
    });
  }

  fileDownloadUrl(file: any): string {
    return this.api.downloadFile(this.id, file.id);
  }

  derivationBadgeClass(status?: string): string {
    switch ((status || '').toUpperCase()) {
      case 'PENDIENTE': return 'badge-warning';
      case 'LEIDO': return 'badge-info';
      case 'EN_GESTION': return 'badge-primary';
      case 'RESPONDIDO': return 'badge-success';
      case 'CERRADO': return 'badge-dark';
      default: return 'badge-secondary';
    }
  }
}




