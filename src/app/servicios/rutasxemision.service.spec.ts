import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';
import { RutasxemisionService } from './rutasxemision.service';

const baseUrl = `${environment.API_URL}/rutasxemision`;
describe('RutasxemisionService: notificaciones al cerrar', () => {
  let service: RutasxemisionService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(RutasxemisionService);
    http = TestBed.inject(HttpTestingController);
    spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false, isDenied: false, isDismissed: true });
  });
  afterEach(() => http.verify());

  it('encola los correos despues de guardar el cierre desde lecturas', () => {
    let respuesta: any;
    service.updateRutaxemision(10, { estado: 1 }).subscribe(r => respuesta = r);
    http.expectNone(`${baseUrl}/10/notificar-cierre`);
    const cierre = http.expectOne(`${baseUrl}/10`);
    expect(cierre.request.method).toBe('PUT');
    cierre.flush({ estado: 1 });
    expect(respuesta).toBeUndefined();
    const aviso = http.expectOne(`${baseUrl}/10/notificar-cierre`);
    expect(aviso.request.method).toBe('POST');
    expect(aviso.request.body).toEqual({});
    aviso.flush({ encolados: 2, sinCalcular: 0 });
    expect(respuesta.estado).toBe(1);
  });

  it('tambien notifica el cierre masivo desde emisiones', () => {
    service.update_Rutaxemision(20, { estado: 1 } as any).subscribe();
    const cierre = http.expectOne(`${baseUrl}/20`);
    expect(cierre.request.method).toBe('PATCH');
    cierre.flush({ estado: 1 });
    http.expectOne(`${baseUrl}/20/notificar-cierre`).flush({ encolados: 1, sinCalcular: 0 });
  });

  it('no notifica rutas abiertas ni cierres que no se guardaron', () => {
    service.updateRutaxemision(10, { estado: 0 }).subscribe();
    http.expectOne(`${baseUrl}/10`).flush({ estado: 0 });
    http.expectNone(`${baseUrl}/10/notificar-cierre`);
    service.updateRutaxemision(11, { estado: 1 }).subscribe({ error: () => {} });
    http.expectOne(`${baseUrl}/11`).flush({}, { status: 500, statusText: 'Error' });
    http.expectNone(`${baseUrl}/11/notificar-cierre`);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  it('conserva el cierre y avisa si no se pudieron preparar los correos', () => {
    let respuesta: any;
    service.updateRutaxemision(10, { estado: 1 }).subscribe(r => respuesta = r);
    http.expectOne(`${baseUrl}/10`).flush({ estado: 1 });
    http.expectOne(`${baseUrl}/10/notificar-cierre`).flush({}, { status: 500, statusText: 'Error' });
    expect(respuesta.estado).toBe(1);
    expect(Swal.fire).toHaveBeenCalled();
  });
});
