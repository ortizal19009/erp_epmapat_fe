import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Aguatramite } from 'src/app/modelos/aguatramite.model';
import { AguatramiteService } from 'src/app/servicios/aguatramite.service';
import { TipoTramiteService } from 'src/app/servicios/tipo-tramite.service';
import { TramiteNuevoService } from 'src/app/servicios/tramite-nuevo.service';
import { TramitesAguaService } from 'src/app/servicios/tramites-agua.service';

@Component({
   selector: 'app-aguatramite',
   templateUrl: 'aguatramite.component.html',
   styleUrls: ['aguatramite.component.css'],
})

export class AguatramiteComponent implements OnInit {

   f_aguatramite: FormGroup;
   f_Tipotramite: FormGroup;
   formBuscar: FormGroup;
   _aguatramite: any;
   aguatramites: any;
   filterTerm: string;
   l_tipotramite: any;  //Solo 1,2,5, y 9
   btnSelectTpTramite: boolean = false;
   estados: any = [
      { valor: 1, estado: 'Recien ingresado' },
      { valor: 2, estado: 'Inspeccionando' },
      { valor: 3, estado: 'Aprobado' },
      { valor: 4, estado: 'Notificado' },
      { valor: 5, estado: 'Contrato generado' },
      { valor: 6, estado: 'Negado' },
      { valor: 0, estado: 'Eliminado' },
   ];
   optAcciones: boolean;

   constructor(private router: Router, private fb: FormBuilder, private aguatramiService: AguatramiteService,
      private tipotramiService: TipoTramiteService, private tramitenuevoService: TramiteNuevoService,
      private s_genpdf: TramitesAguaService
   ) { }

   ngOnInit(): void {
      this.f_Tipotramite = this.fb.group({
         idtitpotramite: 1,
      });

      this.formBuscar = this.fb.group({
         idtipotramite_tipotramite: 1,
         estado: 1,
      });
      this.listartipotramite();
      this.listarByTipoTramite();
      this.setcolor();
   }

   setcolor() {
      let colores: string[];
      let coloresJSON = sessionStorage.getItem('/aguatramite');
      if (!coloresJSON) {
         colores = ['rgb(144, 123, 5)', 'rgb(249, 249, 175)'];
         const coloresJSON = JSON.stringify(colores);
         sessionStorage.setItem('/aguatramite', coloresJSON);
      } else colores = JSON.parse(coloresJSON);

      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1');
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   listartipotramite() {
      this.tipotramiService.getListaTipoTramite().subscribe({
         next: (datos: any) => {
            let tipTramite: any = [];
            datos.forEach((dato: any) => {
               if (
                  dato.idtipotramite === 1 ||
                  dato.idtipotramite === 2 ||
                  dato.idtipotramite === 5 ||
                  dato.idtipotramite === 9
               ) {
                  tipTramite.push(dato);
               }
            });
            this.l_tipotramite = tipTramite;
         },
         error: (e) => console.error(e),
      });
   }

   listarByTipoTramite() {
      if (+this.formBuscar.value.idtipotramite_tipotramite! != 1) this.optAcciones = false;
      else this.optAcciones = true;
      this.aguatramiService.getByTipoTramite(this.formBuscar.value.idtipotramite_tipotramite, this.formBuscar.value.estado).subscribe({
         next: (datos) => {
            this._aguatramite = datos;
         },
         error: (e) => console.error(e),
      });
   }

   listarTramiteNuevo() {
      this.tramitenuevoService.getListaTramiteNuevo().subscribe({
         next: (datos) => this._aguatramite = datos,
         error: (e) => console.error(e),
      });
   }

   genPdf() {
      let datos: any = [];
      this.s_genpdf.listaTramitesAgua('my-table');
   }

   addAguaTramite() {
      // console.log('forms-aguatramite',+this.f_Tipotramite.value.idtitpotramite!,)
      this.router.navigate(['forms-aguatramite',+this.f_Tipotramite.value.idtitpotramite!,]);
   }

   modificarAguaTramite(aguatramite: Aguatramite) {
      localStorage.setItem('idaguatramite', aguatramite.idaguatramite.toString());
      this.router.navigate(['/modificar-aguatramite']);
   }

   eliminarAguaTramite(idaguatramite: number) {
      localStorage.setItem('idAguaTramiteToDelete', idaguatramite.toString());
   }

   infoNuevoTramite(aguatramite: any) {
      this.tramitenuevoService.getByIdAguaTramite(aguatramite.idaguatramite).subscribe({
         next: (datos: any) => {
            if (datos.length != 0) this.router.navigate(['info-aguatramite', datos[0].idtramitenuevo]);
         },
         error: (e) => console.error(e),
      });
   }

   setEstado(i_estado: number) {
      let est = this.estados.find(
         (estado: { valor: number }) => estado.valor === i_estado
      );
      return est.estado;
   }

}
