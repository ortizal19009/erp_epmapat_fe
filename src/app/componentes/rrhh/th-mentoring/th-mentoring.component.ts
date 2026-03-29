import { Component } from '@angular/core';
import { RrhhSectionPageBase } from '../shared/rrhh-section-page.base';

@Component({
  selector: 'app-th-mentoring',
  templateUrl: '../shared/rrhh-section-page.template.html',
  styleUrls: ['../shared/rrhh-section-page.styles.css']
})
export class ThMentoringComponent extends RrhhSectionPageBase {
  override title = 'Mentoría y Coaching';
  override subtitle = 'Acompañamiento individual, sesiones de desarrollo y seguimiento';
  override sectionName = 'Desarrollo y Capacitación';
  override pageIcon = 'bi bi-chat-heart-fill';
  override tableTitle = 'Sesiones de acompañamiento';
  override tableSubtitle = 'Relación mentor-mentee y avance de objetivos';
  override summaryCards = [
    { label: 'Mentores activos', value: '8', help: 'Lideres y referentes asignados', tone: 'info', icon: 'bi bi-person-heart' },
    { label: 'Mentees', value: '13', help: 'Colaboradores en acompañamiento', tone: 'success', icon: 'bi bi-people-fill' },
    { label: 'Sesiones del mes', value: '22', help: 'Reuniones de coaching ejecutadas', tone: 'warning', icon: 'bi bi-calendar-week-fill' },
    { label: 'Cumplimiento', value: '89%', help: 'Planes de seguimiento al día', tone: 'primary', icon: 'bi bi-bullseye' }
  ];
  override alerts = [{ tone: 'info', title: 'Acompañamiento estable', message: 'Los programas de mentoría están alineados con formación y sucesión.' }];
  override filters = [{ label: 'Programa', value: 'ALL', options: [{ value: 'ALL', label: 'Todos' }, { value: 'LIDERAZGO', label: 'Liderazgo' }, { value: 'INGRESO', label: 'Nuevos ingresos' }, { value: 'DESEMPEÑO', label: 'Desempeño' }] }];
  override highlights = [
    { title: 'Objetivos cumplidos', value: '76%', help: 'Metas individuales alcanzadas en el plan actual.' },
    { title: 'Riesgos detectados', value: '3', help: 'Casos con seguimiento adicional recomendado.' },
    { title: 'Frecuencia media', value: '2.4', help: 'Sesiones mensuales por participante.' }
  ];
  override tableColumns = [{ key: 'mentor', label: 'Mentor' }, { key: 'mentee', label: 'Mentee' }, { key: 'programa', label: 'Programa' }, { key: 'ultimaSesion', label: 'Última sesión' }, { key: 'avance', label: 'Avance' }];
  override tableRows = [
    { mentor: 'Jefe TH', mentee: 'Patricia Mora', programa: 'LIDERAZGO', ultimaSesion: '2026-03-20', avance: '85%' },
    { mentor: 'Supervisor campo', mentee: 'Luis Burbano', programa: 'DESEMPEÑO', ultimaSesion: '2026-03-22', avance: '72%' },
    { mentor: 'Coordinador comercial', mentee: 'Andrea Ponce', programa: 'INGRESO', ultimaSesion: '2026-03-25', avance: '90%' }
  ];
}
