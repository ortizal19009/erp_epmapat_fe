import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Beneficiarios } from 'src/app/modelos/contabilidad/beneficiarios.model';
import { BeneficiariosService } from 'src/app/servicios/contabilidad/beneficiarios.service';
import { BenextranService } from 'src/app/servicios/contabilidad/benextran.service';

@Component({
   selector: 'app-beneficiarios',
   templateUrl: './beneficiarios.component.html',
   styleUrls: ['./beneficiarios.component.css']
})

export class BeneficiariosComponent implements OnInit {

   _beneficiarios: any;
   buscaBeneficiarios = { nomben: String, codben: String, rucben: String }
   filtro: string;
   formBuscar: FormGroup;
   swbuscando: boolean;
   txtbuscar: string = 'Buscar';
   swexiste: boolean;
   nomben: string;
   idbene: number;

   constructor(public fb: FormBuilder, private router: Router, public authService: AutorizaService,
      private coloresService: ColoresService, private beneService: BeneficiariosService, private bxtService: BenextranService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/beneficiarios');
      let coloresJSON = sessionStorage.getItem('/beneficiarios');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      //Campos guardados o ''
      let nomben: string; let codben: string; let rucben: string;
      const buscaBeneficiariosJSON = sessionStorage.getItem('buscaBeneficiarios');
      if (buscaBeneficiariosJSON) {
         const buscaBeneficiarios = JSON.parse(buscaBeneficiariosJSON);
         nomben = buscaBeneficiarios.nomben;
         codben = buscaBeneficiarios.codben;
         rucben = buscaBeneficiarios.rucben;
      } else {
         nomben = '';
         codben = '';
         rucben = ''
      }
      this.formBuscar = this.fb.group({
         nomben: nomben,
         codben: codben,
         rucben: rucben
      });
      if (nomben != '' || codben != '' || rucben != '') this.buscar();
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
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'beneficiarios');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/beneficiarios', coloresJSON);
         this.colocaColor(datos);
      } catch (error) { console.error(error); }
   }

   buscar() {
      this.swbuscando = true;
      this.txtbuscar = 'Buscando';
      let nomben = '';
      if (this.formBuscar.value.nomben != null) nomben = this.formBuscar.value.nomben;
      let codben = '';
      if (this.formBuscar.value.codben != null) codben = this.formBuscar.value.codben;
      let ruc_ciben = '';
      if (this.formBuscar.value.rucben != null) ruc_ciben = this.formBuscar.value.rucben;

      this.beneService.getBeneficiarios( nomben, codben, ruc_ciben, ruc_ciben ).subscribe({
         next: resp => {
            this._beneficiarios = resp;
            //Guarda los campos de búsqueda
            this.buscaBeneficiarios = {
               nomben: this.formBuscar.value.nomben,
               codben: this.formBuscar.value.codben,
               rucben: this.formBuscar.value.rucben
            };
            sessionStorage.setItem('buscaBeneficiarios', JSON.stringify(this.buscaBeneficiarios));
            this.swbuscando = false;
            this.txtbuscar = 'Buscar';
         },
         error: err => console.error(err.error.msg)
      });
   }

   public infoBeneficiario(event: any, beneficiario: Beneficiarios) {
      const tagName = event.target.tagName;
      if (tagName === 'TD') {
         let beneficiarioToInfo: { idbene: number, nomben: string }
         beneficiarioToInfo = {
            idbene: beneficiario.idbene,
            nomben: beneficiario.nomben
         };
         sessionStorage.setItem('beneficiarioToInfo', JSON.stringify(beneficiarioToInfo));
         this.router.navigate(['info-beneficiario']);
      }
   }

   nuevo() { this.router.navigate(['/add-beneficiario']); }

   modificar(idbene: number) {
      sessionStorage.setItem("idbeneToModi", idbene.toString());
      this.router.navigate(["/modi-beneficiario"]);
   }

   eliminar(beneficiario: any) {
      this.nomben = beneficiario.nomben;
      this.idbene = beneficiario.idbene;
      this.swexiste = true; //Para que no trate de eliminar en caso de error
      this.bxtService.existeByIdbene(beneficiario.idbene).subscribe({
         next: existe => {
            this.swexiste = existe
            this.swexiste = true; //OJO: Falta validar en otras tablas
         },
         error: err => console.error('Al buscar si existe en benextran: ', err.error)
      });
   }

   elimina() {
      this.beneService.deleteBeneficiario(this.idbene).subscribe({
         next: resp => this.buscar(),
         error: err => console.error('Al eliminar el Beneficiario: ', err.error),
      });
   }

   imprimir() {
      sessionStorage.setItem("beneficiariosToImpExp", JSON.stringify(this.buscaBeneficiarios));
      this.router.navigate(['/imp-beneficiarios']);
   }
}
