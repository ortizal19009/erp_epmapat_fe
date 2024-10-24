import { FormStyle } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { isEmpty } from 'rxjs';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { RecaudacionService } from 'src/app/servicios/microservicios/recaudacion.service';

@Component({
  selector: 'app-add-recauda',
  templateUrl: './add-recauda.component.html',
  styleUrls: ['./add-recauda.component.css'],
})
export class AddRecaudaComponent implements OnInit {
  filtrar: string;
  _sincobro: any;
  _cliente: any;
  f_buscar: FormGroup;
  nombre: string;
  swBuscar: Boolean = false;
  swImprimir: Boolean = false;
  totalapagar: number = 0;
  fencola: any[] = [];
  constructor(
    private fb: FormBuilder,
    private ms_recaudacion: RecaudacionService,
    private s_cliente: ClientesService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.f_buscar = this.fb.group({
      cuenta: '',
      cliente: '',
    });
  }

  btn_buscar() {
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
    this.ms_recaudacion
      .getSincobroByCuenta(cuenta)
      .then((sincobro: any) => {
        this._sincobro = sincobro;
        this.getClienteById(sincobro[0].idcliente);
        this.loadingService.hideLoading();
      })
      .catch((e: any) => console.error(e));

    //let sincobro = await this.ms_recaudacion.getSincobroByCuenta(cuenta);
  }
  async getCliente(cliente: any) {
    this.loadingService.showLoading();
    this.f_buscar.reset();
    this._sincobro = null;
    this.ms_recaudacion
      .getSincobroByCliente(cliente.idcliente)
      .then((sincobro: any) => {
        this._sincobro = sincobro;
        this.getClienteById(cliente.idcliente);
        this.loadingService.hideLoading();
      })
      .catch((e: any) => console.error(e));
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
  calcular(e: any, factura: any) {
    console.log(factura);

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
      console.log(factura);
      // this.sumtotal += factura.total + factura.iva + factura.interes;
      this.totalapagar +=
        factura.total + factura.interesacobrar + factura.swiva;
    });
  }
}
