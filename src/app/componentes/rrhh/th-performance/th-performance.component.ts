import { Component } from '@angular/core';
import { RrhhSectionPageBase } from '../shared/rrhh-section-page.base';

@Component({
  selector: 'app-th-performance',
  templateUrl: '../shared/rrhh-section-page.template.html',
  styleUrls: ['../shared/rrhh-section-page.styles.css']
})
export class ThPerformanceComponent extends RrhhSectionPageBase {
  override title = 'Evaluación de Desempeño';
  override subtitle = 'Resultados por área, cumplimiento de metas y seguimiento individual';
  override sectionName = 'Desarrollo y Capacitación';
  override pageIcon = 'bi bi-clipboard-data-fill';
  override tableTitle = 'Matriz de evaluación';
  override tableSubtitle = 'Consolidado de resultados y retroalimentación';
  override summaryCards = [
    { label: 'Evaluaciones cerradas', value: '38', help: 'Procesos concluidos en el ciclo actual', tone: 'success', icon: 'bi bi-check2-square' },
    { label: 'Promedio general', value: '86/100', help: 'Desempeño consolidado institucional', tone: 'info', icon: 'bi bi-bar-chart-fill' },
    { label: 'Planes de mejora', value: '7', help: 'Colaboradores con seguimiento reforzado', tone: 'warning', icon: 'bi bi-graph-down-arrow' },
    { label: 'Áreas evaluadas', value: '5', help: 'Cobertura del proceso de desempeño', tone: 'primary', icon: 'bi bi-diagram-3-fill' }
  ];
  override alerts = [{ tone: 'info', title: 'Ciclo en curso', message: 'Se requiere completar retroalimentación en dos jefaturas antes del cierre.' }];
  override filters = [
    { label: 'Ciclo', value: '2026', options: [{ value: '2026', label: '2026' }, { value: '2025', label: '2025' }] },
    { label: 'Resultado', value: 'ALL', options: [{ value: 'ALL', label: 'Todos' }, { value: 'ALTO', label: 'Alto' }, { value: 'MEDIO', label: 'Medio' }, { value: 'MEJORA', label: 'Requiere mejora' }] }
  ];
  override highlights = [
    { title: 'Meta cumplida', value: '81%', help: 'Colaboradores dentro o por encima del objetivo.' },
    { title: 'Feedback entregado', value: '92%', help: 'Evaluaciones con retroalimentación formal registrada.' },
    { title: 'Talento clave', value: '9', help: 'Colaboradores con alto potencial identificados.' }
  ];
  override tableColumns = [{ key: 'area', label: 'Área' }, { key: 'promedio', label: 'Promedio' }, { key: 'evaluados', label: 'Evaluados' }, { key: 'planes', label: 'Planes mejora' }, { key: 'estado', label: 'Estado' }];
  override tableRows = [
    { area: 'Operaciones', promedio: '84/100', evaluados: '14', planes: '3', estado: 'EN CURSO' },
    { area: 'Comercial', promedio: '88/100', evaluados: '9', planes: '1', estado: 'CERRADO' },
    { area: 'Administración', promedio: '90/100', evaluados: '7', planes: '1', estado: 'CERRADO' }
  ];
}
