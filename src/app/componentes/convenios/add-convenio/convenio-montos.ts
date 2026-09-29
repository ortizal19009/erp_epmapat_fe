/** Round money once, compensating only for binary floating-point precision. */
export function aCentavos(valor: number): number {
  if (!Number.isFinite(valor) || valor < 0) throw new Error('Importe invalido');
  const escalado = valor * 100;
  return Math.round(escalado + Number.EPSILON * Math.max(1, Math.abs(escalado)));
}

/** Distributes cents while preserving both installment and rubro totals. */
export function distribuirRubros(cuotas: number[], rubros: number[]): number[][] {
  const filas = cuotas.map(aCentavos);
  const restantes = rubros.map(aCentavos);
  let saldo = restantes.reduce((a, b) => a + b, 0);
  if (filas.reduce((a, b) => a + b, 0) !== saldo || saldo <= 0) {
    const totalCuotas = filas.reduce((a, b) => a + b, 0);
    throw new Error(`Total de rubros: $${(saldo / 100).toFixed(2)}. Total de cuotas: $${(totalCuotas / 100).toFixed(2)}. Diferencia (rubros - cuotas): $${((saldo - totalCuotas) / 100).toFixed(2)}. Revise los valores antes de guardar.`);
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
