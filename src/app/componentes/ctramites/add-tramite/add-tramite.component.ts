import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Clientes } from 'src/app/modelos/clientes';
import { LiquidaTramite } from 'src/app/modelos/liquida-tramite';
import { TpTramite } from 'src/app/modelos/tp-tramite';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { LiquidaTramiteService } from 'src/app/servicios/liquida-tramite.service';
import { RubroAdicionalService } from 'src/app/servicios/rubro-adicional.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { TpTramiteService } from 'src/app/servicios/tp-tramite.service';
import { TramitesService } from 'src/app/servicios/ctramites.service';

@Component({
  selector: 'app-add-tramite',
  templateUrl: './add-tramite.component.html',
})
export class AddTramiteComponent implements OnInit {
  f_tramites: FormGroup;
  f_clientes: FormGroup;
  f_factura: FormGroup;
  f_liquidatramite: FormGroup;
  f_rubxfac: FormGroup;
  v_tptramites: any;
  cliente: any;
  v_cliente: any;
  v_valortramite: number = 0;
  v_servadmin: number = 0;
  v_valorotro: number = 0;
  v_descuento: number = 0;
  v_subtotal: number = 0;
  v_iva: number = 0;
  v_total: number = 0;
  filterTerm: string;
  rubxfac: any = {};
  ultimaf: any;
  v_rubros: any = [];
  v_modulo: any;

  constructor(
    private s_tramites: TramitesService,
    private router: Router,
    private s_clientes: ClientesService,
    private s_tptramites: TpTramiteService,
    private fb: FormBuilder,
    private s_facturas: FacturaService,
    private s_liquidatramites: LiquidaTramiteService,
    private s_rubroxfac: RubroxfacService,
    private s_rubroadicional: RubroAdicionalService,
    private authService: AutorizaService
  ) {}

  ngOnInit(): void {
    let date: Date = new Date();
    let tptramite: TpTramite = new TpTramite();
    tptramite.idtptramite = 1;
    setTimeout(() => {
      let o_tptramite = document.getElementById(
        'id-tpt' + tptramite.idtptramite
      ) as HTMLElement;
      o_tptramite.setAttribute('selected', '');
    }, 500);
    this.f_tramites = this.fb.group({
      estado: 1,
      total: ['', Validators.required],
      descripcion: ['', Validators.required],
      cuotas: 1,
      validohasta: ['', Validators.required],
      idtptramite_tptramite: { idtptramite: tptramite.idtptramite },
      idcliente_clientes: ['', Validators.required],
      usucrea: this.authService.idusuario,
      feccrea: date,
    });
    this.f_clientes = this.fb.group({
      buscarCliente: ['', Validators.required],
    });
    this.f_factura = this.fb.group({
      idmodulo: [''],
      idcliente: [''],
      nrofactura: null,
      idabonado: { idabonado: 0 },
      porcexoneracion: 0,
      razonexonera: null,
      totaltarifa: ['', Validators.required],
      pagado: 0,
      valorbase: null,
      usuariocobro: null,
      fechacobro: null,
      estado: ['', Validators.required],
      usuarioanulacion: null,
      razonanulacion: null,
      fechaanulacion: null,
      usuarioeliminacion: null,
      fechaeliminacion: null,
      razoneliminacion: null,
      conveniopago: 0,
      fechaconvenio: null,
      estadoconvenio: 0,
      formapago: 1,
      refeformapago: null,
      horacobro: null,
      usuariotransferencia: null,
      fechatransferencia: null,
      usucrea: [this.authService.idusuario, Validators.required],
      feccrea: ['', Validators.required],
      usumodi: this.authService.idusuario,
      fecmodi: null,
    });
    this.f_liquidatramite = this.fb.group({
      cuota: [''],
      valor: ['', Validators.required],
      usuarioeliminacion: [''],
      fechaeliminacion: [''],
      razoneliminacion: [''],
      estado: 1,
      observacion: ['', Validators.required],
      idtramite_tramites: '',
      idfactura_facturas: '',
      usucrea: this.authService.idusuario,
      feccrea: date,
    });
    this.f_rubxfac = this.fb.group({
      cantidad: 1,
      valorunitario: ['', Validators.required],
      estado: 1,
      idfactura_facturas: ['', Validators.required],
      idrubro_rubros: ['', Validators.required],
    });
    this.listarTpTramites();
    this.obtenerRubrosByTpTramite();
    this.sumaValores();
  }

  listarTpTramites() {
    this.s_tptramites.getListaTpTramite().subscribe(
      (datos) => {
        this.v_tptramites = datos;
      },
      (error) => console.log(error)
    );
  }

  onSubmit() {
    this.sumaValores();
    let ultimoTramite: any;
    this.f_tramites.value.idcliente_clientes = this.cliente;
    this.generarLiquidacionTramite();
    this.s_tramites.saveTramite(this.f_tramites.value).subscribe(
      (datos) => {
        this.f_liquidatramite.value.idtramite_tramites = datos;
        this.generarFactura();
        this.retornarListarTramties();
      },
      (error) => console.log(error)
    );
    setTimeout(() => {
      this.s_facturas.saveFactura(this.f_factura.value).subscribe(
        (datos) => {
          this.ultimaf = datos;
          setTimeout(() => {
            this.s_tramites.getListaTramites().subscribe(
              (datos) => {
                ultimoTramite = datos[datos.length - 1];
              },
              (error) => console.log(error)
            );
            setTimeout(() => {
              this.f_liquidatramite.value.idfactura_facturas = this.ultimaf;
              this.s_liquidatramites
                .saveLiquidaTramite(this.f_liquidatramite.value)
                .subscribe(
                  (datos) => {
                    this.generarRubroxFac(this.ultimaf);
                  },
                  (error) => console.log(error)
                );
            }, 500);
          }, 500);
        },
        (error) => console.log(error)
      );
    }, 500);
  }

  retornarListarTramties() {
    this.router.navigate(['/tramites']);
  }

  /*   buscarCliente() {
    let i_cliente = document.getElementById(
      'buscarCliente'
    ) as HTMLInputElement;
    let inClientes = document.getElementById('idi-cliente') as HTMLElement;
    let p_message = document.createElement('span');
    p_message.style.color = 'red';
    inClientes.appendChild(p_message);
    i_cliente.addEventListener('keyup', () => {
      if (i_cliente.value === '') {
        i_cliente.style.border = '#F54500 1px solid';
        p_message.innerHTML = 'El campo de búsqueda no puede estar vacio</br>';
      } else {
        i_cliente.style.border = '';
        p_message.remove();
      }
    });
    if (i_cliente.value === '') {
      i_cliente.style.border = '#F54500 1px solid';
      p_message.innerHTML = 'El campo de búsqueda no puede estar vacio</br>';
    } else {
      i_cliente.style.border = '';
      // this.s_clientes.getByDato(this.f_clientes.value.buscarCliente).subscribe(datos => {
      //   this.v_cliente = datos;
      // });
    }
  } */

  obtenerValoresClientes(clientes: Clientes) {
    let i_cliente = document.getElementById(
      'idcliente_clientes'
    ) as HTMLInputElement;
    i_cliente.value = clientes.nombre.toString();
    this.cliente = clientes;
  }

  generarFactura() {
    let date: Date = new Date();
    this.f_factura.setValue({
      idmodulo: this.v_modulo,
      idcliente: {
        idcliente: this.f_tramites.value.idcliente_clientes.idcliente,
      },
      nrofactura: null,
      idabonado: { idabonado: 1 },
      porcexoneracion: 0.0,
      razonexonera: null,
      totaltarifa: this.f_tramites.value.total,
      pagado: 0,
      valorbase: 1,
      usuariocobro: null,
      fechacobro: null,
      estado: 1,
      usuarioanulacion: null,
      razonanulacion: null,
      fechaanulacion: null,
      usuarioeliminacion: null,
      fechaeliminacion: null,
      razoneliminacion: null,
      conveniopago: 0,
      fechaconvenio: null,
      estadoconvenio: 0,
      formapago: 1,
      refeformapago: null,
      horacobro: null,
      usuariotransferencia: null,
      fechatransferencia: null,
      usucrea: this.authService.idusuario,
      feccrea: date,
      usumodi: this.authService.idusuario,
      fecmodi: null,
    });
  }

  generarLiquidacionTramite() {
    let date: Date = new Date();
    this.f_liquidatramite.setValue({
      cuota: +this.f_tramites.value.cuotas!,
      valor: this.f_tramites.value.total,
      usuarioeliminacion: 1,
      fechaeliminacion: date,
      razoneliminacion: 'null',
      estado: 1,
      observacion: '',
      idtramite_tramites: '',
      idfactura_facturas: '',
      usucrea: this.authService.idusuario,
      feccrea: date,
    });
  }

  generarRubroxFac(factura: any) {
    let i = 0;
    this.v_rubros.forEach(() => {
      this.f_rubxfac.setValue({
        cantidad: 1,
        valorunitario: this.v_rubros[i].valor,
        estado: 1,
        idfactura_facturas: factura,
        idrubro_rubros: { idrubro: this.v_rubros[i].idrubro },
      });
      this.s_rubroxfac.saveRubroxfac(this.f_rubxfac.value).subscribe({
        next: (datos) => {},
        error: (err) => console.log(err.error),
      });
      i++;
    });
  }

  obtenerRubrosByTpTramite() {
    let s_tptramite = document.getElementById(
      'idtptramite_tptramite'
    ) as HTMLSelectElement;
    this.s_rubroadicional.getRubAdiByIdTpTram(1).subscribe(
      (datos) => {
        this.v_modulo = datos[0].idrubro_rubros.idmodulo_modulos;
        let i = 0;
        datos.forEach(() => {
          if (datos[i].rubroprincipal === 0) {
            this.rubxfac = {
              idrubro: datos[i].idrubro_rubros.idrubro,
              descripcion: datos[i].idrubro_rubros.descripcion,
              valor: datos[i].idrubro_rubros.valor,
            };
            this.v_rubros.push(this.rubxfac);
          } else {
            this.rubxfac = {
              idrubro: datos[i].idrubro_rubros.idrubro,
              descripcion: datos[i].idrubro_rubros.descripcion,
              valor: datos[i].valor,
            };
            this.v_rubros.push(this.rubxfac);
          }
          i++;
        });
        setTimeout(() => {
          this.sumaValores();
        }, 300);
      },
      (error) => console.log(error)
    );
    s_tptramite.addEventListener('change', () => {
      this.rubxfac = {};
      this.v_rubros = [];
      this.f_tramites.value.idtptramite_tptramite = {
        idtptramite: +s_tptramite.value!,
      };
      this.s_rubroadicional.getRubAdiByIdTpTram(+s_tptramite.value!).subscribe(
        (datos) => {
          if (datos.length != 0) {
            this.v_modulo = datos[0].idrubro_rubros.idmodulo_modulos;
            let i = 0;
            datos.forEach(() => {
              if (datos[i].rubroprincipal === 0) {
                this.rubxfac = {
                  idrubro: datos[i].idrubro_rubros.idrubro,
                  descripcion: datos[i].idrubro_rubros.descripcion,
                  valor: datos[i].idrubro_rubros.valor,
                };
                this.v_rubros.push(this.rubxfac);
              } else {
                this.rubxfac = {
                  idrubro: datos[i].idrubro_rubros.idrubro,
                  descripcion: datos[i].idrubro_rubros.descripcion,
                  valor: datos[i].valor,
                };
                this.v_rubros.push(this.rubxfac);
              }
              i++;
            });
          }
        },
        (error) => console.log(error)
      );
      setTimeout(() => {
        this.sumaValores();
      }, 300);
    });
  }

  addValor(rubro: any) {
    let rid = document.getElementById('r' + rubro.idrubro) as HTMLInputElement;
    let i = 0;
    this.v_rubros.forEach(() => {
      if (this.v_rubros[i].idrubro === rubro.idrubro) {
        this.v_rubros[i].valor = +rid.value!;
      }
      i++;
    });
    this.sumaValores();
  }

  sumaValores() {
    let total = document.getElementById('total') as HTMLInputElement;
    let subtotal = document.getElementById('subtotal') as HTMLInputElement;
    let suma = 0;
    let iva = 0;
    let i = 0;
    this.v_rubros.forEach(() => {
      suma += +this.v_rubros[i].valor!;
      if (this.v_rubros[i].descripcion === 'Iva') {
        iva = +this.v_rubros[i].valor!;
      }
      i++;
    });
    total.value = suma.toString();
    subtotal.value = (suma - iva).toString();
    this.f_tramites.value.total = suma;
  }
  setCliente(e: any) {
    console.log(e);
    this.cliente = e;
    this.f_tramites.patchValue({
      idcliente_clientes: e,
    });
  }
}
