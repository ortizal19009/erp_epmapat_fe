import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormArray, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { EjecucioCreateDTO, EjecucioUpdateDTO } from 'src/app/dtos/contabilidad/ejecucio.dto';
import { PagoscobrosUpdateDTO } from 'src/app/dtos/contabilidad/pagoscobros.dto';
import { TransaciUpdateDTO } from 'src/app/dtos/contabilidad/transaci.dto';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { Eliminadosapp } from 'src/app/modelos/administracion/eliminadosapp.model';
import { Asientos } from 'src/app/modelos/contabilidad/asientos.model';
import { Beneficiarios } from 'src/app/modelos/contabilidad/beneficiarios.model';
import { Ejecucio } from 'src/app/modelos/contabilidad/ejecucio.model';
import { Pagoscobros } from 'src/app/modelos/contabilidad/pagoscobros.model';
import { Presupue } from 'src/app/modelos/contabilidad/presupue.model';
import { Transaci } from 'src/app/modelos/contabilidad/transaci.model';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { EliminadosappService } from 'src/app/servicios/administracion/eliminadosapp.service';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucio.service';
import { PagoscobrosService } from 'src/app/servicios/contabilidad/pagoscobros.service';
import { PresupueService } from 'src/app/servicios/contabilidad/presupue.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modi-pagoscobros',
  templateUrl: './modi-pagoscobros.component.html',
  styleUrls: ['./modi-pagoscobros.component.css']
})

export class ModiPagoscobrosComponent implements OnInit {

   formAsiento!: FormGroup;
   idasiento!: number;
   formTransaci!: FormGroup;
   transaci!: Transaci;
   inttra!: number | null;
   antidbene!: number;   // id del beneficiario de la transacción
   primeridbene: number;
   documentos: Documentos[] = [];
   tiptran: number;
   nombretiptran!: { nombre: string; cabecera1: string; cabecera2: string; cabecera3: string };
   ejecucio: Ejecucio | null;    // Ejecución de cobros o pagos
   presupue: Presupue[] = [];
   arrBeneficiarios: Beneficiarios[][] = [];
   totDebe!: number;
   totHaber!: number;
   nomDebcre: string = 'Debe';
   antvalor: number;
   anttotbene: number;
   formPagoscobros!: FormGroup;
   swCobpagado: boolean = false;
   txtCobpagado: String = 'noVisible';
   txtPresupuestario: string = 'Cobrado presupuestario';
   intpre: number | null;
   naturaleza: string;
   totales: { totBenextranValor: number; totTotpagcob: number; totSaldo: number; totValor: number; }
      = { totBenextranValor: 0, totTotpagcob: 0, totSaldo: 0, totValor: 0 };

   constructor(private fb: FormBuilder, private router: Router, private coloresService: ColoresService, public authService: AutorizaService,
      private asiService: AsientosService, private tranService: TransaciService, private docuService: DocumentosService,
      private elimService: EliminadosappService, private pagcobService: PagoscobrosService, private presuService: PresupueService,
      private ejecuService: EjecucionService) {
      this.formPagoscobros = this.fb.group({
         registros: this.fb.array([])
      }, { updateOn: "blur" });
   }

   ngOnInit(): void {
      if (!this.authService.sessionlog) { this.router.navigate(['/inicio']); }
      sessionStorage.setItem('ventana', '/add-pagoscobros');
      let coloresJSON = sessionStorage.getItem('/add-pagoscobros');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      const datosToModiTransaci = JSON.parse(sessionStorage.getItem("datosToModiTransaci")!);
      this.inttra = +datosToModiTransaci.inttra;
      this.idasiento = datosToModiTransaci.idasiento;
      this.totDebe = +datosToModiTransaci.totDebe;
      this.totHaber = +datosToModiTransaci.totHaber;
      this.tiptran = datosToModiTransaci.tiptran;
      if (this.tiptran == 12) this.txtPresupuestario = 'Pagado presupuestario'
      this.nombretiptran = nombreTiptran(this.tiptran)
      if (datosToModiTransaci.tiptran > 4) { this.nomDebcre = 'Haber'; };

      this.formAsiento = this.fb.group({
         numero: '',
         comprobante: '',
         fecha: '',
         documentonum: '',
         beneficiario: '',
      });

      this.formTransaci = this.fb.group({
         orden: ['', Validators.required],
         codcue: [''],
         nomcue: [''],
         valor: ['', [Validators.required]],
         intdoc: null,
         numdoc: ['', Validators.required],
         descri: [''],
         registros: this.fb.array([]),
         codpar: ['', Validators.required, this.valCodpar()],
         nompar: '',
         cobpagado: ''
      }, { updateOn: "blur" });

      this.listarDocumentos();
      this.datosAsiento();
      this.buscaTransaci();
      this.buscaPagoscobros();
   }

   async buscaColor() {
      try {
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'add-pagoscobros');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/add-pagoscobros', coloresJSON);
         this.colocaColor(datos);
      } catch (error) { console.error(error) }
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   listarDocumentos() {
      this.docuService.getListaDocumentos().subscribe({
         next: (documentos: Documentos[]) => this.documentos = documentos,
         error: (err) => { console.error(err.error); this.authService.mostrarError('Error al recuperar Documentos', err.error) }
      });
   }

   datosAsiento() {
      this.asiService.unAsiento(this.idasiento).subscribe({
         next: (asiento: Asientos) => {
            let documentonum: String;
            if (asiento.intdoc.intdoc == 1) documentonum = asiento.numdoc;
            else documentonum = asiento.intdoc.nomdoc + ' ' + asiento.numdoc;
            this.formAsiento.patchValue({
               numero: asiento.asiento,
               comprobante: this.authService.comprobante(asiento.tipcom, asiento.compro),
               fecha: asiento.fecha,
               documentonum: documentonum,
               beneficiario: asiento.idbene.nomben,
            });
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar el Asiento', err.error) }
      });
   }

   buscaTransaci() {
      this.tranService.getById(this.inttra!).subscribe({
         next: (transaci: Transaci) => {
            this.transaci = transaci;
            this.antidbene = transaci.idbene.idbene;
            this.antvalor = transaci.valor;
            this.anttotbene = transaci.totbene;
            this.naturaleza = '61'  //transaci.idcuenta.codcue.slice(??)
            this.formTransaci.patchValue({
               orden: transaci.orden,
               intdoc: transaci.intdoc.intdoc,
               numdoc: transaci.numdoc,
               codcue: transaci.idcuenta.codcue,
               nomcue: transaci.idcuenta.nomcue,
               valor: transaci.valor,
               descri: transaci.descri
            });
            if (this.tiptran == 9 || this.tiptran == 12) {
               this.ejecuService.getByInttra(transaci.inttra).subscribe({
                  next: (ejecucio: Ejecucio | null) => {
                     this.ejecucio = ejecucio;
                     if (ejecucio) {
                        this.intpre = ejecucio.intpre.intpre;
                        this.formTransaci.patchValue({
                           codpar: ejecucio.intpre.codpar,
                           nompar: ejecucio.intpre.nompar,
                           cobpagado: ejecucio.cobpagado
                        });
                     }
                  },
                  error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar Ejecucio', err.error) }
               })
            }
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar la Transacción', err.error) }
      });
   }

   get f() { return this.formTransaci.controls; }

   //Datalist de codpar 
   partidaxCodpar(e: any) {
      if (e.target.value != '') {
         this.presuService.findByCodpar(2, e.target.value).subscribe({
            next: (partidas: Presupue[]) => this.presupue = partidas,
            error: err => console.error(err.error),
         });
      }
   }
   onPartidaSelected(e: any) {
      const selectedOption = this.presupue.find((x: { codpar: any; }) => x.codpar === e.target.value);
      if (selectedOption) {
         this.intpre = selectedOption.intpre;
         this.swCobpagado = true;
         this.f['codpar'].setValue(selectedOption.codpar);
         this.f['nompar'].setValue(selectedOption.nompar);
         this.f['cobpagado'].setValue(this.f['valor'].value);
         if (!this.ejecucio) {
            this.txtCobpagado = 'Guardar'
            this.registros.disable();
         }
         else this.txtCobpagado = 'Actualizar'
      }
      else {
         this.intpre = null;
         this.formTransaci.patchValue({ nompar: '' })
      }
   }

   // Getter para acceder al FormArray
   get registros(): FormArray { return this.formTransaci.get('registros') as FormArray }

   // Crea un FormGroup para un registro
   crearRegistro(index: number): FormGroup {
      return this.fb.group({
         asiento: '',
         comprobante: '',
         fecha: '',
         idbene: '',
         nomben: '',
         benextran_valor: '',
         valor: [0, [Validators.required], [this.valValor()]],
         antvalor: '',
         totpagcob: [0],
         saldo: [0],
         idpagcob: [''],
         estado: 1 // 1: sin cambios, 2: modificado
      });
   }

   // Agregar una fila (Con datos)
   agregarFila(pagoscobros: Pagoscobros): void {
      const index = this.registros.length;
      const fila = this.crearRegistro(index);
      // Suscripción al control 'valor' de esta fila para recalcular saldo
      fila.get('valor')!.valueChanges.subscribe(nuevoValorRaw => {
         const nuevoValor = Number(nuevoValorRaw) || 0;
         const antvalor = Number(fila.get('antvalor')!.value) || 0;
         const totpagcobActual = Number(fila.get('totpagcob')!.value) || 0;
         const benextranValor = Number(fila.get('benextran_valor')!.value) || 0;
         // Ajustar totpagcob: quitar el valor anterior y sumar el nuevo
         const totpagcobNuevo = totpagcobActual - antvalor + nuevoValor;
         // Recalcular saldo directamente
         const saldo = benextranValor - totpagcobNuevo;
         fila.patchValue({ totpagcob: totpagcobNuevo, saldo, antvalor: nuevoValor, estado: 2 }, { emitEvent: false });
         this.sumaTotales();
      });
      fila.patchValue({
         asiento: pagoscobros.idbenxtra.inttra.idasiento.asiento,
         comprobante: this.authService.comprobante(pagoscobros.idbenxtra.inttra.idasiento.tipcom, pagoscobros.idbenxtra.inttra.idasiento.compro),
         fecha: pagoscobros.idbenxtra.inttra.idasiento.fecha,
         idbene: pagoscobros.idbene.idbene,
         nomben: pagoscobros.idbene.nomben,
         benextran_valor: pagoscobros.idbenxtra.valor,
         valor: pagoscobros.valor,
         antvalor: pagoscobros.valor,
         totpagcob: pagoscobros.idbenxtra.totpagcob,
         saldo: pagoscobros.idbenxtra.valor - pagoscobros.idbenxtra.totpagcob,
         idpagcob: pagoscobros.idpagcob,
      });
      this.registros.push(fila);
   }

   // Pagoscobros
   buscaPagoscobros(): void {
      this.pagcobService.obtenerPorInttra(this.inttra!).subscribe({
         next: (pagoscobros: Pagoscobros[]) => {
            this.registros.clear();
            pagoscobros.forEach(item => this.agregarFila(item));
            this.sumaTotales();
         },
         error: err => { console.error(err); this.authService.mostrarError('Error al buscar Pagoscobros', err.error) }
      });
   }

   sumaTotales(): void {
      this.totales = { totBenextranValor: 0, totTotpagcob: 0, totSaldo: 0, totValor: 0 };
      this.registros.controls.forEach(fila => {
         const benextranvalor = fila.get('benextran_valor')?.value;
         const totpagcob = fila.get('totpagcob')?.value;
         const saldo = fila.get('saldo')?.value;
         const valor = fila.get('valor')?.value;
         this.totales.totBenextranValor += typeof benextranvalor === 'number' ? benextranvalor : 0;
         this.totales.totTotpagcob += typeof totpagcob === 'number' ? totpagcob : 0;
         this.totales.totSaldo += typeof saldo === 'number' ? saldo : 0;
         this.totales.totValor += typeof valor === 'number' ? valor : 0;
      });
      this.formTransaci.get('valor')?.setValue(this.totales.totValor, { emitEvent: false });
      if (this.ejecucio) {
         this.formTransaci.get('cobpagado')?.setValue(this.totales.totValor, { emitEvent: false });
         this.txtCobpagado = 'Automático'
      }
   }

   // Actualiza las filas modificadas
   async actualizFilas(): Promise<void> {
      let swerror = false;
      for (let i = 0; i < this.registros.length; i++) {
         const fila = this.registros.at(i) as FormGroup;
         if (i == 0) this.primeridbene = fila.get('idbene')?.value;
         if (fila.get('estado')?.value == 2) {
            const dtoPagoscobros: PagoscobrosUpdateDTO = {
               idbene: { idbene: fila.get('idbeneficiario')?.value },
               valor: fila.get('valor')?.value
            }
            try {
               await firstValueFrom(this.pagcobService.updatePagoscobros(fila.get('idpagcob')?.value, dtoPagoscobros));
            } catch (error) {
               swerror = true;
               console.error(error);
               this.authService.mostrarError('Error al actualizar Pagoscobros', error);
            }
         }
      }
      if (!swerror) { this.actualizaTransaci(true) }
   }

   seleccionarTexto(event: FocusEvent): void {
      const input = event.target as HTMLInputElement;
      input.select();
   }

   eliminarFila(index: number): void {
      const fila = this.registros.at(index) as FormGroup;
      const valoresFila = fila.value;
      Swal.fire({
         icon: 'warning',
         title: 'Mensaje',
         text: `Eliminar ${this.nombretiptran.cabecera3} del Beneficiario: ${valoresFila.nomben} ?`,
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
         if (resultado.isConfirmed) { this.elimina(valoresFila, index) }
      });
   }

   //Elimina
   elimina(valoresFila: RegistroForm, index: number) {
      this.pagcobService.deletePagoscobros(valoresFila.idpagcob).subscribe({
         next: (resp) => {
            if (resp.status === 200) {
               const eliminado: Eliminadosapp = new Eliminadosapp();
               eliminado.idusuario = this.authService.idusuario!;
               eliminado.modulo = this.authService.moduActual;
               eliminado.fecha = new Date();
               eliminado.routerlink = 'modi-pagoscobros';
               eliminado.tabla = 'PAGOSCOBROS';
               eliminado.datos = `Beneficiario: ${valoresFila.nomben} Valor: ${valoresFila.valor}`;
               this.elimService.save(eliminado).subscribe({
                  next: () => {
                     this.registros.removeAt(index);
                     this.sumaTotales();
                     if (this.registros.length === 0) { this.primeridbene = 0; this.actualizaTransaci(true) }
                     else { this.actualizaTransaci(false) }
                  },
                  error: err => { console.error(err.error); this.authService.mostrarError('Error al guardar eliminado', err.error); }
               });
            }
            else if (resp.status === 204) {
               this.authService.mensaje404(`${this.nombretiptran.cabecera1} a ${valoresFila.nomben} no existe o fue eliminada por otro Usuario`);
            }
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al eliminar', err.error); }
      });
   }

   actualizaTransaci(swregresar: boolean) {
      if (this.txtCobpagado == 'Automático') this.cobpagado(false)
      // Crea el dto con los campos modificados (Todos son opcionales)
      const dtoTransaci: TransaciUpdateDTO = {};
      if (this.f['orden'].dirty) { dtoTransaci.orden = this.formTransaci.value.orden }
      if (this.f['intdoc'].dirty) { dtoTransaci.intdoc = { intdoc: this.f['intdoc'].value } };
      if (this.f['numdoc'].dirty) { dtoTransaci.numdoc = this.formTransaci.value.numdoc };
      if (this.antvalor != this.f['valor'].value) { dtoTransaci.valor = this.f['valor'].value };
      if (this.f['descri'].dirty) { dtoTransaci.descri = this.f['descri'].value };
      if (this.antidbene != this.primeridbene) {
         if (this.primeridbene == 0) {
            dtoTransaci.idbene = { idbene: 1 };
            dtoTransaci.totbene = 0;
         }
         else { dtoTransaci.idbene = { idbene: this.primeridbene } }
      }
      dtoTransaci.usumodi = this.authService.idusuario;
      dtoTransaci.fecmodi = new Date();
      this.tranService.updateTransa(this.inttra!, dtoTransaci).subscribe({
         next: () => {
            if (swregresar) {
               this.authService.swal('success', `Transacción actualizada con éxito`)
               this.regresar()
            } else {
               this.authService.swal('success', `Beneficiario eliminado con éxito del ${this.nombretiptran.nombre}`);
            }
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al actualizar la Transacción', err.error) }
      });
   }

   // Añade o actualiza Ejecución (cobpagado presupuestario)
   cobpagado(mensaje: boolean) {
      if (this.txtCobpagado == 'Guardar') {
         let tipeje = 4;
         const dtoEjecucio: EjecucioCreateDTO = {
            tipeje: tipeje,
            intpre: { intpre: this.intpre! },
            codpar: this.formTransaci.value.codpar,
            fecha_eje: this.formAsiento.value.fecha,
            modifi: 0,
            prmiso: 0,
            totdeven: 0,
            devengado: 0,
            cobpagado: this.formTransaci.value.valor,
            concep: this.formTransaci.value.descri,
            idrefo: 0,
            idtrami: null,
            idasiento: this.idasiento,
            inttra: this.transaci.inttra,
            idparxcer: null,
            idprmiso: null,
            idtrata: 0,
            usucrea: this.authService.idusuario,
            feccrea: new Date(),
         }
         this.ejecuService.saveEjecu(dtoEjecucio).subscribe({
            next: (_ejecucio: Ejecucio) => {
               this.authService.swal('success', `Cobrado/Pagado guardado con éxito`);
               this.swCobpagado = false;
               this.txtCobpagado = 'noVisible';
               this.registros.enable();
            },
            error: err => { console.error(err.error); this.authService.mostrarError('Error al guardar Ejecucio', err.error) }
         });
      }
      else {   //Actualiza cobpagado
         if (this.txtCobpagado == 'Actualizar') {
            // let intpre = this.formTransaci.value.intpre;
            const dto: EjecucioUpdateDTO = {};
            // No usar dirty (se colocan programáticamente)
            { dto.intpre = { intpre: this.intpre! } };
            { dto.codpar = this.formTransaci.value.codpar };
            { dto.cobpagado = this.formTransaci.value.cobpagado };
            dto.usumodi = this.authService.idusuario;
            dto.fecmodi = new Date();
            this.ejecuService.updateEjecucio(this.ejecucio!.inteje, dto).subscribe({
               next: (_ejecucio: Ejecucio) => {
                  if (mensaje) this.authService.swal('success', `Cobrado/Pagado actualizado con éxito`);
                  this.swCobpagado = false;
                  this.txtCobpagado = 'noVisible';
               },
               error: err => { console.error(err.error); this.authService.mostrarError('Error al actualizar Ejecucio', err.error) }
            });
         }
      }
   }

   regresar() { this.router.navigate(['/transaci']); }

   valCodpar(): AsyncValidatorFn {
      return (control: AbstractControl) => {
         if (this.intpre == null) { return of<ValidationErrors>({ invalido: true }); }
         const valor: string = control.value ?? '';
         const sub = valor.substring(3, 5);
         if (sub !== this.naturaleza) { 
            this.txtCobpagado = 'noVisible';
            return of<ValidationErrors>({ naturalezaInvalida: true }); }
         return of(null);
      };
   }

   valValor(): AsyncValidatorFn {
      return (control: AbstractControl) => {
         const fila = control.parent as FormGroup;
         if (!fila) return of(null);
         const nuevoValor = Number(control.value) || 0;
         const antvalor = Number(fila.get('antvalor')?.value) || 0;
         const totpagcobActual = Number(fila.get('totpagcob')?.value) || 0;
         const benextranValor = Number(fila.get('benextran_valor')?.value) || 0;
         // Recalcular totpagcob con el nuevo valor
         const totpagcobNuevo = totpagcobActual - antvalor + nuevoValor;

         // Saldo original y saldo resultante
         const saldoOriginal = benextranValor - totpagcobActual;
         const saldoNuevo = benextranValor - totpagcobNuevo;

         const esNegativo = benextranValor < 0;
         const valorEsNegativo = nuevoValor < 0;
         // --- REGLA DE SIGNO ---
         if (esNegativo && !valorEsNegativo) {
            return of({
               signoInvalido: {
                  // mensaje: `El ${this.tiptran.cabecera2} debe ser negativo`
                  mensaje: `Debe ser negativo`
               }
            });
         }
         if (!esNegativo && valorEsNegativo) {
            return of({
               signoInvalido: {
                  // mensaje: `El ${this.tiptran.cabecera2} debe ser positivo`
                  mensaje: `Debe ser positivo`
               }
            });
         }
         // --- VALIDACIÓN DE EXCESO ---
         if (esNegativo) {
            // Si el saldo resultante queda positivo → excede
            if (saldoNuevo > 0) {
               return of({
                  liquidaExcede: {
                     maxPermitido: saldoOriginal
                  }
               });
            }
         } else {
            // Saldo positivo → no puede exceder el saldo original
            if (nuevoValor > saldoOriginal) {
               return of({
                  liquidaExcede: {
                     maxPermitido: saldoOriginal
                  }
               });
            }
         }

         return of(null);
      };
   }

}

function nombreTiptran(tiptran: number): { nombre: string, cabecera1: string, cabecera2: string, cabecera3: string } {
   if (tiptran == 8) return { nombre: 'Modificación de Liquidación de Anticipo(s)', cabecera1: 'Anticipo', cabecera2: 'Liquidado', cabecera3: 'Liquida' };
   if (tiptran == 9) return { nombre: 'Modificación de Cobro(s)', cabecera1: 'CxC', cabecera2: 'Cobrado', cabecera3: 'Cobro' };
   if (tiptran == 10) return { nombre: 'Modificación de Cobro(s) año anterior', cabecera1: 'CxC', cabecera2: 'Cobrado', cabecera3: 'Cobro' };
   if (tiptran == 11) return { nombre: 'Modificación de Liquidación de Depósitos y fondos de terceros', cabecera1: 'Valor', cabecera2: 'Liquidado', cabecera3: 'Liquida' };
   if (tiptran == 12) return { nombre: 'Modificación de Pago(s)', cabecera1: 'CxP', cabecera2: 'Pagado', cabecera3: 'Pago' };
   if (tiptran == 13) return { nombre: 'Modificación de Pago(s) año anterior (presupuestario)', cabecera1: 'CxP', cabecera2: 'Pagado', cabecera3: 'Pago' };
   return { nombre: '(Ninguno)', cabecera1: ' ', cabecera2: ' ', cabecera3: ' ' };
}

interface RegistroForm {
   asiento: number;
   comprobante: string;
   fecha: Date;
   idbeneficiario: number;
   nomben: string;
   benextran_valor: number;
   totpagcob: number;
   saldo: number;
   valor: number;
   estado: number;
   idpagcob: number;
}