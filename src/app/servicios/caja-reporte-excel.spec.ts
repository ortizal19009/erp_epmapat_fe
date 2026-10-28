import { Workbook } from 'exceljs';
import { excelResumenCaja, excelPlanillasCaja, excelTransferenciasCaja, excelTransferenciasGlobalCaja, excelListaCajas, resumenCaja } from './caja-reporte-excel';
describe('Valores de Excel de caja', () => {
  async function recargar(libro: Workbook) {const copia=new Workbook();await copia.xlsx.load(await libro.xlsx.writeBuffer());return copia;}
  it('guarda total e IVA numericos y un total cacheado correcto al abrir sin recalcular', async () => {
    const datos=[{total:'100.10',iva:'15.02',0:{idfactura:1,nrofactura:'001-0001',idcliente:{nombre:'Uno'}}},
      {total:12.23,iva:null,0:{idfactura:2,nrofactura:'001-0002'}}];
    const hoja=(await recargar(excelPlanillasCaja(datos,'Planillas'))).worksheets[0];
    expect(hoja.getCell('G4').value).toBe(115.12);expect(hoja.getCell('G5').value).toBe(12.23);
    expect(hoja.getCell('G6').value).toEqual({formula:'SUM(G4:G5)',result:127.35});
    expect(hoja.getCell('C4').value).toBe('001-0001');
  });
  it('exporta transferencias desde valor y swiva en lugar de usar datos de planillas', async () => {
    const hoja=(await recargar(excelTransferenciasCaja([{idfactura:1,nombre:'Cliente',cedula:'0012345678',valor:'30.25',swiva:'4.54'}],'Transferencias'))).worksheets[0];
    expect(hoja.getCell('G4').value).toBe(34.79);expect(hoja.getCell('C4').value).toBe('0012345678');
    expect((hoja.getCell('G5').value as any).result).toBe(34.79);
  });
  it('calcula resumen actual y anterior en centavos y conserva ajustes negativos', async () => {
    const actual=[[1,'Gravado','100.10',true],[2,'Ajuste',-0.10,false],[3,'Cero',0,false]];
    const anterior=[[4,'Anterior',20,false]];
    const modelo=resumenCaja(actual,anterior,'2024-04-01');expect(modelo.totalGeneral).toBe(135.02);
    const hojas=(await recargar(excelResumenCaja(actual,anterior,[['Efectivo','120.00']],'2024-04-01','Resumen'))).worksheets;
    expect(hojas[0].lastRow!.getCell(3).value).toBe(135.02);expect(hojas[1].lastRow!.getCell(2).value).toBe(135.02);
    expect(modelo.filas.some(f=>f[1]==='Ajuste' && f[2]===-.1)).toBeTrue();
    expect(resumenCaja(actual,anterior,'2024-03-31').totalGeneral).toBe(132.01);
  });
  it('genera una hoja por estado de transferencias y no devuelve PDF al exportar', async () => {
    const libro=await recargar(excelTransferenciasGlobalCaja([{total:'10.10'}],[{total:6.05}],[{total:4.05}],'General'));
    expect(libro.worksheets.length).toBe(3);expect((libro.worksheets[0].lastRow!.getCell(6).value as any).result).toBe(10.1);
    expect((libro.worksheets[2].lastRow!.getCell(6).value as any).result).toBe(4.05);
  });
  it('un reporte vacio tiene total cero sin formula circular y rechaza valores invalidos', () => {
    expect(excelPlanillasCaja([],'Vacio').worksheets[0].getCell('G4').value).toBe(0);
    expect(()=>excelPlanillasCaja([{total:'invalid',0:{}}],'Error')).toThrow();
    expect(()=>excelPlanillasCaja([{total:10}],'Error')).toThrow();
    const hoja=excelListaCajas([{codigo:'002',descripcion:'Caja',idptoemision_ptoemision:{establecimiento:'001'}}]).worksheets[0];
    expect(hoja.getCell('A4').value).toBe('001');expect(hoja.getCell('B4').value).toBe('002');
  });
});
