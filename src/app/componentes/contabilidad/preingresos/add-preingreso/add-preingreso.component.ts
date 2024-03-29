import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Clasificador } from 'src/app/modelos/clasificador.model';
import { ClasificadorService } from 'src/app/servicios/clasificador.service';
import { PreingresoService } from 'src/app/servicios/contabilidad/preingreso.service';

@Component({
   selector: 'app-add-preingreso',
   templateUrl: './add-preingreso.component.html',
   styleUrls: ['./add-preingreso.component.css']
})

export class AddPreingresoComponent implements OnInit {

   preingForm: any;
   formBusClasificador: FormGroup;   //Formulario para buscar Partidas del Clasificador del Modal
   _clasificador: any;
   filtro: string;
   swvalido = 1;     //Búsqueda de Partida en el Clasificador Presupuestario
   privez = true;    //Para resetear los datos de Búsqueda en el Clasificador

   constructor(public fb: FormBuilder, public fb1: FormBuilder, private preingService: PreingresoService,
      private clasiService: ClasificadorService, public router: Router, private authService: AutorizaService) { }

   ngOnInit(): void {
      this.preingForm = this.fb.group({
         tippar: 1,
         codpart: ['', Validators.required],
         nomcla: '',
         codpar: [null, [Validators.required, Validators.minLength(14), Validators.minLength(14)], this.valCodpar.bind(this)],
         codigo: '',
         nompar: [null, [Validators.required, Validators.minLength(3)]],
         inicia: 0,
         totmod: 0,
         totcerti: 0,
         totmisos: 0,
         totdeven: 0,
         intcla: 0,
         usucrea: this.authService.idusuario,
         feccrea: (new Date().toISOString().substring(0, 10))
      });

      //Formulario de Busqueda de Partidas del Clasificador (Modal)
      this.formBusClasificador = this.fb1.group({
         codpar: '',
         nompar: '',
         filtrar: ''
      });
   }

   get codpar() { return this.preingForm.get('codpar'); }
   get nompar() { return this.preingForm.get('nompar'); }

   onSubmit() {
      this.preingForm.controls['codigo'].setValue(this.preingForm.value.codpar);
      this.preingService.savePreingreso(this.preingForm.value).subscribe({
         next: resp => {
            this.regresar();
         },
         error: err => console.log(err.error)
      });
   }

   clasificadorModal() {
      this.swvalido = 1;
      if (this.privez) this.privez = false;
      else {
         this.formBusClasificador.reset();
         this._clasificador = [];
      }
   }

   buscarClasificador() {
      if (this.formBusClasificador.value.codpar == null) this.formBusClasificador.value.codpar = '';
      if (this.formBusClasificador.value.nompar == null) this.formBusClasificador.value.nompar = '';
      this.clasiService.getParingreso(this.formBusClasificador.value.codpar, this.formBusClasificador.value.nompar).subscribe({
         next: datos => this._clasificador = datos,
         error: err => console.log(err.error)
      })
   }

   selecClasificador(partida: Clasificador) {
      this.preingForm.controls['intcla'].setValue(partida);
      this.preingForm.controls['codpart'].setValue(partida.codpar);
      this.preingForm.controls['nomcla'].setValue(partida.nompar);
      this.preingForm.controls['codpar'].setValue(partida.codpar);
   }

   regresar() { this.router.navigate(['/preingresos']); }

   valCodpar(control: AbstractControl) {
      return this.preingService.getByCodigoI(control.value)
         .pipe(
            map(result => result.length == 1 ? { existe: true } : null)
         );
   }
}
