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
    expect(() => columnasPresupuesto({ inicia: 100, totmod: 0 })).toThrow();
  });
});
