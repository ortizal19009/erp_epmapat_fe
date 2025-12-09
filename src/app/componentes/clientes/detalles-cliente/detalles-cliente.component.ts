import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { FacelectroService } from 'src/app/servicios/facelectro.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { TramitesService } from 'src/app/servicios/ctramites.service';
import { ColoresService } from 'src/app/compartida/colores.service';

@Component({
  selector: 'app-detalles-cliente',
  templateUrl: './detalles-cliente.component.html',
  styleUrls: ['./detalles-cliente.component.css'],
})
export class DetallesClienteComponent implements OnInit {
  cliente = {} as Cliente; //Interface para los datos del Cliente

  n_factura: String;
  _cuentas: any; //Cuentas por cliente
  nocuentas = false;
  _facelectro: any; //Facturas Electrónicas por cliente
  nofacelectro = false;
  _facturas: any; //Pre Facturas por cliente
  nofacturas = false;
  _tramites: any; //Trámites por cliente
  notramites = false;
  _rubrosxfac: any; //Detalle de la Factura
  totfac: number;
  idfactura: number;
  limit: number = 20;
  idcliente: number;
  rolepermission = 1; // 1=lector, 2=editor, 3=admin (ajusta a tu convención)
  ventana = 'detalles-clientes';

  constructor(
    private cliService: ClientesService,
    private facService: FacturaService,
    private faceleService: FacelectroService,
    private abonadoService: AbonadosService,
    private traService: TramitesService,
    private router: Router,
    public authService: AutorizaService,
    private coloresService: ColoresService
  ) {}

  ngOnInit(): void {
    // if (!this.authService.log) this.router.navigate(['/inicio']);
    // Permisos (también sin await directo)
    if (this.coloresService.rolepermission == null) {
    }
    this.coloresService
      .getRolePermission(this.authService.idusuario, this.ventana)
      .then((rp) => (this.rolepermission = rp))
      .catch(console.error);
    this.obtenerDatosCliente();
  }

  obtenerDatosCliente() {
    let idCliente = localStorage.getItem('idclienteToDetalles');
    this.cliService.getListaById(+idCliente!).subscribe({
      next: (datos: any) => {
        this.cliente.idcliente = datos.idcliente;
        this.cliente.nombre = datos.nombre;
        this.cliente.cedula = datos.cedula;
        this.cliente.telefono = datos.telefono;
        this.cliente.email = datos.email;
        this.cliente.direccion = datos.direccion;
        this.cliente.porcdiscapacidad = datos.porcdiscapacidad;
        this.cliente.porcexonera = datos.porcexonera;
        this.cliente.fechanacimiento = datos.fechanacimiento;
      },
      error: (err) => console.log(err.error),
    });
    this.cuentasxCli(+idCliente!);
  }

  //Cuentas por Cliente
  cuentasxCli(idcliente: number) {
    this.abonadoService.getResAbonadoCliente(idcliente).subscribe({
      next: (datos) => {
        this._cuentas = datos;
        if (this._cuentas.length == 0) {
          this.nocuentas = true;
        }
      },
      error: (err) => console.error(err.error),
    });
  }

  //Facturas electrónicas por Cliente
  facelectroxCli(idcliente: number) {
    this.faceleService.getByIdcliente(idcliente).subscribe({
      next: (datos) => {
        this._facelectro = datos;
        if (this._facelectro.length == 0) {
          this.nofacelectro = true;
        }
      },
      error: (err) => console.error(err.error),
    });
  }

  //Planillas por Cliente
  planillasxCliente(idcliente: number) {
    this.idcliente = idcliente;
    this.facService.getByIdcliente(idcliente, this.limit).subscribe({
      next: (datos) => {
        this._facturas = datos;
        if (this._facturas.length == 0) {
          this.nofacturas = true;
        }
      },
      error: (err) => console.error(err.error),
    });
  }
  getFactura() {
    this.planillasxCliente(this.idcliente);
  }

  //Trámites por Cliente
  tramitesxCliente(idcliente: number) {
    this.traService.getByIdcliente(idcliente).subscribe({
      next: (datos) => {
        this._tramites = datos;
        if (this._tramites.length == 0) {
          this.notramites = true;
        }
      },
      error: (err) => console.error(err.error),
    });
  }

  getRubroxfac(idfactura: number) {
    this.idfactura = idfactura;
  }

  subtotal() {
    let suma12: number = 0;
    let suma0: number = 0;
    let i = 0;
    this._rubrosxfac.forEach(() => {
      if (this._rubrosxfac[i].idrubro_rubros.swiva == 1) {
        suma12 +=
          this._rubrosxfac[i].cantidad * this._rubrosxfac[i].valorunitario;
      } else {
        if (this._rubrosxfac[i].idrubro_rubros.esiva == 0) {
          suma0 +=
            this._rubrosxfac[i].cantidad * this._rubrosxfac[i].valorunitario;
        } else {
        }
      }
      i++;
    });
    this.totfac = suma12 + suma0;
  }

  detallesAbonado(idabonado: number) {
    sessionStorage.setItem('padreDetalleAbonado', '2');
    sessionStorage.setItem('idabonadoToFactura', idabonado.toString());
    this.router.navigate(['detalles-abonado']);
  }

  regresar() {
    this.router.navigate(['/clientes']);
  }

  modificarCliente(idcliente: number) {
    sessionStorage.setItem('padreModiCliente', '/detalles-cliente');
    sessionStorage.setItem(
      'idclienteToModi',
      this.cliente.idcliente.toString()
    );
    this.router.navigate(['/modificar-clientes']);
  }
  imprimir() {
    let idcliente = this.cliente.idcliente;
    let cedula = this.cliente.cedula;
    let nombre = this.cliente.nombre;
    sessionStorage.setItem(
      'infoclienteToImpExp',
      JSON.stringify({ idcliente, cedula, nombre })
    );
    this.router.navigate(['imp-infocliente']);
  }
}

interface Cliente {
  idcliente: number;
  nombre: String;
  cedula: String;
  direccion: String;
  telefono: String;
  email: String;
  porcexonera: number;
  porcdiscapacidad: number;
  fechanacimiento: Date;
}
