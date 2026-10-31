import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule,HttpTestingController } from '@angular/common/http/testing';
import { EmailAdminService } from './email-admin.service';
import { EmailAccountFormValue } from './email-admin.models';
import { environment } from 'src/environments/environment';
describe('EmailAdminService: persistencia y resultados inciertos',()=>{
  let service:EmailAdminService;let http:HttpTestingController;
  const url=environment.API_URL+'/api/v1/email-accounts/1';
  const form=():EmailAccountFormValue=>({code:'MAIL_FACT_01',name:'Facturacion',provider:'SMTP',fromAddress:'sender@example.invalid',fromName:'ERP',replyTo:'sender@example.invalid',transportType:'SMTP',host:'smtp.example.invalid',port:465,protocol:'smtp',securityType:'SSL_TLS',authRequired:true,username:'sender@example.invalid',password:'test-only-secret',apiUrl:'',apiAuthHeader:'',apiAuthScheme:'Bearer',apiKey:'',active:true,defaultAccount:false,defaultForType:'FACTURACION'});
  beforeEach(()=>{TestBed.configureTestingModule({imports:[HttpClientTestingModule]});service=TestBed.inject(EmailAdminService);http=TestBed.inject(HttpTestingController);});
  afterEach(()=>http.verify());
  it('edita la cuenta elegida sin reemplazar el host del operador',()=>{
    service.saveAccount(form(),1).subscribe();const req=http.expectOne(url);
    expect(req.request.method).toBe('PUT');expect(req.request.body.host).toBe('smtp.example.invalid');expect(req.request.body.password).toBe('test-only-secret');req.flush({id:1});
  });
  it('permite conservar la contrase?a guardada sin reenviarla',()=>{
    const value=form();value.password='';service.saveAccount(value,1).subscribe();const req=http.expectOne(url);
    expect(req.request.body.password).toBeUndefined();req.flush({id:1});
  });
  it('no rellena el formulario con una contrase?a recuperada del servidor',()=>{
    service.getAccountById(1).subscribe(account=>{expect(account.password).toBeUndefined();expect(account.hasPassword).toBeTrue();});
    http.expectOne(url).flush({id:1,password:'old-test-secret',hasPassword:true});
  });
  it('conserva UNCERTAIN y no lo presenta como pendiente de reintento',()=>{
    service.getEmails({page:0,size:20}).subscribe(page=>expect(page.rows[0].state).toBe('UNCERTAIN'));
    http.expectOne(req=>req.url===environment.API_URL+'/api/v1/emails').flush({content:[{id:'test-id',status:'UNCERTAIN'}],totalElements:1,totalPages:1});
  });
});
