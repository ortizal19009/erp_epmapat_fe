import { Component } from '@angular/core';
import { RrhhSectionPageBase } from '../shared/rrhh-section-page.base';

@Component({
  selector: 'app-th-onboarding',
  templateUrl: '../shared/rrhh-section-page.template.html',
  styleUrls: ['../shared/rrhh-section-page.styles.css']
})
export class ThOnboardingComponent extends RrhhSectionPageBase {
  override title = 'Onboarding e Inducción';
  override subtitle = 'Integración de nuevos colaboradores, checklist y acompañamiento inicial';
  override sectionName = 'Reclutamiento y Selección';
  override pageIcon = 'bi bi-box-arrow-in-right';
  override tableTitle = 'Plan de inducción';
  override tableSubtitle = 'Seguimiento del proceso de ingreso y adaptación';
  override summaryCards = [
    { label: 'Ingresos del mes', value: '6', help: 'Nuevos colaboradores incorporados', tone: 'info', icon: 'bi bi-person-plus-fill' },
    { label: 'Inducciones completas', value: '4', help: 'Procesos cerrados satisfactoriamente', tone: 'success', icon: 'bi bi-check-square-fill' },
    { label: 'Checklists pendientes', value: '9', help: 'Tareas de inducción aún abiertas', tone: 'warning', icon: 'bi bi-list-check' },
    { label: 'Satisfacción onboarding', value: '91%', help: 'Valoración inicial de la experiencia de ingreso', tone: 'primary', icon: 'bi bi-emoji-smile-fill' }
  ];
  override alerts = [{ tone: 'info', title: 'Integración positiva', message: 'Los ingresos recientes completaron la mayor parte del plan de acogida.' }];
  override filters = [{ label: 'Etapa', value: 'ALL', options: [{ value: 'ALL', label: 'Todas' }, { value: 'DOCUMENTAL', label: 'Documental' }, { value: 'INDUCCION', label: 'Inducción' }, { value: 'SEGUIMIENTO', label: 'Seguimiento' }] }];
  override highlights = [
    { title: 'Tiempo de adaptación', value: '21 dias', help: 'Periodo promedio para completar el plan base.' },
    { title: 'Mentores asignados', value: '5', help: 'Colaboradores acompañando el proceso inicial.' },
    { title: 'Tareas críticas', value: '3', help: 'Equipos, accesos y firma documental pendientes.' }
  ];
  override tableColumns = [{ key: 'colaborador', label: 'Colaborador' }, { key: 'cargo', label: 'Cargo' }, { key: 'etapa', label: 'Etapa' }, { key: 'avance', label: 'Avance' }, { key: 'mentor', label: 'Mentor' }];
  override tableRows = [
    { colaborador: 'Luis Burbano', cargo: 'Analista TH', etapa: 'INDUCCIÓN', avance: '80%', mentor: 'Patricia M.' },
    { colaborador: 'Sonia Vera', cargo: 'Inspector', etapa: 'SEGUIMIENTO', avance: '92%', mentor: 'Carlos T.' },
    { colaborador: 'David Mena', cargo: 'Asistente comercial', etapa: 'DOCUMENTAL', avance: '60%', mentor: 'Ana C.' }
  ];
}
