// Reglas compartidas por el análisis de ruta y de emisión.
export class AnalisisLecturas {
  getConsumo(lectura: any): number {
    return Number(lectura?.lecturaactual || 0) - Number(lectura?.lecturaanterior || 0);
  }

  hasNegativeConsumption(lectura: any): boolean {
    return this.getConsumo(lectura) < 0;
  }

  hasHighConsumptionVsAverage(lectura: any): boolean {
    const consumo = this.getConsumo(lectura);
    const promedio = Number(lectura?.idabonado_abonados?.promedio || 0);

    if (consumo < 0 || promedio <= 0) return false;

    return consumo > promedio * 2;
  }

  isResidentialHighConsumption(lectura: any): boolean {
    const consumo = this.getConsumo(lectura);
    if (consumo <= 70) return false;

    const descripcion = String(
      lectura?.idabonado_abonados?.idcategoria_categorias?.descripcion || ''
    ).toLowerCase();
    const idcategoria = Number(
      lectura?.idabonado_abonados?.idcategoria_categorias?.idcategoria || 0
    );

    return descripcion.includes('resid') || idcategoria === 1;
  }

  isSpecialAdultoMayorHighConsumption(lectura: any): boolean {
    const consumo = this.getConsumo(lectura);
    const adultomayor = !!lectura?.idabonado_abonados?.adultomayor;
    const descripcion = String(
      lectura?.idabonado_abonados?.idcategoria_categorias?.descripcion || ''
    ).toLowerCase();
    const idcategoria = Number(
      lectura?.idabonado_abonados?.idcategoria_categorias?.idcategoria || 0
    );
    const esEspecial = descripcion.includes('especial') || idcategoria === 9;

    return adultomayor && esEspecial && consumo > 34;
  }

}
export const analisisLecturas = new AnalisisLecturas();
