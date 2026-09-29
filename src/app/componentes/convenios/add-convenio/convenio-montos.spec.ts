import { aCentavos, distribuirRubros } from './convenio-montos';
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

describe('Redondeo monetario del convenio', () => {
  it('redondea medios centavos igual que los rubros de la consulta', () => {
    expect(aCentavos(1.005)).toBe(101);
    expect(aCentavos(2.005)).toBe(201);
    expect(aCentavos(1.0049)).toBe(100);
    expect(aCentavos(0.1 + 0.2)).toBe(30);
  });
  it('conserva el total de intereses redondeados por factura', () => {
    const interes = [0.005, 0.005].reduce((s, n) => s + aCentavos(n), 0);
    expect(interes).toBe(2);
    expect(distribuirRubros([0.01, 0.01], [interes / 100])).toEqual([[0.01], [0.01]]);
  });
  it('indica los totales y la diferencia sin ocultar un descuadre real', () => {
    expect(() => distribuirRubros([10], [9.99])).toThrowError(/rubros: \$9.99.*cuotas: \$10.00.*\$-0.01/);
  });
});
