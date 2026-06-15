import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Aguatramite } from 'src/app/modelos/aguatramite.model';
import { Clientes } from 'src/app/modelos/clientes';
import { TramiteNuevoService } from 'src/app/servicios/tramite-nuevo.service';
import { TramiteNuevo } from 'src/app/modelos/tramite-nuevo';
import { TramitesAguaService } from 'src/app/servicios/tramites-agua.service';
import { ClientesService } from 'src/app/servicios/clientes.service';

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
    private tramiaguaService: TramitesAguaService,
    private clientesService: ClientesService
  ) {}

  ngOnInit(): void {
    const idtramitenuevo = this.getRouter.snapshot.paramMap.get('id');
    this.idtramite = +idtramitenuevo!;
    this.getTramNuevoById(+idtramitenuevo!);
    this.setcolor();
  }

  setcolor() {
    let colores: string[];
    const coloresJSON = sessionStorage.getItem('/aguatramite');
    if (!coloresJSON) {
      colores = ['rgb(144, 123, 5)', 'rgb(249, 249, 175)'];
      const coloresIniciales = JSON.stringify(colores);
      sessionStorage.setItem('/aguatramite', coloresIniciales);
    } else {
      colores = JSON.parse(coloresJSON);
    }

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
        this.aguatramite = datos?.idaguatramite_aguatramite || new Aguatramite();
        this.cliente = this.obtenerClienteDesdeFuentes() || new Clientes();
        this.cargarClienteCompleto();
        this.setEstado(Number(this.aguatramite?.estado || 0));
      },
      error: (e) => console.error(e),
    });
  }

  setEstado(estado: number) {
    const estadotram = [
      { valor: 0, estado: 'Eliminado' },
      { valor: 1, estado: 'Recien ingresado' },
      { valor: 2, estado: 'Inspeccionando' },
      { valor: 3, estado: 'Aprobado' },
      { valor: 4, estado: 'Notificado' },
      { valor: 5, estado: 'Contrato generado' },
      { valor: 6, estado: 'Negado' },
    ];

    const consulta = estadotram.find(
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
    this.tramiaguaService.genContrato(this.tramitenuevo);
  }

  genHojaInspeccion() {
    this.tramiaguaService.genHojaInspeccion(
      {
        ...this.tramitenuevo,
        idaguatramite: this.tramitenuevo?.idaguatramite_aguatramite?.idaguatramite,
        idcliente_clientes: this.tramitenuevo?.idaguatramite_aguatramite?.idcliente_clientes,
        feccrea: this.tramitenuevo?.idaguatramite_aguatramite?.feccrea,
        observacion: this.tramitenuevo?.idaguatramite_aguatramite?.observacion,
        usucrea: this.tramitenuevo?.idaguatramite_aguatramite?.usucrea,
      },
      'Concesión de servicios'
    );
  }

  getNombreCliente(): string {
    const cliente = this.obtenerClienteDesdeFuentes();

    return String(
      cliente?.nombre ||
      cliente?.['nombres'] ||
      cliente?.['razonsocial'] ||
      'Sin cliente'
    );
  }

  getCuenta(): string {
    return (
      `${this.aguatramite?.idaguatramite ?? ''}` ||
      `${this.tramitenuevo?.idaguatramite_aguatramite?.idaguatramite ?? ''}` ||
      `${this.aguatramite?.idfactura_facturas ?? ''}` ||
      ''
    );
  }

  private cargarClienteCompleto(): void {
    const idcliente = this.obtenerIdCliente();
    if (!idcliente || this.cliente?.nombre) {
      return;
    }

    this.clientesService.getListaById(idcliente).subscribe({
      next: (datos: any) => {
        const cliente = Array.isArray(datos) ? datos?.[0] : datos;
        if (cliente) {
          this.cliente = cliente;
        }
      },
      error: (e) => console.error('No se pudo cargar el cliente completo', e),
    });
  }

  private obtenerClienteDesdeFuentes(): any {
    const aguatramiteAny = this.aguatramite as any;
    const aguatramiteAnidado: any = this.tramitenuevo?.idaguatramite_aguatramite;

    const candidato =
      this.cliente ||
      this.aguatramite?.idcliente_clientes ||
      aguatramiteAny?.idcliente ||
      aguatramiteAnidado?.idcliente_clientes ||
      aguatramiteAnidado?.idcliente ||
      null;

    return candidato && typeof candidato === 'object' ? candidato : null;
  }

  private obtenerIdCliente(): number | null {
    const aguatramiteAny = this.aguatramite as any;
    const aguatramiteAnidado: any = this.tramitenuevo?.idaguatramite_aguatramite;

    const candidato =
      this.cliente?.idcliente ??
      this.aguatramite?.idcliente_clientes?.idcliente ??
      this.aguatramite?.idcliente_clientes ??
      aguatramiteAny?.idcliente?.idcliente ??
      aguatramiteAny?.idcliente ??
      aguatramiteAnidado?.idcliente_clientes?.idcliente ??
      aguatramiteAnidado?.idcliente_clientes ??
      aguatramiteAnidado?.idcliente?.idcliente ??
      aguatramiteAnidado?.idcliente;

    const idcliente = Number(candidato);
    return Number.isFinite(idcliente) && idcliente > 0 ? idcliente : null;
  }
}
