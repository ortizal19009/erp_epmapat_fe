import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { PersonalService } from 'src/app/servicios/rrhh/personal.service';
import { PerformanceReview, ThPerformanceService } from 'src/app/servicios/rrhh/th-performance.service';
import { personalFromContext } from '../shared/personal-context';

@Component({ selector: 'app-th-performance', templateUrl: './th-performance.component.html', styleUrls: ['./th-performance.component.css'] })
export class ThPerformanceComponent implements OnInit {
  idpersonal = 0;
  personalList: any[] = [];
  reviews: PerformanceReview[] = [];
  permissionsReady = false;
  canWrite = false;
  loading = false;
  saving = false;
  error = '';
  msg = '';
  page = 0;
  totalPages = 0;
  totalElements = 0;
  private sequence = 0;
  model = this.emptyModel();
  private emptyModel() { return { periodo: '', fecha: '', puntaje: null as number | null, evaluador: '', observaciones: '', planMejora: '' }; }

  constructor(private service: ThPerformanceService, private personal: PersonalService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/th-performance');
    this.service.permissions().subscribe({
      next: p => {
        this.canWrite = p.canWrite; this.permissionsReady = true;
        this.personal.getAllPersonal().subscribe({
          next: (list: any) => {
            this.personalList = Array.isArray(list) ? list : [];
            this.idpersonal = personalFromContext(this.personalList, this.route.snapshot.queryParamMap.get('idpersonal'));
            if (this.idpersonal) this.cargar();
            else this.error = 'Seleccione un empleado válido para consultar sus evaluaciones.';
          }, error: e => this.error = this.message(e, 'No se pudo cargar el personal')
        });
      }, error: e => this.error = this.message(e, 'No tiene acceso a evaluaciones')
    });
  }

  cambiarPersonal(): void { this.model = this.emptyModel(); this.msg = ''; this.cargar(); }

  cargar(page = 0): void {
    const sequence = ++this.sequence;
    this.reviews = []; this.totalPages = 0; this.totalElements = 0;
    if (!this.idpersonal || !this.permissionsReady) { this.loading = false; return; }
    this.error = ''; this.loading = true; this.page = page;
    this.service.byPersonal(this.idpersonal, page).pipe(finalize(() => { if (sequence === this.sequence) this.loading = false; }))
      .subscribe({ next: data => {
        if (sequence !== this.sequence) return;
        this.reviews = data.content; this.totalPages = data.totalPages; this.totalElements = data.totalElements;
      }, error: e => { if (sequence === this.sequence) this.error = this.message(e, 'No se pudieron cargar las evaluaciones'); } });
  }

  guardar(): void {
    if (!this.canWrite || this.saving || this.loading || !this.idpersonal) return;
    this.error = ''; this.msg = '';
    const score = this.model.puntaje;
    if (!this.model.periodo.trim() || this.model.periodo.length > 40 || !this.model.fecha || score === null
      || !Number.isFinite(score) || score < 0 || score > 100 || Math.abs(score * 100 - Math.round(score * 100)) > 0.000001
      || !this.model.evaluador.trim() || this.model.evaluador.length > 120
      || !this.model.observaciones.trim() || this.model.observaciones.length > 2000 || this.model.planMejora.length > 2000) {
      this.error = 'Complete período, fecha, evaluador, observaciones y puntaje de 0 a 100 con hasta dos decimales.'; return;
    }
    this.saving = true;
    this.service.save({ ...this.model, idpersonal: this.idpersonal, puntaje: score })
      .pipe(finalize(() => this.saving = false)).subscribe({
        next: () => { this.msg = 'Evaluación registrada correctamente.'; this.model = this.emptyModel(); this.cargar(); },
        error: e => this.error = this.message(e, 'No se pudo registrar la evaluación')
      });
  }

  private message(e: any, fallback: string): string { return e?.error?.message || e?.error?.reason || fallback; }
}
