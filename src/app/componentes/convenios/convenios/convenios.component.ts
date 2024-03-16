import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ConvenioService } from 'src/app/servicios/convenio.service';
import { Convenios } from 'src/app/modelos/convenios.model';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';

@Component({
   selector: 'app-convenios',
   templateUrl: './convenios.component.html', 
   styleUrls: ['./convenios.component.css']
})

export class ConveniosComponent implements OnInit {

   formBuscar: FormGroup;
   filtro: string;
   nroconve: any;  //Nro de convenio enviado como mensaje a eliminar
   _convenios: any;
   rtn: number;
   swdesdehasta: boolean; //Visibilidad Buscar últimos
   currentIndex = -1;
   swbuscando: boolean;
   txtbuscar: string;

   constructor(private convService: ConvenioService, private router: Router, private fb: FormBuilder,
      public authService: AutorizaService, private coloresService: ColoresService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/convenios');
      let coloresJSON = sessionStorage.getItem('/convenios');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      this.formBuscar = this.fb.group({
         desde: [''],
         hasta: [''],
      });

      if (sessionStorage.getItem("desdeconvenio") != null && sessionStorage.getItem("hastaconvenio") != null) {
         this.formBuscar.controls['desde'].setValue(sessionStorage.getItem("desdeconvenio"));
         this.formBuscar.controls['hasta'].setValue(sessionStorage.getItem("hastaconvenio"));
         this.buscaConvenios();
      }
      else this.ultimoNroconvenio();
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
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'convenios');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/convenios', coloresJSON);
         this.colocaColor(datos);
      } catch (error) { console.error(error); }
   }

   ultimoNroconvenio() {
      this.convService.ultimoNroconvenio().subscribe({
         next: resp => {
            this.formBuscar.controls['hasta'].setValue(resp.nroconvenio);
            let desde = 1;
            if (resp.nroconvenio > 10) desde = resp.nroconvenio - 10
            this.formBuscar.controls['desde'].setValue(desde);
            this.buscaConvenios();
         },
         error: err => console.error(err.error)
      });
   }

   buscaConvenios() {
      this.swbuscando = true;
      this.txtbuscar = 'Buscando'
      sessionStorage.setItem("desdeconvenio", this.formBuscar.value.desde);
      sessionStorage.setItem("hastaconvenio", this.formBuscar.value.hasta);
      let desde = +this.formBuscar.value.desde;
      let hasta = +this.formBuscar.value.hasta;
      if (desde > 0 && hasta > 0) {
         if (hasta - desde < 200) {
            this.convService.conveniosDesdeHasta(desde, hasta).subscribe({
               next: datos => {
                  this._convenios = datos;
                  this.swbuscando = false;
                  this.txtbuscar = 'Buscar'
               },
               error: err => console.error(err.error)
            });
         } else {
            //Advertencia
         }
      }
   }

   public listainicial() {
      sessionStorage.removeItem('desdeconvenio');
      sessionStorage.removeItem('hastaconvenio');
      this.swdesdehasta = false;
      this.ultimoNroconvenio();
   }

   changeDesdeHasta() {
      this.swdesdehasta = true;
      // this.formBuscar.get('desde')!.valueChanges.subscribe(x => {

      //  });
   }

   setActive(m: Convenios, index: number): void {
      this.currentIndex = index;
   }

   public listar10() {
      // this.swbusca = false;
      sessionStorage.removeItem("desde");
      sessionStorage.removeItem("hasta");
      // this.inicia();
      // this.convService.getAll().subscribe(datos => { this._convenios = datos })
   }

   // public buscaConvenios() {
   //    let desde = this.formBuscar.value.desde;
   //    let hasta = this.formBuscar.value.hasta;
   //    let desdeB = document.getElementById("desde") as HTMLInputElement;
   //    let hastaB = document.getElementById("hasta") as HTMLInputElement;

   //    if (desde == '' || hasta == '' || desde == null || hasta == null) {
   //       desdeB.style.border = "#f50000 1px solid";
   //       hastaB.style.border = "#f50000 1px solid";
   //    } else if (desde != null && hasta != null) {
   //       if ((+desdeB.value!) > (+hastaB.value!)) {
   //          desdeB.style.border = "#f50000 1px solid";
   //          hastaB.style.border = "#f50000 1px solid";
   //       } else {
   //          desdeB.style.border = "";
   //          hastaB.style.border = "";
   //          // this.swbusca = true;
   //          sessionStorage.setItem('desde', desde.toString());
   //          sessionStorage.setItem('hasta', hasta.toString());
   //          this.convService.getConveniosQuery(desde, hasta).subscribe({
   //             next: datos => this._convenios = datos,
   //             error: err => console.error(err.error)
   //          });
   //       }
   //    }
   // }

   nuevo() {
      this.router.navigate(['add-convenio']);
   }

   info(event: any, idconvenio: number) {
      const tagName = event.target.tagName;
      if (tagName === 'TD') {
         sessionStorage.setItem('idconvenioToInfo', idconvenio.toString());
         this.router.navigate(['info-convenio']);
      }
   }

   public modiConvenio(idconvenio: number) {
      sessionStorage.setItem('idconvenioToModi', idconvenio.toString());
      this.router.navigate(["modi-convenio"]);
   }

   imprimir() {
      this.router.navigate(['imp-convenios']);
   }

}
