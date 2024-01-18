import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CajaService } from 'src/app/servicios/caja.service';

@Component({
   selector: 'app-info-caja',
   templateUrl: './info-caja.component.html'
})

export class InfoCajaComponent implements OnInit {

   caja = {} as Caja; //Interface para los datos de la Caja
   elimdisabled: boolean = false;

   constructor(private router: Router, private cajaService: CajaService) { }

   ngOnInit(): void {
      this.datosCaja();
   }

   datosCaja() {
      let idcaja = sessionStorage.getItem('idcajaToInfo');
      this.cajaService.getById(+idcaja!).subscribe({
         next: datos => {
            this.caja.idcaja = datos.idcaja;
            this.caja.codigo = datos.codigo;
            this.caja.descripcion = datos.descripcion;
            this.caja.ptoemi = datos.idptoemision_ptoemision.establecimiento;
            this.caja.estado = "Activa";
            if (datos.estado == 0) this.caja.estado = "Inactiva"
         },
         error: err => console.error(err.error)
      });
   }

   regresar() { this.router.navigate(['/cajas']); }

   modiCaja() {
      localStorage.setItem("idcajaToModi", this.caja.idcaja.toString());
      this.router.navigate(['modicaja', this.caja.idcaja]);
   }

   eliminarCaja() {
      if (this.caja.idcaja != null) {
         this.cajaService.deleteCaja(this.caja.idcaja).subscribe(datos => {
            this.router.navigate(['/cajas']);
         }, error => console.log(error));
      }
   }

}

interface Caja {
   idcaja: number;
   codigo: String;
   descripcion: String;
   ptoemi: String;
   estado: String
}
