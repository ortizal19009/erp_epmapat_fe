import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TramitesService } from 'src/app/servicios/ctramites.service';

@Component({
   selector: 'app-info-tramite',
   templateUrl: './info-tramite.component.html',
   styleUrls: ['./info-tramite.component.css']
})

export class InfoTramiteComponent implements OnInit {

   tramite = {} as Tramite; //Interface para los datos del Trámite
   elimdisabled: boolean = true;

   constructor(private router: Router, private traService: TramitesService ) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/tramites');
      let coloresJSON = sessionStorage.getItem('/tramites');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.datosTramite();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   datosTramite() {
      let idtramite = sessionStorage.getItem('idtramiteToInfo');
      this.traService.getTramiteById(+idtramite!).subscribe(datos => {
         this.tramite.idtramite = datos.idtramite;
         this.tramite.descripcion = datos.descripcion;
         this.tramite.nomcli = datos.idcliente_clientes.nombre;
         this.tramite.fecha = datos.feccrea;
         this.tramite.validohasta = datos.validohasta;
         this.tramite.total = datos.total;
      }, error => console.error(error));
   }

   public modiTramite(idtramite: number) {
      this.router.navigate(['moditramite', idtramite]);
   }

   regresar() { this.router.navigate(['/tramites']); }

}

interface Tramite {
   idtramite: number;
   descripcion: String;
   nomcli: String;
   total: number;
   fecha: Date;
   validohasta: Date;
}
