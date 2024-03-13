import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Aguatramite } from 'src/app/modelos/aguatramite.model';
import { TramiteNuevoService } from 'src/app/servicios/tramite-nuevo.service';
import { Clientes } from 'src/app/modelos/clientes';
import { TramiteNuevo } from 'src/app/modelos/tramite-nuevo';
import { TramitesAguaService } from 'src/app/servicios/tramites-agua.service';

@Component({
  selector: 'app-info-aguatramite',
  templateUrl: './info-aguatramite.component.html',
  styleUrls: ['./info-aguatramite.component.css'],
})
export class InfoAguatramiteComponent implements OnInit {
  titulo: string = 'Detalles del Trámite';
  tramitenuevo: TramiteNuevo = new TramiteNuevo();
  cliente: Clientes = new Clientes();
  aguatramite: Aguatramite = new Aguatramite();
  estadoTramite: any;
  idtramite: number;

  constructor(
    private getRouter: ActivatedRoute,
    private traminuevoService: TramiteNuevoService,
    private tramiaguaService: TramitesAguaService
  ) {}

  ngOnInit(): void {
    let idtramitenuevo = this.getRouter.snapshot.paramMap.get('id');
    this.idtramite = +idtramitenuevo!;
    this.getTramNuevoById(+idtramitenuevo!);
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

  getTramNuevoById(id: number) {
    this.traminuevoService.getListaById(id).subscribe({
      next: (datos) => {
        this.tramitenuevo = datos;
        this.cliente = datos.idaguatramite_aguatramite.idcliente_clientes;
        this.aguatramite = datos.idaguatramite_aguatramite;
        this.setEstado(datos.idaguatramite_aguatramite.estado);
      },
      error: (e) => console.error(e),
    });
  }

  setEstado(estado: number) {
    let estadotram = [
      { valor: 0, estado: 'Eliminado' },
      { valor: 1, estado: 'Recien ingresado' },
      { valor: 2, estado: 'Inspeccionando' },
      { valor: 3, estado: 'Aprobado' },
      { valor: 4, estado: 'Notificado' },
      { valor: 5, estado: 'Contrato generado' },
      { valor: 6, estado: 'Negado' },
    ];

    let consulta = estadotram.find(
      (estadot: { valor: number }) => estadot.valor === estado
    );
    this.estadoTramite = consulta?.estado;
  }

  valEstado() {
    if (this.aguatramite.estado === 1) {
      return true;
    } else if (this.aguatramite.estado === 3) {
      return false;
    } else {
      return true;
    }
  }

  genContrato() {
    // console.log('this.aguatramite.estado: ', this.aguatramite.estado)
    this.tramiaguaService.genContrato(this.tramitenuevo);
  }

  genHojaInspeccion() {
    this.tramiaguaService.genHojaInspeccion(
      this.tramitenuevo.idaguatramite_aguatramite,
      'Concesión de servicios'
    );
  }
}
