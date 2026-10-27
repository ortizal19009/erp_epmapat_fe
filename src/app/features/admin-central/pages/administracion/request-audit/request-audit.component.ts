import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, timer } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { UsuarioService } from 'src/app/servicios/administracion/usuario.service';
import { Usuarios } from 'src/app/modelos/administracion/usuarios.model';
import { environment } from 'src/environments/environment';
interface Audit { id: number; fecha: string; metodo: string; ruta: string; estado: number; duracionMs: number; ip: string; usuarioId: number | null; }
@Component({ selector: 'app-request-audit', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './request-audit.component.html', styleUrls: ['./request-audit.component.css'] })
export class RequestAuditComponent implements OnInit, OnDestroy {
 rows: Audit[] = []; page = 0; totalPages = 0; total = 0; loading = false; error = ''; auto = false;
 metodo = ''; ruta = ''; estado = ''; usuarioId = ''; ip = '';
 desde = this.today(); hasta = this.desde;
 usuarios: Usuarios[] = []; usuariosError = '';
 private userNames = new Map<number, string>();
 private destroy$ = new Subject<void>();
 constructor(private http: HttpClient, private usuarioService: UsuarioService) {}
 ngOnInit(): void {
  this.usuarioService.getUsuarios().pipe(takeUntil(this.destroy$)).subscribe({
   next: users => { this.usuarios = (users || []).sort((a, b) => (a.nomusu || a.alias || '').localeCompare(b.nomusu || b.alias || '')); this.userNames = new Map(this.usuarios.map(u => [u.idusuario, u.nomusu || u.alias || String(u.idusuario)])); },
   error: () => this.usuariosError = 'No se pudo cargar la lista de usuarios. Puedes filtrar ingresando su ID.'
  });
  this.load(); timer(10000, 10000).pipe(takeUntil(this.destroy$)).subscribe(() => { if (this.auto) this.load(); }); }
 ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
 private today(): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = (type: string) => parts.find(p => p.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
 }
 userLabel(id: number | null): string { return id == null ? 'Sin identificar' : `${id} - ${this.userNames.get(id) || 'Usuario'}`; }
 reset(): void { this.metodo = ''; this.ruta = ''; this.estado = ''; this.usuarioId = ''; this.ip = ''; this.desde = this.today(); this.hasta = this.desde; this.search(); }
 search(): void { this.page = 0; this.load(); }
 move(delta: number): void { this.page += delta; this.load(); }
 load(): void {
  if (this.loading) return;
  if (this.desde && this.hasta && this.desde > this.hasta) { this.error = 'La fecha inicial debe ser anterior a la fecha final.'; return; }
  this.loading = true; this.error = '';
  let params = new HttpParams().set('page', this.page).set('size', 25);
  for (const [key, value] of Object.entries({ metodo: this.metodo, ruta: this.ruta, estado: this.estado, usuarioId: this.usuarioId, ip: this.ip.trim(), desde: this.desde, hasta: this.hasta })) { if (value) params = params.set(key, value); }
  this.http.get<{content: Audit[]; totalPages: number; totalElements: number}>(`${environment.API_URL}/request-audit`, {params})
   .pipe(takeUntil(this.destroy$), finalize(() => this.loading = false)).subscribe({
    next: data => { this.rows = data.content; this.totalPages = data.totalPages; this.total = data.totalElements; },
    error: () => { this.error = 'No se pudo cargar la auditoría de peticiones. Intenta actualizar.'; }
   });
 }
}
