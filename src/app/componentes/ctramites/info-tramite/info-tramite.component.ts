import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Clientes } from 'src/app/modelos/clientes';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { TramitesService } from 'src/app/servicios/ctramites.service';

@Component({
   selector: 'app-info-tramite',
   templateUrl: './info-tramite.component.html',
   styleUrls: ['./info-tramite.component.css']
})
export class InfoTramiteComponent implements OnInit {

   tramite = {} as Tramite;
   cliente = {} as Clientes;
   elimdisabled = true;

   constructor(
      private router: Router,
      private traService: TramitesService,
      private clienteService: ClientesService
   ) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/tramites');
      const coloresJSON = sessionStorage.getItem('/tramites');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.datosTramite();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1');
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   datosTramite() {
      const idtramite = Number(sessionStorage.getItem('idtramiteToInfo') || 0);
      if (!idtramite) {
         return;
      }

      this.traService.getTramiteById(idtramite).subscribe({
         next: (datos: any) => {
            console.log('Datos del trámite:', datos);
            this.tramite.idtramite = datos?.idtramite;
            this.tramite.descripcion = datos?.descripcion ?? '';
            this.tramite.fecha = datos?.feccrea;
            this.tramite.validohasta = datos?.validohasta;
            this.tramite.total = datos?.total ?? 0;
            this.asignarCliente(datos?.idcliente_clientes);
         },
         error: (error) => console.error(error)
      });
   }

   private asignarCliente(cliente: any) {
      const idcliente = Number(cliente?.idcliente ?? 0);
      const nombre = String(cliente?.nombre ?? '');

      this.cliente = {
         ...(cliente || {}),
         idcliente: idcliente || null,
         nombre: nombre || 'Sin cliente',
         cedula: cliente?.cedula ?? '',
         direccion: cliente?.direccion ?? '',
         telefono: cliente?.telefono ?? '',
         email: cliente?.email ?? ''
      } as Clientes;

      this.tramite.nomcli = this.cliente.nombre || 'Sin cliente';

      if (idcliente > 0 && !nombre) {
         this.clienteService.getListaById(idcliente).subscribe({
            next: (resp: any) => {
               this.cliente = {
                  ...this.cliente,
                  ...(resp || {}),
                  idcliente: Number(resp?.idcliente ?? idcliente),
                  nombre: resp?.nombre ?? this.cliente.nombre,
                  cedula: resp?.cedula ?? this.cliente.cedula,
                  direccion: resp?.direccion ?? this.cliente.direccion,
                  telefono: resp?.telefono ?? this.cliente.telefono,
                  email: resp?.email ?? this.cliente.email
               } as Clientes;
               this.tramite.nomcli = this.cliente.nombre || 'Sin cliente';
            },
            error: (err) => console.error(err?.error ?? err)
         });
      }
   }

   public modiTramite(idtramite: number) {
      this.router.navigate(['moditramite', idtramite]);
   }

   regresar() {
      this.router.navigate(['/tramites']);
   }
}

interface Tramite {
   idtramite: number;
   descripcion: String;
   nomcli: String;
   total: number;
   fecha: Date;
   validohasta: Date;
}
