import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Abonados } from 'src/app/modelos/abonados';
import { Emisiones } from 'src/app/modelos/emisiones.model';
import { Novedad } from 'src/app/modelos/novedad.model';
import { Rutas } from 'src/app/modelos/rutas.model';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { EmisionService } from 'src/app/servicios/emision.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { RutasService } from 'src/app/servicios/rutas.service';
import { RutasxemisionService } from 'src/app/servicios/rutasxemision.service';

@Component({
   selector: 'app-gene-emision',
   templateUrl: './gene-emision.component.html',
   styleUrls: ['./gene-emision.component.css']
})

export class GeneEmisionComponent implements OnInit {

   idemision: number;
   _rutas: any;
   _abonados: any;
   emision: any;
   totrutas: number;
   private contador = 0;
   public progreso = 0;
   fecha: Date = new Date();

   constructor(private emiServicio: EmisionService, private router: Router, private rutService: RutasService,
      private aboService: AbonadosService, private ruxemiService: RutasxemisionService,
      private lecService: LecturasService) { }

   ngOnInit(): void {
      this.emision = {} as Emision;
      this.idemision = +sessionStorage.getItem('idemisionToGenerar')!;
      this.emiServicio.getByIdemision(this.idemision).subscribe({
         next: emision => {
            this.emision = emision
            this.rutService.getListaRutas().subscribe({
               next: rutas => {
                  this._rutas = rutas;
                  this.totrutas = this._rutas.length;
               },
               error: err => console.error(err.error)
            })
         },
         error: err => console.error(err.error)
      })
   }

   generar() {
      this.totrutas = this._rutas.length;
      this.contador = 0;
      this.generaRutaxemision();
   }

   generaRutaxemision() {
      let fecha: Date = new Date();
      let novedad: Novedad = new Novedad();
      novedad.idnovedad = 1;

      let rutasxemision = {} as Rutasxemision;
      rutasxemision.estado = 0;
      rutasxemision.m3 = 0;
      let emision: Emisiones = new Emisiones();
      emision.idemision = this.idemision;
      rutasxemision.idemision_emisiones = emision;
      rutasxemision.idruta_rutas = this._rutas[this.contador];
      rutasxemision.usucrea = 1;
      rutasxemision.feccrea = fecha;

      this.ruxemiService.saveRutaxemision(rutasxemision).subscribe({
         next: ruxemi => {
            this.contador++;
            this.progreso = (this.contador / this.totrutas) * 100;

            this.abonados(this.contador - 1, ruxemi);
   
            if (this.contador < this.totrutas) {
               this.generaRutaxemision();
            } else {
               this.regresar();
            }
         },
         error: err => console.error(err.error)
      })
   }

   abonados(i: number, ruxemi: any) {
      let novedad: Novedad = new Novedad();
      novedad.idnovedad = 1;
      this.aboService.getByIdruta(this._rutas[i].idruta).subscribe({
         next: aboxruta => {
            this._abonados = aboxruta;
            for (let n = 0; n < aboxruta.length; n++) {
               let lectura = {} as Lecturas;
               lectura.estado = 0;
               lectura.fechaemision = this.fecha;
               lectura.lecturaanterior = 0;
               lectura.lecturaactual = 0;
               lectura.lecturadigitada = 0;
               lectura.mesesmulta = 0;
               lectura.idnovedad_novedades = novedad;
               lectura.idemision = this.idemision;
               lectura.idabonado_abonados = aboxruta[n];
               lectura.idresponsable = aboxruta[n].idresponsable.idcliente;
               lectura.idcategoria = aboxruta[n].idcategoria_categorias.idcategoria;
               lectura.idrutaxemision_rutasxemision = ruxemi;
               this.lecService.saveLectura(lectura).subscribe({
                  next: nex => {
                  },
                  error: err => console.error(err.error)
               })
            };
            // console.log('Lecturas Ok!')
         },
         error: err => console.error(err.error)
      })
   }

   regresar() { this.router.navigate(['emisiones']);   }

}

interface Emision {
   emision: String;
}

interface Rutasxemision {
   idrutaxemision: number;
   estado: number;
   m3: number;
   usuariocierre: number;
   fechacierre: Date;
   idemision_emisiones: Emisiones;
   idruta_rutas: Rutas;
   usucrea: number;
   feccrea: Date;
}

interface Lecturas {
   idlectura: number;
   estado: number;
   fechaemision: Date;
   lecturaanterior: number;
   lecturaactual: number;
   lecturadigitada: number;
   mesesmulta: number;
   observaciones: String;
   idnovedad_novedades: Novedad;
   idemision: number;
   idabonado_abonados: Abonados;
   idresponsable: number;
   idcategoria: number;
   idrutaxemision_rutasxemision: Rutasxemision;
   idfactura: number;
   total1: number;
   total31: number;
   total32: number;
}
