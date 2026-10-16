import { FormBuilder } from '@angular/forms';
import * as ExcelJS from 'exceljs';
import { libroFacturacion, fechaExcel } from './facturacion-excel';
import { FacturacionComponent } from './facturacion/facturacion.component';
import { RecargosxcuentaComponent } from './recargosxcuenta/recargosxcuenta.component';
import { InfoFacturacionComponent } from './info-facturacion/info-facturacion.component';

describe('Excel de todos los reportes de Facturación', () => {
  function listado() {
    const component = new FacturacionComponent({} as any, {} as any, new FormBuilder(), {} as any, {} as any);
    component.formBuscar = new FormBuilder().group({del:'2026-09-01', al:'2026-09-30'});
    component._facturacion = [
      {idfacturacion:1,feccrea:'2026-09-01',idcliente_clientes:{nombre:'Ana'},descripcion:'Prueba',total:12.5,cuotas:2},
      {idfacturacion:2,feccrea:'2026-09-30',idcliente_clientes:{nombre:'Luis'},descripcion:'Otro',total:20,cuotas:3}
    ];
    return component;
  }
  it('exporta la lista completa filtrada, ordenada y con valores numericos', () => {
    const component = listado(); component.pageSize=1;
    const sheet=component.crearExcel().worksheets[0];
    expect(sheet.getCell('A4').value).toBe(2);
    expect(sheet.getCell('A5').value).toBe(1);
    expect(sheet.getCell('E4').value).toBe(20);
    expect(sheet.getCell('B4').value).toEqual(new Date(Date.UTC(2026,8,30)));
    expect(sheet.getCell('E6').value).toEqual({formula:'SUM(E4:E5)',result:32.5});
    component.filtro='Ana';
    const filtered=component.crearExcel().worksheets[0];
    expect(filtered.getCell('A4').value).toBe(1);
    expect(filtered.getCell('E5').value).toEqual({formula:'SUM(E4:E4)',result:12.5});
  });
  it('exporta cuotas pendientes con sus cantidades y total monetario', () => {
    const component=listado(); component.soloPendientesCuotas=true;
    component._facturacion=[{idfacturacion:5,cliente:'Ana',cuotas:4,planillasPagadas:1,planillasPendientes:3,valorPendiente:75}];
    const sheet=component.crearExcel().worksheets[0];
    expect(sheet.getCell('F4').value).toBe(1);
    expect(sheet.getCell('G5').value).toEqual({formula:'SUM(G4:G4)',result:3});
    expect(sheet.getCell('H5').value).toEqual({formula:'SUM(H4:H4)',result:75});
  });
  it('exporta recargos con las mismas columnas y filtros del PDF', () => {
    const component=new RecargosxcuentaComponent({} as any,{} as any,{} as any,{} as any,{} as any,{} as any,{} as any,{} as any);
    component._recargosxcuenta=[{idabonado_abonados:{idabonado:6,responsableNombre:'Ana'},idrubro_rubros:{descripcion:'Recargo',valor:8.25}}];
    const sheet=component.crearExcel().worksheets[0];
    expect(sheet.getCell('A4').value).toBe(6);
    expect(sheet.getCell('I4').value).toBe(8.25);
    expect(sheet.getCell('I5').value).toEqual({formula:'SUM(I4:I4)',result:8.25});
  });
  it('exporta planillas usando el valor individual de factura', () => {
    const component=new InfoFacturacionComponent({} as any,{} as any,{} as any);
    component.facturacion={idfacturacion:1,descripcion:'Prueba',fecha:null,nomcli:'Ana',total:20,cuotas:1};
    component._liquidafac=[{cuota:1,valor:200,idfactura_facturas:{idfactura:10,totaltarifa:20,pagado:1}}];
    const sheet=component.crearExcel().worksheets[0];
    expect(sheet.getCell('E4').value).toBe('Pagada');
    expect(sheet.getCell('G4').value).toBe(20);
  });
  it('produce un XLSX valido con fechas, totales calculados y textos literales', async () => {
    const source=libroFacturacion('Prueba',['Fecha','Cliente','Valor'],[[fechaExcel('2026-09-30'),'=1+1',12.5]],[3],[3]);
    const reopened=new ExcelJS.Workbook(); await reopened.xlsx.load(await source.xlsx.writeBuffer());
    const sheet=reopened.worksheets[0];
    expect(sheet.getCell('A4').value).toEqual(new Date(Date.UTC(2026,8,30)));
    expect(sheet.getCell('B4').value).toBe('=1+1');
    expect(sheet.getCell('C5').result).toBe(12.5);
    expect(sheet.getCell('C4').numFmt).toBe('#,##0.00');
  });
  it('admite listas vacias sin formulas de rango incorrectas', () => {
    const sheet=libroFacturacion('Vacio',['Nombre','Valor'],[],[2],[2]).worksheets[0];
    expect(sheet.getCell('B4').value).toBe(0);
    expect(fechaExcel(null)).toBeNull(); expect(fechaExcel('invalida')).toBeNull();
  });
});
