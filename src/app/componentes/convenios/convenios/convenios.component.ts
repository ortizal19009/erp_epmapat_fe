import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ConvenioService } from 'src/app/servicios/convenio.service';
import { Convenios } from 'src/app/modelos/convenios.model';

@Component({
   selector: 'app-convenios',
   templateUrl: './convenios.component.html'
})

export class ConveniosComponent implements OnInit {

   filtro: string;
   nroconve: any;  //Nro de convenio enviado como mensaje a eliminar
   formBuscar: FormGroup;
   _convenios: any;
   rtn: number;
   swbusca: boolean; //Visibilidad Buscar 10 últimos
   currentIndex = -1;

   constructor(private convService: ConvenioService, private router: Router, private fb: FormBuilder) { }

   ngOnInit(): void {
      this.listar();
   }

   public inicia() {
      this.formBuscar = this.fb.group({
         desde: [''],
         hasta: [''],
      }
      );
      this.swbusca = false;
   }

   public inicia1(desde: string, hasta: string) {
      this.formBuscar = this.fb.group({
         desde: [desde],
         hasta: [hasta],
      }
      );
      this.swbusca = true;
   }

   public listar() {
      let desde = sessionStorage.getItem("desde");
      let hasta = sessionStorage.getItem("hasta");
      if (!desde || !hasta) {
         this.inicia();
         this.convService.getAll().subscribe(datos => { this._convenios = datos })
      }
      else {
         this.inicia1(desde.toString(), hasta.toString());
         this.buscaConvenios();
      }
   }

   setActive(m: Convenios, index: number): void {
      this.currentIndex = index;
   }

   public listar10() {
      this.swbusca = false;
      sessionStorage.removeItem("desde");
      sessionStorage.removeItem("hasta");
      this.inicia();
      this.convService.getAll().subscribe(datos => { this._convenios = datos })
   }

   public buscaConvenios() {

      let desde = this.formBuscar.value.desde;
      let hasta = this.formBuscar.value.hasta;
      let desdeB = document.getElementById("desde") as HTMLInputElement;
      let hastaB = document.getElementById("hasta") as HTMLInputElement;

      if (desde == '' || hasta == '' || desde == null || hasta == null) {
         desdeB.style.border = "#f50000 1px solid";
         hastaB.style.border = "#f50000 1px solid";
      } else if (desde != null && hasta != null) {
         if ((+desdeB.value!) > (+hastaB.value!)) {
            desdeB.style.border = "#f50000 1px solid";
            hastaB.style.border = "#f50000 1px solid";
         } else {
            desdeB.style.border = "";
            hastaB.style.border = "";
            this.swbusca = true;
            sessionStorage.setItem('desde', desde.toString());
            sessionStorage.setItem('hasta', hasta.toString());
            this.convService.getConveniosQuery(desde, hasta).subscribe(datos => {
               this._convenios = datos;
            }, error => console.log(error));
         }
      }
   }

   public info(idconvenio: number) {
      sessionStorage.setItem('idconvenioToInfo', idconvenio.toString());
      this.router.navigate(['info-convenio']);
   }

}
