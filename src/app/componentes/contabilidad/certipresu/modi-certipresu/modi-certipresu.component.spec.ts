import { FormBuilder } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';
import { ModiCertipresuComponent } from './modi-certipresu.component';
describe('Resumen de partidas al modificar certificacion',()=>{
 let c:ModiCertipresuComponent,api:any,certi:any,router:any;
 beforeEach(()=>{api={getByIdCerti:jasmine.createSpy().and.returnValue(of([]))};certi={updateCertipresu:jasmine.createSpy()};router={navigate:jasmine.createSpy()};
  c=new ModiCertipresuComponent(null!,router,new FormBuilder(),null!,certi,null!,api);c.idcerti=10;c.antnumero=25;
 });afterEach(()=>c.ngOnDestroy());
 it('carga las partidas de la certificacion y suma valores numericos',()=>{
  api.getByIdCerti.and.returnValue(of([{valor:'10.10',intpre:{codpar:'001',nompar:'Prueba'}},{valor:.20}]));c.cargarPartidas();
  expect(api.getByIdCerti).toHaveBeenCalledWith(10);expect(c.partidas).toBe(2);expect(c.totalPartidas).toBe(10.3);expect(c.cargandoPartidas).toBeFalse();
 });
 it('distingue una certificacion sin partidas de un fallo de consulta',()=>{
  c.cargarPartidas();expect(c.partidas).toBe(0);expect(c.errorPartidas).toBe('');
  api.getByIdCerti.and.returnValue(throwError(()=>new Error('Fallo')));c.cargarPartidas();expect(c.errorPartidas).toBeTruthy();expect(c.cargandoPartidas).toBeFalse();
  c.onSubmit();expect(certi.updateCertipresu).not.toHaveBeenCalled();
 });
 it('descarta resultados de una consulta anterior al reintentar',()=>{
  const anterior=new Subject<any[]>();api.getByIdCerti.and.returnValues(anterior,of([{valor:3}]));c.cargarPartidas();c.cargarPartidas();anterior.next([{valor:99}]);expect(c.totalPartidas).toBe(3);
 });
 it('abre el detalle de las partidas de esta certificacion',()=>{
  const previo=sessionStorage.getItem('datosToPartixcerti');try{c.verPartidas();expect(JSON.parse(sessionStorage.getItem('datosToPartixcerti')!)).toEqual({idcerti:10,desdeNum:25,hastaNum:25});expect(router.navigate).toHaveBeenCalledWith(['partixcerti']);}
  finally{if(previo===null)sessionStorage.removeItem('datosToPartixcerti');else sessionStorage.setItem('datosToPartixcerti',previo);}
 });
});
