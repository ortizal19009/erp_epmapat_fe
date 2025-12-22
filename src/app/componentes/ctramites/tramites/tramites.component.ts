import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Tramites } from 'src/app/modelos/ctramites';
import { LiquidaTramiteService } from 'src/app/servicios/liquida-tramite.service';
import { TpTramiteService } from 'src/app/servicios/tp-tramite.service';
import { TramitesService } from 'src/app/servicios/ctramites.service';

@Component({
   selector: 'app-tramites',
   templateUrl: './tramites.component.html',
   styleUrls: ['./tramites.component.css']
})

export class TramitesComponent implements OnInit {

   _tramites: any;
   filterTerm: string;
   v_tptramites: any;
   d_tramites: any;
   detalles_tramite: any = {};
   l_rubrosxfac: any;
   detalles: boolean = true;
   _liquidatrami: any;
   tipo: boolean = false;

   constructor(private coloresService: ColoresService, private traService: TramitesService, private router: Router,
      private tptramiService: TpTramiteService, private liqtraService: LiquidaTramiteService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/tramites');
      let coloresJSON = sessionStorage.getItem('/tramites');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      this.listarTramites();
      this.listarTpTramites();
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
         const datos = await this.coloresService.setcolor(1, 'tramites');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/tramites', coloresJSON);
         this.colocaColor(datos);
      } catch (error) {
         console.error(error);
      }
   }

   listarTramites() {
      let b_tramite = document.getElementById("b_tramites") as HTMLSelectElement;
      setTimeout(() => {
         let o_tramite = document.getElementById("id-tpt1") as HTMLSelectElement;
         o_tramite.setAttribute('selected', '');
         this.traService.getByTpTramite(1).subscribe({
            next: datos => this._tramites = datos,
            error: err => console.error(err.error)
         })
      }, 200);

      b_tramite.addEventListener("change", () => {
         this.traService.getByTpTramite(+b_tramite.value!).subscribe({
            next: datos => this._tramites = datos,
            error: err => console.error(err.error)
         })
      });
   }

   listarTpTramites() {
      this.tptramiService.getListaTpTramite().subscribe(datos => {
         this.v_tptramites = datos;
      }, error => console.error(error))
   }

   addTramite() { this.router.navigate(["/add-tramite"]); }

   modificarTramite(tramite: Tramites) {
      localStorage.setItem("idtramite", tramite.idtramite.toString());
      this.router.navigate(["/modificar-tramites"]);
   }

   eliminarTramite(idtramite: number) {
      localStorage.setItem("idtramiteToDelete", idtramite.toString());
   }

   aprobarEliminarTramite() {
      let ida = localStorage.getItem("idtramiteToDelete");
      this.traService.deleteTramite(+ida!).subscribe({
         next: datos => {
            localStorage.setItem("mensajeSuccess", "Tramite eliminado");
            this.listarTramites();
         },
         error: err => console.error(err.error),
      });
      localStorage.removeItem("idtramiteToDelete");
   }

   setDetallesTramite() {
      this.detalles_tramite = {
         nrotramite: this.d_tramites[0].idtramite_tramites.idtramite,
         cliente: this.d_tramites[0].idtramite_tramites.idcliente_clientes.nombre,
         detalles: this.l_rubrosxfac,
         total: this.d_tramites[0].valor,
      }
   }

   public info(e: any, idtramite: number) {
      const tagName = e.target.tagName;
      if (tagName === 'TD') {
         sessionStorage.setItem('idtramiteToInfo', idtramite.toString());
         this.traService.getTramiteById(idtramite).subscribe({
            next: datos => {
               let idtramite = datos.idtramite;
               this.liqtraService.getLiquidaTramiteByIdTramite(idtramite).subscribe({
                  next: resp => {
                     this._liquidatrami = resp;
                     let idfactura = this._liquidatrami[0].idfactura_facturas.idfactura;
                     sessionStorage.setItem('idfacturaToInfo', idfactura.toString());
                     this.router.navigate(['info-tramite']);
                  },
                  error: err => console.error(err.error),
               });
            },
            error: err => console.error(err.error)
         });
      }
   }

}
