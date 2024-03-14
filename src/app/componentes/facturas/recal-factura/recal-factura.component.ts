import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { Pliego24Service } from 'src/app/servicios/pliego24.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';

@Component({
   selector: 'app-recal-factura',
   templateUrl: './recal-factura.component.html',
   styleUrls: ['./recal-factura.component.css']
})
export class RecalFacturaComponent implements OnInit {

   idfactura: number;
   formLectura: FormGroup;
   _rubroxfac: any;
   total: number;
   _lecturas: any;
   _lectura: any;
   finbusca: boolean;
   tarifa: any;
   swcalcular: boolean;
   newtotal: number;
   rubros: any = [];

   porcResidencial: number[] = [0.777, 0.78, 0.78, 0.78, 0.78, 0.778, 0.778, 0.778, 0.78, 0.78, 0.78, 0.68, 0.68, 0.678, 0.68, 0.68, 0.678, 0.678, 0.68,
      0.68, 0.678, 0.676, 0.678, 0.678, 0.678, 0.68, 0.647, 0.65, 0.65, 0.647, 0.647, 0.65, 0.65, 0.647, 0.647, 0.65, 0.65, 0.65,
      0.65, 0.65, 0.65, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7,
      0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7]

   constructor(private fb: FormBuilder, private router: Router, private rxfService: RubroxfacService, private facService: FacturaService,
      private pli24Service: Pliego24Service, private lecService: LecturasService, public authService: AutorizaService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/facturas');
      let coloresJSON = sessionStorage.getItem('/facturas');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.formLectura = this.fb.group({
         lecturaanterior: 0,
         lecturaactual: 0, disabled: false,
         consumo: 0
      });

      this.idfactura = +sessionStorage.getItem('idfacturaToRecal')!;
      sessionStorage.removeItem('idfacturaToRecal');
      this.datosLectura();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   datosLectura() {
      this.lecService.getByIdfactura(this.idfactura).subscribe({
         next: datos => {
            this._lecturas = datos;
            this.formLectura.patchValue({
               lecturaanterior: this._lecturas[0].lecturaanterior,
               lecturaactual: this._lecturas[0].lecturaactual,
               consumo: this._lecturas[0].lecturaactual - this._lecturas[0].lecturaanterior,
            });
            this.rubroxfac();
         },
         error: err => console.error('Al recuperare la Lectura', err.error)
      });
   }

   rubroxfac() {
      this.rxfService.getByIdfactura(this.idfactura).subscribe({
         next: datos => {
            this._rubroxfac = datos;
            this.subtotal();
         },
         error: err => console.error(err.error)
      })
   }

   subtotal() {
      let suma: number = 0;
      let i = 0;
      this._rubroxfac.forEach(() => {
         suma += this._rubroxfac[i].cantidad * this._rubroxfac[i].valorunitario;
         i++;
      });
      this.total = Math.round(suma * 100) / 100;
      this.finbusca = true
   }

   planilla() {
      this.swcalcular = true;
      let categoria = this._lecturas[0].idabonado_abonados.idcategoria_categorias.idcategoria;
      let consumo = this._lecturas[0].lecturaactual - this._lecturas[0].lecturaanterior;
      let adultomayor = this._lecturas[0].idabonado_abonados.adultomayor;
      if (adultomayor) if (categoria == 9 && consumo > 34) categoria = 1;
      else if (categoria == 9 && consumo > 10) categoria = 1;
      if (categoria == 9 && consumo > 34) categoria = 1;
      if (categoria == 1 && consumo > 70) categoria = 2;
      let municipio = this._lecturas[0].idabonado_abonados.municipio;
      let num1: number;
      let swcate9: boolean;     //No hay Tarifas para Categoria 9 es el 50% de la 1
      if (categoria == 9) { categoria = 1; swcate9 = true }
      let swmunicipio: boolean; //Instituciones del Municipio 50% de la Tarifa Oficial
      if (categoria == 4 && municipio) { swmunicipio = true }
      // Obtiene la tarifa del nuevo Pliego
      this.pli24Service.getBloque(categoria, consumo).subscribe({
         next: resp => {
            if (!resp) {
               //No hay Tarifa para esta Categoría y Consumo
            }
            else {
               this.tarifa = resp;

               if (categoria == 1) { num1 = Math.round((this.tarifa[0].idcategoria.fijoagua - 0.1) * this.porcResidencial[consumo] * 100) / 100; }
               else { num1 = Math.round((this.tarifa[0].idcategoria.fijoagua - 0.1) * this.tarifa[0].porc * 100) / 100; }

               let num2 = Math.round((this.tarifa[0].idcategoria.fijosanea - 0.5) * this.tarifa[0].porc * 100) / 100;
               let num3 = Math.round((consumo * this.tarifa[0].agua) * this.tarifa[0].porc * 100) / 100;
               let num4 = Math.round((consumo * this.tarifa[0].saneamiento / 2) * this.tarifa[0].porc * 100) / 100;
               let num5 = Math.round((consumo * this.tarifa[0].saneamiento / 2) * this.tarifa[0].porc * 100) / 100;
               let num7 = Math.round(0.5 * this.tarifa[0].porc * 100) / 100;
               let suma: number = 0;
               suma = Math.round((num1 + num2 + num3 + num4 + num5 + 0.1 + num7) * 100) / 100;
               //Categoria 9 no tiene tarifario es el 50% de la Residencial. Abonados del Municipio también 50%
               if (swcate9 || swmunicipio) suma = Math.round(suma / 2 * 100) / 100;
               this.newtotal = suma;
               let r: any = {};
               this.rubros = [];

               if (swcate9 || swmunicipio) {
                  let rub1002: number; let rub1003: number
                  //Alcantarillado / 2
                  if (num2 + num4 + num7 > 0) rub1002 = Math.round((num2 + num4 + num7) / 2 * 100) / 100;
                  else rub1002 = 0;
                  //Saneamiento / 2
                  if (num5 > 0) rub1003 = Math.round(num5 / 2 * 100) / 100;
                  else rub1003 = 0
                  //Agua portable por diferencia con la suma
                  let rub1001 = suma - rub1002 - rub1003 - 0.1;
                  r = { idrubroxfac: this._rubroxfac[0].idrubroxfac, descripcion: this._rubroxfac[0].idrubro_rubros.descripcion, valorunitario: rub1001 };
                  this.rubros.push(r);
                  r = { idrubroxfac: this._rubroxfac[1].idrubroxfac, descripcion: this._rubroxfac[1].idrubro_rubros.descripcion, valorunitario: rub1002 };
                  this.rubros.push(r);
                  r = { idrubroxfac: this._rubroxfac[2].idrubroxfac, descripcion: this._rubroxfac[2].idrubro_rubros.descripcion, valorunitario: rub1003 };
                  this.rubros.push(r);
                  r = { idrubroxfac: this._rubroxfac[3].idrubroxfac, descripcion: this._rubroxfac[3].idrubro_rubros.descripcion, valorunitario: 0.1 };
                  this.rubros.push(r);
               } else {
                  r = { idrubroxfac: this._rubroxfac[0].idrubroxfac, descripcion: this._rubroxfac[0].idrubro_rubros.descripcion, valorunitario: num1 + num3 };
                  this.rubros.push(r);
                  r = { idrubroxfac: this._rubroxfac[1].idrubroxfac, descripcion: this._rubroxfac[1].idrubro_rubros.descripcion, valorunitario: num2 + num4 + num7 };
                  this.rubros.push(r);
                  r = { idrubroxfac: this._rubroxfac[2].idrubroxfac, descripcion: this._rubroxfac[2].idrubro_rubros.descripcion, valorunitario: num5 };
                  this.rubros.push(r);
                  r = { idrubroxfac: this._rubroxfac[3].idrubroxfac, descripcion: this._rubroxfac[3].idrubro_rubros.descripcion, valorunitario: 0.1 };
                  this.rubros.push(r);
               };
            }
         },
         error: err => console.error(err.error)
      });
   }

   actualizar() {
      this.facService.getById(this._lecturas[0].idfactura).subscribe({
         next: datos => {
            datos.totaltarifa = this.newtotal;
            datos.valorbase = this.newtotal;
            datos.usumodi = this.authService.idusuario;
            datos.fecmodi = new Date();
            this.facService.updateFacturas(datos).subscribe({
               next: nex => {
                  let i = 0;
                  this.actuRubroxfac(i);
               },
               error: err => console.error('Al actualizar la Planilla', err.error)
            })
         },
         error: err => console.error('Al recuperar la Planilla', err.error)
      });
   }

   actuRubroxfac(i: number) {
      let idrubroxfac = this.rubros[i].idrubroxfac;
      this.rxfService.getById(idrubroxfac).subscribe({
         next: datos => {
            datos.valorunitario = this.rubros[i].valorunitario;
            this.rxfService.updateRubroxfac(idrubroxfac, datos).subscribe({
               next: nex => {
                  i++
                  if (i < this.rubros.length) this.actuRubroxfac(i);
                  else this.regresar();
               },
               error: err => console.error('Al alctualizar Rubroxfac', err.error)
            })
         },
         error: err => console.error('Al recupera Rubroxfac', err.error)
      });
   }

   regresar() { this.router.navigate(['facturas']); }

}
