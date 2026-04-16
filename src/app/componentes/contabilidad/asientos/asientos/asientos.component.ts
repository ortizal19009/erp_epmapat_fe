// import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Eliminadosapp } from 'src/app/modelos/administracion/eliminadosapp.model';
import { Asientos } from 'src/app/modelos/contabilidad/asientos.model';
import { Retenciones } from 'src/app/modelos/contabilidad/retenciones.model';
import { EliminadosappService } from 'src/app/servicios/administracion/eliminadosapp.service';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import { RetencionesService } from 'src/app/servicios/contabilidad/retenciones.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';
import Swal from 'sweetalert2';

@Component({
   selector: 'app-asientos',
   templateUrl: './asientos.component.html',
   styleUrls: ['./asientos.component.css'],
})


export class AsientosComponent implements OnInit {

   asientos: Asientos[] = [];
   swbuscando: boolean;
   txtbuscar: string = 'Buscar';
   buscarAsientos: { tipcom: number, desdeNum: number, hastaNum: number, desdeFecha: string, hastaFecha: string }
   formBuscar: FormGroup;
   today: number = Date.now();
   date: Date = new Date();
   sumTotdeb: number;
   sumTotcre: number;
   swdesdehasta: boolean; //Visibilidad Buscar últimos
   filtro: string;
   disabTipcom: boolean = true;
   sweliminar: boolean = false;
   ultIdSelec: number = -1;

   constructor(private asiService: AsientosService, private fb: FormBuilder, public authService: AutorizaService,
      private coloresService: ColoresService, private router: Router, private tranService: TransaciService,
      private reteService: RetencionesService, private elimService: EliminadosappService) { }

   ngOnInit(): void {
      if (!this.authService.sessionlog) { this.router.navigate(['/inicio']); }
      sessionStorage.setItem('ventana', '/asientos');
      let coloresJSON = sessionStorage.getItem('/asientos');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      const fecha = new Date();
      const año = fecha.getFullYear()
      this.formBuscar = this.fb.group({
         tipcom: '',
         desdeNum: '',
         hastaNum: '',
         desdeFecha: año + '-01-01',
         hastaFecha: año + '-12-31',
      });

      //Datos de búsqueda último asiento o guardados
      this.ultIdSelec = sessionStorage.getItem('ultidasiento') ? Number(sessionStorage.getItem('ultidasiento')) : 0;
      this.buscarAsientos = JSON.parse(sessionStorage.getItem("buscarAsientos")!);
      if (this.buscarAsientos == null) this.ultimoAsiento();
      else {
         this.formBuscar.patchValue({
            tipcom: this.buscarAsientos.tipcom,
            desdeNum: this.buscarAsientos.desdeNum,
            hastaNum: this.buscarAsientos.hastaNum,
            desdeFecha: this.buscarAsientos.desdeFecha,
            hastaFecha: this.buscarAsientos.hastaFecha
         });
         this.buscar();
      }
      this.formBuscar.get('desdeNum')?.valueChanges.subscribe(valor => {
         if (valor != null && !isNaN(valor)) {
            this.formBuscar.patchValue({
               hastaNum: Number(valor) + 16
            }, { emitEvent: false });
         }
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

   async buscaColor() {
      try {
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'asientos');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/asientos', coloresJSON);
         this.colocaColor(datos);
      } catch (error) { console.error(error); }
   }

   ultimoAsiento() {
      this.asiService.ultimo().subscribe({
         next: resp => {
            let desde = resp.asiento - 16;
            if (desde <= 0) desde = 1;
            this.formBuscar.patchValue({
               tipcom: 0,
               desdeNum: desde,
               hastaNum: resp.asiento,
            });
            this.buscar();
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar el último', err.error) }
      });
   }

   changeTipcom() {
      if (this.formBuscar.value.tipcom == 0) this.ultimoAsiento();
      else {
         this.asiService.obtenerUltimoCompro(this.formBuscar.value.tipcom).subscribe({
            next: resp => {
               let desde = resp - 16;
               if (desde <= 0) desde = 1;
               this.formBuscar.patchValue({
                  desdeNum: desde,
                  hastaNum: resp,
               });
               this.buscar();
            },
            error: err => console.error(err.error)
         });
      }
   }

   buscar() {
      this.swbuscando = true;
      this.txtbuscar = 'Buscando';
      //Guarda los datos de búsqueda
      this.buscarAsientos = {
         tipcom: this.formBuscar.value.tipcom,
         desdeNum: this.formBuscar.value.desdeNum,
         hastaNum: this.formBuscar.value.hastaNum,
         desdeFecha: this.formBuscar.value.desdeFecha,
         hastaFecha: this.formBuscar.value.hastaFecha
      };
      sessionStorage.setItem("buscarAsientos", JSON.stringify(this.buscarAsientos));

      //Numeros
      let desdeNum: number = 1;
      if (this.formBuscar.value.desdeNum != null) { desdeNum = this.formBuscar.value.desdeNum; }
      let hastaNum: number = 999999999;
      if (this.formBuscar.value.hastaNum != null) { hastaNum = this.formBuscar.value.hastaNum; }
      //Busca Asientos
      if (this.formBuscar.value.tipcom == 0)
         this.asiService.getAsientos(1, desdeNum, hastaNum,
            this.formBuscar.value.desdeFecha, this.formBuscar.value.hastaFecha).subscribe({
               next: (asientos: Asientos[]) => {
                  this.asientos = asientos;
                  this.swbuscando = false;
                  this.txtbuscar = 'Buscar';
                  this.totales();
               },
               error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar por Asiento', err.error) }
            });
      else {   //Busca Comprobantes
         this.asiService.getComprobantes(2, this.formBuscar.value.tipcom, this.formBuscar.value.desdeNum, this.formBuscar.value.hastaNum,
            this.formBuscar.value.desdeFecha, this.formBuscar.value.hastaFecha).subscribe({
               next: datos => {
                  this.asientos = datos;
                  this.swbuscando = false;
                  this.txtbuscar = 'Buscar';
                  this.totales();
               },
               error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar por Comprobante', err.error) }
            });
      }
   }

   totales() {
      this.sumTotdeb = this.asientos.reduce((acc, a) => acc + (a.totdeb ?? 0), 0);
      this.sumTotcre = this.asientos.reduce((acc, a) => acc + (a.totcre ?? 0), 0);
   }

   busquedainicial() {
      sessionStorage.removeItem('buscarAsientos');
      this.swdesdehasta = false;
      this.ultimoAsiento();
   }

   changeDesdeHasta() { this.swdesdehasta = true; }

   onCellClick(event: any, asiento: Asientos) {
      const tagName = event.target.tagName;
      this.ultIdSelec = asiento.idasiento;
      sessionStorage.setItem('ultidasiento', this.ultIdSelec.toString());
      let desdeNum = 0;
      let hastaNum = 0;
      if (tagName === 'TD') {
         if (this.formBuscar.get('tipcom')?.value == 0) {
            desdeNum = this.formBuscar.value.desdeNum;
            hastaNum = this.formBuscar.value.hastaNum;
         } else {    //Si se muestran comprobantes ultimo = actual
            hastaNum = asiento.asiento;
            desdeNum = hastaNum - 16
            if (desdeNum < 1) desdeNum = 1
         }
         let datosToTransaci = {
            idasiento: asiento.idasiento,
            desdeNum: desdeNum,
            hastaNum: hastaNum,
            padre: '/asientos'
         };
         sessionStorage.setItem('datosToTransaci', JSON.stringify(datosToTransaci));
         this.router.navigate(['transaci']);
      }
   }

   addAsiento() { this.router.navigate(['add-asiento']); }

   modiAsiento(idasiento: number) {
      sessionStorage.setItem("idasientoToModi", idasiento.toString());
      this.router.navigate(['/modi-asiento']);
   }

   retenciones(idasiento: number) {
      this.reteService.getByAsiento(idasiento).subscribe({
         next: (retenciones: Retenciones[]) => {
            const totrete = retenciones.length;
            switch (totrete) {
               case 0:
                  sessionStorage.setItem("idasientoToRete", idasiento.toString());
                  this.router.navigate(['/add-retencion']);
                  break;
               case 1:
                  let idrete = retenciones[0].idrete;
                  sessionStorage.setItem("retencionToModifi", JSON.stringify({ idasiento: idasiento, idrete: idrete }));
                  this.router.navigate(['/modi-retencion']);
                  break;
               default:
                  if (totrete > 1) {
                     let idrete = retenciones[0].idrete;
                     sessionStorage.setItem("idasientoToRete", idrete.toString());
                     this.router.navigate(['/modi-retencion']);
                  } else {
                     console.error(`Total de retencines no válido (${totrete})`);
                  }
            }
         },
         error: err => console.error('Al buscar la(s) retenciones: ', err.error)
      });
   }

   eliminar(asiento: Asientos) {
      this.tranService.countByIdasiento(asiento.idasiento).subscribe({
         next: registros => {
            if (registros > 0) {
               Swal.fire({
                  icon: 'error',
                  title: `No puede eliminar el Asiento Nro: ${asiento.asiento}`,
                  text: `Tiene registrado ${registros} Transaccion(es)`,
                  confirmButtonText: '<i class="bi-check"></i> Continuar ',
                  customClass: {
                     popup: 'noeliminar',
                     title: 'robotobig',
                     confirmButton: 'btn btn-warning',
                  },
               });
            } else {
               Swal.fire({
                  width: '500px',
                  title: 'Mensaje',
                  text: `Eliminar la Certificación: ${asiento.asiento} ?`,
                  icon: 'warning',
                  showCancelButton: true,
                  confirmButtonText: '<i class="fa fa-check"></i> Aceptar',
                  cancelButtonText: '<i class="fa fa-times"></i> Cancelar',
                  customClass: {
                     popup: 'eliminar',
                     title: 'robotobig',
                     confirmButton: 'btn btn-success',
                     cancelButton: 'btn btn-success'
                  },
               }).then((resultado) => {
                  if (resultado.isConfirmed) this.elimina(asiento);
               });
            }
         },
         error: err => { console.error('Al buscar las Transacciones del Asiento: ', err.error); },
      });
   }

   elimina(asiento: Asientos) {
      this.asiService.deleteAsiento(asiento.idasiento).subscribe({
         next: () => {
            let eliminado: Eliminadosapp = new Eliminadosapp();
            eliminado.idusuario = this.authService.idusuario!;
            eliminado.modulo = this.authService.moduActual;
            eliminado.fecha = new Date();
            eliminado.routerlink = 'asientos';
            eliminado.tabla = 'ASIENTOS';
            eliminado.datos = `Nro. ${asiento.asiento} del ${asiento.fecha}`;
            this.elimService.save(eliminado).subscribe({
               next: () => {
                  this.authService.swal('success', `Asiento ${asiento.asiento} eliminada con éxito`);
                  this.buscar();
               },
               error: err => { console.error(err.error); this.authService.mostrarError('Error al guardar eliminado', err.error); }
            });
         },
         error: (err) => {
            if (err.status === 404) {
               this.authService.mensaje404(`El Asiento ${asiento.asiento} no existe o fue eliminado por otro Usuario`);
               this.buscar();
            } else {
               this.authService.mostrarError('Error al eliminar el Asiento', err.error);
            }
         }
      });
   }

   imprimir() {
      sessionStorage.setItem("asientosToImpExp", JSON.stringify(this.buscarAsientos));
      this.router.navigate(['/imp-asientos']);
   }

   cerrar() { this.router.navigate(['/inicio']); }

}
