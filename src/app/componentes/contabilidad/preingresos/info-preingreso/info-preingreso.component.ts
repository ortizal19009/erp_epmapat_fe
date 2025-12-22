import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PreingresoService } from 'src/app/servicios/contabilidad/preingreso.service';

@Component({
   selector: 'app-info-preingreso',
   templateUrl: './info-preingreso.component.html',
   styleUrls: ['./info-preingreso.component.css']
})

export class InfoPreingresoComponent implements OnInit {

   paringreso = {} as Paringreso; //Interface para los datos de la Partida de Ingresos
   elimdisabled = true;
   nomovimi: true;
   _movimientos: any;

   constructor(private router: Router, private preingService: PreingresoService) { }

   ngOnInit(): void {
      this.datosParingreso();
   }

   datosParingreso() {
      let idpresupue = sessionStorage.getItem('idpresupueToInfo');
      console.log("Recibe: "+idpresupue)
      this.preingService.getById(+idpresupue!).subscribe({
         next: (resp:any) => {
            this.paringreso.idpresupue = resp.idpresupue;
            this.paringreso.codpar = resp.codpar;
            this.paringreso.nompar = resp.nompar;
            this.paringreso.inicia = resp.inicia;
            this.paringreso.totmod = resp.totmod;
         },
         error: err => console.error(err.error),
      })
   }

   regresar() { this.router.navigate(['/preingresos']); }


   modiPresupuei() {
      sessionStorage.setItem("idpresupueToModi", this.paringreso.idpresupue.toString());
      this.router.navigate(['/modi-preingreso']);
   }

   eliminarPresupuei() {
      if (this.paringreso.idpresupue != null) {
         this.preingService.deletePreingreso(this.paringreso.idpresupue).subscribe({
            next: resp => this.router.navigate(['/preingresos']),
            error: err => console.error(err.error)
         })
      }
   }
}

interface Paringreso {
   idpresupue: number;
   nompar: String;
   codpar: String;
   inicia: number;
   totmod: number;
}
