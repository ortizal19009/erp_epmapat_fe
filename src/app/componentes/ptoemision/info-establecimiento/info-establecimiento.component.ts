import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CajaService } from 'src/app/servicios/caja.service';
import { PtoemisionService } from 'src/app/servicios/ptoemision.service';

@Component({
   selector: 'app-info-establecimiento',
   templateUrl: './info-establecimiento.component.html'
})

export class InfoEstablecimientoComponent implements OnInit {

   estab = {} as Estab; //Interface para los datos del Establecimiento
   _cajas: any;         //Cajas (Ptos de Emision) del Establecimeinto
   elimdisabled: boolean = false;

   constructor(private ptoService: PtoemisionService, private cajaService: CajaService, 
      private router: Router) { }

   ngOnInit(): void { this.datosEstablecimiento() }

   datosEstablecimiento() {
      let idptoemision = sessionStorage.getItem('idptoemisionToInfo');
      this.ptoService.getPtoemisionById(+idptoemision!).subscribe(datos => {
         this.estab.idptoemision = datos.idptoemision;   //Usado en eliminar
         this.estab.codigo = datos.establecimiento;
         this.estab.direccion = datos.direccion;
         this.estab.nroautorizacion = datos.nroautorizacion;
         this.estab.telefono = datos.telefono;
         this.estab.estado = "Inactivo"
         if (datos.estado = 1) { this.estab.estado = "Activo"; }
      }, error => console.log(error));
      this.puntosxEstab(+idptoemision!)
   }

   puntosxEstab(idptoemision: number) {
      this.cajaService.getByIdptoemision(idptoemision).subscribe(datos => {
         this._cajas = datos;
         if (this._cajas.length > 0) { this.elimdisabled = true }
      }, error => console.log(error));
   }

   eliminarEstablecimiento() {
         if (this.estab.idptoemision != null) {
         this.ptoService.deletePtoEmision(this.estab.idptoemision).subscribe(datos => {
            this.router.navigate(['/ptoemision']);
         }, error => console.log(error));
      }
   }

   regresar() { this.router.navigate(['/ptoemision']); }

}

interface Estab {
   idptoemision: number;
   codigo: String;
   direccion: String;
   nroautorizacion: String;
   telefono: String;
   estado: String
}
