import { Component } from '@angular/core';
import { RrhhSectionPageBase } from '../shared/rrhh-section-page.base';

@Component({
  selector: 'app-th-benefits',
  templateUrl: '../shared/rrhh-section-page.template.html',
  styleUrls: ['../shared/rrhh-section-page.styles.css']
})
export class ThBenefitsComponent extends RrhhSectionPageBase {
  override title = 'Beneficios Sociales';
  override subtitle = 'Seguro, alimentación, transporte y cobertura de beneficios al personal';
  override sectionName = 'Compensación y Beneficios';
  override pageIcon = 'bi bi-heart-pulse-fill';
  override tableTitle = 'Matriz de beneficios';
  override tableSubtitle = 'Cobertura institucional por tipo de beneficio';
  override summaryCards = [
    { label: 'Cobertura médica', value: '92%', help: 'Empleados con plan vigente', tone: 'success', icon: 'bi bi-shield-plus' },
    { label: 'Alimentación', value: '58', help: 'Beneficiarios activos del subsidio', tone: 'info', icon: 'bi bi-cup-hot-fill' },
    { label: 'Transporte', value: '24', help: 'Colaboradores con apoyo movilización', tone: 'warning', icon: 'bi bi-bus-front-fill' },
    { label: 'Costo mensual', value: '$9,850.00', help: 'Inversión total en beneficios', tone: 'primary', icon: 'bi bi-piggy-bank-fill' }
  ];
  override alerts = [{ tone: 'info', title: 'Cobertura estable', message: 'Los beneficios principales mantienen altos niveles de adopción.' }];
  override filters = [{ label: 'Beneficio', value: 'ALL', options: [{ value: 'ALL', label: 'Todos' }, { value: 'MEDICO', label: 'Seguro médico' }, { value: 'ALIMENTACION', label: 'Alimentación' }, { value: 'TRANSPORTE', label: 'Transporte' }] }];
  override highlights = [
    { title: 'Participación total', value: '81%', help: 'Promedio de utilización de beneficios institucionales.' },
    { title: 'Nuevos ingresos cubiertos', value: '100%', help: 'Ingresos del trimestre con beneficios asignados.' },
    { title: 'Revisión próxima', value: 'Abril', help: 'Mes previsto para renegociación de proveedor médico.' }
  ];
  override tableColumns = [{ key: 'beneficio', label: 'Beneficio' }, { key: 'cobertura', label: 'Cobertura' }, { key: 'beneficiarios', label: 'Beneficiarios' }, { key: 'costo', label: 'Costo' }, { key: 'estado', label: 'Estado' }];
  override tableRows = [
    { beneficio: 'Seguro médico', cobertura: '92%', beneficiarios: '65', costo: '$6,200.00', estado: 'VIGENTE' },
    { beneficio: 'Alimentación', cobertura: '82%', beneficiarios: '58', costo: '$2,150.00', estado: 'VIGENTE' },
    { beneficio: 'Transporte', cobertura: '34%', beneficiarios: '24', costo: '$1,500.00', estado: 'REVISIÓN' }
  ];
}
