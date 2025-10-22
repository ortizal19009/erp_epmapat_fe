import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
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
import { Colores } from 'src/app/modelos/administracion/colores.model';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { ColoresService } from 'src/app/compartida/colores.service';
declare var bootstrap: any; // 👈 para usar la librería de Bootstrap JS

@Component({
  selector: 'app-add-recauda',
  templateUrl: './add-recauda.component.html',
  styleUrls: ['./add-recauda.component.css'],
})
export class AddRecaudaComponent implements OnInit {
  filtrar: string;
  _sincobro: any[] = [];
  _cliente: any;
  _formasCobro: any;
  f_buscar: FormGroup;
  f_cobrar: FormGroup;
  formColores: FormGroup;
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
  addRubro: any[] = [];
  _clientes: any[] = [];
  ordenColumna: keyof SinCobrarVisual = 'idabonado';
  ordenAscendente: boolean = true;
  @ViewChild('consultaModal') consultaModal!: ElementRef;
  //_mensaje: any;
  constructor(
    private fb: FormBuilder,
    private ms_recaudacion: RecaudacionService,
    private s_cliente: ClientesService,
    private loadingService: LoadingService,
    private s_formacobro: FormacobroService,
    private authService: AutorizaService,
    private s_cajas: CajaService,
    private s_recaudaxcaja: RecaudaxcajaService,
    private router: Router,
    private coloresService: ColoresService
  ) {}

  ngOnInit(): void {
    console.log(this.authService.sessionlog);
    /*     if (!this.authService.sessionlog) {
      this.router.navigate(['/inicio']);
    } */
    sessionStorage.setItem('ventana', '/abonados');
    let coloresJSON = sessionStorage.getItem('/abonados');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();
    this.f_buscar = this.fb.group({
      cuenta: '',
      identificacion: '',
    });
    this.f_cobrar = this.fb.group({
      idformacobro: 1,
      acobrar: this.totalapagar,
      ncvalor: '',
      dinero: '',
      vuelto: '',
    });
    var t: Colores = new Colores();
    var c: Colores = new Colores();
    this.formColores = this.fb.group({
      tonos0: t,
      colores0: c,
      tonos1: t,
      colores1: t,
    });
    this.getAllFormaCobro();
    this.getEstadoCaja();
  }
  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, 'abonados');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/abonados', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  getEstadoCaja() {
    this.ms_recaudacion.testConnection(this.authService.idusuario).subscribe({
      next: async (item: any) => {
        this._estadoCaja = item;
        let caja = await this.s_cajas
          .getByIdUsuario(this.authService.idusuario)
          .toPromise();
        if (item.estado === 1) {
          this.swcaja = true;
          this.abrirCaja.usuario = item.username;
          this.abrirCaja.nrofactura = `${item.establecimiento}-${item.codigo}-${item.secuencial}`;
          this.abrirCaja.establecimiento = item.establecimiento;
        } else {
          /* generar una consulta para traer user name de  */
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
          this.swal('info', item.mensaje);
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
    let f = this.f_buscar.value;
    if (f.cuenta != '') {
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
    } else {
      const modal = new bootstrap.Modal(this.consultaModal.nativeElement);
      modal.show();
      this.s_cliente.getByIdentificacion(f.identificacion).subscribe({
        next: (clientes: any) => {
          this._clientes = clientes;
        },
        error: (e: any) => console.error(e.error),
      });
    }
  }
  txtCuenta(e: any) {
    this.swBuscar = false;
    this.f_buscar.patchValue({
      identificacion: '',
    });
  }
  txtIdentificacion(e: any) {
    this.swBuscar = false;
    this.f_buscar.patchValue({
      cuenta: '',
    });
  }
  buscarCuentasOfCliente(cliente: any) {}
  async getSinCobro(cuenta: number) {
    this.loadingService.showLoading();
    this._sincobro = [];
    this.totalapagar = 0;
    this.ms_recaudacion
      .getSincobroByCuenta(cuenta)
      .then((sincobro: any) => {
        if (sincobro.length > 0) {
          this._sincobro = [...sincobro];
          this.getClienteById(sincobro[0].idcliente);
        } else {
          this.swal('warning', 'No tiene valores pendientes');
        }
        this.loadingService.hideLoading();
      })
      .catch((e: any) => {
        console.error(e);
        this.loadingService.hideLoading();
      });
  }
  async getCliente(cliente: any) {
    this.loadingService.showLoading();
    this.f_buscar.reset();
    this._sincobro = [];
    this.totalapagar = 0;
    this.ms_recaudacion
      .getSincobroByCliente(cliente.idcliente)
      .then((sincobro: any) => {
        this._sincobro = [...sincobro];
        this.getClienteById(cliente.idcliente);
        this.loadingService.hideLoading();
      })
      .catch((e: any) => {
        console.error(e);
        this.loadingService.hideLoading();
      });
  }
  swSincobro() {
    if (this._sincobro.length > 0) {
      return true;
    }
    return false;
  }
  validarCampo(campo: any) {
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
    this.addRubro = [];
    this.idfactura = idfactura;
    this.detalleFac = true;
    let _fac = this._sincobro.find(
      (fact: { idfactura: any }) => fact.idfactura === idfactura
    );
    let iva: any = {
      cantidad: 1,
      idrubro_rubros: { descripcion: 'Iva' },
      valorunitario: 0.0,
      estado: 1,
    };
    let interes: any = {
      cantidad: 1,
      idrubro_rubros: { descripcion: 'Intereses' },
      valorunitario: 0.0,
      estado: 1,
    };
    if (_fac.interes > 0) {
      interes.valorunitario = _fac.interes;
      this.addRubro.push(interes);
    }
    if (_fac.iva > 0) {
      iva.valorunitario = _fac.iva;
      this.addRubro.push(iva);
    }
    // this.addRubro = [...interes, iva];
  }
  cancelarDetalle(e: any) {
    this.detalleFac = e;
  }
  calcular(e: any, factura: any) {
    const checked = !!e.target?.checked;

    // Asegurar que fencola es un array
    if (!Array.isArray(this.fencola)) {
      this.fencola = [];
    }

    if (checked) {
      // Evitar duplicados
      const exists = this.fencola.some(
        (f: any) => f.idfactura === factura.idfactura
      );
      if (!exists) {
        this.fencola.push(factura);
      }
    } else {
      // Buscar por igualdad (===), no por asignación
      const idx = this.fencola.findIndex(
        (f: any) => f.idfactura === factura.idfactura
      );
      if (idx !== -1) {
        this.fencola.splice(idx, 1);
      }
    }

    // Recalcular total una sola vez (asegurando conversión a Number)
    this.totalapagar = this.fencola.reduce((acc: number, f: any) => {
      const t = Number(f.total || 0);
      const inter = Number(f.interes || 0);
      const iva = Number(f.iva || 0);
      return acc + t + inter + iva;
    }, 0);

    // Patchear el formulario solo una vez
    this.f_cobrar.patchValue({
      acobrar: Number(this.totalapagar.toFixed(2)),
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
  ordenarPor(campo: keyof SinCobrarVisual): void {
    if (this.ordenColumna === campo) {
      this.ordenAscendente = !this.ordenAscendente;
    } else {
      this.ordenColumna = campo;
      this.ordenAscendente = true;
    }

    this._sincobro.sort((a: any, b: any) => {
      const valorA = a[campo];
      const valorB = b[campo];

      if (valorA == null && valorB == null) return 0;
      if (valorA == null) return 1;
      if (valorB == null) return -1;

      const esNumero = typeof valorA === 'number' && typeof valorB === 'number';

      if (esNumero) {
        return this.ordenAscendente ? valorA - valorB : valorB - valorA;
      } else {
        return this.ordenAscendente
          ? String(valorA).localeCompare(String(valorB))
          : String(valorB).localeCompare(String(valorA));
      }
    });
  }

  /* CONTROLAR LA FOMRA DE COBRO PARA VALIDAR LAS NOTAS DE CREDITO */

  formaDeCobro(e: any) {
    console.log(e.target.value);
    let idformacobro = +this.f_cobrar.value.idformacobro!;
    if (idformacobro === 3) {
    }
  }
}
interface SinCobrarVisual {
  idabonado: number;
}
