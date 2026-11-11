import { FormBuilder } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { Benextran } from 'src/app/modelos/contabilidad/benextran.model';
import { Cuentas } from 'src/app/modelos/contabilidad/cuentas.model';
import { AddPagoscobrosComponent } from './add-pagoscobros.component';

describe('AddPagoscobrosComponent: busqueda de beneficiarios', () => {
   let component: AddPagoscobrosComponent;
   let buscar: jasmine.Spy;
   const fb = new FormBuilder();
   const fila = { valor: 100, totpagcob: 20, idbene: { idbene: 1, nomben: 'Maria Perez' } } as Benextran;

   beforeEach(() => {
      buscar = jasmine.createSpy('getACFP').and.returnValue(of([fila]));
      component = new AddPagoscobrosComponent(
         {} as any, fb, {} as any, {} as any,
         { mostrarError: jasmine.createSpy('mostrarError') } as any,
         {} as any, {} as any, {} as any, { getACFP: buscar } as any,
         {} as any, {} as any, {} as any
      );
      component.formTransaci = fb.group({
         idcuenta: '222', codcue: '222', nomcue: 'Seleccionada', valor: null, nomben: '  Maria  '
      });
      component.formBeneficiarios = fb.group({ liquida: fb.array([]) });
      component.idcuenta = 2;
      component.iAsiento.fecha = '2026-11-11' as any;
      component.tiptran = { numero: 12, nombre: '', cabecera1: '', cabecera2: '' };
      component.cuentas = [Object.assign(new Cuentas(), { idcuenta: 1, codcue: '111' }), Object.assign(new Cuentas(), { idcuenta: 2, codcue: '222' })];
   });

   it('consulta la cuenta seleccionada y el filtro actual, y prepara las filas', () => {
      component.nomben = 'Filtro anterior';
      component.sinliquidar();
      expect(buscar).toHaveBeenCalledWith('2026-11-11', 'Maria', 6, '222');
      expect(component.benextran).toEqual([fila]);
      expect(component.formArrayLiquida.length).toBe(1);
      expect(component.totales.totalSaldo).toBe(80);
      expect(component.hayregistros).toBeTrue();
   });

   it('no depende de que las sugerencias conserven la cuenta elegida', () => {
      component.cuentas = [];
      component.sinliquidar();
      expect(buscar).toHaveBeenCalledWith('2026-11-11', 'Maria', 6, '222');
   });

   it('limpia filas y totales cuando no hay coincidencias', () => {
      component.sinliquidar();
      buscar.and.returnValue(of([]));
      component.sinliquidar();
      expect(component.benextran).toEqual([]);
      expect(component.formArrayLiquida.length).toBe(0);
      expect(component.totales.totalSaldo).toBe(0);
      expect(component.formTransaci.get('valor')!.value).toBeNull();
      expect(component.hayregistros).toBeFalse();
   });

   it('ignora resultados pendientes de una cuenta anterior', () => {
      const pendiente = new Subject<Benextran[]>();
      buscar.and.returnValue(pendiente);
      component.sinliquidar();
      component.onCuentaSelected({ target: { value: '111' } });
      pendiente.next([fila]);
      expect(component.benextran).toEqual([]);
      expect(component.formArrayLiquida.length).toBe(0);
      expect(component.buscandoBeneficiarios).toBeFalse();
   });
   it('agrupa movimientos por ID y espera la seleccion cuando hay varios beneficiarios', () => {
      const otro = { valor: 200, totpagcob: 50, idbene: { idbene: 2, nomben: 'Maria Perez', ciben: '222' } } as Benextran;
      buscar.and.returnValue(of([fila, { ...fila, valor: 50 }, otro]));
      const dialogo = { open: false, showModal: jasmine.createSpy('showModal'), close: jasmine.createSpy('close') };
      component.modalBeneficiarios = { nativeElement: dialogo } as any;
      component.sinliquidar();
      expect(dialogo.showModal).toHaveBeenCalled();
      expect(component.coincidenciasBeneficiarios.length).toBe(2);
      expect(component.coincidenciasBeneficiarios[0].registros.length).toBe(2);
      expect(component.benextran).toEqual([]);
      expect(component.formArrayLiquida.length).toBe(0);
      component.seleccionarBeneficiario(2);
      expect(component.formTransaci.get('nomben')!.value).toBe('Maria Perez');
      expect(component.beneficiarioSeleccionado!.idbene).toBe(2);
      expect(component.benextran).toEqual([otro]);
      expect(component.formArrayLiquida.length).toBe(1);
      expect(component.totales.totalSaldo).toBe(150);
   });

   it('carga todos los movimientos de un unico beneficiario sin abrir el modal', () => {
      buscar.and.returnValue(of([fila, { ...fila, valor: 50 }]));
      component.sinliquidar();
      expect(component.benextran.length).toBe(2);
      expect(component.formArrayLiquida.length).toBe(2);
      expect(component.formTransaci.get('nomben')!.value).toBe('Maria Perez');
      expect(component.totales.totalSaldo).toBe(110);
   });

   it('cancelar el modal no carga datos y cambiar de cuenta descarta la seleccion', () => {
      const otro = { ...fila, idbene: { ...fila.idbene, idbene: 2 } };
      buscar.and.returnValue(of([fila, otro]));
      component.sinliquidar();
      component.cerrarModalBeneficiarios();
      component.seleccionarBeneficiario(1);
      expect(component.benextran).toEqual([]);
      buscar.and.returnValue(of([fila]));
      component.sinliquidar();
      component.onCuentaSelected({ target: { value: '111' } });
      expect(component.beneficiarioSeleccionado).toBeNull();
      expect(component.coincidenciasBeneficiarios).toEqual([]);
      expect(component.benextran).toEqual([]);
   });

   it('editar el nombre descarta la seleccion y las respuestas pendientes', () => {
      component.sinliquidar();
      const pendiente = new Subject<Benextran[]>();
      buscar.and.returnValue(pendiente);
      component.sinliquidar();
      component.formTransaci.patchValue({ nomben: 'Pedro' });
      component.cambiarBusquedaBeneficiario();
      pendiente.next([fila]);
      expect(component.beneficiarioSeleccionado).toBeNull();
      expect(component.benextran).toEqual([]);
      expect(component.formArrayLiquida.length).toBe(0);
      expect(component.buscandoBeneficiarios).toBeFalse();
      expect(component.formTransaci.get('nomben')!.value).toBe('Pedro');
   });

});
