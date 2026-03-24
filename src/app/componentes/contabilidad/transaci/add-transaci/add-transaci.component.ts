import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { EjecucioCreateDTO } from 'src/app/dtos/contabilidad/ejecucio.dto';
import { TransaciCreateDTO } from 'src/app/dtos/contabilidad/transaci.dto';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { Asientos } from 'src/app/modelos/contabilidad/asientos.model';
import { Beneficiarios } from 'src/app/modelos/contabilidad/beneficiarios.model';
import { Cuentas } from 'src/app/modelos/contabilidad/cuentas.model';
import { Presupue } from 'src/app/modelos/contabilidad/presupue.model';
import { Transaci } from 'src/app/modelos/contabilidad/transaci.model';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucion.service';
import { PreingresoService } from 'src/app/servicios/contabilidad/preingreso.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';

@Component({
   selector: 'app-add-transaci',
   templateUrl: './add-transaci.component.html',
   styleUrls: ['./add-transaci.component.css']
})
export class AddTransaciComponent implements OnInit {

   formTransaci: FormGroup;
   idasiento: number;
   iAsiento = {} as interfaceAsiento; //Interface para los datos del Asiento
   cuentas: Cuentas[] = [];
   idcuenta: number | null;
   documentos: Documentos[] = [];
   totDebe: number;
   totHaber: number;
   valorfrmt: number;
   partida: { intpre: number | null; codpar: String };

   constructor(private router: Router, private fb: FormBuilder, private asiService: AsientosService, public authService: AutorizaService,
      private cueService: CuentasService, private docuService: DocumentosService, private tranService: TransaciService,
      private preingService: PreingresoService, private ejecuService: EjecucionService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/transaci');
      let coloresJSON = sessionStorage.getItem('/transaci');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      const datosToAddtransaci = JSON.parse(sessionStorage.getItem("datosToAddtransaci")!);
      this.idasiento = datosToAddtransaci.idasiento;
      this.totDebe = +datosToAddtransaci.totDebe;
      this.totHaber = +datosToAddtransaci.totHaber;

      this.formTransaci = this.fb.group({
         orden: [+datosToAddtransaci.orden, Validators.required],
         idcuenta: ['', Validators.required, this.valCuenta()],
         codcue: '',
         nomcue: [''],
         intdoc: this.documentos,
         numdoc: ['', Validators.required],
         debcre: ['', Validators.required],
         valor: ['', [Validators.required]],
         descri: '',
         intpre: '',
         codpar: '',
         nompar: ''
      }, { updateOn: "blur" });

      this.datosAsiento();
      this.listarDocumentos();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   get f() { return this.formTransaci.controls; }

   regresar() { this.router.navigate(['/transaci']); }

   datosAsiento() {
      this.asiService.unAsiento(this.idasiento).subscribe({
         next: (datos: Asientos) => {
            this.iAsiento.idasiento = datos.idasiento;
            this.iAsiento.asiento = datos.asiento;
            this.iAsiento.fecha = datos.fecha;
            this.iAsiento.tipasi = datos.tipasi;
            this.iAsiento.comprobante = this.authService.comprobante(datos.tipcom, datos.compro);
            this.iAsiento.benefi = datos.idbene.nomben;
            this.iAsiento.documento = datos.intdoc.nomdoc + ' ' + datos.numdoc;
            this.iAsiento.intdoc = datos.intdoc.intdoc;
            this.formTransaci.patchValue({
               intdoc: this.iAsiento.intdoc,
               numdoc: datos.numdoc,
               descri: datos.glosa
            });
         },
         error: err => console.error(err.error)
      });
   }

   cuentasxTiptran(e: any) {
      if (e.target.value != '') {
         this.cueService.findByTiptran(0, e.target.value).subscribe({
            next: (cuentas: Cuentas[]) => this.cuentas = cuentas,
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
         //Para asiento financiero con cuenta que tiene asohaber busca la partida
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
         this.partida = { intpre: null, codpar: '' };
      };
   }

   listarDocumentos() {
      this.docuService.getListaDocumentos().subscribe({
         next: (documentos: Documentos[]) => this.documentos = documentos,
         error: (err) => console.error(err.error)
      });
   }

   seleccionarTexto(event: FocusEvent): void {
      const input = event.target as HTMLInputElement;
      input.select();
   }

   onSubmit() {
      const dto: TransaciCreateDTO = {
         idasiento: { idasiento: this.idasiento },
         tiptran: 0,
         orden: this.formTransaci.value.orden,
         idcuenta: { idcuenta: this.idcuenta! },
         codcue: this.formTransaci.value.codcue,
         debcre: this.formTransaci.value.debcre,
         valor: this.formTransaci.value.valor,
         intdoc: { intdoc: this.formTransaci.value.intdoc },
         numdoc: this.formTransaci.value.numdoc,
         descri: this.formTransaci.value.descri,
         idbene: { idbene: 1 },
         totbene: 0,
         intpre: null,
         usucrea: this.authService.idusuario,
         feccrea: new Date(),
      };
      this.tranService.saveTransaci(dto).subscribe({
         next: (transaci: Transaci) => {
            if (this.partida.intpre) {
               const dtoEjecucio: EjecucioCreateDTO = {
                  codpar: this.partida.codpar,
                  fecha_eje: this.iAsiento.fecha,
                  tipeje: 3,
                  modifi: 0,
                  prmiso: 0,
                  totdeven: 0,
                  devengado: this.formTransaci.value.valor,
                  cobpagado: 0,
                  concep: this.formTransaci.value.descri,
                  usucrea: this.authService.idusuario,
                  feccrea: new Date(),
                  idasiento: this.idasiento,
                  inttra: transaci.inttra,
                  intpre: { intpre: this.partida.intpre },
                  idrefo: 0,
                  idtrata: 0
               }
               this.ejecuService.saveEjecu(dtoEjecucio).subscribe({
                  next: () => { },
                  error: err => { console.error(err.error); this.authService.mostrarError('Error al guardar Ejecucio', err.error) }
               });
            }
            this.authService.swal('success', `Transacción de la Cuenta ${transaci.codcue} guardada con éxito`);
            this.regresar()
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al guardar', err.error) }
      });
   }

   //Valida que se haya seleccionado una Cuenta
   valCuenta(): AsyncValidatorFn {
      return (_control: AbstractControl): any => {
         if (this.idcuenta == null) { return of({ invalido: true }); } else { return of(null); }
      };
   }

}

interface interfaceAsiento {
   idasiento: number;
   asiento: number;
   fecha: Date;
   tipasi: number;
   comprobante: string;
   documento: String;
   benefi: String;
   intdoc: number;
}

interface interfaceEjecucio {
   inteje: number | null;
   codpar: String;
   fecha_eje: Date;
   tipeje: number;
   modifi: number;
   prmiso: number;
   totdeven: number;
   devengado: number;
   cobpagado: number;
   concep: string;
   usucrea: number;
   feccrea: Date;
   idasiento: number;
   inttra: number;
   intpre: Presupue;
}