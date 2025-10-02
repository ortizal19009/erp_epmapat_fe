import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map, of } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Gruposbene } from 'src/app/modelos/contabilidad/gruposbene.model';
import { Ifinan } from 'src/app/modelos/contabilidad/ifinan.model';
import { BeneficiariosService } from 'src/app/servicios/contabilidad/beneficiarios.service';
import { GruposbeneService } from 'src/app/servicios/contabilidad/gruposbene.service';
import { IfinanService } from 'src/app/servicios/contabilidad/ifinan.service';
import { TpidentificaService } from 'src/app/servicios/tpidentifica.service';

@Component({
   selector: 'app-add-beneficiario',
   templateUrl: './add-beneficiario.component.html',
   styleUrls: ['./add-beneficiario.component.css']
})
export class AddBeneficiarioComponent implements OnInit {

   formBeneficiario: FormGroup;
   _gruposbene: any;
   _tpidentifica: any;
   _ifinan: any;
   codgrupo: string = 'P-';

   constructor(private fb: FormBuilder, private router: Router, public authService: AutorizaService,
      private beneService: BeneficiariosService, private grubenService: GruposbeneService,
      private tpidentiService: TpidentificaService, private ifinanService: IfinanService) { }

   ngOnInit(): void {

      sessionStorage.setItem('ventana', '/beneficiarios');
      let coloresJSON = sessionStorage.getItem('/beneficiarios');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      this.crearForm();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   crearForm() {
      let fecha: Date = new Date();
      let gruposbene: Gruposbene = new Gruposbene;
      let ifinan: Ifinan = new Ifinan;
      this.formBeneficiario = this.fb.group({
         nomben: [null, [Validators.required, Validators.minLength(3)], this.valNomben.bind(this)],
         idgrupo: gruposbene,
         codben: [null, [Validators.required, Validators.minLength(6), Validators.maxLength(6)], [this.valCodgru.bind(this), this.valCodben.bind(this)]],
         tpidben: '',
         rucben: [null, [Validators.required], this.valRucben.bind(this)],
         ciben: '',
         mailben: null,
         tlfben: null,
         dirben: null,
         tpcueben: 0,
         cuebanben: null,
         foto: null,
         idifinan: ifinan,
         swconsufin: 0,
         modulo: 1,
         usucrea: this.authService.idusuario,
         feccrea: fecha,
      },
         { updateOn: "blur" }
      );

      this.listaGruposbene();
      this.listarTpIdentifica();
      this.listarIfinan();
   }

   //Grupos de los Beneficiarios
   listaGruposbene() {
      this.grubenService.getListaGruposbene().subscribe({
         next: datos => {
            this._gruposbene = datos;
            //Busca el Grupo de Id = 1 y lo coloca en el combo
            let selectedRecord = this._gruposbene.find((grupo: { idgrupo: number; }) => grupo.idgrupo == 1);
            this.formBeneficiario.controls['idgrupo'].setValue(selectedRecord);

            this.beneService.siguienteCodigo(selectedRecord.idgrupo).subscribe({
               next: resp => this.formBeneficiario.controls['codben'].setValue(resp),
               error: err => console.error('Al generar el siguiente código', err.error)
            });
         },
         error: err => console.error('Al recuperar los grupos de los beneficiarios', err.error)
      });
   }

   //Tipos de identificacion
   listarTpIdentifica() {
      this.tpidentiService.getListaTpIdentifica().subscribe({
         next: datos => {
            this._tpidentifica = datos;
            let reg = this._tpidentifica.find((tp: { codigo: string; }) => tp.codigo == '04');
            this.formBeneficiario.controls['tpidben'].setValue(reg.codigo);
         },
         error: err => console.error('Al recuperar los tipos de identificación', err.error)
      });
   }

   //Instituciones financieras
   listarIfinan() {
      this.ifinanService.getListaIfinans().subscribe({
         next: datos => {
            this._ifinan = datos;
            this.formBeneficiario.controls['idifinan'].setValue(this._ifinan[0]);
         },
         error: err => console.error('Al recuperar las Instituciones financieras', err.error)
      });
   }

   get f() { return this.formBeneficiario.controls; }

   changeIdgrupo() {
      this.formBeneficiario.get('idgrupo')!.valueChanges.subscribe(gruposbene => {
         let x = gruposbene
         this.beneService.siguienteCodigo(x.idgrupo).subscribe({
            next: resp => {
               this.codgrupo = resp.slice(0, 2);
               this.formBeneficiario.controls['codben'].setValue(resp)
            },
            error: err => console.error('Al generar el siguiente código', err.error)
         });
      });
   }

   changeTpidben() { this.formBeneficiario.controls['rucben'].setValue('') }

   onSubmit() {
      let benefi: any;  //Para no actualizar el formulario por el mensaje de validación
      benefi = this.formBeneficiario.value;
      if (this.formBeneficiario.value.tpidben == '05') {
         benefi.ciben = this.formBeneficiario.value.rucben;
         benefi.rucben = '';
      }

      this.beneService.save(benefi).subscribe({
         next: resp => this.regresar(),
         error: err => console.log(err.msg.error)
      });
   }

   regresar() { this.router.navigate(['/beneficiarios']); }

   //Valida Nomben
   valNomben(control: AbstractControl) {
      return this.beneService.valNomben(control.value)
         .pipe(
            map(result => result ? { existe: true } : null)
         );
   }

   //Valida el código del Grupo (los dos primeros caracteres del código)
   valCodgru(control: AbstractControl) {
      if (this.codgrupo != control.value.slice(0, 2)) return of({ 'invalido': true });
      else return of(null);
   }

   //Valida Codben
   valCodben(control: AbstractControl) {
      return this.beneService.valCodben(control.value).pipe(
         map(result => result ? { existe: true } : null)
      );
   }

   valRucben(control: AbstractControl) {
      switch (this.formBeneficiario.value.tpidben) {
         case '04':
            if (control.value.length == 13) {
               return this.beneService.valRucben(control.value).pipe(
                  map(result => result ? { existe: true } : null)
               );
            }
            else return of({ invalido: true });
         case '05':
            if (control.value.length == 10) {
               // let rtn = this.valCedula(control.value)
               // if (!rtn) return of({ invalido: true })
               if (this.valCedula(control.value))
                  return this.beneService.valCiben(control.value).pipe(
                     map(result => result ? { existe: true } : null)
                  );
            } else return of({ invalido: true })
            return of({ invalido: true })

         default:
            if (control.value.length >= 3) return of(null);
            else return of({ 'invalido': true });
      }
   }

   valCedula(cedula: String) {
      const digitoRegion = cedula.substring(0, 2);
      let digR = parseInt(digitoRegion);
      if (digR >= 1 && digR <= 24) {
         const ultimoDigito = Number(cedula.substring(9, 10));
         const pares = Number(cedula.substring(1, 2)) + Number(cedula.substring(3, 4)) + Number(cedula.substring(5, 6)) + Number(cedula.substring(7, 8));
         let numeroUno: any = cedula.substring(0, 1);
         numeroUno = (numeroUno * 2);
         if (numeroUno > 9) numeroUno = (numeroUno - 9);
         let numeroTres: any = cedula.substring(2, 3);
         numeroTres = (numeroTres * 2);
         if (numeroTres > 9) numeroTres = (numeroTres - 9);
         let numeroCinco: any = cedula.substring(4, 5);
         numeroCinco = (numeroCinco * 2);
         if (numeroCinco > 9) numeroCinco = (numeroCinco - 9);
         let numeroSiete: any = cedula.substring(6, 7);
         numeroSiete = (numeroSiete * 2);
         if (numeroSiete > 9) numeroSiete = (numeroSiete - 9);
         let numeroNueve: any = cedula.substring(8, 9);
         numeroNueve = (numeroNueve * 2);
         if (numeroNueve > 9) numeroNueve = (numeroNueve - 9);
         const impares = numeroUno + numeroTres + numeroCinco + numeroSiete + numeroNueve;
         const sumaTotal = (pares + impares);
         const primerDigitoSuma = String(sumaTotal).substring(0, 1);
         const decena = (Number(primerDigitoSuma) + 1) * 10;
         let digitoValidador = decena - sumaTotal;
         if (digitoValidador === 10) digitoValidador = 0;
         if (digitoValidador === ultimoDigito) return true;
         else return false;
      } else return false;
   }

}
