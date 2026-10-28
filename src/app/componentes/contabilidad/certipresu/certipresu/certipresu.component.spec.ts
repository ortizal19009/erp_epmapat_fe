import { FormBuilder } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';
import { CertipresuComponent } from './certipresu.component';
describe('Filtros de certificaciones presupuestarias',()=>{
 let c:CertipresuComponent,api:any,guardada:string|null;
 beforeEach(()=>{guardada=sessionStorage.getItem('buscarCertipresu');sessionStorage.removeItem('buscarCertipresu');
  api={ultima:jasmine.createSpy().and.returnValue(of({numero:274,fecha:'2026-10-27'})),getDesdeHasta:jasmine.createSpy().and.returnValue(of([]))};
  c=new CertipresuComponent(new FormBuilder(),null!,{sessionlog:true,getDatosEmpresa:()=>({fechap:'2025-01-01'})} as any,null!,api,null!,null!);
  spyOn(c,'buscaColor');spyOn(c,'colocaColor');
 });
 afterEach(()=>{c.ngOnDestroy();if(guardada===null)sessionStorage.removeItem('buscarCertipresu');else sessionStorage.setItem('buscarCertipresu',guardada);});
 it('carga las ultimas con su anio aunque la fecha de empresa sea de otro ejercicio',()=>{
  c.ngOnInit();expect(api.getDesdeHasta).toHaveBeenCalledWith(1,258,274,'2026-01-01','2026-12-31');
 });
 it('limpiar filtros permite listar todas sin convertir vacios en ceros',()=>{
  c.ngOnInit();c.filtro='anterior';c.limpiarFiltros();expect(api.getDesdeHasta).toHaveBeenCalledWith(1,null,null,null,null);expect(c.filtro).toBe('');
 });
 it('valida ambos rangos y admite limites parciales',()=>{
  c.ngOnInit();api.getDesdeHasta.calls.reset();c.formBuscar.patchValue({desdeNum:20,hastaNum:10});c.buscar();expect(api.getDesdeHasta).not.toHaveBeenCalled();expect(c.errorListado).toBeTruthy();
  c.formBuscar.patchValue({desdeNum:'',hastaNum:100,desdeFecha:'',hastaFecha:'2026-12-31'});c.buscar();expect(api.getDesdeHasta).toHaveBeenCalledWith(1,null,100,null,'2026-12-31');
  api.getDesdeHasta.calls.reset();c.formBuscar.patchValue({desdeFecha:'2026-12-31',hastaFecha:'2026-01-01'});c.buscar();expect(api.getDesdeHasta).not.toHaveBeenCalled();
 });
 it('una respuesta anterior no reemplaza la consulta mas reciente',()=>{
  c.ngOnInit();const anterior=new Subject<any[]>();api.getDesdeHasta.and.returnValues(anterior,of([{numero:2,valor:'12.50'}]));
  c.buscar();c.buscar();anterior.next([{numero:1,valor:99}]);expect(c.certipresu[0].numero).toBe(2);expect(c.sumvalor).toBe(12.5);
 });
 it('maneja ultima vacia y fallos de carga sin dejar el indicador activo',()=>{
  api.ultima.and.returnValue(of(null));c.ngOnInit();expect(c.certipresu).toEqual([]);expect(c.cargando).toBeFalse();
  api.getDesdeHasta.and.returnValue(throwError(()=>new Error('Fallo')));c.buscar();expect(c.errorListado).toBeTruthy();expect(c.cargando).toBeFalse();
 });
 it('recupera filtros guardados corruptos sin bloquear la pantalla',()=>{
  sessionStorage.setItem('buscarCertipresu','{invalido');c.ngOnInit();expect(api.ultima).toHaveBeenCalled();expect(c.errorListado).toBe('');
 });
});
