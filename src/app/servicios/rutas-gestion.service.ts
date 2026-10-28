import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs';
@Injectable({providedIn:'root'})
export class RutasGestionService {
  private base=environment.API_URL+'/rutas/gestion';
  constructor(private http:HttpClient) {}
  siguienteCodigo(){return this.http.get<{codigo:string;orden:number}>(this.base+'/siguiente-codigo');}
  guardar(id:number|null,datos:any) {return id?this.http.put<any>(`${this.base}/${id}`,datos):this.http.post<any>(this.base,datos);}
  cuentas(origen:number|null,destino:number|null,filtro:string,page:number,size:number) {
    let params=new HttpParams().set('filtro',filtro).set('page',page).set('size',size);
    if(origen)params=params.set('origen',origen);if(destino)params=params.set('destino',destino);
    return this.http.get<any>(this.base+'/cuentas',{params});
  }
  historial(ruta:number|null,cuenta:number|null,page=0) {
    let params=new HttpParams().set('page',page).set('size',20);
    if(ruta)params=params.set('ruta',ruta);if(cuenta)params=params.set('cuenta',cuenta);
    return this.http.get<any>(this.base+'/historial',{params}).pipe(map(p=>({...p,content:p.content.map((fila:any)=>{
      let cambio:any={};try{cambio=JSON.parse(fila.objectJson||'{}');}catch{}
      return {...fila,cambio};
    })})));
  }
}
