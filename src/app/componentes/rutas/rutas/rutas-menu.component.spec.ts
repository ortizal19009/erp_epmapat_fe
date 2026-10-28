import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Ng2SearchPipe } from 'ng2-search-filter';
import { RutasComponent } from './rutas.component';
import { RutasService } from 'src/app/servicios/rutas.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { RutasxemisionService } from 'src/app/servicios/rutasxemision.service';
import { UsrxrutaServiceService } from 'src/app/servicios/usrxruta-service.service';
describe('Menu de acciones del listado de rutas',()=>{
  let fixture:any,componente:RutasComponent,router:any;
  beforeEach(async()=>{
    router={navigate:jasmine.createSpy()};
    spyOn(RutasComponent.prototype,'ngOnInit');
    await TestBed.configureTestingModule({imports:[FormsModule],declarations:[RutasComponent,Ng2SearchPipe],schemas:[NO_ERRORS_SCHEMA],
      providers:[{provide:Router,useValue:router},...[RutasService,ColoresService,AutorizaService,LoadingService,AbonadosService,LecturasService,RutasxemisionService,UsrxrutaServiceService].map(provide=>({provide,useValue:{}}))]}).compileComponents();
    fixture=TestBed.createComponent(RutasComponent);componente=fixture.componentInstance;
    spyOn(componente,'seleccionarRuta');
    componente._rutas=[{idruta:10,codigo:'20400172',descripcion:'Ruta diez',estado:true,orden:1}];fixture.detectChanges();
  });
  afterEach(()=>fixture.destroy());
  it('abre el menu al pulsar el boton y entra a editar sin seleccionar la fila',()=>{
    fixture.nativeElement.querySelector('button[aria-controls="accionesRuta"]').click();fixture.detectChanges();
    const menu=fixture.nativeElement.querySelector('#accionesRuta');expect(menu).toBeTruthy();expect(menu.closest('.rutas-lista')).toBeNull();
    expect(componente.seleccionarRuta).not.toHaveBeenCalled();
    const anterior=localStorage.getItem('idruta');
    try{menu.querySelector('button').click();fixture.detectChanges();expect(router.navigate).toHaveBeenCalledWith(['editar-ruta',10]);expect(fixture.nativeElement.querySelector('#accionesRuta')).toBeNull();}
    finally{if(anterior===null)localStorage.removeItem('idruta');else localStorage.setItem('idruta',anterior);}
  });
  it('cierra el menu con Escape o al desplazar el listado',()=>{
    const boton=fixture.nativeElement.querySelector('button[aria-controls="accionesRuta"]');boton.click();fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));fixture.detectChanges();expect(componente.menuRuta).toBeNull();
    boton.click();fixture.detectChanges();fixture.nativeElement.querySelector('.rutas-lista').dispatchEvent(new Event('scroll'));fixture.detectChanges();expect(componente.menuRuta).toBeNull();
  });
});
