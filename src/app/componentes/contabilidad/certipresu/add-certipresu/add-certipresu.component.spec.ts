import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { AddCertipresuComponent } from './add-certipresu.component';
describe('Periodo de nuevas certificaciones',()=>{
 let c:AddCertipresuComponent,config:any,certi:any;
 beforeEach(()=>{
  config={getByIddefinir:jasmine.createSpy().and.returnValue(of({fechap:'2026-01-01'}))};certi={saveCertipresu:jasmine.createSpy()};
  c=new AddCertipresuComponent(null!,null!,{getDatosEmpresa:()=>({fechap:'2025-01-01'})} as any,new FormBuilder(),null!,certi,config);
  c.formCertipresu=new FormBuilder().group({fecha:['2026-10-28',Validators.required,c.valAño()]});
 });afterEach(()=>c.ngOnDestroy());
 it('valida con el periodo del servidor aunque la sesion conserve otro anio',()=>{
  c.cargarPeriodo();expect(config.getByIddefinir).toHaveBeenCalledWith(1);expect(c.periodoPresupuestario).toBe(2026);expect(c.f['fecha'].errors).toBeNull();
 });
 it('indica el anio esperado cuando la fecha corresponde a otro periodo',()=>{
  c.cargarPeriodo();c.f['fecha'].setValue('2025-12-31');expect(c.f['fecha'].errors?.['añoinvalido']).toEqual({esperado:2026});
 });
 it('no asume el anio actual ni permite guardar si no puede consultar el periodo',()=>{
  config.getByIddefinir.and.returnValue(throwError(()=>new Error('Error')));c.cargarPeriodo();
  expect(c.errorPeriodo).toBeTruthy();expect(c.periodoPresupuestario).toBeNull();c.onSubmit();expect(certi.saveCertipresu).not.toHaveBeenCalled();
 });
 it('usa la fecha de Ecuador y no la reemplaza con la ultima certificacion',()=>{
  jasmine.clock().install();
  try {
   jasmine.clock().mockDate(new Date('2026-10-29T02:00:00Z'));
   expect((c as any).fechaDeHoy()).toBe('2026-10-28');
   c.formCertipresu.addControl('numero',new FormControl());
   certi.ultima=()=>of({numero:274,fecha:'2026-10-20'});
   c.ultimo();expect(c.f['numero'].value).toBe(275);expect(c.f['fecha'].value).toBe('2026-10-28');
  } finally {jasmine.clock().uninstall();}
 });

});
