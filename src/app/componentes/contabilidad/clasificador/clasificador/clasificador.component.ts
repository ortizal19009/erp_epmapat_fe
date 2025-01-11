import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ClasificadorService } from 'src/app/servicios/clasificador.service';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';

@Component({
   selector: 'app-clasificador',
   templateUrl: './clasificador.component.html',
   styleUrls: ['./clasificador.component.css']
})
export class ClasificadorComponent implements OnInit {

   _clasificador: any;
   swbuscando: boolean;
   txtbuscar: string = 'Buscar';
   filtro: string;
   formBuscar: FormGroup;
   buscarClasificador: { codpar: string, nompar: string }
   clasificador = {} as iClasificador; //Interface para los datos del Trámite a eliminar
   totmovi: number = 1;  //Por default no puede eliminar


   constructor(public fb: FormBuilder, private clasiService: ClasificadorService, private router: Router,
      public authService: AutorizaService, private coloresService: ColoresService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/clasificador');
      let coloresJSON = sessionStorage.getItem('/clasificador');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      this.formBuscar = this.fb.group({
         codpar: '',
         nompar: '',
         filtro: '',
      });

      //Datos de búsqueda: guardados o no busca
      this.buscarClasificador = JSON.parse(sessionStorage.getItem("buscarClasificador")!);
      if (this.buscarClasificador != null) {
         this.formBuscar.patchValue({
            codpar: this.buscarClasificador.codpar,
            nompar: this.buscarClasificador.nompar
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
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'clasificador');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/clasificador', coloresJSON);
         this.colocaColor(datos);
      } catch (error) { console.error(error); }
   }

   buscar() {
      this.swbuscando = true;
      this.txtbuscar = 'Buscando';
      let codpar: string = '';
      if (this.formBuscar.value.codpar != null) { codpar = this.formBuscar.value.codpar; }
      let nompar: string = '';
      if (this.formBuscar.value.nompar != null) { nompar = this.formBuscar.value.nompar; }
      this.clasiService.getPartidas(codpar, nompar).subscribe({
         next: datos => {
            this._clasificador = datos;
            if (codpar == '' && nompar == '') { sessionStorage.removeItem('buscarClasificador') }
            else {
               this.buscarClasificador = {  //Guarda los datos de búsqueda
                  codpar: this.formBuscar.value.codpar,
                  nompar: this.formBuscar.value.nompar
               };
               sessionStorage.setItem("buscarClasificador", JSON.stringify(this.buscarClasificador));
            }
            this.swbuscando = false;
            this.txtbuscar = 'Buscar';
         },
         error: err => console.error(err.error)
      });
   }

   info(event: any, intcla: number) {
      const tagName = event.target.tagName;
      if (tagName === 'TD') {
         sessionStorage.setItem('intclaToInfo', intcla.toString());
         this.router.navigate(['info-clasificador']);
      }
   }

   nuevo() { this.router.navigate(['/add-clasificador']); }

   modificar(intcla: number) {
      console.log('intcla: ', intcla);
      sessionStorage.setItem("intclaToModi", intcla.toString());
      this.router.navigate(['/modi-clasificador']);
   }

   eliminar(clasificador: iClasificador) {
      this.clasificador.intcla = clasificador.intcla;
      this.clasificador.codpar = clasificador.codpar;
      //this.numero = certipresu.numero;  //Para el mensaje de eliminar
      // this.idcerti = certipresu.idcerti;
      this.totmovi = 1;  //Para que por default no pueda eliminar
      // this.ejecuService.countByIntpre(preing.intpre).subscribe({
      //    next: resp => this.totmovi = resp,
      //    error: err => console.error('Al contar los movimientos de la partida: ', err.error)
      // });
   }

   elimina() {
      // this.tramiService. .deleteCertipresu(this.certipresu.idcerti).subscribe({
      //    next: datos => this.buscar(),
      //    error: err => console.log(err.error)
      // });
   }

}

interface iClasificador {
   intcla: number
   codpar: String;
   // nompar: String
}
