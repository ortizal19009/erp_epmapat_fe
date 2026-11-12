import { FormBuilder } from '@angular/forms';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';
import { AddAsientoComponent } from './add-asiento.component';

describe('AddAsientoComponent: periodo contable', () => {
   let component: AddAsientoComponent;
   let config: jasmine.Spy;
   let asientos: any;
   beforeEach(() => {
      sessionStorage.removeItem('/asientos');
      config = jasmine.createSpy().and.returnValue(of({ fechap: '2026-01-01' }));
      asientos = { obtenerUltimaFecha: () => of(null), valCompro: () => of(false), siguienteNumero: jasmine.createSpy() };
      component = new AddAsientoComponent({} as any, new FormBuilder(), {} as any,
         { getDatosEmpresa: () => null } as any,
         { getListaDocumentos: () => of([]) } as any, asientos, { getByIddefinir: config } as any);
   });
   it('inicializa el formulario sin datos de empresa en sesion y recupera el periodo', () => {
      expect(() => component.ngOnInit()).not.toThrow();
      expect(config).toHaveBeenCalledWith(1);
      expect(component.f['fecha'].value).toBe('2026-01-01');
      expect(component.periodoContable).toBe('2026');
   });
   it('mantiene el formulario disponible mientras espera y bloquea el guardado', () => {
      const pendiente = new Subject<any>(); config.and.returnValue(pendiente);
      component.ngOnInit();
      expect(component.f['fecha']).toBeDefined();
      expect(component.cargandoPeriodo).toBeTrue();
      component.saveAsiento();
      expect(asientos.siguienteNumero).not.toHaveBeenCalled();
      pendiente.next({ fechap: '2025-01-01' });
      expect(component.f['fecha'].value).toBe('2025-01-01');
      expect(component.cargandoPeriodo).toBeFalse();
      component.ngOnDestroy();
   });
   it('permite reintentar si la consulta falla', () => {
      config.and.returnValue(throwError(() => new Error('conexion')));
      component.ngOnInit();
      expect(component.errorPeriodo).toBeTruthy();
      expect(component.periodoContable).toBeNull();
      config.and.returnValue(of({ fechap: '2026-01-01' }));
      component.cargarPeriodo();
      expect(component.errorPeriodo).toBe('');
      expect(component.periodoContable).toBe('2026');
   });
   it('rechaza fechas de otro periodo y configuracion vacia', async () => {
      component.ngOnInit();
      const resultado = await firstValueFrom(component.valAño()(new FormBuilder().control('2025-01-01')) as any);
      expect(resultado).toBeTruthy();
      config.and.returnValue(of(null)); component.cargarPeriodo();
      expect(component.periodoContable).toBeNull();
      expect(component.errorPeriodo).toBeTruthy();
   });
});
