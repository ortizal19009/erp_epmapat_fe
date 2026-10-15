import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { PersonalService } from 'src/app/servicios/rrhh/personal.service';
import { ThFilesService } from 'src/app/servicios/rrhh/th-files.service';
import { ThFilesComponent } from './th-files.component';

describe('Expediente digital por empleado', () => {
  let service: any;
  let component: ThFilesComponent;
  const data = [
    {idfile:3,tipo_doc:'CONTRATO',nombre_archivo:'Contrato de trabajo 2026',emisor:'Talento Humano',descripcion:'Contrato laboral y condiciones de ingreso.',estado:'ACTIVO',version_doc:1,origen:'ARCHIVO',tamano_bytes:230000,fecha_vencimiento:'2027-12-31'},
    {idfile:2,tipo_doc:'CERTIFICADO',nombre_archivo:'Certificado de capacitación',emisor:'Centro de formación',descripcion:'Certificación de competencias profesionales.',estado:'ACTIVO',version_doc:2,origen:'REFERENCIA',fecha_vencimiento:'2026-10-25',ruta_archivo:'https://ejemplo.test/certificado'},
    {idfile:1,tipo_doc:'TITULO',nombre_archivo:'Título profesional',estado:'ARCHIVADO',version_doc:1,origen:'REFERENCIA'}
  ];
  const personal = { getAllPersonal: () => of([{idpersonal:1,nombres:'Otro',apellidos:'Empleado'},{idpersonal:2,nombres:'Ana María',apellidos:'Torres García',identificacion:'EMPLEADO DE PRUEBA',codigo:'TH-002'}]) };
  const route = {snapshot:{queryParamMap:convertToParamMap({idpersonal:'2'})}};
  beforeEach(() => {
    jasmine.clock().install(); jasmine.clock().mockDate(new Date(2026,9,15,12));
    service=jasmine.createSpyObj('ThFilesService',['permissions','byPersonal','save','upload','download','changeState']);
    service.permissions.and.returnValue(of({userId:8,canWrite:true})); service.byPersonal.and.returnValue(of(data.map(f=>({...f}))));
    component=new ThFilesComponent(personal as any,service,{idusuario:8} as any,route as any); component.ngOnInit();
  });
  afterEach(() => jasmine.clock().uninstall());
  it('abre el expediente solicitado y calcula indicadores reales de vigencia', () => {
    expect(service.byPersonal).toHaveBeenCalledWith(2); expect(component.employeeName).toContain('Torres');
    expect(component.activeCount).toBe(2); expect(component.expiringCount).toBe(1); expect(component.archivedCount).toBe(1);
    component.query='capacitación'; expect(component.filtered.length).toBe(1);
    component.query=''; component.category='CONTRATO'; expect(component.filtered[0].idfile).toBe(3);
    component.category=''; component.stateFilter='ARCHIVADO'; expect(component.filtered[0].idfile).toBe(1);
  });
  it('descarta la respuesta anterior al cambiar de empleado', () => {
    const pending=new Subject<any>(); service.byPersonal.and.returnValue(pending); component.cargar();
    service.byPersonal.and.returnValue(of([])); component.idpersonal=1; component.cambiarPersonal();
    pending.next(data); pending.complete(); expect(component.files).toEqual([]);
  });
  it('sube el archivo con el empleado correcto y evita doble envío', () => {
    component.openForm(); component.selectFile(new File(['%PDF-1.7'],'contrato.pdf',{type:'application/pdf'}));
    const pending=new Subject<any>(); service.upload.and.returnValue(pending);
    component.guardar(); component.guardar(); expect(service.upload).toHaveBeenCalledTimes(1);
    expect(service.upload.calls.mostRecent().args[0].idpersonal_personal.idpersonal).toBe(2);
    pending.next({}); pending.complete(); expect(component.formOpen).toBeFalse(); expect(component.msg).toContain('registrado');
  });
  it('registra referencias sin archivo y conserva los datos al fallar', () => {
    component.openForm(); component.mode='REFERENCIA'; component.model.nombre_archivo='Certificado'; component.model.ruta_archivo='https://ejemplo.test';
    service.save.and.returnValue(throwError(() => ({error:{message:'No disponible'}}))); component.guardar();
    expect(service.save).toHaveBeenCalledTimes(1); expect(service.upload).not.toHaveBeenCalled();
    expect(component.formOpen).toBeTrue(); expect(component.model.nombre_archivo).toBe('Certificado'); expect(component.saving).toBeFalse();
  });
  it('valida archivos, fechas y permisos antes de guardar', () => {
    component.openForm(); component.selectFile(new File(['texto'],'script.html',{type:'text/html'}));
    expect(component.selectedFile).toBeNull(); component.guardar(); expect(service.upload).not.toHaveBeenCalled();
    component.mode='REFERENCIA'; component.model.nombre_archivo='Documento'; component.model.ruta_archivo='ruta';
    component.model.fecha_emision='2026-10-15'; component.model.fecha_vencimiento='2026-10-01'; component.guardar(); expect(service.save).not.toHaveBeenCalled();
    component.canWrite=false; component.guardar(); expect(service.save).not.toHaveBeenCalled();
  });
  it('solo abre enlaces HTTP/HTTPS y archiva sin borrar archivos', () => {
    expect(component.safeLink({ruta_archivo:'javascript:alert(1)'})).toBeNull();
    expect(component.safeLink({ruta_archivo:'https://ejemplo.test'})).toContain('https://');
    spyOn(window,'confirm').and.returnValue(true); service.changeState.and.returnValue(of({})); component.cambiarEstado(data[0]);
    expect(service.changeState).toHaveBeenCalledOnceWith(3,'ARCHIVADO');
  });
  it('renderiza la vista y el formulario con datos de prueba para revisión visual', async () => {
    await TestBed.configureTestingModule({imports:[CommonModule,FormsModule,RouterTestingModule],declarations:[ThFilesComponent],providers:[
      {provide:ThFilesService,useValue:service},{provide:PersonalService,useValue:personal},
      {provide:AutorizaService,useValue:{idusuario:8}},{provide:ActivatedRoute,useValue:route}
    ]}).compileComponents();
    const fixture=TestBed.createComponent(ThFilesComponent); fixture.detectChanges();
    await fixture.whenStable(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.document-card').length).toBe(3);
    expect(fixture.nativeElement.querySelector('#dossier-employee').selectedOptions[0].textContent).toContain('Torres');
    const snapshot=(name:string) => {
      const styles=Array.from(document.querySelectorAll('style')).map(s=>s.textContent).filter(s=>s?.includes('.dossier-page')).join('\n');
      const clone=fixture.nativeElement.cloneNode(true) as HTMLElement;
      const source=fixture.nativeElement.querySelectorAll('input,textarea,select') as NodeListOf<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
      clone.querySelectorAll('input,textarea,select').forEach((copy,index) => {
        const original=source[index];
        if (original instanceof HTMLSelectElement) Array.from(original.options).forEach((option,i) => {
          if (option.selected) copy.querySelectorAll('option')[i].setAttribute('selected','');
          else copy.querySelectorAll('option')[i].removeAttribute('selected');
        });
        else if (original instanceof HTMLTextAreaElement) copy.textContent=original.value;
        else { copy.setAttribute('value',original.value); if (original.checked) copy.setAttribute('checked',''); }
      });
      const html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="http://localhost:4200/styles.css"><style>body{margin:0;font-family:Arial,sans-serif}*{box-sizing:border-box}'+styles+'</style></head><body>'+clone.outerHTML+'</body></html>';
      console.log('TH_FILES_SNAPSHOT_'+name+':'+btoa(unescape(encodeURIComponent(html))));
    };
    snapshot('MAIN'); fixture.componentInstance.openForm(); fixture.detectChanges();
    jasmine.clock().tick(1); await fixture.whenStable(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull(); snapshot('FORM'); fixture.destroy();
  });
});
