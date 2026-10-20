import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { Abonados } from 'src/app/modelos/abonados';
import { Clientes } from 'src/app/modelos/clientes';
type CuentaDestino = Omit<Abonados,'idcliente_clientes'|'idresponsable'> & {idcliente_clientes:Clientes|null;idresponsable:Clientes|null};
@Component({selector:'app-nc-endosos',templateUrl:'./nc-endosos.component.html',styleUrls:['./nc-endosos.component.css']})
export class NcEndososComponent implements OnInit {
 readonly api=environment.API_URL+'/api/nc-endosos';
 permisos:string[]=[]; filas:any[]=[]; seleccionado:any=null; historial:any[]=[]; saldo:any=null;
 filtrosMinimizados=true;
 ocupada=false; error=''; estado=''; cuenta=''; desde=''; hasta='';
 notaFiltro=''; usuarioFiltro=''; montoFiltro='';
 form=this.fb.group({notaOrigenId:[null,Validators.required],documentoRespaldo:['',[Validators.required,Validators.maxLength(120)]],referencia:['',[Validators.required,Validators.maxLength(80)]],motivo:['',[Validators.required,Validators.minLength(10),Validators.maxLength(2000)]],destinos:this.fb.array([])});
 destinoBusqueda:AbstractControl|null=null; tipoBusqueda='cuenta'; textoBusqueda=''; cuentas:CuentaDestino[]=[]; buscandoCuenta=false; errorCuenta=''; paginaCuenta=0; paginasCuenta=0; busquedaRealizada=false;
 private consultaCuenta=0;
 private clave=this.uuid(); private operacion=this.uuid();
 constructor(private fb:FormBuilder,private http:HttpClient,private route:ActivatedRoute,private abonados:AbonadosService){}
 get destinos(){return this.form.get('destinos') as FormArray;}
 get totalCentavos(){return this.destinos.controls.reduce((n,c)=>{const valor=Number(c.value.valor||0);return n+(Number.isFinite(valor)?Math.round(valor*100):0);},0);}
 get total(){return this.totalCentavos/100;}
 get saldoVigente(){return this.saldo&&Number(this.saldo.idntacredito)===Number(this.form.value.notaOrigenId);}
 get proyectarSaldo(){return ['BORRADOR','PENDIENTE','AUTORIZADO'].includes(this.seleccionado?.estado);}
 get saldoRestante(){return this.saldoVigente?(Math.round(Number(this.saldo.disponible)*100)-(this.proyectarSaldo?this.totalCentavos:0))/100:0;}
 get excedeSaldo(){return this.saldoVigente&&this.proyectarSaldo&&this.saldoRestante<0;}
 get cuentasAsignadas(){return this.destinos.controls.filter(d=>!!d.value.cuenta).length;}
 puede(p:string){return this.permisos.includes(p);}
 async ngOnInit(){sessionStorage.setItem('ventana','/ntacredito');try{this.permisos=await firstValueFrom(this.http.get<string[]>(this.api+'/permisos'));if(this.puede('CONSULTAR'))await this.cargar();const id=this.route.snapshot.queryParamMap.get('id');if(id&&this.puede('CONSULTAR')){await this.ver(Number(id));return;}if(this.route.snapshot.queryParamMap.get('nuevo')==='1'&&this.puede('SOLICITAR')){this.nuevo();return;}const nota=this.route.snapshot.queryParamMap.get('nota');if(nota&&this.puede('SOLICITAR')){this.nuevo();this.form.patchValue({notaOrigenId:Number(nota)} as any);await this.consultarSaldo();}}catch(e){this.fallo(e);}}
 async cargar(){this.filas=await firstValueFrom(this.http.get<any[]>(this.api,{params:{estado:this.estado,...(this.cuenta?{cuenta:this.cuenta}:{}),desde:this.desde,hasta:this.hasta}}));}
 get visibles(){return this.filas.filter(f=>(!this.notaFiltro||String(f.nota_origen_id)===this.notaFiltro)&&(!this.usuarioFiltro||String(f.solicitante_id)===this.usuarioFiltro)&&(!this.montoFiltro||Number(f.monto_total)===Number(this.montoFiltro)));}
 nuevo(){this.cerrarBuscador();this.seleccionado={estado:'BORRADOR'};this.historial=[];this.saldo=null;this.clave=this.uuid();this.operacion=this.uuid();this.form.reset();this.destinos.clear();this.agregar();}
 agregar(){if(this.destinos.length<20)this.destinos.push(this.fb.group({cuenta:[null,Validators.required],cuentaDescripcion:[''],valor:[null,[Validators.required,Validators.min(0.01),Validators.pattern(/^\d+(\.\d{1,2})?$/)]]}));}
 abrirBuscador(destino:AbstractControl){this.cerrarBuscador();this.destinoBusqueda=destino;this.tipoBusqueda='cuenta';this.textoBusqueda='';}
 cerrarBuscador(){this.consultaCuenta++;this.destinoBusqueda=null;this.cuentas=[];this.errorCuenta='';this.buscandoCuenta=false;this.busquedaRealizada=false;this.paginasCuenta=0;}
 async buscarCuentas(pagina=0){
  const texto=this.textoBusqueda.trim();this.errorCuenta='';this.cuentas=[];this.busquedaRealizada=false;this.paginasCuenta=0;
  if(!texto){this.errorCuenta='Ingrese una cuenta, cédula o nombre para buscar.';return;}
  if(this.tipoBusqueda==='cuenta'&&(!/^\d+$/.test(texto)||!Number.isSafeInteger(Number(texto))||Number(texto)<1)){this.errorCuenta='Ingrese un número de cuenta válido.';return;}
  const consulta=++this.consultaCuenta;this.buscandoCuenta=true;
  try{
   const filtros=this.tipoBusqueda==='cuenta'?{cuenta:Number(texto)}:this.tipoBusqueda==='cedula'?{cedula:texto}:{responsable:texto};
   const resultado=await firstValueFrom(this.abonados.getAbonadosPage(pagina,10,'idabonado,asc',filtros));
   if(consulta!==this.consultaCuenta)return;
   this.cuentas=resultado.content;this.paginaCuenta=resultado.number;this.paginasCuenta=resultado.totalPages;this.busquedaRealizada=true;
  }catch(e){if(consulta===this.consultaCuenta)this.errorCuenta='No se pudieron consultar las cuentas. Intente nuevamente.';}
  finally{if(consulta===this.consultaCuenta)this.buscandoCuenta=false;}
 }
 seleccionarCuenta(cuenta:CuentaDestino){
  if(!this.destinoBusqueda||!this.destinos.controls.includes(this.destinoBusqueda)||this.seleccionado?.estado!=='BORRADOR'||!this.puede('SOLICITAR'))return;
  if(this.destinos.controls.some(d=>d!==this.destinoBusqueda&&Number(d.value.cuenta)===cuenta.idabonado)){this.errorCuenta='Esta cuenta ya está agregada como destino.';return;}
  this.destinoBusqueda.patchValue({cuenta:cuenta.idabonado,cuentaDescripcion:String(cuenta.idcliente_clientes?.nombre||'')});this.destinoBusqueda.markAsDirty();this.cerrarBuscador();
 }
 quitarDestino(i:number){if(this.destinoBusqueda===this.destinos.at(i))this.cerrarBuscador();this.destinos.removeAt(i);}
 async consultarSaldo(){const nota=this.form.value.notaOrigenId;this.saldo=null;if(!nota)return;try{const saldo=await firstValueFrom(this.http.get(this.api+'/notas/'+nota+'/disponibilidad'));if(this.form.value.notaOrigenId===nota)this.saldo=saldo;}catch(e){this.fallo(e);}}
 async ver(id:number){this.cerrarBuscador();try{this.seleccionado=await firstValueFrom(this.http.get(this.api+'/'+id));this.historial=await firstValueFrom(this.http.get<any[]>(this.api+'/'+id+'/historial'));this.clave=this.seleccionado.idempotency_key;this.operacion=this.seleccionado.operacion_key||this.uuid();this.form.patchValue({notaOrigenId:this.seleccionado.nota_origen_id,documentoRespaldo:this.seleccionado.documento_respaldo,referencia:this.seleccionado.referencia,motivo:this.seleccionado.motivo});this.destinos.clear();for(const d of this.seleccionado.destinos)this.destinos.push(this.fb.group({cuenta:[d.cuenta_destino,Validators.required],cuentaDescripcion:[d.titular||''],valor:[d.monto,[Validators.required,Validators.min(0.01),Validators.pattern(/^\d+(\.\d{1,2})?$/)]]}));await this.consultarSaldo();}catch(e){this.fallo(e);}}
 async guardar(){this.form.markAllAsTouched();if(this.form.invalid||!this.destinos.length)return;if(!this.saldoVigente){this.error='Consulte la disponibilidad de la nota antes de guardar.';return;}if(this.excedeSaldo){this.error='El total asignado supera el saldo disponible de la nota.';return;}this.ocupada=true;this.error='';try{const body={...this.form.value,idempotencyKey:this.clave,version:this.seleccionado.version,destinos:this.destinos.value.map((d:any)=>({cuenta:Number(d.cuenta),valor:String(d.valor)}))};const obs=this.seleccionado.id?this.http.put<any>(this.api+'/'+this.seleccionado.id,body):this.http.post<any>(this.api,body);const r=await firstValueFrom(obs);await this.ver(r.id);await this.cargar();}catch(e){this.fallo(e);}finally{this.ocupada=false;}}
 async accion(accion:string){const decision=await Swal.fire({title:accion==='ejecutar'?'Ejecutar transferencia de saldo':accion,input:'textarea',inputLabel:'Motivo (10 a 2000 caracteres)',showCancelButton:true,inputValidator:v=>!v||v.trim().length<10||v.length>2000?'Complete el motivo':undefined});if(!decision.isConfirmed)return;this.ocupada=true;this.error='';try{const r:any=await firstValueFrom(this.http.post(this.api+'/'+this.seleccionado.id+'/'+accion,{version:this.seleccionado.version,motivo:decision.value,operationKey:this.operacion}));await this.ver(r.id);await this.cargar();}catch(e){this.fallo(e);}finally{this.ocupada=false;}}
 async reporte(formato:string,individual=false){try{const blob=await firstValueFrom(this.http.get(this.api+(individual?'/'+this.seleccionado.id+'/comprobante':'/reporte'),{params:{formato,estado:this.estado,...(this.cuenta?{cuenta:this.cuenta}:{}),desde:this.desde,hasta:this.hasta},responseType:'blob'}));const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='endosos.'+formato;link.click();setTimeout(()=>URL.revokeObjectURL(url),15000);}catch(e){this.fallo(e);}}
 async subirRespaldo(event:Event){const file=(event.target as HTMLInputElement).files?.[0];if(!file||!this.seleccionado?.id)return;const body=new FormData();body.append('archivo',file);this.ocupada=true;try{await firstValueFrom(this.http.post(this.api+'/'+this.seleccionado.id+'/respaldo',body));await this.ver(this.seleccionado.id);}catch(e){this.fallo(e);}finally{this.ocupada=false;}}
 async descargarRespaldo(){try{const blob=await firstValueFrom(this.http.get(this.api+'/'+this.seleccionado.id+'/respaldo',{responseType:'blob'}));const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='respaldo.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),15000);}catch(e){this.fallo(e);}}
 uuid():string { const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=Array.from(b,n=>n.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20); }
 fallo(e:any){this.error=e?.error?.message||e?.error?.detail||e?.message||'No se pudo completar la operacion';}
}
