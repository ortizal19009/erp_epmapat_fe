import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Clientes } from 'src/app/modelos/clientes';
import { Modulos } from 'src/app/modelos/modulos.model';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { LiquidaTramite1Service } from 'src/app/servicios/liquida-tramite1.service';
import { ModulosService } from 'src/app/servicios/modulos.service';
import { RubrosService } from 'src/app/servicios/rubros.service';
import { RubrosxtramiteService } from 'src/app/servicios/rubrosxtramite.service';
import { Servicios1Service } from 'src/app/servicios/servicios1.service';
import { Tramites1Service } from 'src/app/servicios/tramites1.service';

@Component({
   selector: 'app-add-tramites1',
   templateUrl: './add-tramites1.component.html'
})

export class AddTramites1Component implements OnInit {
   f_tramite: FormGroup;
   f_clientes: FormGroup;
   f_abonados: FormGroup;
   f_factura: FormGroup;
   f_liquidatramite: FormGroup;
   f_buscarservicios: FormGroup;
   f_listaTramites: FormGroup;
   f_rubxtramite: FormGroup;
   v_cliente: any;
   v_abonado: any;
   v_tramites: any;
   v_modulos: any;
   v_servicios: any;
   v_rubros: any;
   val_cliente: any;
   arr_rubro: any = [];
   tp_servicios: boolean = true;
   t_servicios: boolean = true;
   v_total: number = 0;
   v_idtramite: number;
   v_idfactura: number;
   v_modulo: any;
   informacionTramite: boolean = false;
   informacionCliente: boolean = false;
   filterTerm: string;

   constructor(private router: Router,
      private s_clientes: ClientesService,
      private s_abonados: AbonadosService,
      private fb: FormBuilder,
      private s_modulos: ModulosService,
      private s_servicios: Servicios1Service,
      private s_rubro: RubrosService,
      private s_tramites1: Tramites1Service,
      private s_facturas: FacturaService,
      private s_liquidaTramite: LiquidaTramite1Service,
      private s_rubxtramite: RubrosxtramiteService) { }

   ngOnInit(): void {

      let date = new Date();
      this.f_tramite = this.fb.group({
         valor: this.v_total,
         descripcion: ['', Validators.required],
         idcliente_clientes: ['', Validators.required],
         idabonado_abonados: { idabonado: 0 },
         fecha: date,
         validohasta: ['', Validators.required],
         usucrea: 1,
         feccrea: date
      });
      this.f_clientes = this.fb.group({
         buscarCliente: ['', Validators.required]
      });
      this.f_abonados = this.fb.group({
         buscarAbonado: ['', Validators.required]
      });
      let modulos: Modulos = new Modulos();
      modulos.idmodulo = 50;
      setTimeout(() => {
         let o_modulos = document.getElementById("bs-" + modulos.idmodulo) as HTMLSelectElement;
         o_modulos.setAttribute('selected', '');
      }, 400);
      this.f_buscarservicios = this.fb.group({
         modulos: modulos,
      });
      this.f_factura = this.fb.group({
         idmodulo: '',
         idcliente: ['', Validators.required],
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
         usucrea: ['', Validators.required],
         feccrea: ['', Validators.required],
         usumodi: null,
         fecmodi: null
      });
      this.f_liquidatramite = this.fb.group({
         cuota: [''],
         valor: ['', Validators.required],
         usuarioeliminacion: [''],
         fechaeliminacion: [''],
         razoneliminacion: [''],
         estado: 1,
         observacion: ['', Validators.required],
         idtramite_tramites1: '',
         idfactura_facturas: '',
         usucrea: 1,
         feccrea: date
      });
      this.f_rubxtramite = this.fb.group({
         idtramite_tramites: ['', Validators.required],
         idrubro_rubros: ['', Validators.required],
         cantidad: 1,
         valor: ['', Validators.required],
      })
      this.listarModulos();
   }

   onSubmit() {
      let i_cliente = document.getElementById("idcliente_clientes") as HTMLInputElement;
      if (i_cliente.value == '' || this.arr_rubro == '') {
         this.informacionTramite = true;
         setTimeout(() => {
            this.informacionTramite = false;
         }, 3000);
      } else {
         this.guardarTramite();
         this.sumaTotal();
         this.retornarListarTramite();
      }
   }

   guardarTramite() {
      this.f_tramite.value.idcliente_clientes = this.val_cliente;
      this.f_tramite.value.idabonado_abonados = this.f_tramite.value.idabonado_abonados[0];
      this.s_tramites1.saveTramites1(this.f_tramite.value).subscribe(datos => {
         this.generarFactura();
         setTimeout(() => {
            this.obtenerUltimoTramite();
            this.obtenerUltimaFactura();
         }, 400);
      }, error => console.log(error));
   }

   guardarFactura() {
      this.s_facturas.saveFactura(this.f_factura.value).subscribe(datos => {
      })
   }

   guardarLiquidaTramite() {
      this.s_liquidaTramite.saveLiquidaTramite1(this.f_liquidatramite.value).subscribe(datos => {
      }, error => console.log(error));
   }

   guargarRubros() {
      let i = 0;
      this.arr_rubro.forEach(() => {
         this.f_rubxtramite.setValue({
            idtramite_tramites: { idtramite: this.v_idtramite },
            idrubro_rubros: this.arr_rubro[i],
            cantidad: 1,
            valor: this.arr_rubro[i].valor
         })
         this.s_rubxtramite.saveRubrosxTramie(this.f_rubxtramite.value).subscribe(datos => {
         }, error => console.log(error));
         i++;
      })
   }

   sumaTotal() {
      let i = 0;
      let suma = 0;
      let i_total = document.getElementById("total") as HTMLInputElement;
      this.arr_rubro.forEach(() => {
         suma += this.arr_rubro[i].valor;
         i++;
      });
      this.f_tramite.value.valor = suma;
      i_total.value = suma.toString();
   }

   obtenerUltimoTramite() {
      this.s_tramites1.getListaTramites1().subscribe(datos => {
         let listaTramites = datos;
         let maxId: number[] = [];
         listaTramites.forEach(function (m: any) {
            maxId.push(m.idtramite);
         });
         this.v_idtramite = Math.max.apply(null, maxId);
         this.guargarRubros();
      }, error => console.log(error));
   }

   obtenerUltimaFactura() {
      this.s_facturas.getListaFacturas().subscribe(datos => {
         let listaFacturas = datos;
         let maxId: number[] = [];
         listaFacturas.forEach(function (m: any) {
            maxId.push(m.idfactura);
         });
         this.v_idfactura = Math.max.apply(null, maxId);
         this.generarLiquidacionTramite();
         this.guardarLiquidaTramite();
      }, error => console.log(error));
   }

   listarModulos() {
      this.s_modulos.getTwoModulos().subscribe(datos => {
         this.v_modulos = datos;
         this.listarServicios();
      }, error => console.log(error));
   }

   listarServicios() {
      let s_modulos = document.getElementById("modulos") as HTMLSelectElement;
      this.s_servicios.getByIdModulo(50).subscribe(datos => {
         this.v_servicios = datos;
         this.v_modulo = { idmodulo: 50 };
      }, error => console.log(error));
      s_modulos.addEventListener('change', () => {
         let v_modulo = s_modulos.value;
         if (+v_modulo! === 50) {
            this.v_modulo = { idmodulo: 50 };
            this.t_servicios = true;
            this.tp_servicios = true;
            this.arr_rubro = [];
            this.s_servicios.getByIdModulo(+v_modulo!).subscribe(datos => {
               this.v_servicios = datos;
            }, error => console.log(error));
         } else if (+v_modulo! === 23) {
            this.v_modulo = { idmodulo: 23 };
            this.t_servicios = false;
            this.tp_servicios = false;
            this.arr_rubro = [];
            this.s_rubro.getByIdmodulo(+v_modulo!).subscribe(datos => {
               this.v_rubros = datos;
            }, error => console.log(error));
         }
      });
   }

   buscarCliente() {
      let i_cliente = document.getElementById("buscarCliente") as HTMLInputElement;
      if (i_cliente.value === '') {
         this.informacionCliente = true;
         setTimeout(() => {
            this.informacionCliente = false;
         }, 3000);
      } else {
         // this.s_clientes.getByDato(this.f_clientes.value.buscarCliente).subscribe(datos => {
         //    this.v_cliente = datos;
         // }, error => console.log(error))
      }
   }

   obtenerValoresClientes(cliente: Clientes) {
      let i_cliente = document.getElementById("idcliente_clientes") as HTMLInputElement;
      i_cliente.value = cliente.nombre.toString();
      let c_cliente = cliente.cedula;
      this.val_cliente = cliente;
      this.s_abonados.getListaByidentIficacionCliente(c_cliente.toString()).subscribe(datos => {
         this.v_abonado = datos;
      }, error => console.log(error));
   }

   obtenerServicios(event: any) {
      if (event.target.checked) {
         let num: number = event.target.value;
         this.s_servicios.getListaById(num).subscribe(datos => {
            this.arr_rubro.push(datos);
         }, error => console.log(error));
      } else {
         let num: number = event.target.value;
         let arr = this.arr_rubro;
         let result = arr.find((result: { idservicio: any }) => result.idservicio == num);
         let index = arr.indexOf(result);
         arr.splice(index, 1);
      }
   }

   selRubros(event: any) {
      let num = (+event.target.id!)
      let rubros = this.arr_rubro;
      let result = rubros.find((result: { idrubro: any }) => result.idrubro == num);
      result.valor = (+event.target.value!);
      this.sumaTotal();
   }

   obtenerRubros(event: any) {
      if (event.target.checked) {
         let num: number = event.target.value;
         this.s_rubro.getRubroById(num).subscribe(datos => {
            this.arr_rubro.push(datos);
            this.sumaTotal();
         }, error => console.log(error));
      } else {
         let num: number = event.target.value;
         let arr = this.arr_rubro;
         let result = arr.find((result: { idrubro: any }) => result.idrubro == num);
         let index = arr.indexOf(result);
         arr.splice(index, 1);
         this.sumaTotal();
      }
   }

   generarFactura() {
      let date: Date = new Date();
      this.f_factura.setValue({
         idmodulo: this.v_modulo,
         idcliente: this.f_tramite.value.idcliente_clientes,
         nrofactura: null,
         idabonado: this.f_tramite.value.idabonado_abonados,
         porcexoneracion: 0,
         razonexonera: null,
         totaltarifa: this.f_tramite.value.valor,
         pagado: 0,
         valorbase: null,
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
         usucrea: 1,
         feccrea: date,
         usumodi: null,
         fecmodi: null
      });
      this.guardarFactura();
   }

   generarLiquidacionTramite() {
      let date: Date = new Date();
      let tramite = { idtramite: this.v_idtramite };
      let factura = { idfactura: this.v_idfactura };
      this.f_liquidatramite.setValue({
         cuota: 1,
         valor: this.f_tramite.value.valor,
         usuarioeliminacion: 1,
         fechaeliminacion: date,
         razoneliminacion: 'null',
         estado: 1,
         observacion: '',
         idtramite_tramites1: tramite,
         idfactura_facturas: factura,
         usucrea: 1,
         feccrea: date
      });
   }

   retornarListarTramite() {
      this.router.navigate(['/tramites1']);
   }

}
