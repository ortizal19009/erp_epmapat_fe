import { FormBuilder } from '@angular/forms';
import { AddPartixcertiComponent } from './add-partixcerti.component';
describe('Calculo de saldo de nueva partida',()=>{
 let c:AddPartixcertiComponent,api:any;
 beforeEach(()=>{
  api={savePartixcerti:jasmine.createSpy()};
  c=new AddPartixcertiComponent({sessionlog:true} as any,null!,null!,null!,new FormBuilder(),api);
  spyOn(c,'buscaCertipresu');spyOn(c,'colocaColor');c.ngOnInit();
  c.presupue=[{intpre:1,codpar:'501',nompar:'Partida',inicia:'25',totmod:'5',totcerti:'3'} as any];
  c.f['intpre'].setValue('501');c.onPartidaSelected({target:{value:'501'}});
 });afterEach(()=>c.ngOnDestroy());
 it('al cambiar de 30 a cero reemplaza el saldo negativo anterior por el saldo disponible',()=>{
  expect(c.f['saldo'].value).toBe(27);c.f['valor'].setValue(30);expect(c.f['newsaldo'].value).toBe(-3);
  c.f['valor'].setValue(0);expect(c.f['newsaldo'].value).toBe(27);expect(c.f['valor'].hasError('min')).toBeTrue();
  c.guardar();expect(api.savePartixcerti).not.toHaveBeenCalled();
 });
 it('calcula centavos y admite certificar exactamente el saldo disponible',()=>{
  c.f['saldo'].setValue(.3);c.f['valor'].setValue(.1);expect(c.f['newsaldo'].value).toBe(.2);
  c.f['valor'].setValue(.3);expect(c.f['newsaldo'].value).toBe(0);expect(c.f['valor'].valid).toBeTrue();
 });
 it('al borrar o invalidar la partida limpia saldo, importe y resultado',()=>{
  c.f['valor'].setValue(4);c.onPartidaSelected({target:{value:'NO EXISTE'}});
  expect(c.intpre).toBeNull();expect(c.f['saldo'].value).toBeNull();expect(c.f['newsaldo'].value).toBeNull();expect(c.f['intpre'].invalid).toBeTrue();
 });
 it('revalida el valor si cambia el saldo y no oculta un saldo original negativo',()=>{
  c.f['valor'].setValue(5);c.f['saldo'].setValue(2);expect(c.f['valor'].hasError('invalido')).toBeTrue();expect(c.f['newsaldo'].value).toBe(-3);
  c.f['saldo'].setValue(-3);c.f['valor'].setValue(0);expect(c.f['newsaldo'].value).toBe(-3);
 });
 it('rechaza importes pegados con mas de dos decimales',()=>{
  c.f['valor'].setValue(1.234);expect(c.f['valor'].hasError('decimales')).toBeTrue();c.guardar();expect(api.savePartixcerti).not.toHaveBeenCalled();
 });
});
