import { Component } from '@angular/core';
import { RrhhSectionPageBase } from '../shared/rrhh-section-page.base';

@Component({
  selector: 'app-th-career',
  templateUrl: '../shared/rrhh-section-page.template.html',
  styleUrls: ['../shared/rrhh-section-page.styles.css']
})
export class ThCareerComponent extends RrhhSectionPageBase {
  override title = 'Carrera y Sucesión';
  override subtitle = 'Planes de carrera, sucesión y reserva de talento institucional';
  override sectionName = 'Desarrollo y Capacitación';
  override pageIcon = 'bi bi-signpost-2-fill';
  override tableTitle = 'Rutas de crecimiento';
  override tableSubtitle = 'Seguimiento de talento con potencial de desarrollo';
  override summaryCards = [
    { label: 'Planes activos', value: '11', help: 'Colaboradores con ruta de carrera formalizada', tone: 'info', icon: 'bi bi-map-fill' },
    { label: 'Sucesiones críticas', value: '4', help: 'Posiciones con reemplazo identificado', tone: 'warning', icon: 'bi bi-person-lines-fill' },
    { label: 'Movilidad interna', value: '3', help: 'Promociones o rotaciones planificadas', tone: 'success', icon: 'bi bi-arrow-left-right' },
    { label: 'Talento alto potencial', value: '9', help: 'Reserva para liderazgo y continuidad', tone: 'primary', icon: 'bi bi-stars' }
  ];
  override alerts = [{ tone: 'warning', title: 'Riesgo de sucesión', message: 'Dos roles críticos aún no tienen reemplazo formal documentado.' }];
  override filters = [{ label: 'Nivel', value: 'ALL', options: [{ value: 'ALL', label: 'Todos' }, { value: 'OPERATIVO', label: 'Operativo' }, { value: 'MANDO_MEDIO', label: 'Mando medio' }, { value: 'LIDERAZGO', label: 'Liderazgo' }] }];
  override highlights = [
    { title: 'Cobertura sucesoria', value: '67%', help: 'Cargos críticos con sucesor identificado.' },
    { title: 'Promoción interna', value: '21%', help: 'Cobertura de vacantes desde talento interno.' },
    { title: 'Planes por cerrar', value: '2', help: 'Definiciones pendientes de comité de talento.' }
  ];
  override tableColumns = [{ key: 'colaborador', label: 'Colaborador' }, { key: 'cargoActual', label: 'Cargo actual' }, { key: 'ruta', label: 'Ruta' }, { key: 'potencial', label: 'Potencial' }, { key: 'estado', label: 'Estado' }];
  override tableRows = [
    { colaborador: 'Patricia Mora', cargoActual: 'Analista TH', ruta: 'Coordinación TH', potencial: 'ALTO', estado: 'ACTIVO' },
    { colaborador: 'Luis Burbano', cargoActual: 'Inspector', ruta: 'Supervisor campo', potencial: 'MEDIO', estado: 'EN EVALUACIÓN' },
    { colaborador: 'Andrea Ponce', cargoActual: 'Asistente comercial', ruta: 'Analista comercial', potencial: 'ALTO', estado: 'ACTIVO' }
  ];
}
