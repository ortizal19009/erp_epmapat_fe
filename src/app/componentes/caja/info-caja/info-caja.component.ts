import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { CajaService } from 'src/app/servicios/caja.service';
import { RecaudaxcajaService } from 'src/app/servicios/recaudaxcaja.service';

@Component({
   selector: 'app-info-caja',
   templateUrl: './info-caja.component.html',
   styleUrls: ['./info-caja.component.css']
})
export class InfoCajaComponent implements OnInit {

   caja = {} as Caja; //Interface para los datos de la Caja
   elimdisabled: boolean = false;
   idcaja: number;
   _recaudaxcaja: any;
   formFechas: FormGroup;
   formCaja: FormGroup;
   filtro: string;

   constructor(private router: Router, private fb: FormBuilder, private cajaService: CajaService, private recxcaja: RecaudaxcajaService ) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/cajas');
      let coloresJSON = sessionStorage.getItem('/cajas');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      
      this.idcaja = +sessionStorage.getItem('idcajaToInfo')!;

      this.formFechas = this.fb.group({
         caja: '',
         desde: '',
         hasta: ''
      });

      this.datosCaja();

      const fechaActual = new Date();
      let hasta = fechaActual.toISOString().slice(0, 10);
      let fechaRestada: Date = new Date();
      fechaRestada.setMonth(fechaActual.getMonth() - 1);
      let desde = fechaRestada.toISOString().slice(0, 10);
      this.formFechas.patchValue({
         desde: desde,
         hasta: hasta,
      });
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

    datosCaja() {
      this.cajaService.getById(this.idcaja).subscribe({
         next: datos => {
            this.caja.idcaja = datos.idcaja;
            this.caja.codigo = datos.codigo;
            this.caja.descripcion = datos.descripcion;
            this.caja.ptoemi = datos.idptoemision_ptoemision.establecimiento;
            this.caja.estado = "Habilitado";
            if (datos.estado == 0) this.caja.estado = "Inahibilitado";
            this.formFechas.patchValue({
               caja: datos.idptoemision_ptoemision.establecimiento +'-'+ datos.codigo + ' ' + datos.descripcion,
            });      
            this.recaudacionxcaja();
         },
         error: err => console.error(err.error)
      });
   }

   recaudacionxcaja(){
      this.recxcaja.getByIdcaja(this.idcaja, this.formFechas.value.desde, this.formFechas.value.hasta ).subscribe({
         next: datos => {
            this._recaudaxcaja = datos;
            // console.log('Busqueda ok: ', this._recaudaxcaja)
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
