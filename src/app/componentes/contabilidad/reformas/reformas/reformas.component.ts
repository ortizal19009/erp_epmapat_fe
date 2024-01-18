import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Reformas } from 'src/app/modelos/contabilidad/reformas.model';
import { ReformasService } from 'src/app/servicios/contabilidad/reformas.service';

@Component({
   selector: 'app-reformas',
   templateUrl: './reformas.component.html',
   styleUrls: ['./reformas.component.css']
})

export class ReformasComponent {
   formBuscar: FormGroup;
   _reformas: any;
   filtro: string;
   elimdisabled = false;
   disabled = false;
   idrefo: number;

   constructor(public fb: FormBuilder, private refoService: ReformasService, private router: Router) { }

   ngOnInit(): void {
      this.formBuscar = this.fb.group({
         desde: '',
         hasta: '',
      });
      let buscaReformasHasta = '';
      let buscaReformasDesde = '';
      if (!sessionStorage.getItem("buscaReformasHasta")) {
         this.refoService.ultimaReforma().subscribe({
            next: datos => {
               buscaReformasHasta = datos.numero.toString();
               if (+buscaReformasHasta - 10 < 0) buscaReformasDesde = '1';
               else buscaReformasDesde = (+buscaReformasHasta - 10).toString();
               this.formBuscar.patchValue({
                  desde: buscaReformasDesde,
                  hasta: buscaReformasHasta,
               });
               this.buscar();
            },
            error: err => console.error('Al buscar la última Reforma: ', err.error)
         });
      } else {
         buscaReformasHasta = sessionStorage.getItem("buscaReformasHasta")!;
         buscaReformasDesde = sessionStorage.getItem("buscaReformasDesde")!;
         this.formBuscar.patchValue({
            desde: buscaReformasDesde,
            hasta: buscaReformasHasta,
         });
         this.buscar();
      }
   }

   buscar() {
      this.refoService.buscaByNumfec(this.formBuscar.value.desde, this.formBuscar.value.hasta).subscribe({
         next: resp => {
            this._reformas = resp;
            sessionStorage.setItem('buscaReformasDesde', this.formBuscar?.controls['desde'].value.toString());
            sessionStorage.setItem('buscaReformasHasta', this.formBuscar?.controls['hasta'].value.toString());
         },
         error: err => console.error('Al buscar las Reformas: ', err.error)
      });
   }

   onCellClick(event: any, reformas: Reformas) {
      const tagName = event.target.tagName;
      if (tagName === 'TD') {
         sessionStorage.setItem('idrefoToEjecucion', reformas.idrefo.toString());
         this.router.navigate(['ejecucion']);
      }
   }

   onCellClick1(reformas: Reformas) {
      this.idrefo = reformas.idrefo;
   };

   addReforma() {
      this.router.navigate(['add-reforma']);
   }

   modiReforma(reformas: Reformas) {
      sessionStorage.setItem("idrefoToModi", reformas.idrefo.toString());
      this.router.navigate(['/modi-reforma']);
   }

   eliminarReforma(idrefo: number) {
      if (idrefo != null) {
         this.refoService.deleteReforma(idrefo).subscribe({
            next: resp => this.router.navigate(['/reformas']),
            error: err => console.error(err.error)
         })
      }
   }

}
