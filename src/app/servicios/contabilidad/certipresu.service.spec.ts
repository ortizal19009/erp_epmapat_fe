import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule,HttpTestingController } from '@angular/common/http/testing';
import { CertipresuService } from './certipresu.service';
describe('Consulta HTTP de certificaciones',()=>{
 let api:CertipresuService,http:HttpTestingController;
 beforeEach(()=>{TestBed.configureTestingModule({imports:[HttpClientTestingModule]});api=TestBed.inject(CertipresuService);http=TestBed.inject(HttpTestingController);});afterEach(()=>http.verify());
 it('omite filtros vacios y conserva el tipo de certificacion',()=>{
  api.getDesdeHasta(1,null,null,'',null).subscribe();const req=http.expectOne(r=>r.url.endsWith('/certipresu'));expect(req.request.params.keys()).toEqual(['tipo']);req.flush([]);
 });
 it('envia limites parciales y fechas ISO sin undefined ni ceros artificiales',()=>{
  api.getDesdeHasta(2,20,null,'2026-01-01',null).subscribe();const req=http.expectOne(r=>r.url.endsWith('/certipresu'));
  expect(req.request.params.get('tipo')).toBe('2');expect(req.request.params.get('desdeNum')).toBe('20');expect(req.request.params.has('hastaNum')).toBeFalse();expect(req.request.params.get('desdeFecha')).toBe('2026-01-01');req.flush([]);
 });
});
