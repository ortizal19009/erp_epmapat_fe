import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Eliminadosapp } from 'src/app/modelos/administracion/eliminadosapp.model';
import { Asientos } from 'src/app/modelos/contabilidad/asientos.model';
import { Ejecucio } from 'src/app/modelos/contabilidad/ejecucio.model';
import { Transaci } from 'src/app/modelos/contabilidad/transaci.model';
import { EliminadosappService } from 'src/app/servicios/administracion/eliminadosapp.service';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import { BenextranService } from 'src/app/servicios/contabilidad/benextran.service';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucio.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';
import { tiptranNombre } from 'src/app/utileria/formateaStrings';
import Swal from 'sweetalert2';

@Component({
   selector: 'app-transaci',
   templateUrl: './transaci.component.html',
   styleUrls: ['./transaci.component.css']
})
export class TransaciComponent implements OnInit {


   formAsiento: FormGroup;
   asiento: Asientos;
   idasiento: number;
   padre: string;
   transaci: Transaci[] = [];
   totDebe: number = 0;
   totHaber: number = 0;
   ejecucio: Ejecucio[] = [];
   totDevengado: number = 0;
   totCobpagado: number = 0;
   tiptran: string = "";
   codcue: String;
   sweliminar: boolean = false;
   inttra: number;
   swbusca: boolean = false;
   observable$!: Observable<any>;
   tiptranNombre = tiptranNombre;
   hover: boolean = false;
   ultIdSelec: number = -1;
   primerAsiento!: number;
   navegadorActual!: number;
   ultimoAsiento!: number;
   primerCompro!: number;
   actualCompro!: number;
   datosToTransaci: { idasiento: number; desdeNum: number; hastaNum: number; padre: string; };

   constructor(private router: Router, private coloresService: ColoresService, public authService: AutorizaService,
      private asiService: AsientosService, private tranService: TransaciService, private ejecuService: EjecucionService,
      private elimService: EliminadosappService, private benxtraService: BenextranService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/transaci');
      let coloresJSON = sessionStorage.getItem('/transaci');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      this.ultIdSelec = sessionStorage.getItem('ultinttra') ? Number(sessionStorage.getItem('ultinttra')) : 0;
      const datosToTransaciJSON = sessionStorage.getItem('datosToTransaci');
      if (datosToTransaciJSON) {
         this.datosToTransaci = JSON.parse(datosToTransaciJSON);
         this.idasiento = this.datosToTransaci.idasiento;
         this.primerAsiento = +this.datosToTransaci.desdeNum;
         this.ultimoAsiento = +this.datosToTransaci.hastaNum;
         this.padre = this.datosToTransaci.padre
      }
      this.datosAsiento();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   async buscaColor() {
      try {
         const datos = await this.coloresService.setcolor(1, 'transaci');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/transaci', coloresJSON);
         this.colocaColor(datos);
      } catch (error) {
         console.error(error);
      }
   }

   datosAsiento() {
      this.asiService.findByIdAsiento(this.idasiento).subscribe({
         next: (asiento: Asientos | null) => {
            if (asiento) {
               this.asiento = asiento;
               this.navegadorActual = asiento.asiento;
               this.busca();
            }
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al busca el Asiento: ', err.error) }
      });
   }

   busca() {
      this.tranService.getTransaci(this.idasiento).subscribe({
         next: (transaci: Transaci[]) => {
            this.swbusca = true;
            this.transaci = transaci;
            this.totales();
            this.ejecuService.findByIdAsiento(this.idasiento).subscribe({
               next: (ejecucio: Ejecucio[]) => {
                  this.ejecucio = ejecucio;
                  if (ejecucio.length > 1) this.totalesEjecucion();
               },
               error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar la Ejecución', err.error) },
            });
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar Transacciones', err.error) }
      });
   }

   totales() {
      const totales = this.transaci.reduce(
         (acc, t) => {
            if (t.debcre === 1) {
               acc.sumDebe += t.valor;
            } else if (t.debcre === 2) {
               acc.sumHaber += t.valor;
            }
            return acc;
         },
         { sumDebe: 0, sumHaber: 0 }
      );
      this.totDebe = Number(totales.sumDebe.toFixed(2));
      this.totHaber = Number(totales.sumHaber.toFixed(2));
   }

   totalesEjecucion() {
      const totales = this.ejecucio.reduce(
         (acc, e) => {
            acc.sumDevengado += e.devengado;
            acc.sumCobpagado += e.cobpagado;
            return acc;
         },
         { sumDevengado: 0, sumCobpagado: 0 }
      );
      this.totDevengado = Number(totales.sumDevengado.toFixed(2));
      this.totCobpagado = Number(totales.sumCobpagado.toFixed(2));
   }

   onCellClick(event: any, transaci: Transaci) {
      const tagName = event.target.tagName;
      this.ultIdSelec = transaci.inttra;
      sessionStorage.setItem('ultinttra', this.ultIdSelec.toString());
   }

   onCellEjecucion(event: any, ejecucio: Ejecucio) {
      const tagName = event.target.tagName;
      this.ultIdSelec = ejecucio.inttra;
      sessionStorage.setItem('ultinttra', this.ultIdSelec.toString());
   }

   // Cierra el modal al seleciionar una opcion sin [Aceptar]
   cerrarModal() {
      const modal = document.getElementById('addTransa');
      modal!.classList.remove('show');
      modal!.style.display = 'none';
      document.body.classList.remove('modal-open');
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
         backdrop.parentNode!.removeChild(backdrop);
      }
   }

   // Se necesita por el warning porque el modal sigue con el foco
   cancelar() {
      (document.activeElement as HTMLElement)?.blur();
      const modal = document.getElementById('addTransa');
      modal!.classList.remove('show');
      modal!.style.display = 'none';
      document.body.classList.remove('modal-open');
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) backdrop.remove();
   }

   nuevo() {
      this.cerrarModal();
      sessionStorage.setItem("datosToAddtransaci", JSON.stringify({
         idasiento: this.idasiento, totDebe: this.totDebe, totHaber: this.totHaber, tiptran: +this.tiptran, orden: 10 + (this.transaci.length * 2)
      }));
      // Si se uso el navegador => actualiza this.datosToTransaci
      if (this.datosToTransaci.idasiento != this.idasiento) {
         this.datosToTransaci.idasiento = this.idasiento;
         sessionStorage.setItem('datosToTransaci', JSON.stringify(this.datosToTransaci));
      }
      switch (+this.tiptran) {
         case 0:
            this.router.navigate(['/add-transaci']);
            break;
         case 1:
            this.router.navigate(['/add-trandetrami']);
            //    this.router.navigate(['/add-trandecomprom']);
            break;
         case 2: case 3: case 4: case 5: case 6: case 7:
            this.router.navigate(['/add-benextran']);
            break;
         case 8: case 9: case 10: case 11: case 12:
            this.router.navigate(['/add-pagoscobros']);
            break;
         default:
         // 
      }
   }

   modificar(inttra: number, tiptran: number) {
      this.ultIdSelec = inttra;
      sessionStorage.setItem('ultinttra', this.ultIdSelec.toString());
      sessionStorage.setItem("datosToModiTransaci", JSON.stringify({ tiptran: tiptran, inttra: inttra, idasiento: this.idasiento, totDebe: this.totDebe, totHaber: this.totHaber }));
      // Si se usó el navegador  => actualiza this.datosToTransaci
      if (this.datosToTransaci.idasiento != this.idasiento) {
         this.datosToTransaci.idasiento = this.idasiento;
         sessionStorage.setItem('datosToTransaci', JSON.stringify(this.datosToTransaci));
      }
      switch (tiptran) {
         case 0:
            this.router.navigate(['/modi-transaci']);
            break;
         case 1:
            // this.router.navigate(['/modi-trandecomprom']);
            break;
         case 2: case 3: case 4: case 5: case 6: case 7:
            this.router.navigate(['/modi-benextran']);
            break;
         case 8: case 9: case 10: case 11: case 12:
            this.router.navigate(['/modi-pagoscobros']);
            break;
         default:
         // 
      }
   }

   eliminar(transaci: Transaci): void {
      switch (transaci.tiptran) {
         case 0:
            this.ejecuService.getByInttra(transaci.inttra).subscribe({
               next: (ejecucio: Ejecucio | null) => {
                  let titulo: string;
                  let codparElim: String = '';
                  if (ejecucio) {
                     titulo = `Eliminar la Cuenta: ${transaci.codcue} y la Partida: ${ejecucio.intpre.codpar} del Asiento ${this.asiento.asiento} ?`;
                     codparElim = ejecucio.intpre.codpar;
                     this.observable$ = this.tranService.deleteTransaci(transaci.inttra)  // Era: deleteTransaccionEjecucion()
                  }
                  else {
                     titulo = `Eliminar la Cuenta: ${transaci.codcue} del Asiento ${this.asiento.asiento} ?`;
                     codparElim = '';
                     this.observable$ = this.tranService.deleteTransaci(transaci.inttra)
                  }
                  this.confirmElimina(transaci, titulo, codparElim);
               },
               error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar la Ejecucion', err.error) }
            });
            break;
         case 1:
            this.ejecuService.getByInttra(transaci.inttra).subscribe({
               next: (ejecucio: Ejecucio | null) => {
                  let titulo: string;
                  let codparElim: String = '';
                  if (ejecucio) {
                     titulo = `Eliminar la Cuenta: ${transaci.codcue} y la Partida: ${ejecucio.intpre.codpar} del Asiento ${this.asiento.asiento} ?`;
                     codparElim = ejecucio.intpre.codpar;
                     this.observable$ = this.tranService.deleteTransaci(transaci.inttra)  // Era: deleteTransaccionDevengado()
                  }
                  else {
                     titulo = `Eliminar la Cuenta: ${transaci.codcue} del Asiento ${this.asiento.asiento} ?`;
                     codparElim = '';
                     this.observable$ = this.tranService.deleteTransaci(transaci.inttra)
                  }
                  this.confirmElimina(transaci, titulo, codparElim);
               },
               error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar la Ejecucion', err.error) }
            });
            break;
         case 2: case 3: case 4: case 5: case 6: case 7:
            this.benxtraService.countByInttra(transaci.inttra).subscribe({
               next: registros => {
                  if (registros > 0) {
                     Swal.fire({
                        icon: 'error',
                        title: `No puede eliminar la Cuenta: ${transaci.codcue}`,
                        text: `Tiene registrado ${registros} Beneficiario(s)`,
                        confirmButtonText: '<i class="bi-check"></i> Continuar ',
                        customClass: {
                           popup: 'noeliminar',
                           title: 'robotobig',
                           confirmButton: 'btn btn-info',
                        },
                     });
                  } else {
                     let titulo = `Eliminar la Cuenta: ${transaci.codcue} del Asiento ${this.asiento.asiento} ?`;
                     let codparElim = '';
                     this.observable$ = this.tranService.deleteTransaci(transaci.inttra)
                     this.confirmElimina(transaci, titulo, codparElim);
                  }
               }
            });
            break;
         case 8: case 9: case 10: case 11: case 12:
            // this.pagcobService.conteoPorTransaccion(transaccion.idtransaccion).subscribe({
            //    next: registros => {
            //       if (registros > 0) {
            //          Swal.fire({
            //             icon: 'error',
            //             title: `No puede eliminar la Cuenta: ${transaccion.codcue}`,
            //             text: `Tiene registrado ${registros} Beneficiario(s)`,
            //             confirmButtonText: '<i class="bi-check"></i> Continuar ',
            //             customClass: {
            //                popup: 'noeliminar',
            //                title: 'robotobig',
            //                confirmButton: 'btn btn-info',
            //             },
            //          });
            //       } else {
            //          let titulo = `Eliminar la Cuenta: ${transaccion.codcue} del Asiento ${this.asiento.numero} ?`;
            //          let codparElim = '';
            //          this.observable$ = this.tranService.deleteTransaccion(transaccion.idtransaccion)
            //          this.confirmElimina(transaccion, titulo, codparElim);
            //       }
            //    }
            // });
            break;
         default:
            // this.observable$ = this.tranService.deleteTransaccion(transaccion.idtransaccion)
            this.authService.swal('warning', `${transaci.tiptran}`);
      }
   }

   confirmElimina(transaci: Transaci, titulo: string, codparElim: String) {
      Swal.fire({
         icon: 'warning',
         title: titulo,
         showCancelButton: true,
         confirmButtonText: '<i class="fa fa-check"></i> Aceptar',
         cancelButtonText: '<i class="fa fa-times"></i> Cancelar',
         customClass: { popup: 'eliminar', title: 'robotobig', confirmButton: 'btn btn-info', cancelButton: 'btn btn-info' },
      }).then((resultado) => {
         if (resultado.isConfirmed) this.elimina(transaci, codparElim);
      });
   }

   //Elimina
   elimina(transaci: Transaci, codparElim: String) {
      let datos: string;
      if (codparElim != '') {
         datos = `Cuenta: ${transaci.codcue} ${transaci.debcre === 1 ? 'Débito' : 'Crédito'} ${transaci.valor} Comprobante: ${this.authService.comprobante(transaci.idasiento.tipcom, transaci.idasiento.compro)} Partida: ${codparElim}`;;
      } else {
         datos = `Cuenta: ${transaci.codcue} ${transaci.debcre === 1 ? 'Débito' : 'Crédito'} ${transaci.valor} Comprobante: ${this.authService.comprobante(transaci.idasiento.tipcom, transaci.idasiento.compro)}`;
      }
      this.observable$.subscribe({
         next: () => {
            const eliminado: Eliminadosapp = new Eliminadosapp();
            eliminado.idusuario = this.authService.idusuario!;
            eliminado.modulo = this.authService.moduActual;
            eliminado.fecha = new Date();
            eliminado.routerlink = 'transaci';
            eliminado.tabla = 'TRANSACI';
            eliminado.datos = datos;
            this.elimService.save(eliminado).subscribe({
               next: () => {
                  this.authService.swal('success', `Cuenta: ${transaci.codcue} eliminada con éxito del Asiento ${transaci.idasiento.asiento}`);
                  this.busca();
               },
               error: err => { console.error(err.error); this.authService.mostrarError('Error al eliminar', err.error); }
            });
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al eliminar', err.error); }
      });
   }
   imprimir() {
      sessionStorage.setItem("idasientoToImpExp", this.idasiento.toString());
      this.router.navigate(['/imp-transaci']);
   }

   actual(opcion: number) {
      if (opcion == 1) this.navegadorActual = this.asiento.asiento;
      if (opcion == 2) this.actualCompro = this.asiento.compro;
   }

   irPrimero(opcion: number) {
      if (opcion == 1) {
         this.navegadorActual = this.primerAsiento;
         this.cargarRegistro(this.navegadorActual);
      }
      if (opcion == 2) {
         this.asiService.obtenerPrimerCompro(this.asiento.tipcom).subscribe({
            next: (primerCompro: number) => {
               if (primerCompro) {
                  this.actualCompro = primerCompro;
                  this.buscaPorComprobante(this.asiento.tipcom, this.actualCompro);
               }
            },
            error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar ultimo Comprobante', err.error); }
         });

      }
   }

   irUltimo(opcion: number) {
      if (opcion == 1) {
         this.navegadorActual = this.ultimoAsiento;
         this.cargarRegistro(this.navegadorActual);
      }
      if (opcion == 2) {
         this.asiService.obtenerUltimoCompro(this.asiento.tipcom).subscribe({
            next: (ultCompro: number) => {
               if (ultCompro) {
                  this.actualCompro = ultCompro;
                  this.buscaPorComprobante(this.asiento.tipcom, this.actualCompro);
               }
            },
            error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar ultimo Comprobante', err.error); }
         });
      }
   }

   retroceder(opcion: number) {
      if (opcion == 1) {
         if (this.navegadorActual > 1) {
            this.navegadorActual--;
            this.cargarRegistro(this.navegadorActual);
         }
      }
      if (opcion == 2) {
         this.primerCompro = 1;
         if (this.asiento.tipcom == 3) this.primerCompro = 1
         if (this.actualCompro > this.primerCompro) {
            this.actualCompro--;
            this.buscaPorComprobante(this.asiento.tipcom, this.actualCompro);
         }
      }
   }

   avanzar(opcion: number) {
      if (opcion == 1) {
         this.navegadorActual++;
         this.cargarRegistro(this.navegadorActual);
      }
      if (opcion == 2) {
         this.actualCompro++;
         this.buscaPorComprobante(this.asiento.tipcom, this.actualCompro);
      }
   }

   irA(opcion: number, n: number) {
      if (opcion == 1) {
         if (n > 1) {
            this.navegadorActual = n;
            this.cargarRegistro(n);
         }
      }
      if (opcion == 2) {
         this.primerCompro = 0;
         if (this.asiento.tipcom == 3) this.primerCompro = 1;
         if (n > this.primerCompro) {
            this.actualCompro = n;
            this.buscaPorComprobante(this.asiento.tipcom, this.actualCompro);
         }
      }
   }

   cargarRegistro(n: number) {
      this.asiService.buscaPorNumero(n).subscribe({
         next: (asiento: Asientos | null) => {
            if (asiento) {
               this.asiento = asiento;
               this.idasiento = asiento.idasiento;
               this.busca();
            }
            else this.authService.swal('warning', `No existe el Asiento número: ${n}`);
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar', err.error); }
      });
   }

   buscaPorComprobante(tipcom: number, compro: number) {
      this.asiService.buscaPorComprobante(tipcom, compro).subscribe({
         next: (asiento: Asientos | null) => {
            if (asiento) {
               this.asiento = asiento;
               this.idasiento = asiento.idasiento;
               this.busca();
            }
            else this.authService.swal('warning', `No existe el Comprobante: ${this.authService.comprobante(tipcom, compro)}`);
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar', err.error); }
      });
   }

   regresar() { this.router.navigate([this.padre]); }
   cerrar() { this.router.navigate(['/inicio']); }

}
