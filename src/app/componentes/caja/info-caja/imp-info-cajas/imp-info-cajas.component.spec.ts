import { FormBuilder } from '@angular/forms';
import { ImpInfoCajasComponent } from './imp-info-cajas.component';
describe('Carga de reportes por recaudador', () => {
  it('espera los detalles de las planillas antes de habilitar el Excel', async () => {
    let resolver: (valor:any)=>void = () => {};
    const api={getByFechacobroTotByRecaudadorAsync:()=>Promise.resolve([{idfactura:1,total:'10.10',iva:'1.52'}]),
      getByIdAsync:()=>new Promise(resolve=>resolver=resolve)};
    const componente=new ImpInfoCajasComponent({idusuario:7} as any,new FormBuilder(),null!,api as any,null!,null!,null!,{hideLoading:()=>{}} as any,null!);
    componente.formImprimir=new FormBuilder().group({reporte:'2',d_fecha:'2024-01-01',h_fecha:'2024-01-31'});
    const carga=componente.imprimir();await Promise.resolve();await Promise.resolve();
    expect(componente.swcalculando).toBeTrue();resolver({idfactura:1,idcliente:{nombre:'Uno'}});await carga;
    expect(componente._cobradas[0][0].idfactura).toBe(1);expect(componente.swcalculando).toBeFalse();expect(componente.errorReporte).toBe('');
  });
  it('restablece botones y muestra error si falla una consulta', async () => {
    const api={getByFechacobroTotByRecaudadorAsync:()=>Promise.reject(new Error('Error'))};
    const componente=new ImpInfoCajasComponent({idusuario:7} as any,new FormBuilder(),null!,api as any,null!,null!,null!,{hideLoading:()=>{}} as any,null!);
    componente.formImprimir=new FormBuilder().group({reporte:'2',d_fecha:'2024-01-01',h_fecha:'2024-01-31'});
    await componente.imprimir();expect(componente.errorReporte).toBeTruthy();expect(componente.swcalculando).toBeFalse();expect(componente.swbotones).toBeFalse();
  });
});
