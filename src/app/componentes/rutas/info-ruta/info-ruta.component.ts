import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { RutasService } from 'src/app/servicios/rutas.service';

@Component({
   selector: 'app-info-ruta',
   templateUrl: './info-ruta.component.html',
   styleUrls: ['./info-ruta.component.css']
})
export class InfoRutaComponent implements OnInit {

   ruta = {} as Ruta; //Interface para los datos de la Ruta
   disabled: boolean = false;
   _abonados: any;

   constructor(private router: Router, private rutaService: RutasService,
      private aboService: AbonadosService) { }

   ngOnInit(): void {
      this.datosRuta();
   }

   datosRuta() {
      let idruta = sessionStorage.getItem('idrutaToInfo');
      this.rutaService.getByIdruta(+idruta!).subscribe({
         next: datos => {
            this.ruta.idruta = datos.idruta;
            this.ruta.codigo = datos.codigo;
            this.ruta.descripcion = datos.descripcion;
            this.ruta.orden = datos.orden;
            this.ruta.feccrea = datos.feccrea;
            this.abonadosxRuta(this.ruta.idruta);
         },
         error: err => console.error(err.error)
      });
   }

   abonadosxRuta(idruta: number) {
      this.aboService.getByIdruta(idruta).subscribe({
         next: datos => {
            this._abonados = datos;
            if (this._abonados[0].idabonado > 0) this.disabled = true;
         },
         error: err => console.error(err.error)
      })
   }

   regresar() { this.router.navigate(['/rutas']); }

   prueba() {
      alert("Ok!")
   }

}

interface Ruta {
   idruta: number;
   codigo: String;
   descripcion: String;
   orden: number;
   feccrea: Date;
}
