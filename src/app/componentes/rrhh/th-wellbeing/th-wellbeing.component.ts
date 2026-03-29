import { Component } from '@angular/core';
import { RrhhSectionPageBase } from '../shared/rrhh-section-page.base';

@Component({
  selector: 'app-th-wellbeing',
  templateUrl: '../shared/rrhh-section-page.template.html',
  styleUrls: ['../shared/rrhh-section-page.styles.css']
})
export class ThWellbeingComponent extends RrhhSectionPageBase {
  override title = 'Programas de Bienestar';
  override subtitle = 'Salud, deporte y actividades de integración del personal';
  override sectionName = 'Bienestar y Cultura';
  override pageIcon = 'bi bi-heart-fill';
  override tableTitle = 'Portafolio de bienestar';
  override tableSubtitle = 'Participación e impacto de actividades institucionales';
  override summaryCards = [
    { label: 'Programas activos', value: '8', help: 'Iniciativas vigentes del periodo', tone: 'info', icon: 'bi bi-calendar-heart-fill' },
    { label: 'Participación', value: '67%', help: 'Colaboradores que participaron al menos una vez', tone: 'success', icon: 'bi bi-people-fill' },
    { label: 'Eventos del mes', value: '5', help: 'Actividades ejecutadas o calendarizadas', tone: 'warning', icon: 'bi bi-calendar3-event-fill' },
    { label: 'Satisfacción', value: '93%', help: 'Valoración promedio de asistentes', tone: 'primary', icon: 'bi bi-hand-thumbs-up-fill' }
  ];
  override alerts = [{ tone: 'info', title: 'Alta aceptación', message: 'Salud preventiva y deporte lideran la participación del trimestre.' }];
  override filters = [{ label: 'Programa', value: 'ALL', options: [{ value: 'ALL', label: 'Todos' }, { value: 'SALUD', label: 'Salud' }, { value: 'DEPORTE', label: 'Deporte' }, { value: 'SOCIAL', label: 'Social' }] }];
  override highlights = [
    { title: 'Programa líder', value: 'Salud preventiva', help: 'Mayor participación y mejor evaluación.' },
    { title: 'Cobertura trimestral', value: '72%', help: 'Personal que participó en al menos dos actividades.' },
    { title: 'Aliados externos', value: '3', help: 'Instituciones colaborando con bienestar.' }
  ];
  override tableColumns = [{ key: 'programa', label: 'Programa' }, { key: 'tipo', label: 'Tipo' }, { key: 'participantes', label: 'Participantes' }, { key: 'frecuencia', label: 'Frecuencia' }, { key: 'impacto', label: 'Impacto' }];
  override tableRows = [
    { programa: 'Chequeo preventivo', tipo: 'SALUD', participantes: '42', frecuencia: 'Mensual', impacto: 'ALTO' },
    { programa: 'Torneos internos', tipo: 'DEPORTE', participantes: '31', frecuencia: 'Quincenal', impacto: 'MEDIO' },
    { programa: 'Integración familiar', tipo: 'SOCIAL', participantes: '55', frecuencia: 'Trimestral', impacto: 'ALTO' }
  ];
}
