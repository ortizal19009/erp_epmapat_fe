// La cuenta del tramite es el idabonado. El medidor y la cuenta del vecino son datos distintos.
export function cuentaRealTramite(tramite: any): string {
  const fuentes = [tramite, tramite?.idaguatramite_aguatramite,
    tramite?.idtramitenuevo_tramitenuevo?.idaguatramite_aguatramite, tramite?.idtramitenuevo_tramitenuevo];
  for (const fuente of fuentes) {
    const candidatos = [fuente?.idabonado, fuente?.idabonado_abonados?.idabonado, fuente?.abonado?.idabonado];
    for (const candidato of candidatos) {
      if (typeof candidato !== 'number' && typeof candidato !== 'string') continue;
      if (typeof candidato === 'string' && !/^[0-9]+$/.test(candidato.trim())) continue;
      const id = Number(candidato);
      if (Number.isSafeInteger(id) && id > 0) return String(id);
    }
  }
  return '';
}
