import { Component } from '@angular/core';
import { RrhhSectionPageBase } from '../shared/rrhh-section-page.base';

@Component({
  selector: 'app-th-incentives',
  templateUrl: '../shared/rrhh-section-page.template.html',
  styleUrls: ['../shared/rrhh-section-page.styles.css']
})
export class ThIncentivesComponent extends RrhhSectionPageBase {
  override title = 'Incentivos y Reconocimientos';
  override subtitle = 'Bonificaciones, premios de desempeño y reconocimientos institucionales';
  override sectionName = 'Compensación y Beneficios';
  override pageIcon = 'bi bi-award-fill';
  override tableTitle = 'Reconocimientos vigentes';
  override tableSubtitle = 'Seguimiento de premios y estímulos por desempeño';
  override summaryCards = [
    { label: 'Bonos entregados', value: '$6,420.00', help: 'Monto acumulado del periodo', tone: 'success', icon: 'bi bi-cash-coin' },
    { label: 'Reconocimientos', value: '17', help: 'Distinciones formales otorgadas', tone: 'info', icon: 'bi bi-patch-check-fill' },
    { label: 'Áreas premiadas', value: '5', help: 'Cobertura institucional del programa', tone: 'warning', icon: 'bi bi-building-fill-check' },
    { label: 'Participación', value: '63%', help: 'Áreas con propuestas de reconocimiento', tone: 'primary', icon: 'bi bi-bar-chart-steps' }
  ];
  override alerts = [{ tone: 'success', title: 'Programa activo', message: 'Los incentivos están alineados con desempeño y bienestar.' }];
  override filters = [{ label: 'Tipo', value: 'ALL', options: [{ value: 'ALL', label: 'Todos' }, { value: 'BONO', label: 'Bono' }, { value: 'RECONOCIMIENTO', label: 'Reconocimiento' }, { value: 'EQUIPO', label: 'Equipo destacado' }] }];
  override highlights = [
    { title: 'Frecuencia', value: 'Mensual', help: 'Periodicidad del comité de reconocimientos.' },
    { title: 'Top área', value: 'Operaciones', help: 'Área con mayor número de estímulos acumulados.' },
    { title: 'Objetivo anual', value: '75%', help: 'Meta de cobertura del programa institucional.' }
  ];
  override tableColumns = [{ key: 'nombre', label: 'Reconocimiento' }, { key: 'tipo', label: 'Tipo' }, { key: 'area', label: 'Área' }, { key: 'monto', label: 'Monto' }, { key: 'fecha', label: 'Fecha' }];
  override tableRows = [
    { nombre: 'Empleado del mes', tipo: 'RECONOCIMIENTO', area: 'Comercial', monto: '-', fecha: '2026-03-15' },
    { nombre: 'Bono de productividad', tipo: 'BONO', area: 'Operaciones', monto: '$1,200.00', fecha: '2026-03-20' },
    { nombre: 'Equipo destacado', tipo: 'EQUIPO', area: 'TH', monto: '$850.00', fecha: '2026-03-25' }
  ];
}
