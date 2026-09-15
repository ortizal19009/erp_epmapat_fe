import { distribuirRubros } from './convenio-montos';
describe('Distribucion de cuotas y rubros', () => {
  it('conserva cada cuota y cada rubro en centavos', () => {
    for (let n = 1; n <= 1000; n++) {
      const cuotas = [n, 17, 33], rubros = [13, n + 37];
      const valores = distribuirRubros(cuotas.map(x => x / 100), rubros.map(x => x / 100));
      valores.forEach((fila, i) => expect(fila.reduce((s, x) => s + Math.round(x * 100), 0)).toBe(cuotas[i]));
      rubros.forEach((valor, j) => expect(valores.reduce((s, fila) => s + Math.round(fila[j] * 100), 0)).toBe(valor));
    }
  });
  it('rechaza diferencias e importes invalidos', () => {
    expect(() => distribuirRubros([1], [2])).toThrow();
    expect(() => distribuirRubros([-1], [-1])).toThrow();
  });
});
