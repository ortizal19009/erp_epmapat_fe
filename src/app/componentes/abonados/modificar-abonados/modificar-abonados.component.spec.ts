import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { Subject } from 'rxjs';
import Swal from 'sweetalert2';
import { ModificarAbonadosComponent } from './modificar-abonados.component';

describe('Fotos al modificar abonado', () => {
  let component: ModificarAbonadosComponent;
  let service: any;
  let router: any;
  let update: Subject<any>;
  let upload: Subject<any>;
  let alert: jasmine.Spy;
  let originalCuenta: string | null;

  beforeEach(() => {
    originalCuenta = sessionStorage.getItem('idabonadoToFactura');
    update = new Subject();
    upload = new Subject();
    service = jasmine.createSpyObj('AbonadosService', ['updateAbonadoAuditoria', 'uploadFotosAbonado', 'getFotoCasaUrl', 'getFotoMedidorUrl']);
    service.updateAbonadoAuditoria.and.returnValue(update);
    service.uploadFotosAbonado.and.returnValue(upload);
    service.getFotoCasaUrl.and.returnValue('/abonados/123/fotocasa');
    service.getFotoMedidorUrl.and.returnValue('/abonados/123/fotomedidor');
    router = jasmine.createSpyObj('Router', ['navigate']);
    component = new ModificarAbonadosComponent(new FormBuilder(), service, null!, null!, null!, null!, null!, null!, router, { idusuario: 1 } as any);
    component.abonado.idabonado = 123;
    component.abonadoForm = new FormBuilder().group({ idabonado: 123, fotocasaPath: 'casa.jpg', fotomedidorPath: 'medidor.jpg' });
    alert = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true, value: 'Editar' } as any));
  });

  afterEach(() => {
    component.ngOnDestroy();
    if (originalCuenta === null) sessionStorage.removeItem('idabonadoToFactura');
    else sessionStorage.setItem('idabonadoToFactura', originalCuenta);
  });

  it('envia las rutas correctas y espera la carga antes de volver a la misma cuenta', fakeAsync(() => {
    const file = new File(['foto'], 'casa.jpg', { type: 'image/jpeg' });
    component.selectedFotoCasa = file;
    component.onSubmit();
    flushMicrotasks();
    const payload = service.updateAbonadoAuditoria.calls.mostRecent().args[0];
    expect(payload.fotocasaPath).toBe('casa.jpg');
    expect(payload.fotomedidorPath).toBe('medidor.jpg');
    update.next({ idabonado: 123 });
    expect(service.uploadFotosAbonado.calls.mostRecent().args[1].fotocasa).toBe(file);
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.guardando).toBeTrue();
    component.onSubmit();
    expect(service.updateAbonadoAuditoria).toHaveBeenCalledTimes(1);
    upload.next({ idabonado: 123, fotocasaPath: 'nueva.jpg', fotomedidorPath: 'medidor.jpg' });
    upload.complete();
    update.complete();
    flushMicrotasks();
    expect(sessionStorage.getItem('idabonadoToFactura')).toBe('123');
    expect(router.navigate).toHaveBeenCalledWith(['detalles-abonado']);
    expect(component.selectedFotoCasa).toBeNull();
    expect(component.guardando).toBeFalse();
  }));

  it('conserva la seleccion y no redirige si falla la subida', fakeAsync(() => {
    spyOn(console, 'error');
    const file = new File(['foto'], 'medidor.jpg', { type: 'image/jpeg' });
    component.selectedFotoMedidor = file;
    component.onSubmit();
    flushMicrotasks();
    update.next({ idabonado: 123 });
    upload.error({ status: 503 });
    flushMicrotasks();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.selectedFotoMedidor).toBe(file);
    expect(component.guardando).toBeFalse();
    expect(alert.calls.mostRecent().args[0].title).toBe('No se pudieron guardar las fotos');
  }));

  it('permite guardar sin seleccionar nuevas fotos', fakeAsync(() => {
    component.onSubmit();
    flushMicrotasks();
    update.next({ idabonado: 123, fotocasaPath: 'casa.jpg', fotomedidorPath: 'medidor.jpg' });
    update.complete();
    flushMicrotasks();
    expect(service.uploadFotosAbonado).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['detalles-abonado']);
    expect(component.fotoCasaPreview).toBe('/abonados/123/fotocasa');
  }));
});
