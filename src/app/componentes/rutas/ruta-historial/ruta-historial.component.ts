import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { RutasGestionService } from 'src/app/servicios/rutas-gestion.service';
@Component({selector:'app-ruta-historial',templateUrl:'./ruta-historial.component.html',styleUrls:['../../../compartida/gestion-cuentas.css']})
export class RutaHistorialComponent implements OnChanges,OnDestroy {
  @Input() ruta:number|null=null;@Input() cuenta:number|null=null;@Input() version=0;
  pagina=0;totalPaginas=0;total=0;filas:any[]=[];cargando=false;error='';private consulta?:Subscription;
  constructor(private api:RutasGestionService) {}
  ngOnChanges(){this.filas=[];this.total=0;this.totalPaginas=0;this.pagina=0;this.listar(0);}ngOnDestroy(){this.consulta?.unsubscribe();}
  listar(pagina:number) {
    if(!this.ruta&&!this.cuenta)return;
    this.consulta?.unsubscribe();this.filas=[];this.cargando=true;this.error='';
    this.consulta=this.api.historial(this.ruta,this.cuenta,pagina).subscribe({next:p=>{this.filas=p.content;this.pagina=p.number;this.total=p.totalElements;this.totalPaginas=p.totalPages;this.cargando=false;},error:()=>{this.cargando=false;this.error='No se pudo cargar el historial de traslados.';}});
  }
}
