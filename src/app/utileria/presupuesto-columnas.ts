export interface ColumnasPresupuesto {
  inicia: number; totmod: number; codificado: number; compromiso: number;
  devengado: number; cobpagado: number; saldoCompromiso: number; saldoDevengado: number; saldoCobpagado: number;
}
const moneda = (v: any): number => {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) throw new Error('Importe presupuestario invalido');
  return Math.round((n + Number.EPSILON) * 100) / 100;
};
export function columnasPresupuesto<T>(partida: T): T & ColumnasPresupuesto {
  const p: any = partida;
  if (p.ejecCompromiso == null || p.ejecDevengado == null || p.ejecCobpagado == null) throw new Error('Falta ejecucion de la partida');
  const inicia = moneda(p.inicia), totmod = moneda(p.totmod);
  const codificado = moneda(inicia + totmod);
  const compromiso = moneda(p.ejecCompromiso), devengado = moneda(p.ejecDevengado), cobpagado = moneda(p.ejecCobpagado);
  return { ...partida, inicia, totmod, codificado, compromiso, devengado, cobpagado,
    saldoCompromiso: moneda(codificado - compromiso), saldoDevengado: moneda(codificado - devengado), saldoCobpagado: moneda(codificado - cobpagado) };
}
export function totalesPresupuesto(partidas: ColumnasPresupuesto[]): ColumnasPresupuesto {
  const total = { inicia: 0, totmod: 0, codificado: 0, compromiso: 0, devengado: 0, cobpagado: 0,
    saldoCompromiso: 0, saldoDevengado: 0, saldoCobpagado: 0 };
  for (const p of partidas) for (const campo of Object.keys(total) as (keyof ColumnasPresupuesto)[]) total[campo] = moneda(total[campo] + p[campo]);
  return total;
}
