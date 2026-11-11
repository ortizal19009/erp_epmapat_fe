import { jerarquiaPresupuesto } from './presupuesto-jerarquia';
import { columnasPresupuesto, totalesPresupuesto } from './presupuesto-columnas';

describe('Columnas de cedula presupuestaria', () => {
  it('calcula gastos y los tres saldos contra codificado', () => {
    const p = columnasPresupuesto({ inicia: 583320, totmod: 0, ejecCompromiso: 426180.83, ejecDevengado: 426180.83, ejecCobpagado: 426180.83 });
    expect(p.codificado).toBe(583320); expect(p.saldoCompromiso).toBe(157139.17);
    expect(p.saldoDevengado).toBe(157139.17); expect(p.saldoCobpagado).toBe(157139.17);
  });
  it('conserva saldos negativos y no usa devengado menos cobrado como saldo', () => {
    const p = columnasPresupuesto({ inicia: '100.10', totmod: '-20', ejecCompromiso: 0, ejecDevengado: '127.60', ejecCobpagado: 40 });
    expect(p.codificado).toBe(80.10); expect(p.saldoDevengado).toBe(-47.50); expect(p.saldoCobpagado).toBe(40.10);
  });
  it('suma cada columna sin perder centavos', () => {
    const filas = [0.1, 0.2].map(inicia => columnasPresupuesto({ inicia, totmod: 0, ejecCompromiso: 0, ejecDevengado: 0, ejecCobpagado: 0 }));
    expect(totalesPresupuesto(filas).codificado).toBe(.3); expect(totalesPresupuesto(filas).saldoCobpagado).toBe(.3);
  });
  it('no muestra cero como si fuese un dato real cuando falta la ejecucion', () => {
    const p = columnasPresupuesto({ inicia: 100, totmod: 20 });
    expect(p.codificado).toBe(120); expect(p.compromiso).toBeNull(); expect(p.saldoDevengado).toBeNull();
  });
  it('conserva datos parciales y no suma totales incompletos', () => {
    const parcial = columnasPresupuesto({ inicia: 100, totmod: 0, ejecDevengado: 30 });
    const completa = columnasPresupuesto({ inicia: 50, totmod: 0, ejecCompromiso: 10, ejecDevengado: 20, ejecCobpagado: 5 });
    const total = totalesPresupuesto([parcial, completa]);
    expect(total.codificado).toBe(150); expect(total.devengado).toBe(50);
    expect(total.saldoDevengado).toBe(100); expect(total.compromiso).toBeNull(); expect(total.saldoCobpagado).toBeNull();
  });
});

describe('Jerarquia de presupuesto', () => {
  const catalogo = [
    { codpar: '5', nompar: 'EGRESOS CORRIENTES' },
    { codpar: '51', nompar: 'EGRESOS EN PERSONAL' },
    { codpar: '51.01', nompar: 'Remuneraciones Basicas' },
    { codpar: '51.01.05', nompar: 'Remuneraciones Unificadas' },
    { codpar: '51.01.05.001', nompar: 'Remuneraciones Unificadas' }
  ];
  const detalle = (codpar: string, inicia: number) => columnasPresupuesto({ intpre: inicia, codpar, nompar: 'Detalle', inicia, totmod: 10, ejecCompromiso: 30, ejecDevengado: 20, ejecCobpagado: 5 });
  it('muestra todos los niveles de gastos con subtotales sin duplicarlos', () => {
    const filas = jerarquiaPresupuesto([detalle('11.51.01.05.001.0', 100), detalle('11.51.01.05.002.0', 200)], 2, catalogo.filter(c => c.codpar !== '51.01.05.001'), [{ codigo: '11', nombre: 'ADMINISTRACION FINANCIERA' }]);
    expect(filas.map(p => p.codpar)).toEqual(['11', '11.5', '11.51', '11.51.01', '11.51.01.05', '11.51.01.05.001', '11.51.01.05.001.0', '11.51.01.05.002', '11.51.01.05.002.0']);
    const padre = filas[0];
    expect(padre.nompar).toBe('ADMINISTRACION FINANCIERA'); expect(padre.agrupadora).toBeTrue();
    expect(padre.inicia).toBe(300); expect(padre.codificado).toBe(320); expect(padre.compromiso).toBe(60); expect(padre.saldoCompromiso).toBe(260);
    expect(filas.filter(p => !p.agrupadora).length).toBe(2);
    expect(totalesPresupuesto(filas.filter(p => !p.agrupadora)).inicia).toBe(300);
  });
  it('ordena cada grupo inmediatamente antes de sus descendientes', () => {
    const filas = jerarquiaPresupuesto([detalle('11.51.01.05.001.0', 100), detalle('11.84.01.01.001.0', 200)], 2, [...catalogo, {codpar:'8',nompar:'Capital'}, {codpar:'84',nompar:'Bienes'}]);
    expect(filas.findIndex(p => p.codpar === '11.8')).toBeGreaterThan(filas.findIndex(p => p.codpar === '11.51.01.05.001.0'));
  });
  it('separa actividades aunque compartan clasificador', () => {
    const filas = jerarquiaPresupuesto([detalle('11.51.01.05.001.0', 100), detalle('12.51.01.05.001.0', 200)], 2, catalogo);
    expect(filas.find(p => p.codpar === '11.51').inicia).toBe(100);
    expect(filas.find(p => p.codpar === '12.51').inicia).toBe(200);
  });
  it('agrupa ingresos desde su naturaleza sin agregar una actividad funcional', () => {
    const filas = jerarquiaPresupuesto([detalle('11.02.04.01.01', 100)], 1, [{codpar: '1', nompar: 'INGRESOS CORRIENTES'}, {codpar:'11',nompar:'IMPUESTOS'}, {codpar:'11.02',nompar:'Sobre la Propiedad'}, {codpar:'11.02.04.01.01',nompar:'Detalle'}]);
    expect(filas.map(p => p.codpar)).toEqual(['1', '11', '11.02', '11.02.04', '11.02.04.01', '11.02.04.01.01']);
    expect(filas[0].devengado).toBe(20); expect(filas[5].agrupadora).toBeFalse();
  });
  it('los subtotales no convierten ejecucion ausente en cero', () => {
    const filas = jerarquiaPresupuesto([columnasPresupuesto({codpar:'11.51.01.05.001.0',inicia:100})], 2, catalogo);
    expect(filas[0].inicia).toBe(100); expect(filas[0].compromiso).toBeNull(); expect(filas[0].saldoDevengado).toBeNull();
  });
});
