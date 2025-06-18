import { FormStyle } from '@angular/common';
import Swal from 'sweetalert2';

import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { isEmpty } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Recaudacion } from 'src/app/modelos/recaudacion.model';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { FormacobroService } from 'src/app/servicios/formacobro.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { RecaudacionService } from 'src/app/servicios/microservicios/recaudacion.service';
import { CajaService } from 'src/app/servicios/caja.service';
import { RecaudaxcajaService } from 'src/app/servicios/recaudaxcaja.service';
@Component({
  selector: 'app-add-recauda',
  templateUrl: './add-recauda.component.html',
  styleUrls: ['./add-recauda.component.css'],
})
export class AddRecaudaComponent implements OnInit {
  filtrar: string;
  _sincobro: any;
  _cliente: any;
  _formasCobro: any;
  f_buscar: FormGroup;
  f_cobrar: FormGroup;
  nombre: string;
  swBuscar: Boolean = false;
  swImprimir: Boolean = false;
  swNotFound: Boolean = false;
  swcaja: boolean = false;
  totalapagar: number = 0;
  fencola: any[] = [];
  abrirCaja: any = {
    usuario: '',
    password: '',
    establecimiento: '',
    nrofactura: '',
  };
  _estadoCaja: any;
  idfactura: any;
  detalleFac: Boolean = false;
  //_mensaje: any;
  constructor(
    private fb: FormBuilder,
    private ms_recaudacion: RecaudacionService,
    private s_cliente: ClientesService,
    private loadingService: LoadingService,
    private s_formacobro: FormacobroService,
    private authService: AutorizaService,
    private s_cajas: CajaService, 
    private s_recaudaxcaja: RecaudaxcajaService
  ) {}

  ngOnInit(): void {
    this.f_buscar = this.fb.group({
      cuenta: '',
      cliente: '',
    });
    this.f_cobrar = this.fb.group({
      idformacobro: 1,
      acobrar: this.totalapagar,
      ncvalor: '',
      dinero: '',
      vuelto: '',
    });
    this.getAllFormaCobro();
    this.getEstadoCaja();
  }
  getEstadoCaja() {
    this.ms_recaudacion.testConnection(this.authService.idusuario).subscribe({
      next: (item: any) => {
        console.log(item);
        this._estadoCaja = item;
        this.s_cajas.getByIdUsuario(this.authService.idusuario).subscribe({
          next: (datos: any) => {
            console.log(datos);
          },
          error: (e: any) => console.error(e),
        });

        if (item.estado === 1) {
          this.swcaja = true;
          this.abrirCaja.usuario = item.username;
          this.abrirCaja.nrofactura = `${item.establecimiento}-${item.codigo}-${item.secuencial}`;
          this.abrirCaja.establecimiento = item.establecimiento;
        } else {
          /* generar una consulta para traer user name de  */
          console.log(this.authService);
          this.abrirCaja.usuario = this.authService.alias;
          this.swcaja = false;
        }
      },
      error: (e: any) => console.error(e),
    });
  }
  fnabrirCaja() {
    this.ms_recaudacion
      .logincajas(this.abrirCaja.usuario, this.abrirCaja.password)
      .subscribe({
        next: (item: any) => {
          console.log(item);
          this.swal('info', item.body.mensaje);
          this.getEstadoCaja();
        },
        error: (e: any) => console.error(e),
      });
  }
  swal(icon: any, mensaje: any) {
    Swal.fire({
      toast: true,
      icon: icon,
      title: mensaje,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
    });
  }
  fnCerrarCaja() {
    console.log(this._estadoCaja);
    this.ms_recaudacion.singOutCaja(this._estadoCaja.username).subscribe({
      next: (item: any) => {
        this.swal('info', item.body.mensaje);
        this.getEstadoCaja();
      },
    });
  }
  getAllFormaCobro() {
    this.s_formacobro.getAll().subscribe({
      next: (formascobro: any) => {
        this._formasCobro = formascobro;
      },
      error: (e: any) => console.error(e),
    });
  }

  btn_buscar() {
    this.fencola = [];
    if (
      this.validarCampo(this.f_buscar.value.cuenta) ||
      this.f_buscar.value.cuenta != ''
    ) {
      this.getSinCobro(this.f_buscar.value.cuenta);
    }
    if (
      !this.validarCampo(this.f_buscar.value.cuenta) ||
      this.f_buscar.value.cuenta === ''
    ) {
      this.swBuscar = true;
    }
  }
  txtCuenta(e: any) {
    this.swBuscar = false;
  }
  async getSinCobro(cuenta: number) {
    this.loadingService.showLoading();
    this._sincobro = null;
    this.totalapagar = 0;
    this.ms_recaudacion
      .getSincobroByCuenta(cuenta)
      .then((sincobro: any) => {
        if (sincobro.length > 0) {
          this._sincobro = sincobro;
          this.getClienteById(sincobro[0].idcliente);
        } else {
          alert('Datos no encontrados');
        }
        this.loadingService.hideLoading();
      })
      .catch((e: any) => {
        console.error(e);
        //this.swNotFound = true;
        this.loadingService.hideLoading();
      });

    //let sincobro = await this.ms_recaudacion.getSincobroByCuenta(cuenta);
  }
  async getCliente(cliente: any) {
    this.loadingService.showLoading();
    this.f_buscar.reset();
    this._sincobro = null;
    this.totalapagar = 0;
    this.ms_recaudacion
      .getSincobroByCliente(cliente.idcliente)
      .then((sincobro: any) => {
        this._sincobro = sincobro;
        this.getClienteById(cliente.idcliente);
        this.loadingService.hideLoading();
      })
      .catch((e: any) => {
        console.error(e);
        this.loadingService.hideLoading();
      });
  }
  swSincobro() {
    if (this._sincobro != null) {
      return true;
    }
    return false;
  }
  validarCampo(campo: any) {
    // ^ indica el inicio de la cadena
    // \s representa cualquier espacio en blanco (espacio, tabulación, etc.)
    // + indica uno o más ocurrencias del carácter anterior
    const regex = /^\s+/;
    return !regex.test(campo);
  }
  sumaIndividual(subtotal: number, interes: number, impuesto: number) {
    return (subtotal + interes + impuesto).toFixed(2);
  }

  getClienteById(idcliente: number) {
    this.s_cliente.getListaById(idcliente).subscribe((cliente: any) => {
      this._cliente = cliente;
    });
  }
  facturaDetalle(idfactura: any) {
    console.log(idfactura);
    this.idfactura = idfactura;
    this.detalleFac = true;
  }
  cancelarDetalle(e: any) {
    console.log(e);
    this.detalleFac = e;
  }
  calcular(e: any, factura: any) {
    this.totalapagar = 0;
    if (e.target.checked === true) {
      /*    let query = this.arrFacturas.find(
        (fact: { idfactura: number }) => (fact.idfactura = factura.idfactura)
      ); */
      this.fencola.push(factura);
    }
    if (e.target.checked === false) {
      let query = this.fencola.find(
        (fact: { idfactura: number }) => (fact.idfactura = factura.idfactura)
      );
      let i = this.fencola.indexOf(query);
      this.fencola.splice(i, 1);
    }
    this.fencola.forEach((factura: any) => {
      this.totalapagar +=
        factura.total + factura.interesacobrar + factura.swiva;
      this.f_cobrar.patchValue({
        acobrar: +this.totalapagar!.toFixed(2),
      });
    });
  }
  cobrar() {
    let dinero: number = +this.f_cobrar.value.dinero!;
    let apagar: number = +this.totalapagar!.toFixed(2);
    let facturas: any[] = [];
    let autentification = 1;
    let recaudacion: any = {};
    this.fencola.forEach((item: any) => {
      facturas.push(item.idfactura);
    });
    recaudacion.totalpagar = this.totalapagar;
    recaudacion.recaudador = autentification;
    recaudacion.valor = this.totalapagar;
    recaudacion.recibo = dinero;
    recaudacion.cambio = dinero - apagar;
    recaudacion.usucrea = autentification;
    recaudacion.formapago = 1;
    let obj: any = {
      facturas: facturas,
      autentification: autentification,
      recaudacion: recaudacion,
    };
    this.ms_recaudacion.cobrarFacturas(obj).subscribe({
      next: (cobrado: any) => {
        this.fencola = [];
      },
      error: (e: any) => {
        console.error(e);
        this.fencola = [];
      },
    });
  }
  vuelto(e: any) {
    let dinero: number = +this.f_cobrar.value.dinero!;
    let apagar: number = +this.totalapagar!.toFixed(2);
    if (dinero > apagar) {
      let vuelto = dinero - apagar;
      this.f_cobrar.patchValue({
        vuelto: +vuelto!.toFixed(2),
      });
    }
  }
}
