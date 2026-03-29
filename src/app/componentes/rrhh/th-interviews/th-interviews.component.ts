import { Component } from '@angular/core';
import { RrhhSectionPageBase } from '../shared/rrhh-section-page.base';

@Component({
  selector: 'app-th-interviews',
  templateUrl: '../shared/rrhh-section-page.template.html',
  styleUrls: ['../shared/rrhh-section-page.styles.css']
})
export class ThInterviewsComponent extends RrhhSectionPageBase {
  override title = 'Entrevistas y Pruebas';
  override subtitle = 'Agenda, resultados y seguimiento de evaluaciones de selección';
  override sectionName = 'Reclutamiento y Selección';
  override pageIcon = 'bi bi-ui-checks-grid';
  override tableTitle = 'Agenda de entrevistas';
  override tableSubtitle = 'Control de etapas técnicas, psicológicas y finales';
  override summaryCards = [
    { label: 'Entrevistas agendadas', value: '14', help: 'Sesiones programadas esta semana', tone: 'info', icon: 'bi bi-calendar-event-fill' },
    { label: 'Pruebas técnicas', value: '9', help: 'Evaluaciones pendientes o en revisión', tone: 'warning', icon: 'bi bi-clipboard2-check-fill' },
    { label: 'Finalistas', value: '5', help: 'Candidatos listos para decisión final', tone: 'success', icon: 'bi bi-star-fill' },
    { label: 'Cumplimiento agenda', value: '93%', help: 'Sesiones ejecutadas en tiempo previsto', tone: 'primary', icon: 'bi bi-clock-history' }
  ];
  override alerts = [{ tone: 'warning', title: 'Sobrecarga de entrevistas', message: 'Dos jefaturas concentran más del 50% de entrevistas del periodo.' }];
  override filters = [
    { label: 'Tipo', value: 'ALL', options: [{ value: 'ALL', label: 'Todas' }, { value: 'TECNICA', label: 'Técnica' }, { value: 'COMPETENCIAS', label: 'Competencias' }, { value: 'FINAL', label: 'Final' }] },
    { label: 'Estado', value: 'PROGRAMADA', options: [{ value: 'PROGRAMADA', label: 'Programadas' }, { value: 'REALIZADA', label: 'Realizadas' }, { value: 'PENDIENTE', label: 'Pendientes' }] }
  ];
  override highlights = [
    { title: 'Tiempo medio por proceso', value: '6 dias', help: 'Desde preselección hasta evaluación final.' },
    { title: 'Paneles activos', value: '4', help: 'Equipos evaluadores participando en selección.' },
    { title: 'Pruebas estandarizadas', value: '3', help: 'Técnica, psicométrica y entrevista por competencias.' }
  ];
  override tableColumns = [{ key: 'candidato', label: 'Candidato' }, { key: 'tipo', label: 'Tipo' }, { key: 'fecha', label: 'Fecha' }, { key: 'responsable', label: 'Responsable' }, { key: 'resultado', label: 'Resultado' }];
  override tableRows = [
    { candidato: 'María Narváez', tipo: 'FINAL', fecha: '2026-04-01 09:00', responsable: 'Jefe TH', resultado: 'PENDIENTE' },
    { candidato: 'Carlos Rosero', tipo: 'TÉCNICA', fecha: '2026-03-30 14:30', responsable: 'Jefe Operaciones', resultado: 'APTO' },
    { candidato: 'Ana Maya', tipo: 'COMPETENCIAS', fecha: '2026-03-31 11:00', responsable: 'Psicología', resultado: 'EN PROCESO' }
  ];
}
