import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
interface Filtros {estado:string;cuenta:string;desde:string;hasta:string;}
@Component({selector:'app-nc-endosos-listado',templateUrl:'./nc-endosos-listado.component.html',styleUrls:['../nc-endosos.component.css']})
export class NcEndososListadoComponent implements OnInit {
 readonly api=environment.API_URL+'/api/nc-endosos';
 readonly estados=['EJECUTADO','REVERTIDO','BORRADOR','PENDIENTE','AUTORIZADO','RECHAZADO','ANULADO'];
 filtros:Filtros={estado:'EJECUTADO',cuenta:'',desde:'',hasta:''};
 aplicados:Filtros|null=null;permisos:string[]=[];filas:any[]=[];resumen:any={total:0,monto_total:0,monto_ejecutado:0};
 pagina=0;tamanio=20;cargando=false;exportando=false;error='';filtrosMinimizados=false;
 constructor(private http:HttpClient){}
 get paginas(){return Math.ceil(Number(this.resumen.total)/this.tamanio);}
 puede(permiso:string){return this.permisos.includes(permiso);}
 async ngOnInit(){sessionStorage.setItem('ventana','/ntacredito');try{this.permisos=await firstValueFrom(this.http.get<string[]>(this.api+'/permisos'));if(this.puede('CONSULTAR'))await this.buscar();}catch(e){this.fallo(e);}}
 private parametros(f:Filtros){return {...(f.estado?{estado:f.estado}:{}),...(f.cuenta?{cuenta:f.cuenta}:{}),...(f.desde?{desde:f.desde}:{}),...(f.hasta?{hasta:f.hasta}:{})};}
 async buscar(pagina=0,paginar=false){
  if(this.cargando)return;
  const filtros=paginar&&this.aplicados?{...this.aplicados}:{...this.filtros,cuenta:this.filtros.cuenta.trim()};
  this.error='';
  if(filtros.cuenta&&(!/^\d+$/.test(filtros.cuenta)||!Number.isSafeInteger(Number(filtros.cuenta))||Number(filtros.cuenta)<1)){this.error='Ingrese una cuenta v\u00e1lida.';return;}
  if(filtros.desde&&filtros.hasta&&filtros.desde>filtros.hasta){this.error='La fecha desde no puede ser mayor que hasta.';return;}
  this.cargando=true;
  try{const r:any=await firstValueFrom(this.http.get(this.api+'/consulta',{params:{...this.parametros(filtros),page:pagina,size:this.tamanio}}));this.filas=r.content;this.resumen=r.resumen;this.pagina=r.page;this.aplicados=filtros;}catch(e){this.fallo(e);}finally{this.cargando=false;}
 }
 async limpiar(){this.filtros={estado:'',cuenta:'',desde:'',hasta:''};await this.buscar();}
 async reporte(formato:'pdf'|'xlsx'){
  if(!this.aplicados||this.exportando||this.cargando)return;
  this.exportando=true;this.error='';
  try{const blob=await firstValueFrom(this.http.get(this.api+'/reporte',{params:{...this.parametros(this.aplicados),formato},responseType:'blob'}));const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='endosos-'+(this.aplicados.estado||'todos')+'.'+formato;a.click();setTimeout(()=>URL.revokeObjectURL(url),15000);}catch(e){this.fallo(e);}finally{this.exportando=false;}
 }
 fallo(e:any){this.error=e?.error?.message||e?.error?.detail||'No se pudo completar la consulta. Intente nuevamente.';}
}
