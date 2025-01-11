import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NiifcuentasService } from 'src/app/servicios/contabilidad/niifcuentas.service';
import { NiifhomologaService } from 'src/app/servicios/contabilidad/niifhomologa.service';

@Component({
   selector: 'app-modi-niifcuenta',
   templateUrl: './modi-niifcuenta.component.html',
   styleUrls: ['./modi-niifcuenta.component.css']
})
export class ModiNiifcuentaComponent implements OnInit {

   @Output() cancelarEvent = new EventEmitter<boolean>();
   @Input() niifcuenta: any;

   formNiifcuenta: FormGroup;
   filterTerm: string;
   btnSave: boolean = true;
   date: Date = new Date();

   constructor(private fb: FormBuilder, private s_niifhomologa: NiifhomologaService, private s_niifcuenta: NiifcuentasService) { }

   ngOnInit(): void {
      this.formNiifcuenta = this.fb.group({
         idniifcue: '',
         codcue: ['', Validators.pattern('[0-9]{10}')],
         grucue: [0],
         nivcue: [0],
         movcue: false,
         nomcue: [null, [Validators.required, Validators.minLength(3)] ],
         usucrea: 1,
         feccrea: this.date,
      });
      if (this.niifcuenta.length != 0) {
         this.setValuesModificar();
      }
   }

   get f() { return this.formNiifcuenta.controls; }

   onSubmit() {
      console.log(this.formNiifcuenta.value);
      this.guardarNiffCuenta();
   }

   getCuentas(e: any) {
      let codcue: string = this.formNiifcuenta.value.codcue;
      if (codcue.length >= 2 && codcue.length < 10) {
         this.validarGruCue(codcue);
      }
      //this.busNiifCuentas(codcue);
      this.validarCodCue(e);
   }
   /*   busNiifCuentas(codcue: string) {
     this.s_niifcuenta.getByCodCue(codcue).subscribe({
       next: (datos: any) => {
         console.log(datos);
       },
       error: (e) => console.error(e),
     });
   } */
   validarGruCue(codcue: string) {
      let val = 1;
      let grucue: any;
      if (codcue.length === 5 || codcue.length === 7 || codcue.length === 9) {
         val = 2;
      }
      grucue = codcue.slice(0, codcue.length - val);
      this.s_niifcuenta.getByCodcue(grucue).subscribe({
         next: (datos: any) => {
            if (datos.length === 0 && codcue.length != 9) {
               this.formNiifcuenta.patchValue({ grucue: 0 });
               this.btnSave = true;
            } else {
               this.formNiifcuenta.patchValue({ grucue: datos[0].codcue });
            }
         },
         error: (e) => console.error(e),
      });
   }
   validarCodCue(e: any) {
      let codcue = this.formNiifcuenta.value.codcue;
      if (
         codcue.length > 9 ||
         codcue.length === 4 ||
         codcue.length === 6 ||
         codcue.length === 8
      ) {
         e.target.style.border = 'red solid 1px';
         this.btnSave = true;
      } else {
         e.target.style.border = '';
         this.formNiifcuenta.patchValue({ nivcue: codcue.length });
         this.btnSave = false;
      }
      if (codcue.length === 9) {
         this.formNiifcuenta.patchValue({ movcue: true });
      }
      if (this.formNiifcuenta.value.grucue === 0) {
         e.target.style.border = 'red solid 1px';
         this.btnSave = true;
      }
      this.s_niifcuenta.getByCodcue(codcue).subscribe({
         next: (datos: any) => {
            if (datos.length != 0) {
               e.target.style.border = 'red solid 1px';
               this.btnSave = true;
            }
         },
         error: (e) => console.error(e),
      });
   }
   guardarNiffCuenta() {
      this.s_niifcuenta.updateNiifCuenta(this.formNiifcuenta.value).subscribe({
         next: (datos) => {
            console.log('CUENTA NIIF GUARDADA', datos);
         },
         error: (e) => console.error(e),
      });
   }
   cancelar() {
      this.cancelarEvent.emit(false);
   }
   setValuesModificar() {
      console.log(this.niifcuenta);
      // this.titulo += `${this.niifcuenta.nomcue}`;
      this.formNiifcuenta.setValue({
         idniifcue: this.niifcuenta.idniifcue,
         codcue: this.niifcuenta.codcue,
         grucue: this.niifcuenta.grucue,
         nivcue: this.niifcuenta.nivcue,
         movcue: this.niifcuenta.movcue,
         nomcue: this.niifcuenta.nomcue,
         usucrea: this.niifcuenta.usucrea,
         feccrea: this.niifcuenta.feccrea,
      });
   }

}
