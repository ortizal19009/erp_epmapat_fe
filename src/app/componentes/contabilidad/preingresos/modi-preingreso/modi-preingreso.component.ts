import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { Clasificador } from 'src/app/modelos/clasificador.model';
import { ClasificadorService } from 'src/app/servicios/clasificador.service';
import { PreingresoService } from 'src/app/servicios/contabilidad/preingreso.service';

@Component({
   selector: 'app-modi-preingreso',
   templateUrl: './modi-preingreso.component.html',
   styleUrls: ['./modi-preingreso.component.css']
})

export class ModiPreingresoComponent implements OnInit {

   preingForm: any;
   disabled = true;
   formBusClasificador: FormGroup;   //Formulario para buscar Partidas del Clasificador del Modal
   swvalido = 1;     //Búsqueda de Partida en el Clasificador Presupuestario
   privez = true;    //Para resetear los datos de Búsqueda en el Clasificador
   _clasificador: any;
   antcodpar: String;
   idpresupue: number; //Id de la Partida de Ingresos que se modifica
   filtro: string;


   constructor(public fb: FormBuilder, public preingService: PreingresoService,
      private clasiService: ClasificadorService, private router: Router) { }

   ngOnInit(): void {
      this.idpresupue = +sessionStorage.getItem("idpresupueToModi")!;
      let clasificador: Clasificador = new Clasificador;

      this.preingForm = this.fb.group({
         codpart: '',
         nomcla: '',
         codpar: ['', [Validators.required, Validators.minLength(14)], this.valCodpar.bind(this)],
         nompar: [null, [Validators.required, Validators.minLength(3)]],
         inicia: 0,
         totmod: 0,
         intcla: clasificador,
         usucrea: 1,
         feccrea: '',
         usumodi: 1,
         fecmodi: '',
         codificado: 0,
         swpluri: Boolean
      },
         { updateOn: "blur" }
      );
      this.datosParingreso();
      //Formulario de Busqueda de Clientes (Modal)
      this.formBusClasificador = this.fb.group({
         codpar: '',
         nompar: '',
         filtrar: ''
      });
   }


   datosParingreso() {
      let fecha: Date = new Date();
      this.preingService.getById(this.idpresupue).subscribe({
         next: datos => {
            this.antcodpar = datos.codpar;
            this.preingForm.setValue({
               nompar: datos.nompar,
               codpar: datos.codpar,
               codpart: datos.codpart,
               inicia: datos.inicia,
               totmod: datos.totmod,
               intcla: datos.intcla,
               nomcla: datos.intcla.nompar,
               usucrea: datos.usucrea,
               feccrea: datos.feccrea,
               usumodi: 1,
               fecmodi: fecha,
               codificado: datos.inicia + datos.totmod,
               swpluri: datos.swpluri
            })
         },
         error: err => console.log(err.error)
      });
   }

   get codpar() { return this.preingForm.get('codpar'); }

   onSubmit() {
      this.preingService.updatePreingreso(this.idpresupue, this.preingForm.value).subscribe({
         next: resp => this.regresar(),
         error: err => console.log(err.error)
      });
   }

   regresar() { this.router.navigate(['/info-preingreso']); }

   clasificadorModal() {
      this.swvalido = 1;
      if (this.privez) {
         this.privez = false;
      } else {
         this.formBusClasificador.reset();
         this._clasificador = [];
      }
   }

   buscarClasificador() {
      console.log("Envia: "+this.formBusClasificador.value.codpar + "  "+this.formBusClasificador.value.nompar)
      this.clasiService.getParingreso(this.formBusClasificador.value.codpar, this.formBusClasificador.value.nompar).subscribe({
         next: datos => {this._clasificador = datos;
         console.log("this._clasificador.length= "+this._clasificador.length)},
         error: err => console.log(err.error)
      })
   }

   selecClasificador(partida: Clasificador) {
      this.preingForm.controls['codpart'].setValue(partida.codpar);
      this.preingForm.controls['nomcla'].setValue(partida.nompar);
      this.preingForm.controls['codpar'].setValue(partida.codpar);
   }

   valCodpar(control: AbstractControl) {
      return this.preingService.getByCodigoI(control.value)
         .pipe(
            map(result => result.length == 1 && control.value != this.antcodpar ? { existe: true } : null)
         );
   }

}
