import { Component } from '@angular/core';
import { RrhhSectionPageBase } from '../shared/rrhh-section-page.base';

@Component({
  selector: 'app-th-training',
  templateUrl: '../shared/rrhh-section-page.template.html',
  styleUrls: ['../shared/rrhh-section-page.styles.css']
})
export class ThTrainingComponent extends RrhhSectionPageBase {
  override title = 'Planes de Formación';
  override subtitle = 'Cursos, certificaciones y desarrollo de capacidades del personal';
  override sectionName = 'Desarrollo y Capacitación';
  override pageIcon = 'bi bi-journal-bookmark-fill';
  override tableTitle = 'Plan anual de capacitación';
  override tableSubtitle = 'Ejecución por área y modalidad';
  override summaryCards = [
    { label: 'Cursos activos', value: '9', help: 'Programas internos y externos en ejecución', tone: 'info', icon: 'bi bi-journal-richtext' },
    { label: 'Horas impartidas', value: '168 h', help: 'Capacitación acumulada del trimestre', tone: 'success', icon: 'bi bi-clock-fill' },
    { label: 'Cobertura', value: '74%', help: 'Empleados capacitados en el último trimestre', tone: 'warning', icon: 'bi bi-people-fill' },
    { label: 'Certificaciones', value: '12', help: 'Acreditaciones o constancias emitidas', tone: 'primary', icon: 'bi bi-patch-check-fill' }
  ];
  override alerts = [{ tone: 'warning', title: 'Brecha técnica', message: 'Operaciones requiere reforzar formación en seguridad y mantenimiento.' }];
  override filters = [
    { label: 'Modalidad', value: 'ALL', options: [{ value: 'ALL', label: 'Todas' }, { value: 'INTERNA', label: 'Interna' }, { value: 'EXTERNA', label: 'Externa' }, { value: 'CERTIFICACION', label: 'Certificación' }] },
    { label: 'Área', value: 'ALL', options: [{ value: 'ALL', label: 'Todas' }, { value: 'TH', label: 'TH' }, { value: 'OPERACIONES', label: 'Operaciones' }, { value: 'COMERCIAL', label: 'Comercial' }] }
  ];
  override highlights = [
    { title: 'Horas por empleado', value: '6.4 h', help: 'Promedio trimestral de formación recibida.' },
    { title: 'Presupuesto ejecutado', value: '68%', help: 'Uso del presupuesto anual de capacitación.' },
    { title: 'Cursos críticos', value: '3', help: 'Programas vinculados a cumplimiento y riesgos.' }
  ];
  override tableColumns = [{ key: 'programa', label: 'Programa' }, { key: 'area', label: 'Área' }, { key: 'modalidad', label: 'Modalidad' }, { key: 'participantes', label: 'Participantes' }, { key: 'avance', label: 'Avance' }];
  override tableRows = [
    { programa: 'Seguridad ocupacional', area: 'Operaciones', modalidad: 'INTERNA', participantes: '18', avance: '82%' },
    { programa: 'Excelencia en servicio', area: 'Comercial', modalidad: 'EXTERNA', participantes: '11', avance: '65%' },
    { programa: 'Actualización legal TH', area: 'TH', modalidad: 'CERTIFICACIÓN', participantes: '6', avance: '90%' }
  ];
}
