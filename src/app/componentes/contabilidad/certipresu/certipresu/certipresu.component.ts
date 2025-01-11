import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { CertipresuService } from 'src/app/servicios/contabilidad/certipresu.service';

@Component({
   selector: 'app-certipresu',
   templateUrl: './certipresu.component.html',
   styleUrls: ['./certipresu.component.css'],
})

export class CertipresuComponent implements OnInit {

   _certificaciones: any;
   formBuscar: FormGroup;
   today: number = Date.now();
   date: Date = new Date();
   buscarCertipresu: { desdeNum: number, hastaNum: number, desdeFecha: string, hastaFecha: string }
   swdesdehasta: boolean; //Visibilidad Buscar últimos
   beneficiario: any;
   info_form: boolean = false;
   buscarxnum: boolean = true;
   txtBuscar: string = 'Número';
   hastaDate: any;
   certipresu = {} as Certipresu; //Interface para los datos de la Certificación a eliminar
   filtro: string;
   tot: number;
   totmovi: number = 1;  //Por default no puede eliminar
   disabled = false;
   sumvalor: number;
   swfiltro: boolean;

   constructor(private fb: FormBuilder, private router: Router, public authService: AutorizaService, private coloresService: ColoresService,
      private certiService: CertipresuService,) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/certipresu');
      let coloresJSON = sessionStorage.getItem('/certipresu');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      const fecha = new Date();
      const año = fecha.getFullYear()
      this.formBuscar = this.fb.group({
         desdeNum: '',
         hastaNum: '',
         desdeFecha: año + '-01-01',
         hastaFecha: año + '-12-31',
      });

      //Datos de búsqueda: últimas Certificaciones o guardadas
      this.buscarCertipresu = JSON.parse(sessionStorage.getItem("buscarCertipresu")!);
      if (this.buscarCertipresu == null) {
         this.ultimaCertipresu();
      } else {
         this.formBuscar.patchValue({
            desdeNum: this.buscarCertipresu.desdeNum,
            hastaNum: this.buscarCertipresu.hastaNum,
            desdeFecha: this.buscarCertipresu.desdeFecha,
            hastaFecha: this.buscarCertipresu.hastaFecha
         });
         this.buscar();
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

   async buscaColor() {
      try {
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'certipresu');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/certipresu', coloresJSON);
         this.colocaColor(datos);
      } catch (error) { console.error(error); }
   }

   ultimaCertipresu() {
      this.certiService.ultimo().subscribe({
         next: resp => {
            let desde = resp.numero - 16;
            if (desde <= 0) desde = 1;
            this.formBuscar.patchValue({
               desdeNum: desde,
               hastaNum: resp.numero,
            });
            this.buscar();
         },
         error: err => console.error(err.error)
      });
   }

   buscar() {
      //Numeros
      let desdeNum: number = 1;
      if (this.formBuscar.value.desdeNum != null) { desdeNum = this.formBuscar.value.desdeNum; }
      let hastaNum: number = 999999999;
      if (this.formBuscar.value.hastaNum != null) { hastaNum = this.formBuscar.value.hastaNum; }
      this.certiService.getDesdeHasta(desdeNum, hastaNum, this.formBuscar.value.desdeFecha, this.formBuscar.value.hastaFecha).subscribe({
         next: datos => {
            this._certificaciones = datos;
            //Guarda los datos de búsqueda
            this.buscarCertipresu = {
               desdeNum: this.formBuscar.value.desdeNum,
               hastaNum: this.formBuscar.value.hastaNum,
               desdeFecha: this.formBuscar.value.desdeFecha,
               hastaFecha: this.formBuscar.value.hastaFecha
            };
            sessionStorage.setItem("buscarCertipresu", JSON.stringify(this.buscarCertipresu));
            this.total();
         },
         error: err => console.error(err.error),
      });
   }

   total() {
      this.sumvalor = 0;
      this._certificaciones.forEach((certificacion: any) => {
         this.sumvalor = this.sumvalor + certificacion.valor;
      });
      this.tot = this._certificaciones.length;
   }

   changeDesdeHasta() { this.swdesdehasta = true; }

   busquedainicial() {
      sessionStorage.removeItem('buscarCertipresu');
      this.swdesdehasta = false;
      this.ultimaCertipresu();
   }

   changeFiltro() {
      if (this.filtro.trim() !== '') this.swfiltro = true;
      else this.swfiltro = false;
   }

   nuevo() {      this.router.navigate(['add-certipresu']);   }

   modiCertipresu(idcerti: number) {
      sessionStorage.setItem("idcertiToModi", idcerti.toString());
      this.router.navigate(['/modi-certipresu']);
   }

   eliminar(certipresu: Certipresu) {
      this.certipresu.idcerti = certipresu.idcerti;
      this.certipresu.numero = certipresu.numero;
      this.totmovi = 1;  //Para que por default no pueda eliminar
   }

   elimina() {
      this.certiService.deleteCertipresu(this.certipresu.idcerti).subscribe({
         next: datos => this.buscar(),
         error: err => console.error(err.error)
      });
   }

   onCellClick(event: any, certipresu: Certipresu) {
      const tagName = event.target.tagName;
      if (tagName === 'TD') {
         // this.datosBuscar();
         sessionStorage.setItem('idcertiToPartixcerti', certipresu.idcerti.toString());
         this.router.navigate(['partixcerti']);
      }
   }

}

interface Certipresu {
   idcerti: number;
   numero: number
}
