import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import { convertToParamMap } from '@angular/router';
import { RutasmorasComponent } from './rutasmoras.component';

describe('Mora Medidores: entrada desde menu y por ruta', () => {
  let component: RutasmorasComponent;
  let parametros: BehaviorSubject<any>;
  let rutas: any, abonados: any, router: any;
  let ventana: string | null;
  beforeEach(() => {
    ventana = sessionStorage.getItem('ventana');
    parametros = new BehaviorSubject(convertToParamMap({}));
    rutas = { getResumenRutas: jasmine.createSpy().and.returnValue(of([{ idruta: 1, descripcion: 'Ruta uno' }])), getByIdruta: jasmine.createSpy().and.callFake((id: number) => of({ idruta: id, descripcion: `Ruta ${id}` })) };
    abonados = { DeudasCuentasByRuta: jasmine.createSpy().and.resolveTo([]) };
    router = { navigate: jasmine.createSpy() };
    component = new RutasmorasComponent({ paramMap: parametros } as any, null!, null!, new FormBuilder(), rutas, abonados, null!, null!, null!, null!, { showLoading() {}, hideLoading() {} } as any, router);
  });
  afterEach(() => {
    component.ngOnDestroy();
    if (ventana === null) sessionStorage.removeItem('ventana'); else sessionStorage.setItem('ventana', ventana);
  });

  it('abre desde el menu sin asumir la ruta 1 ni consultar una ruta cero', () => {
    component.ngOnInit();
    expect(component.idrutaSeleccionada).toBeNull();
    expect(abonados.DeudasCuentasByRuta).not.toHaveBeenCalled();
    expect(rutas.getResumenRutas).toHaveBeenCalled();
    component.seleccionarRuta(2);
    expect(router.navigate).toHaveBeenCalledWith(['/mora-abonados', 2]);
  });

  it('respeta enlaces existentes y descarta una respuesta atrasada al cambiar de ruta', fakeAsync(() => {
    let primera!: (datos: any) => void;
    let segunda!: (datos: any) => void;
    abonados.DeudasCuentasByRuta.and.returnValues(new Promise(resolve => primera = resolve), new Promise(resolve => segunda = resolve));
    parametros.next(convertToParamMap({ idruta: '1' }));
    component.ngOnInit();
    expect(component.idrutaSeleccionada).toBe(1);
    component.selectedCount = 2;
    parametros.next(convertToParamMap({ idruta: '2' }));
    expect(component.selectedCount).toBe(0);
    segunda([{ cuenta: 200, nombre: 'Cuenta dos' }]);
    flushMicrotasks();
    primera([{ cuenta: 100, nombre: 'Cuenta uno' }]);
    flushMicrotasks();
    expect(component.datosCuentas[0].cuenta).toBe(200);
    expect(component.titulo).toBe('Mora Medidores - Ruta 2');
    expect(component.cargandoCuentas).toBeFalse();
  }));
});
