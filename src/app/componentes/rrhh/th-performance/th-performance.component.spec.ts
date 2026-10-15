import { of, Subject, throwError } from 'rxjs';
import { convertToParamMap } from '@angular/router';
import { ThPerformanceComponent } from './th-performance.component';

describe('Evaluaciones reales por empleado', () => {
  let component: ThPerformanceComponent;
  let service: any;
  beforeEach(() => {
    service = jasmine.createSpyObj('ThPerformance',['permissions','byPersonal','save']);
    service.permissions.and.returnValue(of({canWrite:true,userId:8}));
    service.byPersonal.and.returnValue(of({content:[],totalPages:0,totalElements:0}));
    component = new ThPerformanceComponent(service, {getAllPersonal: () => of([{idpersonal:2},{idpersonal:7}])} as any,
      {snapshot:{queryParamMap:convertToParamMap({idpersonal:'7'})}} as any);
    component.ngOnInit();
    component.model = {periodo:'2026',fecha:'2026-10-15',puntaje:90.25,evaluador:'Jefatura',observaciones:'Cumple objetivos',planMejora:''};
  });
  it('consulta el empleado solicitado y persiste su evaluación una sola vez', () => {
    expect(service.byPersonal).toHaveBeenCalledWith(7,0);
    const pending = new Subject<any>(); service.save.and.returnValue(pending);
    component.guardar(); component.guardar();
    expect(service.save).toHaveBeenCalledTimes(1);
    expect(service.save.calls.mostRecent().args[0].idpersonal).toBe(7);
    pending.next({idreview:1}); pending.complete();
    expect(component.msg).toContain('registrada'); expect(component.model.puntaje).toBeNull();
  });
  it('rechaza puntajes inválidos o campos vacíos', () => {
    for (const score of [-1,101,90.251]) {component.model.puntaje=score; component.guardar();}
    component.model.puntaje=90; component.model.observaciones=' '; component.guardar();
    expect(service.save).not.toHaveBeenCalled();
  });
  it('no guarda con acceso de consulta', () => {
    component.canWrite=false; component.guardar(); expect(service.save).not.toHaveBeenCalled();
  });
  it('conserva el formulario al fallar el guardado', () => {
    service.save.and.returnValue(throwError(() => ({error:{message:'No disponible'}})));
    component.guardar(); expect(component.model.puntaje).toBe(90.25); expect(component.error).toBe('No disponible'); expect(component.saving).toBeFalse();
  });
  it('descarta el historial anterior al cambiar de empleado', () => {
    const pending = new Subject<any>(); service.byPersonal.and.returnValue(pending); component.cargar();
    service.byPersonal.and.returnValue(of({content:[],totalPages:0,totalElements:0}));
    component.idpersonal=2; component.cambiarPersonal();
    pending.next({content:[{idreview:99}],totalPages:1,totalElements:1}); pending.complete();
    expect(component.reviews).toEqual([]); expect(component.model.puntaje).toBeNull();
  });
});
