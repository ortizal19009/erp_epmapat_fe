import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Convenios } from 'src/app/modelos/convenios.model';
import { Cuotas } from 'src/app/modelos/cuotas.model';
import { Facxconvenio } from 'src/app/modelos/facxconvenio.model';
import { Rubroxfac } from 'src/app/modelos/rubroxfac.model';
import { ConveniosComponent } from '../convenios/convenios.component';
import { Facturas } from 'src/app/modelos/facturas.model';
import { ConvenioService } from 'src/app/servicios/convenio.service';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { FacxconvenioService } from 'src/app/servicios/facxconvenio.service';
import { CuotasService } from 'src/app/servicios/cuotas.service';
import { FacturaService } from 'src/app/servicios/factura.service';

@Component({
   selector: 'app-add-convenio',
   templateUrl: './add-convenio.component.html'
})

export class AddConvenioComponent implements OnInit {
   /* modelos declarados */
   conv: Convenios = new Convenios();
   factura: Facturas = new Facturas();
   facxconv: Facxconvenio = new Facxconvenio();
   cuotas: Cuotas = new Cuotas();
   rubxfac: Rubroxfac = new Rubroxfac();
   /* formularios declarados */
   convForm: FormGroup;
   f_bFacxAbo: FormGroup;
   //f_cuotas: FormGroup;
   /* Variables booleanas */
   rtn: boolean = false;
   clientexfac: boolean = true;
   /* Arrays declarados */
   v_facturas: any = [];/* lista de facturas antiguas */
   rubros: any = [];
   c_rubros: any = [];
   g_cuotas: any = [];
   n_facturas: any = []; /* Lista de facturas nuevas */
   /* filter term */
   filterTerm: string;
   /* Variables tipo objetos */
   modulo: any = { idmodulo: 27 };
   buscaConv: any;
   cliente: any;
   v_convenios: any;
   v_cliente: any;
   l_facturas: any;
   v_abonado: any;
   newConvenio: any;
   newFactura: any;
   oldFacturas: any;
   /* variables tipo string */
   titleModal: string = "Seleccionar Cliente";
   clienteNombre: string;
   clienteIdentificacion: string;
   /* variables tipo numero */
   suma_facturas: number = 0;
   base: number = 0;
   c_inicial: number = 0;
   nropagos: number = 0;
   // ncuotas: number;
   v_pagos: number = 0;
   c_final: number = 0;
   n_cuotas = 2;
   dates = new Date();
   constructor(private parent: ConveniosComponent, private convService: ConvenioService, private facService: FacturaService,
      private fb: FormBuilder, private s_abonados: AbonadosService, private s_rubxfac: RubroxfacService,
      private facxconvService: FacxconvenioService, private s_cuota: CuotasService) { }

   ngOnInit(): void {
      this.f_bFacxAbo = this.fb.group({
         cuentaAbonado: ['', Validators.required]
      });
      /*     this.f_cuotas = this.fb.group({
            nrocuotas: '',
            idfactura: '',
            usucrea: 1,
            feccrea: this.dates,
            idconvenio_convenios: ''
          }) */

      this.porcentaje();
      this.ultimoNroConvenio();
   }

   onSubmit() {
      this.validaNumero();
      if (this.rtn === true) {
         // console.log(this.conv.nroconvenio)
      }
      else {
         this.guardar();
      }
   }

   guardar() {
      this.conv.feccrea = new Date();
      this.convService.saveConvenio(this.conv).subscribe({
         next: datos => {
            // console.log('this.convService.saveConvenio Ok!');
            this.newConvenio = datos;
            this.parent.listar();
            this.generarFacturas();
            setTimeout(() => {
               this.calculoByRubro(this.base, this.n_cuotas, this.n_facturas);
            }, 1000);
         },
         error: err => console.error(err.error)
      });
   }

   validaNumero() {
      this.convService.getNroconvenio(this.conv.nroconvenio).subscribe({
         next: datos => {
            let dat = datos;
            if (dat != null) {
               this.rtn = false;
               // } else if (this.conv.nroconvenio != datos[0].nroconvenio) {
            } else if (this.conv.nroconvenio != datos.nroconvenio) {
               this.rtn = false;
            } else {
               this.rtn = true;
               setTimeout(() => {
                  this.rtn = false;
               }, 3000);
            }
         },
         error: err => console.log(err.error)
      });
   }

   ultimoNroConvenio() {
      this.convService.getAll().subscribe(datos => {
         this.v_convenios = datos;
         this.conv.nroconvenio = datos[0].nroconvenio + 1;
      })
   }

   buscarFacxAbo() {
      this.base = 20;
      this.c_inicial = 0;
      this.nropagos = 0;
      this.v_pagos = 0;
      this.c_final = 0;
      this.v_facturas = [];
      this.suma_facturas = 0;
      let i_b = document.getElementById("cuentaAbonado") as HTMLInputElement;
      let b_b = document.getElementById("btn_buscar") as HTMLButtonElement;
      if (this.f_bFacxAbo.value.cuentaAbonado != '') {
         i_b.style.border = "";
         this.s_abonados.getListaByidabonado(this.f_bFacxAbo.value.cuentaAbonado).subscribe(datos => {
            this.v_abonado = datos;
            this.cliente = datos;
            this.clienteNombre = this.cliente[0].idcliente_clientes.nombre;
            this.clienteIdentificacion = this.cliente[0].idcliente_clientes.cedula;
         });
         this.facService.getFacturaByAbonado(this.f_bFacxAbo.value.cuentaAbonado).subscribe(datos => {
            this.l_facturas = datos;
            let i = 0;
            datos.forEach(() => {
               if (datos[i].pagado === 0) {
                  this.v_facturas.push(datos[i]);
                  this.suma_facturas += datos[i].totaltarifa;
               }
               i++;
            });
            this.calculoPrtjs(this.base);
            this.obtenerRubros();
         });
      }
      else {
         i_b.style.border = "1px red solid";
         setTimeout(() => {
            i_b.style.border = "";
         }, 2000)
      }
   }

   setValores() {
      this.conv.totalconvenio = this.suma_facturas;
      this.conv.cuotainicial = this.c_inicial;
      this.conv.cuotafinal = this.c_final;
   }

   calculoPrtjs(v_base: number) {
      this.g_cuotas = [];
      let i_nrocuota = document.getElementById("nrocuotas") as HTMLInputElement;
      i_nrocuota.value = "2";
      let t_facturas = this.suma_facturas;
      let c_individual = 0;
      let base = v_base / 100;
      let c_inicial = this.suma_facturas * base;
      this.c_inicial = c_inicial;
      let n_cuotas = this.n_cuotas;
      this.nropagos = n_cuotas - 1;
      c_individual = (t_facturas - c_inicial) / n_cuotas;
      this.v_pagos = c_individual;
      this.g_cuotas.push({ nrocuota: 1, valor: this.c_inicial });
      let o = 0;
      let nc = 2;
      for (let i = 0; i <= (n_cuotas - 2); i++) {
         o += c_individual
         this.g_cuotas.push({ nrocuota: nc, valor: this.v_pagos });
         nc++;
      }
      this.c_final = t_facturas - (o + c_inicial);
      i_nrocuota.oninput = () => {
         this.g_cuotas = [];
         n_cuotas = (+i_nrocuota.value!);
         this.n_cuotas = n_cuotas;
         this.nropagos = n_cuotas - 1;
         c_individual = (t_facturas - c_inicial) / n_cuotas;
         this.v_pagos = c_individual;
         this.g_cuotas.push({ nrocuota: 1, valor: this.c_inicial });
         let o = 0;
         let nc = 2;
         for (let i = 0; i <= (n_cuotas - 2); i++) {
            o += c_individual
            this.g_cuotas.push({ nrocuota: nc, valor: this.v_pagos });
            nc++;
         }
         this.c_final = t_facturas - (o + c_inicial);
      }
      this.g_cuotas.push({ nrocuota: nc, valor: this.c_final });
   }

   porcentaje() {
      let i_cuotaInicial = document.getElementById("cuotainicial") as HTMLInputElement;
      let cuotainicial = 0;
      i_cuotaInicial.oninput = () => {
         cuotainicial = (+i_cuotaInicial.value!);
         this.base = (cuotainicial * 100) / this.suma_facturas;
         this.calculoPrtjs(this.base);

      }
   }

   obtenerRubros() {
      let i = 0;
      let r: any = {};
      this.rubros = [];
      this.v_facturas.forEach(() => {

         this.s_rubxfac.getByIdfactura(this.v_facturas[i].idfactura).subscribe({
            next: datos => {
               let j = 0;
               datos.forEach(() => {
                  r = {
                     idrubro: datos[j].idrubro_rubros.idrubro,
                     descripcion: datos[j].idrubro_rubros.descripcion,
                     valorunitario: datos[j].valorunitario
                  }
                  let result = this.rubros.some((result: { idrubro: number }) => result.idrubro === r.idrubro)
                  if (result === false) {
                     this.rubros.push(r)
                  } else if (result === true) {
                     this.rubros[j].valorunitario += r.valorunitario;
                  }
                  j++;
               });
            },
            error: err => console.error(err.error)
         });

         i++;
      });
   }

   calculoByRubro(base: number, ncuotas: number, factura: any) {
      let r = {}
      let rubros = this.rubros;
      let i = 0;
      this.c_rubros = [];
      rubros.forEach(() => {
         let idrubro = rubros[i].idrubro;
         let descripcion = rubros[i].descripcion;
         let vi = rubros[i].valorunitario;
         let rci = (rubros[i].valorunitario) * (base / 100);
         let dvici = vi - rci
         let cuota = dvici / ncuotas;
         r = { idrubro: idrubro, descripcion: descripcion, valorunitario: rci, nrocuota: 1, nrofactura: factura[0] }
         this.c_rubros.push(r)
         let nc = 2;
         for (let j = 0; j < ncuotas; j++) {
            let c = cuota
            r = { idrubro: idrubro, descripcion: descripcion, valorunitario: c, nrocuota: nc, nrofactura: factura[j] }
            this.c_rubros.push(r)
            nc++;
         }
         let rcf = (vi - rci - (cuota * (ncuotas - 1)))
         i++;
      });
      setTimeout(() => {
         this.generarRubxFac(this.c_rubros);
      }, 1000);

   }

   generarFacturas() {
      let cuotas = this.g_cuotas;
      let i = 0;
      let j = 1
      cuotas.forEach(() => {
         this.setValoresFactura(cuotas[i].valor);
         // console.log('this.factura: ', this.factura);

         //this.setNroCuota(cuotas[i].nrocuota);
         /* aqui va el codigo para guardar una nueva factura  */

         this.facService.saveFactura(this.factura).subscribe(datos => {
            // console.log('this.facService.saveFactura Ok!');
            this.newFactura = datos;
            this.n_facturas.push(datos);
            this.cuotas.nrocuota = j;
            this.generarCuotas();
            j++
         });

         i++;
      });
      this.cambiarEstadoFacturasAntiguas();
   }

   setNroCuota(ncuota: number) {
      this.cuotas.nrocuota = ncuota;
   }

   setValoresFactura(tarifa: number) {
      this.factura.idcliente = this.cliente[0].idcliente_clientes;
      // console.log('this.v_abonado[0].idabonado: ', this.v_abonado[0].idabonado)
      this.factura.idabonado = this.v_abonado[0].idabonado;
      this.factura.totaltarifa = tarifa;
      this.factura.idmodulo = this.modulo;
      this.factura.pagado = 0;
      this.factura.porcexoneracion = 0;
      this.factura.conveniopago = 0;
      this.factura.estadoconvenio = 0;
      this.factura.usucrea = 1;
      this.factura.feccrea = this.dates;
      this.factura.formapago = 1;
      this.factura.valorbase = tarifa;
   }

   cambiarEstadoFacturasAntiguas() {
      let facturas = this.v_facturas;
      let i = 0;
      facturas.forEach(() => {
         facturas[i].conveniopago = this.conv.nroconvenio;
         facturas[i].estadoconvenio = this.conv.estado;
         facturas[i].fechaconvenio = this.dates;
         this.facService.updateFacturas(facturas[i]).subscribe(datos => {
            this.oldFacturas = datos;
            this.generarfxconvenio();

         });  /* AQUI VOY A ACTUALIZAR LAS VIEJAS FACTURAS PARA QUE TENGAN UN ESTADO DE PAGO 1 */
         i++;
      });
   }

   generarfxconvenio() {
      /* AQUI VAN LAS FACTURAS VIEJAS  */
      this.facxconv.idfactura_facturas = this.oldFacturas;
      this.facxconv.idconvenio_convenios = this.newConvenio;
      this.facxconvService.saveFacByConvenio(this.facxconv).subscribe({
         // next: datos => { },
         error: err => console.error(err.error)
      });
   }

   generarCuotas() {
      /* AQUI VAN LAS FACTURAS NUEVAS */
      this.cuotas.idfactura = this.newFactura;
      this.cuotas.idconvenio_convenios = this.newConvenio;
      this.cuotas.feccrea = this.dates;
      this.cuotas.usucrea = 1;
      this.s_cuota.saveCuotas(this.cuotas).subscribe({
         // next: datos => {},
         error: err => console.error(err.error)
      });
   }

   generarRubxFac(rubros: any) {
      let i = 0;
      rubros.forEach(() => {
         let factura: any = {}
         factura = rubros[i].nrofactura;
         this.rubxfac.idfactura_facturas = factura;
         this.rubxfac.cantidad = 1;
         this.rubxfac.valorunitario = rubros[i].valorunitario;
         this.rubxfac.estado = 1;
         this.rubxfac.idrubro_rubros = rubros[i];
         i++;
         this.s_rubxfac.saveRubroxFac(this.rubxfac).subscribe({
            // next: datos => { },
            error: error => console.log(error)
         });
      })
   }

   resetForm() {
   }

}
