import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { VisualFormatDirective } from 'src/app/directives/visual-format.directive';
import { TransaciUpdateDTO } from 'src/app/dtos/contabilidad/transaci.dto';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { Asientos } from 'src/app/modelos/contabilidad/asientos.model';
import { Beneficiarios } from 'src/app/modelos/contabilidad/beneficiarios.model';
import { Cuentas } from 'src/app/modelos/contabilidad/cuentas.model';
import { Ejecucio } from 'src/app/modelos/contabilidad/ejecucio.model';
import { Presupue } from 'src/app/modelos/contabilidad/presupue.model';
import { Transaci } from 'src/app/modelos/contabilidad/transaci.model';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucio.service';
import { PreingresoService } from 'src/app/servicios/contabilidad/preingreso.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';
@Component({
   selector: 'app-modi-transaci',
   templateUrl: './modi-transaci.component.html',
   styleUrls: ['./modi-transaci.component.css'], 
   
})
export class ModiTransaciComponent implements OnInit {

   formTransaci: FormGroup;
   iAsiento = {} as interfaceAsiento; //Interface para los datos del Asiento
   idasiento: number;
   totDebe: number;
   totHaber: number;
   cuentas: Cuentas[] = [];
   idcuenta: number | null;
   documentos: Documentos[] = [];
   inttra: number;
   partida: { intpre: number | null; codpar: String } = { intpre: null, codpar: '' };
   antIntpre: number | null;

   constructor(private router: Router, private fb: FormBuilder, private asiService: AsientosService, public authService: AutorizaService,
      private cueService: CuentasService, private docuService: DocumentosService, private tranService: TransaciService,
      private ejecuService: EjecucionService , private preingService: PreingresoService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/transaci');
      let coloresJSON = sessionStorage.getItem('/transaci');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      const datosToModiTransaci = JSON.parse(sessionStorage.getItem("datosToModiTransaci")!);
      this.inttra = datosToModiTransaci.inttra;
      this.idasiento = datosToModiTransaci.idasiento;
      this.totDebe = +datosToModiTransaci.totDebe;
      this.totHaber = +datosToModiTransaci.totHaber;

      let date: Date = new Date();
      this.formTransaci = this.fb.group({
         orden: ['', Validators.required],
         idcuenta: ['', Validators.required, this.valCuenta()],
         codcue: '',
         nomcue: [''],
         intdoc: this.documentos,
         numdoc: ['', Validators.required],
         debcre: ['', Validators.required],
         valor: ['', Validators.required],
         descri: '',
         intpre: '',
         codpar: '',
         nompar: ''
      }, { updateOn: "blur" });

      this.listaDocumentos();
      this.datosAsiento();
      this.datosTransaci();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   datosAsiento() {
      this.asiService.unAsiento(this.idasiento).subscribe({
         next: datos => {
            this.iAsiento.tipasi = datos.tipasi;
            this.iAsiento.asiento = datos.asiento;
            this.iAsiento.fecha = datos.fecha;
            this.iAsiento.comprobante = this.authService.comprobante(datos.tipcom, datos.compro);
            this.iAsiento.benefi = datos.idbene.nomben;
            this.iAsiento.documento = datos.intdoc.nomdoc + ' ' + datos.numdoc;
            this.iAsiento.intdoc = datos.intdoc.intdoc;
         },
         error: err => console.error(err.error)
      });
   }

   datosTransaci() {
      this.tranService.getById(this.inttra).subscribe({
         next: (transaci: Transaci) => {
            this.idcuenta = transaci.idcuenta.idcuenta;
            this.formTransaci.patchValue({
               orden: transaci.orden,
               idcuenta: transaci.idcuenta.codcue,
               codcue: transaci.codcue,
               nomcue: transaci.idcuenta.nomcue,
               intdoc: transaci.intdoc.intdoc,
               numdoc: transaci.numdoc,
               debcre: transaci.debcre,
               valor: transaci.valor,
               descri: transaci.descri,
            });
            this.ejecuService.getByInttra(transaci.inttra).subscribe({
               next: (ejecucio: Ejecucio | null) => {
                  if (ejecucio != null) {
                     this.antIntpre = ejecucio?.intpre?.intpre;
                     this.partida = { intpre: ejecucio?.intpre?.intpre, codpar: ejecucio?.intpre?.codpar };
                     this.formTransaci.get('debcre')?.disable();
                     this.formTransaci.patchValue({
                        codpar: this.partida.codpar,
                        nompar: ejecucio.intpre.nompar
                     });
                  } else { this.antIntpre = null }
               },
               error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar Ejecucio', err.error) }
            });
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar Transaci', err.error) }
      });
   }

   get f() { return this.formTransaci.controls; }

   listaDocumentos() {
      this.docuService.getListaDocumentos().subscribe({
         next: (documentos: Documentos[]) => { this.documentos = documentos },
         error: err => console.error(err.error),
      });
   }

   cuentasxTiptran(e: any) {
      if (e.target.value != '') {
         this.cueService.findByTiptran(0, e.target.value).subscribe({
            next: datos => this.cuentas = datos,
            error: err => console.error(err.error),
         });
      }
   }
   onCuentaSelected(e: any) {
      const selectedOption = this.cuentas.find((x: { codcue: any; }) => x.codcue === e.target.value);
      if (selectedOption) {
         this.idcuenta = selectedOption.idcuenta
         this.f['codcue'].setValue(selectedOption.codcue);
         this.f['nomcue'].setValue(selectedOption.nomcue);
         if (this.iAsiento.tipasi == 2 && selectedOption.asohaber && selectedOption.asohaber.length > 6) {    //Ok asi porque asohaber no siempre es nulo
            this.preingService.getByCodpar(selectedOption.asohaber).subscribe({
               next: (presupue: Presupue) => {
                  if (presupue) {
                     this.partida = { intpre: presupue.intpre, codpar: presupue.codpar };
                     this.formTransaci.controls['codpar'].setValue(presupue.codpar);
                     this.formTransaci.controls['nompar'].setValue(presupue.nompar);
                     this.formTransaci.controls['debcre'].setValue(2);
                  }
                  else {
                     this.authService.swal('warning', `No Existe la Partida: ${selectedOption.asohaber} `)
                     this.partida = { intpre: null, codpar: '' };
                  }
               },
               error: err => console.error(err.error)
            });
         } else { this.partida = { intpre: null, codpar: '' }; }
      }
      else {
         this.idcuenta = null;
         this.formTransaci.controls['nomcue'].setValue('');
      };
   }

   seleccionarTexto(event: FocusEvent): void {
      const input = event.target as HTMLInputElement;
      input.select();
   }

   onSubmit() {
      // Crea el dto con los campos modificados (Todos son opcionales)
      const dto: TransaciUpdateDTO = {};   
      if (this.f['orden'].dirty) { dto.orden = this.formTransaci.value.orden }
      if (this.f['idcuenta'].dirty) { dto.idcuenta = { idcuenta: this.idcuenta! } }
      if (this.f['intdoc'].dirty) { dto.intdoc = { intdoc: this.f['intdoc'].value } }
      if (this.f['numdoc'].dirty) { dto.numdoc = this.formTransaci.value.numdoc }
      if (this.f['debcre'].dirty) { dto.debcre = this.f['debcre'].value }
      if (this.f['valor'].dirty) { dto.valor = this.f['valor'].value }
      if (this.f['descri'].dirty) { dto.descri = this.f['descri'].value }
      dto.usumodi = this.authService.idusuario;
      dto.fecmodi = new Date();
      this.tranService.updateTransa(this.inttra, dto).subscribe({
         next: (transaci: Transaci) => {
            this.authService.swal('success', `Transacción de la Cuenta ${transaci.codcue} modificada con éxito`);
            this.regresar();
         },
         error: err => console.error(err.error),
      });
   }

   regresar() { this.router.navigate(['/transaci']); }

   //Valida que se haya seleccionado una Cuenta y no se cambia con/sin asociación
   valCuenta(): AsyncValidatorFn {
      return (_control: AbstractControl) => {
         if (this.idcuenta == null) { return of({ invalido: true }); }
         const antValor = this.antIntpre; // guarda el valor original al cargar
         const valorActual = this.partida.intpre;   // estado actual después de seleccionar
         if (antValor == null && valorActual !== null) { return of({ intpreInvalido: true }); }
         if (antValor != null && valorActual === null) { return of({ intpreInvalido: true }); }
         return of(null);
      };
   }

}

interface interfaceAsiento {
   tipasi: number;
   asiento: number;
   fecha: Date;
   comprobante: string;
   documento: String;
   benefi: String;
   intdoc: number;
}

