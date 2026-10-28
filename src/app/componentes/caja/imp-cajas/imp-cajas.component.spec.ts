import { FormBuilder } from '@angular/forms';
import { ImpCajasComponent } from './imp-cajas.component';
describe('Reportes generales de caja', () => {
  it('usa el anio de la fecha diaria solicitada para separar periodos', async () => {
    const rubros={getTotalRubrosActualAsync:jasmine.createSpy().and.returnValue(Promise.resolve([])),getTotalRubrosAnteriorAsync:()=>Promise.resolve([])};
    const api={totalFechaFormacobroAsync:()=>Promise.resolve([])};
    const c=new ImpCajasComponent({idusuario:7} as any,new FormBuilder(),null!,null!,api as any,rubros as any,null!,null!,{hideLoading:()=>{}} as any);
    c.formImprimir=new FormBuilder().group({reporte:'1',fecha:'2024-04-01',d_fecha:'2026-10-28',h_fecha:'2026-10-28'});
    await c.imprimir();expect(rubros.getTotalRubrosActualAsync).toHaveBeenCalledWith('2024-04-01','2023-12-31');
  });
  it('dirige ambas opciones de transferencias a su exportacion de Excel', async () => {
    const c=new ImpCajasComponent({idusuario:7} as any,new FormBuilder(),null!,null!,null!,null!,null!,null!,null!);
    c.swimprimir=false;spyOn(c,'exportarTransferenciasCobradas').and.returnValue(Promise.resolve());spyOn(c,'exportarTransferenciasGlobal').and.returnValue(Promise.resolve());spyOn(c,'exportarFacturas');spyOn(c,'imprimirTransferenciasGlobal');
    c.opcreporte=6;await c.imprime();c.opcreporte=7;await c.imprime();
    expect(c.exportarTransferenciasCobradas).toHaveBeenCalled();expect(c.exportarTransferenciasGlobal).toHaveBeenCalled();expect(c.exportarFacturas).not.toHaveBeenCalled();expect(c.imprimirTransferenciasGlobal).not.toHaveBeenCalled();
  });
  it('el PDF de resumen usa los mismos totales monetarios del Excel', () => {
    const c=new ImpCajasComponent({idusuario:7} as any,new FormBuilder(),null!,null!,null!,null!,{header:()=>{}} as any,null!,null!);
    c.formImprimir=new FormBuilder().group({fecha:'2024-04-01',d_fecha:'2024-04-01',otrapagina:false});
    c._cobradas=[[1,'Gravado',100.10,true],[2,'Ajuste',-.1,false]];c._rubrosanterior=[[3,'Anterior',20,false]];c._formacobro=[['Efectivo',120]];
    spyOn(c,'muestraPDF');c.imprimirResumen();expect(c.total).toBe(135.02);expect(c.muestraPDF).toHaveBeenCalled();
  });

});
