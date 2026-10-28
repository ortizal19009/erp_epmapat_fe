import { TestBed } from '@angular/core/testing';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Ng2SearchPipe } from 'ng2-search-filter';
import { of,Subject,throwError } from 'rxjs';
import { ReintegradasComponent } from './reintegradas.component';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { CertipresuService } from 'src/app/servicios/contabilidad/certipresu.service';
import { PartixcertiService } from 'src/app/servicios/contabilidad/partixcerti.service';
import { EliminadosappService } from 'src/app/servicios/administracion/eliminadosapp.service';
describe('Reintegradas: formulario y filtros',()=>{
 let fixture:any,c:ReintegradasComponent,api:any,anterior:string|null;
 beforeEach(async()=>{
  anterior=sessionStorage.getItem('buscaReintegradas');sessionStorage.removeItem('buscaReintegradas');
  api={ultima:jasmine.createSpy().and.returnValue(of({numero:26,fecha:'2026-10-22'})),getDesdeHasta:jasmine.createSpy().and.returnValue(of([{idcerti:10,numero:26,fecha:'2026-10-22',valor:'3.25',intdoc:null,idbeneres:null}]))};
  await TestBed.configureTestingModule({imports:[FormsModule,ReactiveFormsModule],declarations:[ReintegradasComponent,Ng2SearchPipe],providers:[
   {provide:Router,useValue:{navigate:jasmine.createSpy()}},{provide:AutorizaService,useValue:{sessionlog:true,getDatosEmpresa:()=>null}},
   {provide:ColoresService,useValue:{setcolor:()=>Promise.resolve(['#123456','#ffffff'])}},{provide:CertipresuService,useValue:api},
   {provide:PartixcertiService,useValue:{}},{provide:EliminadosappService,useValue:{}}]}).compileComponents();
 });
 afterEach(()=>{fixture?.destroy();fixture=null;if(anterior===null)sessionStorage.removeItem('buscaReintegradas');else sessionStorage.setItem('buscaReintegradas',anterior);});
 function abrir(){fixture=TestBed.createComponent(ReintegradasComponent);c=fixture.componentInstance;}
 it('renderiza el formulario y las filas aunque no existan datos de empresa en sesion',()=>{
  abrir();expect(c.formBuscar).toBeTruthy();expect(()=>fixture.detectChanges()).not.toThrow();expect(c.certipresu.length).toBe(1);expect(c.sumvalor).toBe(3.25);
  expect(api.ultima).toHaveBeenCalledWith(2);expect(api.getDesdeHasta).toHaveBeenCalledWith(2,10,26,'2026-01-01','2026-12-31');
  expect(fixture.nativeElement.textContent).toContain('Sin responsable');
 });
 it('maneja la ausencia de reintegros sin intentar leer numero de null',()=>{
  api.ultima.and.returnValue(of(null));abrir();expect(()=>fixture.detectChanges()).not.toThrow();expect(c.certipresu).toEqual([]);expect(c.cargando).toBeFalse();expect(api.getDesdeHasta).not.toHaveBeenCalled();
 });
 it('recupera filtros guardados corruptos y limpia todos los limites',()=>{
  sessionStorage.setItem('buscaReintegradas','{invalido');abrir();expect(()=>fixture.detectChanges()).not.toThrow();c.limpiarFiltros();expect(api.getDesdeHasta).toHaveBeenCalledWith(2,null,null,null,null);
 });
 it('valida rangos antes de consultar y muestra fallos de API',()=>{
  abrir();fixture.detectChanges();api.getDesdeHasta.calls.reset();c.formBuscar.patchValue({desdeNum:20,hastaNum:10});c.buscar();expect(api.getDesdeHasta).not.toHaveBeenCalled();expect(c.errorListado).toBeTruthy();
  c.formBuscar.patchValue({desdeNum:null,hastaNum:null});api.getDesdeHasta.and.returnValue(throwError(()=>new Error('Fallo')));c.buscar();expect(c.errorListado).toBeTruthy();expect(c.cargando).toBeFalse();
 });
 it('cancela respuestas anteriores para conservar la busqueda mas reciente',()=>{
  abrir();fixture.detectChanges();const anterior=new Subject<any[]>();api.getDesdeHasta.and.returnValues(anterior,of([{numero:27,valor:2}]));c.buscar();c.buscar();anterior.next([{numero:1,valor:99}]);expect(c.certipresu[0].numero).toBe(27);expect(c.sumvalor).toBe(2);
 });
});
