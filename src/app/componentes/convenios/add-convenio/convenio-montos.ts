/** Distributes cents while preserving both installment and rubro totals. */
export function distribuirRubros(cuotas: number[], rubros: number[]): number[][] {
  const centavos = (n: number) => {
    if (!Number.isFinite(n) || n < 0) throw new Error('Importe invalido');
    return Math.round(n * 100);
  };
  const filas = cuotas.map(centavos);
  const restantes = rubros.map(centavos);
  let saldo = restantes.reduce((a, b) => a + b, 0);
  if (filas.reduce((a, b) => a + b, 0) !== saldo || saldo <= 0) {
    throw new Error('La suma de rubros no coincide con las cuotas del convenio. Revise los valores antes de guardar.');
  }
  return filas.map(cuota => {
    const exactos = restantes.map(valor => saldo ? cuota * valor / saldo : 0);
    const valores = exactos.map(Math.floor);
    let faltan = cuota - valores.reduce((a, b) => a + b, 0);
    const orden = exactos.map((valor, i) => ({ i, resto: valor - valores[i] }))
      .sort((a, b) => b.resto - a.resto || a.i - b.i);
    for (const { i } of orden) {
      if (faltan > 0 && valores[i] < restantes[i]) { valores[i]++; faltan--; }
    }
    if (faltan !== 0) throw new Error('No se pudo distribuir el importe del convenio');
    valores.forEach((valor, i) => restantes[i] -= valor);
    saldo -= cuota;
    return valores.map(valor => valor / 100);
  });
}
