import { ClientesReporteService } from './clientes-reporte.service';
import { Workbook } from 'exceljs';
describe('Archivos de clientes', () => {
  const servicio=new ClientesReporteService();
  it('conserva identificaciones con ceros iniciales, fechas y conteos en Excel', async () => {
    const libro=servicio.crearExcel('listado',[{idcliente:1,nombre:'Cliente',cedula:'0012345678',nacionalidad:'Ecuatoriana',fechanacimiento:'1980-04-05',cuentas:2}],'Todos');
    const copia=new Workbook();await copia.xlsx.load(await libro.xlsx.writeBuffer());
    const hoja=copia.worksheets[0];expect(hoja.getCell('C5').value).toBe('0012345678');expect(hoja.getCell('E5').value).toBe('1980-04-05');expect(hoja.getCell('I5').value).toBe(2);
  });
  it('incluye filas sin saldo y totaliza capital numerico sin multiplicar por cuentas', () => {
    const hoja=servicio.crearExcel('pendientes',[{nombre:'Uno',capital:12.35},{nombre:'Dos',capital:0},{nombre:'Tres',capital:2.65}],'Todos').worksheets[0];
    expect(hoja.getCell('I6').value).toBe(0);expect(hoja.getCell('I8').value).toBe(15);expect(hoja.getCell('I8').numFmt).toBe('#,##0.00');
  });
  it('muestra el estado real y no convierte un estado desconocido en inactivo', () => {
    expect(servicio.filas('cuentas',[{estado:3}])[0][6]).toBe('Suspendido y retirado');
    expect(servicio.filas('cuentas',[{estado:null}])[0][6]).toBe('Sin definir');
  });
  it('genera un PDF con varias paginas para listados extensos', async () => {
    const doc=await servicio.crearPdf('listado',Array.from({length:180},(_,i)=>({idcliente:i+1,nombre:'Cliente '+i,cedula:'0012345678',direccion:'Direccion de prueba',cuentas:2})),'Todos');
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
    expect(doc.output('arraybuffer').byteLength).toBeGreaterThan(1000);
    expect(doc.internal.pageSize.getWidth()).toBeCloseTo(420,0);
  });

});
