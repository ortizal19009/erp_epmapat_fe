import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Abonados } from 'src/app/modelos/abonados';
import { Clientes } from 'src/app/modelos/clientes';
import { Emisiones } from 'src/app/modelos/emisiones.model';
import { Modulos } from 'src/app/modelos/modulos.model';
import { Novedad } from 'src/app/modelos/novedad.model';
import { Rutas } from 'src/app/modelos/rutas.model';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { EmisionService } from 'src/app/servicios/emision.service';
import { FacturaService } from 'src/app/servicios/factura.service';
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
   emision: String;
   totalrutas: number;
   public progreso = 0;
   fecha: Date = new Date();
   fechaemision: Date;
   novedad: Novedad = new Novedad();
   modulo: Modulos = new Modulos();
   cliente: Clientes;
   swgenerando: boolean = false;

   constructor(private emiServicio: EmisionService, private router: Router, private rutService: RutasService,
      private aboService: AbonadosService, private ruxemiService: RutasxemisionService,
      private lecService: LecturasService, public authService: AutorizaService, private facService: FacturaService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/emisiones');
      let coloresJSON = sessionStorage.getItem('/emisiones');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.novedad.idnovedad = 1;
      this.modulo.idmodulo = 4;

      this.idemision = +sessionStorage.getItem('idemisionToGenerar')!;
      sessionStorage.removeItem('idemisionToGenerar');   //Quitar comentario
      this.emiServicio.getByIdemision(this.idemision).subscribe({
         next: resp => {
            this.emision = resp.emision
            this.rutService.getListaRutas().subscribe({
               next: rutas => {
                  this._rutas = rutas;
                  this.totalrutas = this._rutas.length;
               },
               error: err => console.error(err.error)
            })
         },
         error: err => console.error(err.error)
      })
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   async generar() {
      const anio = parseInt(this.emision.substring(0, 2), 10) + 2000;
      const mes = parseInt(this.emision.substring(2, 4), 10);
      this.fechaemision = new Date(anio, mes - 1, 1);
      this.totalrutas = this._rutas.length;
      this.swgenerando = true;
      await this.generaRutaxemision();
      this.regresar();
   }

   //Genera las Rutaxemision (Son 110)
   async generaRutaxemision() {
      let fecha: Date = new Date();
      let novedad: Novedad = new Novedad();
      novedad.idnovedad = 1;
      for (let i = 0; i < this.totalrutas; i++) {
         // for (let i = 9; i < 10; i++) {
         let rutasxemision = {} as Rutasxemision;
         rutasxemision.estado = 0;  //Ruta Abierta
         rutasxemision.m3 = 0;
         let emision: Emisiones = new Emisiones();
         emision.idemision = this.idemision;
         rutasxemision.idemision_emisiones = emision;
         let ruta: Rutas = new Rutas();
         ruta.idruta = this._rutas[i].idruta;
         rutasxemision.idruta_rutas = ruta;
         rutasxemision.usucrea = this.authService.idusuario;
         rutasxemision.feccrea = fecha;
         try {
            const nuevaRutaxemision = await this.ruxemiService.saveRutaxemisionAsync(rutasxemision);
            await this.generaLecturas(i, nuevaRutaxemision);
            this.progreso = (i / this.totalrutas) * 100;
         } catch (error) {
            console.error(`Al guardar Rutaxemision ${i}`, error);
         }
      }
   }

   //Genera las lecturas de los abonados de la nueva Rutaxemision
   async generaLecturas(i: number, nuevarutaxemi: any) {
      try {
         const abonados = await this.aboService.getByIdrutaAsync(this._rutas[i].idruta);
         for (let k = 0; k < abonados.length; k++) {
            // for (let k = 0; k < 2; k++) {
            //Primero crea la Factura (Planilla) para cada Abonado para luego ponerla en las Lecturas
            let planilla = {} as Planilla;
            planilla.idmodulo = this.modulo;
            this.cliente = new Clientes();
            this.cliente.idcliente = abonados[k].idresponsable.idcliente;
            planilla.idcliente = this.cliente;
            planilla.idabonado = abonados[k].idabonado;
            planilla.porcexoneracion = 0;
            planilla.totaltarifa = 0;
            planilla.pagado = 0;
            planilla.conveniopago = 0;
            planilla.estadoconvenio = 0;
            planilla.formapago = 1;
            planilla.valorbase = 0;
            planilla.usucrea = this.authService.idusuario;
            planilla.estado = 1;
            planilla.feccrea = this.fechaemision;
            //let nuevoIdfactura = k; Solo para pruebas, para que no genere las facturas
            let nuevoIdfactura: number = 0;
            try { //Crea la planilla con el metodo que devuelve el idfactura generado
               nuevoIdfactura = await this.facService.saveFacturaAsyncId(planilla);
            } catch (error) {
               console.error(`Al guardar la Factura (planilla) ${k}`, error);
            }
            //Ahora si crea la Lectura para cada Abonado
            let lectura = {} as Lectura;
            lectura.estado = 0;
            lectura.fechaemision = this.fechaemision;
            try {
               let lecturaanterior = await this.lecService.getUltimaLecturaAsync(abonados[k].idabonado);
               if (!lecturaanterior) { lecturaanterior = 0; }
               lectura.lecturaanterior = lecturaanterior;
            } catch (error) {
               console.error(`Al buscar la Última lectura`, error);
            }
            lectura.lecturaactual = 0;
            lectura.lecturadigitada = 0;
            lectura.mesesmulta = 0;
            lectura.idnovedad_novedades = this.novedad;
            lectura.idemision = this.idemision;
            lectura.idabonado_abonados = abonados[k];
            lectura.idresponsable = abonados[k].idresponsable.idcliente;
            lectura.idcategoria = abonados[k].idcategoria_categorias.idcategoria;
            lectura.idrutaxemision_rutasxemision = nuevarutaxemi;
            lectura.total1 = 0;
            lectura.idfactura = nuevoIdfactura
            try {
               await this.lecService.saveLecturaAsync(lectura);
            } catch (error) {
               console.error(`Al guardar La lectura ${k}`, error);
            }
         };
      } catch (error) {
         console.error(`Al recuperar los Abonados por ruta ${i}`, error);
      }
   }

   regresar() { this.router.navigate(['emisiones']); }

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

interface Planilla {
   idfactura: number;
   idmodulo: Modulos;
   idcliente: Clientes;
   idabonado: number;
   nrofactura: String;
   porcexoneracion: number;
   razonexonera: String;
   totaltarifa: number;
   pagado: number;
   usuariocobro: number;
   fechacobro: Date;
   estado: number;
   usuarioanulacion: number;
   razonanulacion: String;
   usuarioeliminacion: number;
   fechaeliminacion: Date;
   razoneliminacion: String;
   conveniopago: number;
   fechaconvenio: Date;
   estadoconvenio: number;
   formapago: number;
   reformapago: String;
   horacobro: String;
   usuariotransferencia: number;
   fechatransferencia: Date;
   usucrea: number;
   feccrea: Date;
   usumodi: number;
   fecmodi: Date;
   valorbase: number;
}

interface Lectura {
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
