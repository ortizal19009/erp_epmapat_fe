import { Component } from '@angular/core';
import { RrhhSectionPageBase } from '../shared/rrhh-section-page.base';

@Component({
  selector: 'app-th-candidates',
  templateUrl: '../shared/rrhh-section-page.template.html',
  styleUrls: ['../shared/rrhh-section-page.styles.css']
})
export class ThCandidatesComponent extends RrhhSectionPageBase {
  override title = 'Candidatos y Filtros';
  override subtitle = 'Recepción, clasificación y avance del pipeline de selección';
  override sectionName = 'Reclutamiento y Selección';
  override pageIcon = 'bi bi-funnel-fill';
  override tableTitle = 'Pipeline de candidatos';
  override tableSubtitle = 'Estado de postulaciones por vacante y prioridad';
  override summaryCards = [
    { label: 'Postulados', value: '86', help: 'Candidatos registrados en el periodo', tone: 'info', icon: 'bi bi-person-badge-fill' },
    { label: 'Preseleccionados', value: '24', help: 'Perfiles que pasaron filtrado inicial', tone: 'success', icon: 'bi bi-person-check-fill' },
    { label: 'En entrevista', value: '11', help: 'Candidatos agendados o en evaluación', tone: 'warning', icon: 'bi bi-chat-left-text-fill' },
    { label: 'Tasa de avance', value: '27.9%', help: 'Relación entre postulados y preselección', tone: 'primary', icon: 'bi bi-graph-up-arrow' }
  ];
  override alerts = [{ tone: 'info', title: 'Embudo saludable', message: 'La conversión a entrevista se mantiene dentro del rango esperado.' }];
  override filters = [
    { label: 'Vacante', value: 'ALL', options: [{ value: 'ALL', label: 'Todas' }, { value: 'ANALISTA_TH', label: 'Analista TH' }, { value: 'TECNICO', label: 'Técnico mantenimiento' }] },
    { label: 'Etapa', value: 'ALL', options: [{ value: 'ALL', label: 'Todas' }, { value: 'POSTULADO', label: 'Postulado' }, { value: 'PRE', label: 'Preselección' }, { value: 'ENTREVISTA', label: 'Entrevista' }] }
  ];
  override highlights = [
    { title: 'Fuente principal', value: 'Referidos', help: 'Aportan el mayor porcentaje de perfiles calificados.' },
    { title: 'Tiempo de filtrado', value: '3 dias', help: 'Promedio entre postulación y validación inicial.' },
    { title: 'Perfiles críticos', value: '5', help: 'Candidatos con alta compatibilidad para cubrir vacantes clave.' }
  ];
  override tableColumns = [{ key: 'nombre', label: 'Candidato' }, { key: 'vacante', label: 'Vacante' }, { key: 'fuente', label: 'Fuente' }, { key: 'etapa', label: 'Etapa' }, { key: 'score', label: 'Score' }];
  override tableRows = [
    { nombre: 'María Narváez', vacante: 'Analista de TH', fuente: 'Referido', etapa: 'ENTREVISTA', score: '92' },
    { nombre: 'Carlos Rosero', vacante: 'Técnico mantenimiento', fuente: 'Bolsa pública', etapa: 'PRESELECCIÓN', score: '87' },
    { nombre: 'Ana Maya', vacante: 'Asistente comercial', fuente: 'Web institucional', etapa: 'POSTULADO', score: '80' }
  ];
}
