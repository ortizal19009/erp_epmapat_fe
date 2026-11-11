export interface ColumnasPresupuesto {
  inicia: number; totmod: number; codificado: number; compromiso: number | null;
  devengado: number | null; cobpagado: number | null; saldoCompromiso: number | null; saldoDevengado: number | null; saldoCobpagado: number | null;
}
const moneda = (v: any): number => {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) throw new Error('Importe presupuestario invalido');
  return Math.round((n + Number.EPSILON) * 100) / 100;
};
export function columnasPresupuesto<T>(partida: T): T & ColumnasPresupuesto {
  const p: any = partida;
  const ejecucion = (v: any): number | null => v == null ? null : moneda(v);
  const inicia = moneda(p.inicia), totmod = moneda(p.totmod);
  const codificado = moneda(inicia + totmod);
  const compromiso = ejecucion(p.ejecCompromiso), devengado = ejecucion(p.ejecDevengado), cobpagado = ejecucion(p.ejecCobpagado);
  return { ...partida, inicia, totmod, codificado, compromiso, devengado, cobpagado,
    saldoCompromiso: compromiso == null ? null : moneda(codificado - compromiso), saldoDevengado: devengado == null ? null : moneda(codificado - devengado), saldoCobpagado: cobpagado == null ? null : moneda(codificado - cobpagado) };
}
export function totalesPresupuesto(partidas: ColumnasPresupuesto[]): ColumnasPresupuesto {
  const total: ColumnasPresupuesto = { inicia: 0, totmod: 0, codificado: 0, compromiso: 0, devengado: 0, cobpagado: 0,
    saldoCompromiso: 0, saldoDevengado: 0, saldoCobpagado: 0 };
  for (const p of partidas) {
    for (const campo of ['inicia', 'totmod', 'codificado'] as const) total[campo] = moneda(total[campo] + p[campo]);
    for (const campo of ['compromiso', 'devengado', 'cobpagado', 'saldoCompromiso', 'saldoDevengado', 'saldoCobpagado'] as const)
      total[campo] = total[campo] == null || p[campo] == null ? null : moneda(total[campo]! + p[campo]!);
  }
  return total;
}
