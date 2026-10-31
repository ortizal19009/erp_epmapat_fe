import { FormBuilder } from '@angular/forms';
import { throwError } from 'rxjs';
import { AnulacionesBajasComponent } from './anulaciones-bajas.component';
describe('Motivos de anulaciones y bajas',()=>{
 let c:AnulacionesBajasComponent,api:any;
 beforeEach(()=>{
  api={ejecutarAnulacionBaja:jasmine.createSpy().and.returnValue(throwError(()=>({error:{message:'El motivo supera 254 caracteres'}})))};
  c=new AnulacionesBajasComponent(null!,null!,new FormBuilder(),{idusuario:7} as any,null!,null!,null!,null!,null!,api,null!,null!,null!);
  c.f_factura=new FormBuilder().group({razonanulacion:'',razoneliminacion:'',razonreasignacion:''});
  c.campo=1;c.textodato='123';c._factura.idfactura=123;
 });
 it('bloquea motivos de anulacion y baja que superan 254 caracteres',()=>{
  c.f_factura.patchValue({razonanulacion:'a'.repeat(255),razoneliminacion:'b'.repeat(255)});
  c.option='0';expect(c.puedeGuardar).toBeFalse();c.actualizar();c.option='1';expect(c.puedeGuardar).toBeFalse();c.actualizar();expect(api.ejecutarAnulacionBaja).not.toHaveBeenCalled();
 });
 it('acepta exactamente el limite y conserva la regla minima del motivo',()=>{
  c.f_factura.patchValue({razonanulacion:'a'.repeat(254)});expect(c.puedeGuardar).toBeTrue();
  c.f_factura.patchValue({razonanulacion:'abc'});expect(c.puedeGuardar).toBeFalse();
 });
 it('muestra el error del servidor en el formulario y permite corregir el texto',()=>{
  spyOn(console,'error');c.f_factura.patchValue({razonanulacion:'Motivo valido'});c.actualizar();expect(c.errorAccion).toContain('254');expect(c.procesandoAccion).toBeFalse();expect(c.motivoActual).toBe('Motivo valido');
 });
 it('mantiene el comportamiento de motivos de reasignacion',()=>{
  c.option='2';c.f_factura.patchValue({razonreasignacion:'a'.repeat(255)});expect(c.puedeGuardar).toBeTrue();
 });
});
