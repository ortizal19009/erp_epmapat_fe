import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Certificaciones } from 'src/app/modelos/ccertificaciones';
import { Clientes } from 'src/app/modelos/clientes';
import { Facturas } from 'src/app/modelos/facturas.model';
import { Modulos } from 'src/app/modelos/modulos.model';
import { TpCertifica } from 'src/app/modelos/tp-certifica';
import { CertificacionesService } from 'src/app/servicios/ccertificaciones.service';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { TpCertificaService } from 'src/app/servicios/tp-certifica.service';

@Component({
  selector: 'app-add-certificaciones',
  templateUrl: './add-certificaciones.component.html',
  styleUrls: ['add-certificaciones.component.css'],
})
export class AddCertificacionesComponent implements OnInit {
  swvalido = 1; //Búsqueda de Clientes
  privez = true; //Para resetear los datos de Búsqueda de Clientes
  formBusClientes: FormGroup; //Formulario para buscar Clientes del Modal
  certificaciones: Certificaciones = new Certificaciones();
  tpcertifica: TpCertifica = new TpCertifica();
  formCertificacion: FormGroup;
  f_factura: FormGroup;
  _clientes: any;
  filtro: string;
  _tpcertifica: any;
  _facturas: any;
  v_factura: any;
  modulo: Modulos = new Modulos();
  date: Date = new Date();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private tpcertificaS: TpCertificaService,
    private certificacionesS: CertificacionesService,
    private facService: FacturaService,
    private clieService: ClientesService,
    private authService: AutorizaService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/ccertificaciones');
    let coloresJSON = sessionStorage.getItem('/ccertificaciones');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

    let date: Date = new Date();
    let tpcertifica: TpCertifica = new TpCertifica();

    this.formCertificacion = this.fb.group({
      // numero: '',
      // anio: '',
      // referenciadocumento: ['', Validators.required],
      nomcli: ['', Validators.required],
      nrofactura: ['', Validators.required],
      idtpcertifica_tpcertifica: [tpcertifica, Validators.required],
      // idtpcertifica_tpcertifica: '',
      // idfactura_facturas: this.v_factura,
      usucrea: 1,
      feccrea: date,
    });

    //Formulario de Busqueda de Clientes (Modal)
    this.formBusClientes = this.fb.group({
      nombre_identifica: [null, [Validators.required, Validators.minLength(5)]],
    });
    this.f_factura = this.fb.group({
      nrofactura: ['', [Validators.required, Validators.minLength(5)]],
    });

    this.listarTpCerifica();
    this.getUltimaCertificacion();
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  onSubmit() {
    // this.guardarCertificacion();
    // this.formCertificacion.value.idfactura_facturas = this.v_factura;
    this.tpcertifica.idtpcertifica =
      this.formCertificacion.value.idtpcertifica_tpcertifica;
    this.certificaciones.idtpcertifica_tpcertifica = this.tpcertifica;
    this.certificaciones.anio = this.date.getFullYear();
    this.certificaciones.usucrea =  this.authService.idusuario;
    this.certificaciones.feccrea = this.date;
    this.certificacionesS.saveCertificaciones(this.certificaciones).subscribe({
      next: (datos) => {
        this.regresar();
      },
      error: (err) =>
        console.error('Al guardar la nueva Certificación: ', err.error),
    });
  }

  clientesModal() {
    this.swvalido = 1;
    if (this.privez) {
      this.privez = false;
    } else {
      this.formBusClientes.reset();
    }
  }
  facturaModal() {
    this.swvalido = 1;
    if (this.privez) {
      this.privez = false;
    } else {
      this.formBusClientes.reset();
    }
  }

  buscarClientes() {
    if (
      this.formBusClientes.value.nombre_identifica != null &&
      this.formBusClientes.value.nombre_identifica != ''
    ) {
      this.clieService
        .getByNombreIdentifi(this.formBusClientes.value.nombre_identifica)
        .subscribe({
          next: (datos) => {
            this._clientes = datos;
          },
          error: (err) => console.error(err.error),
        });
    }
  }

  selecCliente(cli: Clientes) {
    this.formCertificacion.controls['nomcli'].setValue(cli.nombre);
    this.certificaciones.idcliente_clientes = cli;
  }

  buscarFactura() {
    this.facService
      .getByNrofactura(this.f_factura.value.nrofactura)
      .subscribe({
        next: (datos: any) => {
          this._facturas = datos;
          this.modulo = datos.idmodulo;
        },
        error:(e: any) => console.error(e),
      });
  }
  selectFactura(factura: any) {
    this.formCertificacion.controls['nrofactura'].setValue(factura.nrofactura);
    this.certificaciones.idfactura_facturas = factura;
  }
  pagado(valor: number) {
    if (valor === 1) {
      return 'SI';
    } else {
      return 'NO';
    }
  }

  listarTpCerifica() {
    this.tpcertificaS.getListaTpCertifica().subscribe({
      next: (datos) => {
        this._tpcertifica = datos;
        this.formCertificacion.patchValue({ idtpcertifica_tpcertifica: 1 });
      },
      error: (err) =>
        console.error('Al recuperar los Tipos de Certificaciones: ', err.error),
    });
  }

  get f() {
    return this.formCertificacion.controls;
  }

  regresar() {
    this.router.navigate(['ccertificaciones']);
  }

  guardarCertificacion() {
    this.formCertificacion.value.idfactura_facturas = this.v_factura;
    this.certificacionesS
      .saveCertificaciones(this.formCertificacion.value)
      .subscribe(
        (datos) => {
          this.regresar();
        },
        (error) => console.error(error)
      );
  }
  getUltimaCertificacion() {
    this.certificacionesS.ultima().subscribe({
      next: (datos) => {
        this.certificaciones.numero = datos.numero + 1;
      },
      error: (e) => console.error(e),
    });
  }

  // buscarFacturas() {
  //   let i_factura = document.getElementById("buscarFactura") as HTMLInputElement;
  //   let inFacturas = document.getElementById("idi-facturas") as HTMLElement;
  //   let p_message = document.createElement("span");
  //   p_message.style.color = "red";
  //   inFacturas.appendChild(p_message);
  //   i_factura.addEventListener('keyup', () => {
  //     if (i_factura.value === '') {
  //       i_factura.style.border = "#F54500 1px solid";
  //       p_message.innerHTML = "<strong>Error!.</strong>  El campo de texto no puede estar vacio</br>";
  //     } else {
  //       i_factura.style.border = "";
  //       p_message.remove();
  //     }
  //   });
  //   if (i_factura.value === '') {
  //     i_factura.style.border = "#F54500 1px solid";
  //     p_message.innerHTML = "<strong>Error!.</strong>  El campo de texto no puede estar vacio</br>";
  //     this.facturas = [];
  //   } else if (i_factura.value != '') {
  //     i_factura.style.border = "";
  //     this.facService.getListaByNroFactura(this.f_facturas.value.buscarFactura).subscribe(datos => {
  //       this.facturas = datos;
  //     });
  //     p_message.remove();
  //   }
  // }

  // obtenerValorFactura(factura: Facturas) {
  //   let idfactura_facturas = document.getElementById("idfactura_facturas") as HTMLInputElement;
  //   idfactura_facturas.value = factura.nrofactura.toString();
  //   this.v_factura = factura;
  // }
}
