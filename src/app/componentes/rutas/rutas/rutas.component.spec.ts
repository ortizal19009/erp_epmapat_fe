import { ElementRef } from '@angular/core';
import { fakeAsync, flush, tick } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { RutasComponent } from './rutas.component';

describe('RutasComponent: panel de detalle', () => {
  let component: RutasComponent;
  let abonados: any;
  let rutas: any;
  beforeEach(() => {
    abonados = { getAbonadosByRutaPageable: jasmine.createSpy().and.returnValue(of({ content: [], totalElements: 0, totalPages: 0 })) };
    rutas = { getCuentasMapa: jasmine.createSpy().and.returnValue(of([])) };
    component = new RutasComponent(rutas, null!, null!, null!, null!, abonados, null!, null!, null!, null!);
  });
  afterEach(() => component.ngOnDestroy());

  it('muestra todas las rutas inicialmente y filtra por estado sin limitar registros', () => {
    component._rutas = [
      ...Array.from({ length: 110 }, (_, idruta) => ({ idruta, estado: true })),
      ...Array.from({ length: 4 }, (_, i) => ({ idruta: 110 + i, estado: false })),
      { idruta: 114, estado: null }
    ];
    expect(component.rutasPorEstado.length).toBe(115);
    component.filtroEstado = 'activas';
    expect(component.rutasPorEstado.length).toBe(110);
    component.filtroEstado = 'inactivas';
    expect(component.rutasPorEstado.length).toBe(4);
    component.filtroEstado = 'sinEstado';
    expect(component.rutasPorEstado.length).toBe(1);
  });

  it('carga solo una p?gina al seleccionar y reutiliza las p?ginas consultadas', () => {
    component.seleccionarRuta({ idruta: 1 });
    component.seleccionarRuta({ idruta: 2 });
    component.seleccionarRuta({ idruta: 1 });
    expect(abonados.getAbonadosByRutaPageable.calls.count()).toBe(2);
    expect(abonados.getAbonadosByRutaPageable).toHaveBeenCalledWith(1, 0, 20, '');
    expect(rutas.getCuentasMapa).not.toHaveBeenCalled();
  });

  it('descarta el detalle de una ruta anterior al cambiar de selecci?n', () => {
    const anterior = new Subject<any>();
    abonados.getAbonadosByRutaPageable.and.returnValues(anterior, of({ content: [{ idabonado: 22 }], totalElements: 1, totalPages: 1 }));
    component.seleccionarRuta({ idruta: 1 });
    component.seleccionarRuta({ idruta: 2 });
    anterior.next({ content: [{ idabonado: 11 }] });
    expect(component._abonados[0].idabonado).toBe(22);
  });

  it('cancela el mapa de la ruta anterior y consulta todas las cuentas al abrir la pestana', () => {
    const anterior = new Subject<any[]>();
    rutas.getCuentasMapa.and.returnValue(anterior);
    component.seleccionarRuta({ idruta: 1 });
    component.cambiarTab('mapa');
    expect(rutas.getCuentasMapa).toHaveBeenCalledWith(1);
    component.seleccionarRuta({ idruta: 2 });
    anterior.next([{ idabonado: 11, geolocalizacion: '[1,2]' }]);
    expect(component.cuentasMapa).toEqual([]);
    expect(component.rutaSeleccionada.idruta).toBe(2);
  });

  it('valida coordenadas y contabiliza cuentas sin ubicacion', () => {
    expect(component.parseCoordenadas('[-1.25,-78.6]')).toEqual([-1.25, -78.6]);
    for (const valor of ['', 'null', '[null,0]', '[0,0]', '[91,0]', '[0,181]', '["",2]', 'texto']) {
      expect(component.parseCoordenadas(valor)).toBeNull();
    }
    rutas.getCuentasMapa.and.returnValue(of([
      { geolocalizacion: '[-1.25,-78.6]' }, { geolocalizacion: null }
    ]));
    component.seleccionarRuta({ idruta: 1 });
    component.cambiarTab('mapa');
    expect(component.cuentasSinCoordenadas).toBe(1);
    component.cambiarTab('abonados');
    component.cambiarTab('mapa');
    expect(rutas.getCuentasMapa.calls.count()).toBe(1);
  });

  it('incluye filtro y cantidad en la consulta y no reutiliza paginas de otra busqueda', fakeAsync(() => {
    component.seleccionarRuta({ idruta: 1 });
    component.filtroAbonados = '3601';
    component.buscarAbonados();
    tick(350);
    expect(abonados.getAbonadosByRutaPageable).toHaveBeenCalledWith(1, 0, 20, '3601');
    component.tamanoPagina = 100;
    component.cambiarTamanoPagina();
    expect(abonados.getAbonadosByRutaPageable).toHaveBeenCalledWith(1, 0, 100, '3601');
    component.cargarAbonados(8);
    expect(abonados.getAbonadosByRutaPageable).toHaveBeenCalledWith(1, 8, 100, '3601');
    component.cargarAbonados(0);
    expect(abonados.getAbonadosByRutaPageable.calls.count()).toBe(4);
  }));

  it('dibuja marcadores visibles desde geolocalizacion y los elimina al cerrar el mapa', fakeAsync(() => {
    const contenedor = document.createElement('div');
    contenedor.style.cssText = 'width:600px;height:460px';
    document.body.appendChild(contenedor);
    component.cuentasMapa = [
      { idabonado: 3601, geolocalizacion: '[0.803962143193191,-77.7249921927763]' },
      { idabonado: 3602, geolocalizacion: '[0.80386,-77.72504]' },
      { idabonado: 3603, geolocalizacion: null }
    ];
    try {
      component.mapaCuentas = new ElementRef(contenedor);
      tick(20);
      const marcadores = contenedor.querySelectorAll('.cuenta-marcador');
      expect(marcadores.length).toBe(2);
      expect(marcadores[0].getAttribute('title')).toBe('Cuenta 3601');
      expect(marcadores[0].querySelector('span')!.style.background).toBe('rgb(0, 123, 255)');
      const mapa = (component as any).mapa;
      expect(mapa.getBounds().contains([0.803962143193191, -77.7249921927763])).toBeTrue();
      component.mapaCuentas = undefined;
      expect(contenedor.querySelectorAll('.cuenta-marcador').length).toBe(0);
    } finally {
      component.ngOnDestroy();
      contenedor.remove();
      flush();
    }
  }));

  it('permite reintentar una consulta fallida', () => {
    const respuesta = new Subject<any>();
    abonados.getAbonadosByRutaPageable.and.returnValue(respuesta);
    component.seleccionarRuta({ idruta: 1 });
    respuesta.error(new Error('fallo'));
    expect(component.errorDetalle).toBeTruthy();
    abonados.getAbonadosByRutaPageable.and.returnValue(of({ content: [], totalElements: 0, totalPages: 0 }));
    component.reintentarDetalle();
    expect(component.errorDetalle).toBe('');
    expect(component.cargandoDetalle).toBeFalse();
  });
});
