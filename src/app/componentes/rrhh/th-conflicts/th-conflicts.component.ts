import { Component } from '@angular/core';
import { RrhhSectionPageBase } from '../shared/rrhh-section-page.base';

@Component({
  selector: 'app-th-conflicts',
  templateUrl: '../shared/rrhh-section-page.template.html',
  styleUrls: ['../shared/rrhh-section-page.styles.css']
})
export class ThConflictsComponent extends RrhhSectionPageBase {
  override title = 'Conflictos y Mediación';
  override subtitle = 'Casos reportados, seguimiento y resolución de conflictos laborales';
  override sectionName = 'Bienestar y Cultura';
  override pageIcon = 'bi bi-people-fill';
  override tableTitle = 'Casos de mediación';
  override tableSubtitle = 'Control de incidentes, estado y tiempos de cierre';
  override summaryCards = [
    { label: 'Casos reportados', value: '9', help: 'Incidentes del periodo actual', tone: 'warning', icon: 'bi bi-flag-fill' },
    { label: 'Resueltos', value: '7', help: 'Casos cerrados con mediación o acuerdo', tone: 'success', icon: 'bi bi-check2-circle' },
    { label: 'Escalados', value: '2', help: 'Procesos derivados a instancias superiores', tone: 'danger', icon: 'bi bi-arrow-up-right-circle-fill' },
    { label: 'Tiempo medio', value: '5 dias', help: 'Promedio de resolución de conflictos', tone: 'primary', icon: 'bi bi-stopwatch-fill' }
  ];
  override alerts = [{ tone: 'info', title: 'Riesgo controlado', message: 'La mayoría de incidentes se resuelve en mediación temprana.' }];
  override filters = [{ label: 'Estado', value: 'ALL', options: [{ value: 'ALL', label: 'Todos' }, { value: 'ABIERTO', label: 'Abiertos' }, { value: 'MEDIACION', label: 'En mediación' }, { value: 'CERRADO', label: 'Cerrados' }] }];
  override highlights = [
    { title: 'Causa principal', value: 'Comunicación', help: 'Factor más frecuente en casos levantados.' },
    { title: 'Acuerdos firmados', value: '6', help: 'Casos con cierre formal documentado.' },
    { title: 'Casos reincidentes', value: '1', help: 'Seguimiento especial requerido.' }
  ];
  override tableColumns = [{ key: 'caso', label: 'Caso' }, { key: 'area', label: 'Área' }, { key: 'tipo', label: 'Tipo' }, { key: 'estado', label: 'Estado' }, { key: 'dias', label: 'Dias gestión' }];
  override tableRows = [
    { caso: 'MED-2026-004', area: 'Operaciones', tipo: 'Comunicación', estado: 'CERRADO', dias: '4' },
    { caso: 'MED-2026-006', area: 'Comercial', tipo: 'Convivencia', estado: 'MEDIACIÓN', dias: '6' },
    { caso: 'MED-2026-008', area: 'Administración', tipo: 'Liderazgo', estado: 'ABIERTO', dias: '2' }
  ];
}
