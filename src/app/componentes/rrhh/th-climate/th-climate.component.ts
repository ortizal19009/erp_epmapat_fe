import { Component } from '@angular/core';
import { RrhhSectionPageBase } from '../shared/rrhh-section-page.base';

@Component({
  selector: 'app-th-climate',
  templateUrl: '../shared/rrhh-section-page.template.html',
  styleUrls: ['../shared/rrhh-section-page.styles.css']
})
export class ThClimateComponent extends RrhhSectionPageBase {
  override title = 'Clima Laboral y Encuestas';
  override subtitle = 'Satisfacción, percepción interna y seguimiento del clima organizacional';
  override sectionName = 'Bienestar y Cultura';
  override pageIcon = 'bi bi-bar-chart-line-fill';
  override tableTitle = 'Resultados de clima';
  override tableSubtitle = 'Indicadores de satisfacción por área y dimensión';
  override summaryCards = [
    { label: 'Satisfacción general', value: '88%', help: 'Índice consolidado institucional', tone: 'success', icon: 'bi bi-emoji-smile-fill' },
    { label: 'Participación', value: '79%', help: 'Colaboradores que respondieron encuesta', tone: 'info', icon: 'bi bi-ui-checks' },
    { label: 'Hallazgos críticos', value: '3', help: 'Temas que requieren plan de acción', tone: 'warning', icon: 'bi bi-exclamation-diamond-fill' },
    { label: 'Áreas evaluadas', value: '5', help: 'Cobertura de la medición actual', tone: 'primary', icon: 'bi bi-diagram-2-fill' }
  ];
  override alerts = [{ tone: 'warning', title: 'Seguimiento requerido', message: 'Carga laboral y comunicación interna muestran variaciones negativas.' }];
  override filters = [{ label: 'Encuesta', value: '2026Q1', options: [{ value: '2026Q1', label: '2026 Q1' }, { value: '2025Q4', label: '2025 Q4' }] }];
  override highlights = [
    { title: 'Mejor dimensión', value: 'Liderazgo', help: 'Mayor valoración dentro del clima laboral.' },
    { title: 'Dimensión crítica', value: 'Carga laboral', help: 'Tema con menor puntuación y mayor prioridad.' },
    { title: 'Planes abiertos', value: '4', help: 'Acciones correctivas en seguimiento.' }
  ];
  override tableColumns = [{ key: 'area', label: 'Área' }, { key: 'satisfaccion', label: 'Satisfacción' }, { key: 'participacion', label: 'Participación' }, { key: 'dimension', label: 'Dimensión crítica' }, { key: 'estado', label: 'Estado' }];
  override tableRows = [
    { area: 'Operaciones', satisfaccion: '83%', participacion: '74%', dimension: 'Carga laboral', estado: 'SEGUIMIENTO' },
    { area: 'Comercial', satisfaccion: '89%', participacion: '81%', dimension: 'Comunicación', estado: 'CONTROLADO' },
    { area: 'Administración', satisfaccion: '91%', participacion: '84%', dimension: 'Reconocimiento', estado: 'ESTABLE' }
  ];
}
