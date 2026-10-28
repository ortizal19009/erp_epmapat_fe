import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RutasGestionService } from './rutas-gestion.service';
describe('API de gestion de rutas',()=>{
  let api:RutasGestionService,http:HttpTestingController;
  beforeEach(()=>{TestBed.configureTestingModule({imports:[HttpClientTestingModule]});api=TestBed.inject(RutasGestionService);http=TestBed.inject(HttpTestingController);});
  afterEach(()=>http.verify());
  it('usa POST para crear y PUT para editar',()=>{
    api.guardar(null,{codigo:'N'}).subscribe();let req=http.expectOne(r=>r.url.endsWith('/rutas/gestion'));expect(req.request.method).toBe('POST');req.flush({idruta:10});
    api.guardar(10,{codigo:'E'}).subscribe();req=http.expectOne(r=>r.url.endsWith('/rutas/gestion/10'));expect(req.request.method).toBe('PUT');req.flush({idruta:10});
  });
  it('filtra el historial por cuenta y publica los datos estructurados del cambio',()=>{
    let resultado:any;api.historial(null,123,2).subscribe(p=>resultado=p);
    const req=http.expectOne(r=>r.url.endsWith('/historial'));expect(req.request.params.get('cuenta')).toBe('123');expect(req.request.params.get('page')).toBe('2');
    req.flush({content:[{objectJson:JSON.stringify({rutaAnterior:{id:20},rutaNueva:{id:30},origen:'ABONADOS'})}]});
    expect(resultado.content[0].cambio.rutaNueva.id).toBe(30);
  });
});
