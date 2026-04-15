import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormArray, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { BenextranCreateDTO, BenextranUpdateDTO } from 'src/app/dtos/contabilidad/benextran.dto';
import { TransaciUpdateDTO } from 'src/app/dtos/contabilidad/transaci.dto';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { Eliminadosapp } from 'src/app/modelos/administracion/eliminadosapp.model';
import { Asientos } from 'src/app/modelos/contabilidad/asientos.model';
import { Beneficiarios } from 'src/app/modelos/contabilidad/beneficiarios.model';
import { Benextran } from 'src/app/modelos/contabilidad/benextran.model';
import { Pagoscobros } from 'src/app/modelos/contabilidad/pagoscobros.model';
import { Transaci } from 'src/app/modelos/contabilidad/transaci.model';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { EliminadosappService } from 'src/app/servicios/administracion/eliminadosapp.service';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import { BeneficiariosService } from 'src/app/servicios/contabilidad/beneficiarios.service';
import { BenextranService } from 'src/app/servicios/contabilidad/benextran.service';
import { PagoscobrosService } from 'src/app/servicios/contabilidad/pagoscobros.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modi-benextran',
  templateUrl: './modi-benextran.component.html',
  styleUrls: ['./modi-benextran.component.css']
})

export class ModiBenextranComponent implements OnInit {

   formAsiento!: FormGroup;
   idasiento!: number;
   formTransaci!: FormGroup;
   transaci!: Transaci;
   inttra!: number | null;
   antidbene!: number;   // id del beneficiario de la transacción
   primeridbene: number;   //id del primer beneficiario
   documentos: Documentos[] = [];
   tiptran!: { nombre: string; cabecera1: string; cabecera2: string };
   arrBeneficiarios: Beneficiarios[][] = [];
   nomDebcre: string = 'Debe';
   pagoscobros: Pagoscobros[] = [];
   totPagoscobros: number = 0;
   formBenextran!: FormGroup;
   antvalor: number;
   anttotbene: number;
   totales: { totalValor: number; totalTotpagcob: number; totalSaldo: number; } = { totalValor: 0, totalTotpagcob: 0, totalSaldo: 0 };

   constructor(private fb: FormBuilder, private router: Router, private coloresService: ColoresService, public authService: AutorizaService,
      private asiService: AsientosService, private tranService: TransaciService, private docuService: DocumentosService,
      private beneService: BeneficiariosService, private elimService: EliminadosappService, private colorService: ColoresService,
      private benxtraService: BenextranService, private pagcobService: PagoscobrosService) {
      this.formBenextran = this.fb.group({
         registros: this.fb.array([])
      }, { updateOn: "blur" });
   }

   ngOnInit(): void {
      if (!this.authService.sessionlog) { this.router.navigate(['/inicio']); }
      sessionStorage.setItem('ventana', '/benextran');
      let coloresJSON = sessionStorage.getItem('/benextran');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      const datosToModiTransaci = JSON.parse(sessionStorage.getItem("datosToModiTransaci")!);
      this.tiptran = nombreTiptran(datosToModiTransaci.tiptran)
      this.inttra = +datosToModiTransaci.inttra;
      this.idasiento = datosToModiTransaci.idasiento;
      let debcre = 1;   //tiptran 2,3 y 4 => Debe  5,6 y 7 Haber
      if (datosToModiTransaci.tiptran > 4) { debcre = 2; this.nomDebcre = 'Haber'; };

      this.formAsiento = this.fb.group({
         numero: '',
         comprobante: '',
         fecha: '',
         fechastr: '',
         documentonum: '',
         beneficiario: '',
      });

      this.formTransaci = this.fb.group({
         orden: ['', Validators.required],
         codcue: [''],
         nomcue: [''],
         debcre: '',
         valor: ['', [Validators.required]],
         intdoc: '',
         numdoc: ['', Validators.required],
         descri: ['', Validators.required],
         registros: this.fb.array([])
      }, { updateOn: "blur" });

      this.listarDocumentos();
      this.datosAsiento();
      this.buscaTransaci();
      this.buscaRegistros();
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
            this.antvalor = transaci.valor;
            this.antidbene = transaci.idbene.idbene;
            this.formTransaci.patchValue({
               orden: transaci.orden,
               intdoc: transaci.intdoc.intdoc,
               numdoc: transaci.numdoc,
               codcue: transaci.idcuenta.codcue,
               nomcue: transaci.idcuenta.nomcue,
               debcre: transaci.debcre,
               valor: transaci.valor,
               descri: transaci.descri
            });
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar la Transacción', err.error) }
      });
   }

   get f() { return this.formTransaci.controls; }  // Getter del formTransaci
   get registros(): FormArray { return this.formTransaci.get('registros') as FormArray } // Getter para acceder al FormArray

   private getFilaCampo(index: number, campo: string): AbstractControl | null {
      const fila = this.registros.at(index) as FormGroup | undefined;
      if (!fila) { return null }
      const control = fila.get(campo);
      if (!control) { return null }
      return control;
   }

   // Crea un FormGroup para un registro
   crearRegistro(index: number): FormGroup {
      return this.fb.group({
         idbene: [null, [Validators.required]],
         nomben: ['', [Validators.required], [this.valBeneficiario(index)]],
         valor: [0, [Validators.required, Validators.min(0)]],
         totpagcob: 0,
         saldo: 0,
         estado: 3,
         idbenxtra: null,
      });
   }

   // Agregar una fila (vacía o con datos)
   agregarFila(benextran?: Benextran): void {
      const index = this.registros.length;
      const fila = this.crearRegistro(index);
      // Suscripción al control 'valor' de esta fila para recalcular saldo
      fila.get('valor')!.valueChanges.subscribe(nuevoValor => {
         const totpagcob = fila.get('totpagcob')!.value;
         if (fila.get('estado')!.value === 1) {
            fila.patchValue({ saldo: nuevoValor - totpagcob, estado: 2 }, { emitEvent: false });
         } else {
            fila.patchValue({ saldo: nuevoValor - totpagcob }, { emitEvent: false });
         }
         this.sumaTotales();
      });

      if (benextran) {
         fila.patchValue({
            idbene: benextran.idbene.idbene,
            nomben: benextran.idbene.nomben,
            valor: benextran.valor,
            totpagcob: benextran.totpagcob,
            saldo: benextran.valor - benextran.totpagcob,
            estado: 1,
            idbenxtra: benextran.idbenxtra,
         });
      }
      this.registros.push(fila);
   }

   // Benextran de una transaci.inttra
   buscaRegistros(): void {
      this.benxtraService.obtenerPorInttra(this.inttra!).subscribe({
         next: (benextran: Benextran[]) => {
            this.registros.clear();
            benextran.forEach(item => this.agregarFila(item));
            this.sumaTotales();

            this.anttotbene = this.registros.length;
         },
         error: err => { console.error('Error al recuperar registros:', err); this.authService.mostrarError('Error al buscar Benextran', err.error) }
      });
   }

   sumaTotales(): void {
      this.totales = { totalValor: 0, totalTotpagcob: 0, totalSaldo: 0 };
      // Accede al FormArray hijo dentro del padre
      this.registros.controls.forEach(fila => {
         const valor = fila.get('valor')?.value;
         const totpagcob = fila.get('totpagcob')?.value;
         const saldo = fila.get('saldo')?.value;
         this.totales.totalValor += typeof valor === 'number' ? valor : 0;
         this.totales.totalTotpagcob += typeof totpagcob === 'number' ? totpagcob : 0;
         this.totales.totalSaldo += typeof saldo === 'number' ? saldo : 0;
      });
      this.formTransaci.get('valor')?.setValue(this.totales.totalValor, { emitEvent: false });
   }

   benefixNombre(index: number, e: any) {
      if (!this.arrBeneficiarios[index]) { this.arrBeneficiarios[index] = []; }
      if (e.target.value != '') {
         this.beneService.findByNomben(e.target.value).subscribe({
            next: (beneficiarios: Beneficiarios[]) => this.arrBeneficiarios[index] = beneficiarios,
            error: err => console.error(err.error),
         });
      } else this.arrBeneficiarios[index] = [];
   }
   onBenefiSelected(index: number, e: any) {
      const selectedOption = this.arrBeneficiarios[index]?.find((x: { nomben: any; }) => x.nomben === e.target.value);
      const fila = this.registros.at(index) as FormGroup;
      const idBeneControl = fila.get('idbene');
      if (selectedOption) {
         const estadoControl = (this.registros.at(index) as FormGroup).get('estado');
         if (estadoControl?.value === 1) { estadoControl.setValue(2) }
         idBeneControl?.setValue(selectedOption.idbene);
         idBeneControl?.markAsDirty();
      }
      else idBeneControl?.setValue(null);
   }

   accionFila(index: number): void {
      const fila = this.registros.at(index);
      if (fila.get('estado')!.value < 3) { this.eliminarFila(index) } else { this.quitarFila(index) }
   }

   quitarFila(index: number): void {
      const fila = this.registros.at(index);
      this.registros.removeAt(index);
      this.sumaTotales();
   }

   seleccionarTexto(event: FocusEvent): void {
      const input = event.target as HTMLInputElement;
      input.select();
   }

   async guardarFilas(): Promise<void> {
      let swerror = false;
      for (let i = 0; i < this.registros.length; i++) {
         const fila = this.registros.at(i) as FormGroup;
         if (i == 0) this.primeridbene = fila.get('idbene')?.value;
         if (fila.get('estado')?.value === 2) {    // Actualizar
            const dtoBenextran: BenextranUpdateDTO = {};   // Todos los campos opcionales
            if (fila.get('idbene')?.dirty) { dtoBenextran.idbene = { idbene: fila.get('idbene')?.value } };
            if (fila.get('valor')?.dirty) { dtoBenextran.valor = fila.get('valor')?.value };
            try {
               await firstValueFrom(this.benxtraService.updateBenextran(fila.get('idbenxtra')?.value, dtoBenextran));
            } catch (error) {
               swerror = true;
               console.error(error);
               this.authService.mostrarError('Error al actualizar Benextran', error);
            }
         } else if (fila.get('estado')?.value === 3) {   // Nuevo
            const dtoBenextran: BenextranCreateDTO = {
               inttra: { inttra: this.inttra! },
               idbene: { idbene: this.getFilaCampo(i, 'idbene')?.value },
               intdoc: { intdoc: this.formTransaci.value.intdoc },
               numdoc: this.formTransaci.value.numdoc,
               valor: fila.value.valor,
               totpagcob: 0,
               pagocobro: 0
            };
            try {
               await firstValueFrom(this.benxtraService.saveBenextran(dtoBenextran));
            } catch (error) {
               swerror = true;
               console.error(error);
               this.authService.mostrarError('Error al guardar Benextran', error);
            }
         }
      }
      if (!swerror) { this.actualizaTransaci(true) }
   }

   // Actauliza Transaci (swregresar: cuando filas=0 regresa )
   actualizaTransaci(swregresar: boolean) {
      // Crea el dto con los campos modificados (Todos son opcionales)
      const dto: TransaciUpdateDTO = {};
      if (this.f['orden'].dirty) { dto.orden = this.formTransaci.value.orden }
      if (this.f['intdoc'].dirty) { dto.intdoc = { intdoc: this.f['intdoc'].value } };
      if (this.f['numdoc'].dirty) { dto.numdoc = this.formTransaci.value.numdoc };
      if (this.f['debcre'].dirty) { dto.debcre = this.f['debcre'].value };
      if (this.antvalor != this.f['valor'].value) { dto.valor = this.f['valor'].value };
      if (this.f['descri'].dirty) { dto.descri = this.f['descri'].value };
      if (this.anttotbene != this.registros.length) { dto.totbene = this.registros.length };
      // console.log('this.antidbene y this.primeridbene: ', this.antidbene, this.primeridbene)
      if (this.antidbene != this.primeridbene) {
         if (this.primeridbene == 0) {
            dto.idbene = { idbene: 1 };
            dto.totbene = 0;
         }
         else { dto.idbene = { idbene: this.primeridbene } }
      }
      dto.usumodi = this.authService.idusuario;
      dto.fecmodi = new Date();
      // console.log('dto: ', dto)
      // return
      this.tranService.updateTransa(this.inttra!, dto).subscribe({
         next: (transaci: Transaci) => {
            if (swregresar) {
               this.authService.swal('success', `Cuenta: ${transaci.codcue} modificada con éxito del Asiento: ${this.formAsiento.value.numero}`)
               this.regresar()
            } else { this.authService.swal('success', `Beneficiario eliminado con éxito del ${this.tiptran.nombre}`); }
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al actualizar la Transacción', err.error) }
      });
   }

   eliminarFila(index: number): void {
      const fila = this.registros.at(index) as FormGroup;
      const valoresFila = fila.value;
      Swal.fire({
         icon: 'warning',
         title: 'Mensaje',
         text: `Eliminar el Beneficiario: ${valoresFila.nomben} de la Cuenta ${this.transaci.codcue} ?`,
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
      this.benxtraService.deleteBenextran(valoresFila.idbenxtra).subscribe({
         next: (resp) => {
            // console.log('resp.status: ', resp.status)
            if (resp.status === 200) {
               const eliminado: Eliminadosapp = new Eliminadosapp();
               eliminado.idusuario = this.authService.idusuario!;
               eliminado.modulo = this.authService.moduActual;
               eliminado.fecha = new Date();
               eliminado.routerlink = 'modi-benextran';
               eliminado.tabla = 'BENEXTRAN';
               eliminado.datos = `Beneficiario: ${valoresFila.nomben} Cuenta: ${this.transaci.codcue} Valor: ${valoresFila.valor}`;
               this.elimService.save(eliminado).subscribe({
                  next: () => {
                     this.registros.removeAt(index);
                     this.sumaTotales();
                     if (this.registros.length === 0) { this.primeridbene = 0; this.actualizaTransaci(true) }
                     else {
                        this.primeridbene = this.getFilaCampo(0, 'idbene')?.value; this.actualizaTransaci(false)
                     }
                  },
                  error: err => { console.error(err.error); this.authService.mostrarError('Error al guardar eliminado', err.error); }
               });
            } else if (resp.status === 204) {
               this.authService.mensaje404(`${this.tiptran.cabecera1} a ${valoresFila.nomben} no existe o fue eliminada por otro Usuario`);
            }
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al eliminar Benextran', err.error) }
      });
   }

   buscaPagoscobros(idbenxtra: number) {
      this.pagcobService.obtenerPorBenextran(idbenxtra).subscribe({
         next: (pagoscobros: Pagoscobros[]) => {
            this.pagoscobros = pagoscobros;
            if (this.pagoscobros.length > 1) {  // Calcula total si hay más de una fila
               this.totPagoscobros = this.pagoscobros
                  .map(p => p.valor)
                  .reduce((acc, val) => acc + val, 0);
            } else { this.totPagoscobros = 0 }
         },
         error: (err) => { console.error(err); this.authService.mostrarError('Error al recuperar Pagoscobros', err.error) }
      });
   }

   regresar() { this.router.navigate(['/transaci']); }

   //Valida Beneficiario
   valBeneficiario(i: number): AsyncValidatorFn {
      return (_control: AbstractControl): Observable<ValidationErrors | null> => {
         const idbene = this.getFilaCampo(i, 'idbene')?.value;
         return of(idbene ? null : { invalido: true });
      };
   }

}

function nombreTiptran(tiptran: number): { nombre: string, cabecera1: string, cabecera2: string } {
   if (tiptran == 2) return { nombre: 'Modificación de Anticipo(s)', cabecera1: 'Anticipo', cabecera2: 'Liquidado' };
   if (tiptran == 3) return { nombre: 'Modificación de Cuenta(s) por cobrar', cabecera1: 'Cuenta por cobrar', cabecera2: 'Cobrado' };
   if (tiptran == 4) return { nombre: 'Modificación de Cuenta(s) por cobrar año anterior', cabecera1: 'Valor', cabecera2: 'Cobrado' };
   if (tiptran == 5) return { nombre: 'Modificación de Depósitos y fondos de terceros', cabecera1: 'Valor', cabecera2: 'Liquidado' };
   if (tiptran == 6) return { nombre: 'Modificación de Cuenta(s) por pagar', cabecera1: 'Cuenta por Pagar', cabecera2: 'Pagado' };
   if (tiptran == 7) return { nombre: 'Modificación de Cuenta(s) por pagar año anterior', cabecera1: 'Valor', cabecera2: 'Pagado' };
   return { nombre: '(Ninguno)', cabecera1: ' ', cabecera2: ' ' };
}

interface RegistroForm {
   idbene: number;
   nomben: string;
   valor: number;
   totpagcob: number;
   saldo: number;
   estado: number;
   idbenxtra: number;
}