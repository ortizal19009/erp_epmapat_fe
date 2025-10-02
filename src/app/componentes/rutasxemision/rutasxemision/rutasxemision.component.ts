import { Component, Input, OnInit } from '@angular/core';
import { RutasxemisionService } from 'src/app/servicios/rutasxemision.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { EmisionService } from 'src/app/servicios/emision.service';

@Component({
   selector: 'app-rutasxemision',
   templateUrl: './rutasxemision.component.html',
})

export class RutasxemisionComponent implements OnInit {

   emision = {} as Emision; //Interface para los datos de la Emision
   _rutasxemi: any;
   filtro: string;
   _emision: any;
   //emision: String;

   constructor(private ruxemiService: RutasxemisionService, private emiService: EmisionService,
       private router: Router) { }

   ngOnInit(): void {
      let idemision = sessionStorage.getItem("idemisionToRutasxemision");
      this.emisionDatos( +idemision! );
      this.ruxemiService.getByIdEmision(+idemision!).subscribe({
         next: datos => this._rutasxemi = datos,
         error: err => console.log(err.error)
      })
   }

   emisionDatos(idemision: number){
      this.emiService.getByIdemision(+idemision!).subscribe(datos => {
         this._emision = datos;
         this.emision.emision = this._emision.emision;
      }, error => console.log(error))
   }

   regresar() { this.router.navigate(['/emisiones']); }

   lecturas(idrutaxemision: number){ 
      sessionStorage.setItem("idrutaxemisionToLectura", idrutaxemision.toString());
      this.router.navigate(['lecturas']);
   }
  
}

interface Emision {
   idmision: number;
   emision: String;
}
