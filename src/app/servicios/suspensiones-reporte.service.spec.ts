import { SuspensionesReporteService } from './suspensiones-reporte.service';
describe('Reportes de suspensiones', () => {
  it('exporta cuentas reales, origen y cantidades numericas en un archivo Excel valido', async () => {
    const servicio = new SuspensionesReporteService();
    const libro = servicio.crearExcel('Suspensiones', [{numero: 15, fecha: '2026-10-28', tipo: 3,
      cuentasAfectadas: [101, 102], total: 999, idsuspension_origen: {numero: 14}, observa: '=texto'}], 'Desde 2026-01-01');
    const hoja = libro.worksheets[0];
    expect(hoja.getCell('D5').value).toBe(2);
    expect(hoja.getCell('E5').value).toBe('101, 102');
    expect(hoja.getCell('H5').value).toBe(14);
    expect(hoja.getCell('I5').value).toBe('=texto');
    const buffer = await libro.xlsx.writeBuffer();
    const copia = new (libro.constructor as any)();
    await copia.xlsx.load(buffer);
    expect(copia.worksheets[0].getCell('E5').value).toBe('101, 102');
  });
});
