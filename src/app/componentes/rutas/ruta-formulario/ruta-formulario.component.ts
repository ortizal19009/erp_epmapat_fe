import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { RutasService } from 'src/app/servicios/rutas.service';
import { RutasGestionService } from 'src/app/servicios/rutas-gestion.service';
@Component({selector:'app-ruta-formulario',templateUrl:'./ruta-formulario.component.html',styleUrls:['../../../compartida/gestion-cuentas.css','./ruta-formulario.component.css']})
export class RutaFormularioComponent implements OnInit,OnDestroy {
  id:number|null=null;form:FormGroup;rutas:any[]=[];filas:any[]=[];seleccionadas=new Map<number,any>();
  origen:number|null=null;filtro='';pagina=0;tamano=20;total=0;totalPaginas=0;
  cargando=false;cargandoRuta=false;guardando=false;error='';errorCuentas='';mensaje='';versionHistorial=0;
  colorCabecera='#2c3e50';private consulta?:Subscription;private parametros?:Subscription;
  constructor(private fb:FormBuilder,private ruta:ActivatedRoute,private router:Router,private rutasApi:RutasService,
    private api:RutasGestionService,private auth:AutorizaService) {
    this.form=fb.group({codigo:['',[Validators.required,Validators.maxLength(8)]],descripcion:['',[Validators.required,Validators.maxLength(255)]],orden:[0,[Validators.required,Validators.min(0),Validators.pattern(/^\d+$/)]],estado:[true,Validators.required],motivo:['',Validators.maxLength(240)]});
  }
  ngOnInit() {
    sessionStorage.setItem('ventana','/rutas');
    try{const colores=JSON.parse(sessionStorage.getItem('/rutas')||'[]');if(colores[0])this.colorCabecera=colores[0];}catch{}
    this.parametros=this.ruta.paramMap.subscribe(async params=>{
      const id=Number(params.get('id')||(this.ruta.snapshot.routeConfig?.path==='modificar-rutas'?localStorage.getItem('idruta'):0));
      this.id=id>0?id:null;this.origen=null;this.seleccionadas.clear();this.cargandoRuta=true;this.error='';
      try {
        this.rutas=await firstValueFrom(this.rutasApi.getListaRutas(true));
        if(this.id){const datos=await firstValueFrom(this.rutasApi.getByIdruta(this.id));this.form.patchValue(datos);}
        else {const siguiente=await firstValueFrom(this.api.siguienteCodigo());this.form.patchValue({codigo:siguiente.codigo,orden:siguiente.orden});}
        this.buscar(0);
      }catch{this.error='No se pudieron cargar los datos de rutas. Vuelva al listado e intente nuevamente.';}
      finally{this.cargandoRuta=false;}
    });
  }
  ngOnDestroy(){this.consulta?.unsubscribe();this.parametros?.unsubscribe();}
  get origenes(){return this.rutas.filter(r=>r.idruta!==this.id);}
  get cuentasSeleccionadas(){return [...this.seleccionadas.values()];}
  get todasEnPagina(){return this.filas.length>0&&this.filas.every(f=>this.seleccionadas.has(f.idabonado));}
  buscar(pagina=0) {
    this.consulta?.unsubscribe();this.cargando=true;this.errorCuentas='';
    this.consulta=this.api.cuentas(this.origen,this.id,this.filtro.trim(),pagina,this.tamano).subscribe({next:p=>{this.filas=p.content;this.pagina=p.number;this.total=p.totalElements;this.totalPaginas=p.totalPages;this.cargando=false;},error:()=>{this.cargando=false;this.filas=[];this.errorCuentas='No se pudieron consultar las cuentas.';}});
  }
  seleccionar(fila:any,marcada:boolean){if(marcada&&this.seleccionadas.size<1000)this.seleccionadas.set(fila.idabonado,fila);else if(!marcada)this.seleccionadas.delete(fila.idabonado);}
  seleccionarPagina(marcada:boolean){this.filas.forEach(f=>this.seleccionar(f,marcada));}
  estadoCuenta(estado:number){return ({0:'Inactivo',1:'Activo',2:'Suspendido',3:'Suspendido y retirado'} as any)[estado]||'Sin definir';}
  volver(){this.router.navigate(['/rutas']);}
  async guardar(){
    this.form.markAllAsTouched();this.error='';this.mensaje='';
    if(this.form.invalid||this.guardando||this.cargandoRuta)return;
    if(this.seleccionadas.size&&!this.form.value.motivo.trim()){this.error='Indique el motivo del traslado de cuentas.';return;}
    if(this.seleccionadas.size&&!this.form.value.estado){this.error='Active la ruta para recibir las cuentas seleccionadas.';return;}
    this.guardando=true;
    const datos={...this.form.value,usuario:this.auth.idusuario,cuentas:this.cuentasSeleccionadas.map(c=>({cuenta:c.idabonado,rutaOrigen:c.rutaorigen??null}))};
    try {
      const guardada=await firstValueFrom(this.api.guardar(this.id,datos));
      const cantidad=this.seleccionadas.size;const nueva=!this.id;this.id=guardada.idruta;this.form.patchValue(guardada);this.form.patchValue({motivo:''});
      this.seleccionadas.clear();this.versionHistorial++;this.mensaje=`Ruta guardada correctamente. ${cantidad} cuentas trasladadas.`;
      if(nueva)await this.router.navigate(['/editar-ruta',this.id],{replaceUrl:true});else this.buscar(0);
    }catch(e:any){this.error=e.error?.message||'No se pudo confirmar el guardado. Actualice la ruta antes de volver a intentar.';}
    finally{this.guardando=false;}
  }
}
