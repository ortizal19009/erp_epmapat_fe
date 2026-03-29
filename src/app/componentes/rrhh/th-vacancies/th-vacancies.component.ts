import { Component } from '@angular/core';
import { RrhhSectionPageBase } from '../shared/rrhh-section-page.base';

@Component({
  selector: 'app-th-vacancies',
  templateUrl: '../shared/rrhh-section-page.template.html',
  styleUrls: ['../shared/rrhh-section-page.styles.css']
})
export class ThVacanciesComponent extends RrhhSectionPageBase {
  override title = 'Vacantes';
  override subtitle = 'Publicación, cobertura y seguimiento de posiciones abiertas';
  override sectionName = 'Reclutamiento y Selección';
  override pageIcon = 'bi bi-megaphone-fill';
  override tableTitle = 'Vacantes activas';
  override tableSubtitle = 'Control operativo de posiciones por área y etapa';
  override summaryCards = [
    { label: 'Vacantes abiertas', value: '12', help: 'Posiciones en proceso de cobertura', tone: 'info', icon: 'bi bi-briefcase-fill' },
    { label: 'Cubiertas', value: '7', help: 'Vacantes cerradas en el periodo', tone: 'success', icon: 'bi bi-check2-circle' },
    { label: 'Tiempo promedio', value: '24 dias', help: 'Promedio desde publicación hasta cierre', tone: 'warning', icon: 'bi bi-hourglass-split' },
    { label: 'Costo por vacante', value: '$480.00', help: 'Costo medio estimado de contratación', tone: 'primary', icon: 'bi bi-cash' }
  ];
  override alerts = [{ tone: 'warning', title: 'Vacantes críticas', message: 'Operaciones y Comercial concentran las posiciones con mayor urgencia.' }];
  override filters = [
    { label: 'Área', value: 'ALL', options: [{ value: 'ALL', label: 'Todas' }, { value: 'OPERACIONES', label: 'Operaciones' }, { value: 'COMERCIAL', label: 'Comercial' }, { value: 'ADMIN', label: 'Administración' }] },
    { label: 'Estado', value: 'ABIERTA', options: [{ value: 'ABIERTA', label: 'Abiertas' }, { value: 'EN_PROCESO', label: 'En proceso' }, { value: 'CUBIERTA', label: 'Cubiertas' }] },
    { label: 'Prioridad', value: 'ALL', options: [{ value: 'ALL', label: 'Todas' }, { value: 'ALTA', label: 'Alta' }, { value: 'MEDIA', label: 'Media' }, { value: 'BAJA', label: 'Baja' }] }
  ];
  override highlights = [
    { title: 'Canales activos', value: '4', help: 'Bolsa pública, LinkedIn, referidos y web institucional.' },
    { title: 'Jefaturas involucradas', value: '6', help: 'Responsables validando perfiles y cierre de vacantes.' },
    { title: 'SLA de contratación', value: '85%', help: 'Vacantes cubiertas dentro del tiempo objetivo.' }
  ];
  override tableColumns = [{ key: 'cargo', label: 'Cargo' }, { key: 'area', label: 'Área' }, { key: 'estado', label: 'Estado' }, { key: 'dias', label: 'Dias abierta' }, { key: 'postulados', label: 'Postulados' }];
  override tableRows = [
    { cargo: 'Analista de TH', area: 'Administración', estado: 'ABIERTA', dias: '18', postulados: '23' },
    { cargo: 'Técnico de mantenimiento', area: 'Operaciones', estado: 'EN_PROCESO', dias: '31', postulados: '14' },
    { cargo: 'Asistente comercial', area: 'Comercial', estado: 'ABIERTA', dias: '11', postulados: '19' },
    { cargo: 'Inspector de campo', area: 'Operaciones', estado: 'CUBIERTA', dias: '26', postulados: '12' }
  ];
}
