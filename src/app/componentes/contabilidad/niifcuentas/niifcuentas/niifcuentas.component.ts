import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { NiifcuentasService } from 'src/app/servicios/contabilidad/niifcuentas.service';
import { NiifhomologaService } from 'src/app/servicios/contabilidad/niifhomologa.service';

@Component({
   selector: 'app-niifcuentas',
   templateUrl: './niifcuentas.component.html',
   styleUrls: ['./niifcuentas.component.css']
})
export class NiifcuentasComponent implements OnInit {

   formBuscar: FormGroup;
   filterTerm: string;
   _cuentasNiif: any;
   swbuscando: boolean;
   txtbuscar: string = 'Buscar';
   buscaNiifcuentas: { codcue: string, nomcue: string }
   homologacionesNiif: any;
   listaNef: boolean = false;
   hab_homologa: boolean = false;
   hab_addPlanCuentas: boolean = false;
   hab_modPlanCuentas: boolean = false;
   deleteBox: boolean = false;
   niifcuenta: any;
   homologa: any;

   constructor(private s_niifcuentas: NiifcuentasService, private fb: FormBuilder,
      private router: Router, private s_niifhomologa: NiifhomologaService,
      public authService: AutorizaService, private coloresService: ColoresService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/niifcuentas');
      let coloresJSON = sessionStorage.getItem('/niifcuentas');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      //Campos guardados o ''
      let codcue: string; let nomcue: string;
      const buscaNiifcuentasJSON = sessionStorage.getItem('buscaNiifcuentas');
      if (buscaNiifcuentasJSON) {
         const buscaNiifcuentas = JSON.parse(buscaNiifcuentasJSON);
         codcue = buscaNiifcuentas.codcue;
         nomcue = buscaNiifcuentas.nomcue;
      } else {
         codcue = '';
         nomcue = '';
      }

      this.formBuscar = this.fb.group({
         codcue: codcue,
         nomcue: nomcue
      });
      if (codcue != '' || nomcue != '') this.buscar();
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
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'niifcuentas');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/niifcuentas', coloresJSON);
         this.colocaColor(datos);
      } catch (error) { console.error(error); }
   }

   buscar() {
      this.swbuscando = true;
      this.txtbuscar = 'Buscando';
      this.s_niifcuentas.getByCodigoyNombre(this.formBuscar.value.codcue, this.formBuscar.value.nomcue).subscribe({
         next: (datos) => {
            this._cuentasNiif = datos;
            this.buscaNiifcuentas = {
               codcue: this.formBuscar.value.codcue,
               nomcue: this.formBuscar.value.nomcue
            };
            sessionStorage.setItem("buscaNiifcuentas", JSON.stringify(this.buscaNiifcuentas));
            this.txtbuscar = 'Buscar';
            this.swbuscando = false;
         },
         error: (e) => console.error(e),
      });
   }

   addhomologa() {
      this.router.navigate(['/add-homologa']);
   }


   // getByCodNomCue() {
   //   let tpBusqueda = +this.formBuscar.value.selecTipoBusqueda!;
   //   let valBusqueda = this.formBuscar.value.codNomCue;
   //   if (valBusqueda === '') {
   //     this.getPlanCuentasNiif();
   //   }
   //   if (tpBusqueda === 1) {
   //     this.s_niifcuentas.getByCodCue(valBusqueda).subscribe({
   //       next: (datos) => {
   //         this._cuentasNiif = datos;
   //       },
   //     });
   //   } else if (tpBusqueda === 2) {
   //     this.s_niifcuentas.getByNomCue(valBusqueda).subscribe({
   //       next: (datos) => {
   //         this._cuentasNiif = datos;
   //       },
   //     });
   //   } else {
   //     this.getPlanCuentasNiif();
   //   }
   // }

   getByIdNiifCue(cuentaniif: any) {
      console.log(cuentaniif);
      this.listaNef = cuentaniif.movcue;
      this.niifcuenta = cuentaniif;
      this.s_niifhomologa.getByIdNiifCue(cuentaniif.idniifcue).subscribe({
         next: (datos: any) => {
            console.log(datos);
            if (datos.length != 0 || cuentaniif.movcue === true) {
               this.homologacionesNiif = datos;
               this.listaNef = true;
            } else {
               this.listaNef = false;
            }
         },
         error: (e) => {
            console.error(e);
         },
      });
   }

   addNiifcuenta() {
      this.niifcuenta = [];
      this.hab_addPlanCuentas = false;
      setTimeout(() => {
         this.hab_addPlanCuentas = true;
         this.hab_homologa = false;
         this.hab_modPlanCuentas = false;
      }, 300);
   }

   act_modPlanCuentas() {
      this.hab_modPlanCuentas = false;
      setTimeout(() => {
         this.hab_modPlanCuentas = true;
         this.hab_homologa = false;
         this.hab_addPlanCuentas = false;
      }, 300);
   }

   act_homologa() {
      this.hab_addPlanCuentas = false;
      this.hab_homologa = true;
   }

   des_homologa(e: any) {
      console.log(e);
      setTimeout(() => {
         this.hab_homologa = e;
      }, 300);
   }

   des_addPlanCuentas(e: any) {
      console.log(e);
      setTimeout(() => {
         this.hab_addPlanCuentas = e;
      }, 300);
   }

   optHomolofaciones(homologa: any) {
      console.log(homologa);
      this.homologa = homologa;
      this.deleteBox = true;
   }

   deleteHomologa() {
      this.s_niifhomologa.deleteById(this.homologa.idhomologa).subscribe({
         next: (datos) => {
            // console.log(datos);
            this.getByIdNiifCue(this.niifcuenta);
         },
         error: (e) => console.error(e),
      });
   }

   cancelar() {
      setTimeout(() => {
         this.deleteBox = false;
      }, 300);
   }

   modificar(niifCuenta: any) {
      this.act_modPlanCuentas();
      // console.log(niifCuenta);
      this.niifcuenta = niifCuenta;
   }

   imprimir() {
      sessionStorage.setItem("niifcuentasToImpExp", JSON.stringify(this.buscaNiifcuentas));
      this.router.navigate(['/imp-niifcuentas']);
   }

}
