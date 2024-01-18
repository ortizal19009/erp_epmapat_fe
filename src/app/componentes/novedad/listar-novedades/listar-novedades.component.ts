import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Novedad } from 'src/app/modelos/novedad.model';
import { NovedadesService } from 'src/app/servicios/novedades.service';

@Component({
   selector: 'app-novedades-list',
   templateUrl: './listar-novedades.component.html',
   styleUrls: ['./listar-novedades.component.css']
})

export class ListarNovedadesComponent implements OnInit {

   _novedades: any;
   filtro: string;

   constructor(private novService: NovedadesService, private router: Router) { }

   ngOnInit(): void { this.listarNovedades() }

   listarNovedades(){
      this.novService.getAll().subscribe(datos => {
         this._novedades = datos},error => console.log(error))
    }
  
   public info(idnovedad: number) {
      sessionStorage.setItem('idnovedadToInfo', idnovedad.toString());
      this.router.navigate(['novedad-detalle']);
    }
  
}

