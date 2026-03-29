import { Component } from '@angular/core';
import { RrhhSectionPageBase } from '../shared/rrhh-section-page.base';

@Component({
  selector: 'app-th-payroll',
  templateUrl: '../shared/rrhh-section-page.template.html',
  styleUrls: ['../shared/rrhh-section-page.styles.css']
})
export class ThPayrollComponent extends RrhhSectionPageBase {
  override title = 'Nómina';
  override subtitle = 'Sueldos, deducciones, horas extra y costo laboral mensual';
  override sectionName = 'Compensación y Beneficios';
  override pageIcon = 'bi bi-receipt-cutoff';
  override tableTitle = 'Resumen de nómina';
  override tableSubtitle = 'Consolidado por área y centro de costo';
  override summaryCards = [
    { label: 'Nomina mensual', value: '$84,320.00', help: 'Costo total estimado del periodo', tone: 'muted', icon: 'bi bi-wallet2' },
    { label: 'Horas extra', value: '146 h', help: 'Acumulado del mes en revisión', tone: 'warning', icon: 'bi bi-clock-history' },
    { label: 'Bonificaciones', value: '$6,420.00', help: 'Pagos variables e incentivos', tone: 'success', icon: 'bi bi-cash-stack' },
    { label: 'Costo / ingresos', value: '18.7%', help: 'Participación de nómina sobre ingresos', tone: 'primary', icon: 'bi bi-graph-up' }
  ];
  override alerts = [{ tone: 'warning', title: 'Horas extra altas', message: 'Operaciones supera el promedio mensual de horas complementarias.' }];
  override filters = [
    { label: 'Periodo', value: 'MARZO', options: [{ value: 'MARZO', label: 'Marzo' }, { value: 'FEBRERO', label: 'Febrero' }, { value: 'ENERO', label: 'Enero' }] },
    { label: 'Área', value: 'ALL', options: [{ value: 'ALL', label: 'Todas' }, { value: 'OPERACIONES', label: 'Operaciones' }, { value: 'COMERCIAL', label: 'Comercial' }, { value: 'ADMIN', label: 'Administración' }] }
  ];
  override highlights = [
    { title: 'Empleados procesados', value: '71', help: 'Nómina corrida y validada en el periodo.' },
    { title: 'Deducción promedio', value: '$132.00', help: 'Promedio de retenciones por colaborador.' },
    { title: 'Variación mensual', value: '+4.2%', help: 'Comparación frente al periodo anterior.' }
  ];
  override tableColumns = [{ key: 'area', label: 'Área' }, { key: 'empleados', label: 'Empleados' }, { key: 'salarios', label: 'Sueldos' }, { key: 'extras', label: 'Horas extra' }, { key: 'total', label: 'Total' }];
  override tableRows = [
    { area: 'Operaciones', empleados: '28', salarios: '$31,400.00', extras: '$3,210.00', total: '$36,940.00' },
    { area: 'Comercial', empleados: '19', salarios: '$20,820.00', extras: '$880.00', total: '$23,050.00' },
    { area: 'Administración', empleados: '24', salarios: '$21,500.00', extras: '$410.00', total: '$24,330.00' }
  ];
}
