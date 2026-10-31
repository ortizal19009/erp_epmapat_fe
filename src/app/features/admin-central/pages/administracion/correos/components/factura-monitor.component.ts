import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
@Component({
  standalone:true,selector:'app-factura-monitor',imports:[CommonModule,FormsModule],
  template:`
  <details class="card p-3 mb-3"><summary class="font-weight-bold">Seguimiento de facturas SRI y correo</summary>
    <div class="row mt-3">
      <label class="col-md-3">Desde <input type="date" class="form-control" [(ngModel)]="desde"></label>
      <label class="col-md-3">Hasta (exclusivo) <input type="date" class="form-control" [(ngModel)]="hasta"></label>
      <div class="col-md-2 pt-4"><button class="btn btn-primary" (click)="page=0;load()" [disabled]="busy">Consultar</button></div>
    </div>
    <p class="mt-2 text-danger" *ngIf="error">{{error}}</p>
    <div *ngIf="summary" class="alert alert-light">Total: {{summary.total}} ? Pendientes SRI: {{summary.pendientes_sri}} ? Pendientes correo: {{summary.pendientes_correo}} ? Confirmadas SMTP: {{summary.confirmadas}} ? Revisi?n: {{summary.revision}}</div>
    <div class="table-responsive"><table class="table table-sm" *ngIf="rows.length"><thead><tr><th>Factura</th><th>Estado ERP / SRI</th><th>Correo</th><th>Seguimiento</th><th>Acciones</th></tr></thead>
    <tbody><tr *ngFor="let row of rows"><td>{{row.idfactura}}<br>{{row.secuencial}}</td>
    <td>{{row.estado}} / {{row.estado_sri || 'Sin control registrado'}}</td><td>{{row.emailcomprador}}<br>{{row.notificacion || 'Sin tarea registrada'}}</td>
    <td>{{row.ultimo_error || row.errores}}<br>Pr?ximo: {{(row.proximo_intento || row.proxima_consulta) | date:'short'}}</td>
    <td><button class="btn btn-sm btn-outline-secondary m-1" (click)="action(row,'consultar')" [disabled]="busy">Consultar SRI</button>
    <button class="btn btn-sm btn-outline-primary m-1" (click)="action(row,'reintentar-correo')" [disabled]="busy || row.mail_enviado">Reintentar correo</button>
    <button class="btn btn-sm btn-outline-secondary m-1" (click)="correct(row)" [disabled]="busy || row.mail_enviado">Corregir destinatario</button>
    <button class="btn btn-sm btn-outline-secondary m-1" (click)="history(row)">Historial</button>
    <button class="btn btn-sm btn-outline-info m-1" (click)="download(row,'xml')">XML</button>
    <button class="btn btn-sm btn-outline-info m-1" (click)="download(row,'pdf')" [disabled]="!row.ride_disponible">RIDE</button>
    <button class="btn btn-sm btn-outline-warning m-1" *ngIf="row.notificacion==='UNCERTAIN'" (click)="resolve(row)">Conciliar aceptaci?n</button></td></tr></tbody></table></div>
    <div *ngIf="summary"><button class="btn btn-sm btn-light" [disabled]="page===0 || busy" (click)="page=page-1;load()">Anterior</button> P?gina {{page+1}}
    <button class="btn btn-sm btn-light" [disabled]="rows.length<30 || busy" (click)="page=page+1;load()">Siguiente</button></div>
    <pre class="p-2 bg-light" *ngIf="detail">{{detail | json}}</pre>
  </details>`
})
export class FacturaMonitorComponent {
  desde='';hasta='';rows:any[]=[];summary:any;detail:any;error='';busy=false;page=0;
  private base=environment.API_URL+'/api/v1/sri-control';
  constructor(private http:HttpClient){}
  private headers():HttpHeaders {
    let actor='operador';try{actor='usuario:'+JSON.parse(atob(sessionStorage.getItem('abc')||'')).idusuario;}catch{}
    return new HttpHeaders({'X-Operations-Actor':actor});
  }
  private fail(e:any):void{this.busy=false;this.error=e?.error?.reason||e?.error?.message||e?.error?.error||'No fue posible completar la operaci?n.';}
  load():void{
    this.busy=true;this.error='';const params:any={page:this.page,size:30};if(this.desde)params.desde=this.desde;if(this.hasta)params.hasta=this.hasta;
    this.http.get<any>(this.base,{headers:this.headers(),params}).subscribe({next:r=>{this.rows=r.rows;this.summary=r.summary;this.busy=false;},error:e=>this.fail(e)});
  }
  action(row:any,action:string,body:any={}):void{
    this.busy=true;this.error='';this.http.post(this.base+'/'+row.idfactura+'/'+action,body,{headers:this.headers()}).subscribe({next:()=>this.load(),error:e=>this.fail(e)});
  }
  correct(row:any):void{const email=window.prompt('Direcci?n corregida del contribuyente',row.emailcomprador);if(email && email!==row.emailcomprador)this.action(row,'corregir-correo',{email});}
  resolve(row:any):void{const evidence=window.prompt('Referencia o evidencia del proveedor que confirma la aceptaci?n del correo. No confirme sin verificarla.');if(evidence)this.action(row,'conciliar',{accepted:true,evidence});}
  history(row:any):void{this.http.get(this.base+'/'+row.idfactura+'/historial',{headers:this.headers()}).subscribe({next:r=>this.detail=r,error:e=>this.fail(e)});}
  download(row:any,type:string):void{
    this.http.get(this.base+'/'+row.idfactura+'/documento/'+type,{headers:this.headers(),responseType:'blob'}).subscribe({next:blob=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='factura_'+row.idfactura+'.'+type;a.click();URL.revokeObjectURL(url);},error:e=>this.fail(e)});
  }
}
