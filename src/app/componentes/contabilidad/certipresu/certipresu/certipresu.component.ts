import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
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
   beneficiario: any;
   info_form: boolean = false;
   buscarxnum: boolean = true;
   txtBuscar: string = 'Número';
   date: Date = new Date();
   hastaDate: any;
   certipresu = {} as Certipresu; //Interface para los datos de la Certificación a eliminar

   filtro: string;
   disabled = false;

   constructor(private certiService: CertipresuService, private fb: FormBuilder,
      private router: Router) { }

   ngOnInit(): void {

      const fecha = new Date();
      const año = fecha.getFullYear()
      this.formBuscar = this.fb.group({
         desdeNum: '',
         hastaNum: '',
         desdeFecha: año + '-01-01',
         hastaFecha: año + '-12-31',
      });

      let buscaDesdeNum = sessionStorage.getItem("buscaDesdeNum");
      let buscaHastaNum = sessionStorage.getItem("buscaHastaNum");
      let buscaDesdeFecha = sessionStorage.getItem("buscaDesdeFecha");
      let buscaHastaFecha = sessionStorage.getItem("buscaHastaFecha");
      if (buscaDesdeNum == null || buscaHastaNum == null || buscaDesdeFecha == null || buscaHastaFecha == null ) {
         this.certiService.ultimo().subscribe({
            next: certificacion => {
               let desde = certificacion.numero - 10;
               if (desde <= 0) desde = 1;
               this.formBuscar.patchValue({
                  desdeNum: desde,
                  hastaNum: certificacion.numero,
               });
               this.buscar();
            },
            error: err => console.error(err.error)
         }
         );
      }else this.formBuscar.patchValue({
         desdeNum: buscaDesdeNum,
         hastaNum: buscaHastaNum,
         desdeFecha: buscaDesdeFecha,
         hastaFecha: buscaHastaFecha
      });
      this.buscar();
   }

   buscar() {
      this.certiService.getDesdeHasta(this.formBuscar.value.desdeNum, this.formBuscar.value.hastaNum,
         this.formBuscar.value.desdeFecha, this.formBuscar.value.hastaFecha).subscribe({
            next: datos => {
               this._certificaciones = datos;
               this.datosBuscar();
            },
            error: err => console.log(err.error),
         });
   }

   datosBuscar() {
      sessionStorage.setItem('buscaDesdeNum', this.formBuscar?.controls['desdeNum'].value.toString());
      sessionStorage.setItem('buscaHastaNum', this.formBuscar?.controls['hastaNum'].value.toString());
      sessionStorage.setItem('buscaDesdeFecha', this.formBuscar?.controls['desdeFecha'].value.toString());
      sessionStorage.setItem('buscaHastaFecha', this.formBuscar?.controls['hastaFecha'].value.toString());
   }

   addCertipresu() {
      this.datosBuscar();   
      this.router.navigate(['add-certipresu']); 
   }

   modiCertipresu(idcerti: number) {
      this.datosBuscar();
      sessionStorage.setItem("idcertiToModi", idcerti.toString());
      this.router.navigate(['/modi-certipresu']);
   }

   datosEliminar(certipresu: Certipresu) {
      this.certipresu.idcerti = certipresu.idcerti;
      this.certipresu.numero = certipresu.numero
   }

   elimCertipresu() {
      this.certiService.deleteCertipresu(this.certipresu.idcerti).subscribe({
         next: datos => this.buscar(),
         error: err => console.log(err.error)
      });
   }

   onCellClick(event: any, certipresu: Certipresu) {
      const tagName = event.target.tagName;
      if (tagName === 'TD') {
         this.datosBuscar();
         sessionStorage.setItem('idcertiToPartixcerti', certipresu.idcerti.toString());
         this.router.navigate(['partixcerti']);
      }
   }

}

interface Certipresu {
   idcerti: number;
   numero: number
}
