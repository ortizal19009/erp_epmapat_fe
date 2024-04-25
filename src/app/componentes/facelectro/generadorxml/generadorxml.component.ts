import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Abonados } from 'src/app/modelos/abonados';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { DefinirService } from 'src/app/servicios/administracion/definir.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';

@Component({
   selector: 'app-generadorxml',
   templateUrl: './generadorxml.component.html',
   styleUrls: ['./generadorxml.component.css']
})
export class GeneradorxmlComponent implements OnInit {

   formBuscar: FormGroup;
   formFactura: FormGroup;
   _planillas: any;
   datosJSON: any;
   _facturas: any;
   _rubroxfac: any;
   vecrubros: any = [];
   porciva: number = 0.15;
   swencuentra: boolean;
   sumsubtotal: number = 0;
   sumvaloriva: number = 0;
   sumtotal: number = 0;
   swbuscando: boolean;
   txtbuscar: string = 'Buscar';
   swfincalc: boolean;
   progreso = 0;
   swprogressbar: boolean;
   swgenerar: boolean;
   swnoexiste: boolean;
   claveacceso: string;
   nrofactura: string;
   empresa: any;

   constructor(private router: Router, public authService: AutorizaService, private coloresService: ColoresService,
      public fb: FormBuilder, private facService: FacturaService, private rxfService: RubroxfacService,
      private defService: DefinirService, private aboService: AbonadosService) { }

   async ngOnInit(): Promise<void> {
      sessionStorage.setItem('ventana', '/generadorxml');
      let coloresJSON = sessionStorage.getItem('/generadorxml');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      this.formBuscar = this.fb.group({
         nrofactura: ['', [Validators.required, Validators.minLength(17), Validators.maxLength(17)]]
      });

      this.formFactura = this.fb.group({
         cliente: '',
         fechacobro: '',
      });

      await this.datosDefinirAsync()

   }

   async buscaColor() {
      try {
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'generadorxml');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/generadorxml', coloresJSON);
         this.colocaColor(datos);
      } catch (error) {
         console.error(error);
      }
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   async datosDefinirAsync() {
      try {
         const def = await this.defService.getByIddefinirAsync(1);
         this.empresa = def;
      } catch (error) {
         console.log('Al recuperar los datos de la Empresa', error);
      }
   }

   get f() { return this.formBuscar.controls; }

   buscar() {
      this.swbuscando = true;
      this.txtbuscar = 'Buscando';
      this.swfincalc = false;
      this.swgenerar = false;
      this.swencuentra = false;
      this.nrofactura = this.formBuscar.value.nrofactura;
      this.facService.getByNrofactura(this.nrofactura).subscribe({
         next: datos => {
            console.log(datos)
            this._facturas = datos;
            if (this._facturas.length > 0) {
               this.swnoexiste = false;
               this.swencuentra = true;
               this.formFactura.patchValue({
                  cliente: this._facturas[0].idcliente.nombre,
                  fechacobro: this._facturas[0].fechacobro,
               });
               this.txtbuscar = 'Calculando'
               this.progreso = 0;
               let i = 0;
               this.sumaRubros(i);
               this.sumsubtotal = 0; this.sumvaloriva = 0; this.sumtotal = 0;
            } else {
               this.swnoexiste = true;
               this.swbuscando = false;
               this.txtbuscar = 'Buscar';
            };
         },
         error: err => console.error(err.error)
      });
   }

   sumaRubros(i: number) {
      this.vecrubros = []
      this.swprogressbar = true;
      this.rxfService.getByIdfactura(this._facturas[i].idfactura).subscribe({
         next: datos => {
            let j = 0;
            datos.forEach(() => {
               let r: any = {};
               let baseImponible = datos[j].cantidad * datos[j].valorunitario;
               let [valoriva, total] = valoresIVA(datos[j].idrubro_rubros.swiva, baseImponible, this.porciva);
               r = {
                  idrubro: datos[j].idrubro_rubros.idrubro,
                  descripcion: datos[j].idrubro_rubros.descripcion,
                  cantidad: datos[j].cantidad,
                  valorunitario: datos[j].valorunitario,
                  subtotal: baseImponible,
                  swiva: datos[j].idrubro_rubros.swiva,
                  valoriva: valoriva,
                  total: total,
               }
               this.sumsubtotal += r.subtotal;
               this.sumvaloriva += r.valoriva;
               this.sumtotal += r.total;
               console.log(this.sumsubtotal)
               console.log(this.sumvaloriva)
               console.log(this.sumtotal)
               let indice = this.vecrubros.findIndex((rubro: { idrubro: number }) => rubro.idrubro === r.idrubro);
               if (indice == -1) this.vecrubros.push(r)
               else {
                  console.log('HOLA POR AQUI ')
                  console.log(this.vecrubros[indice])
                  this.vecrubros[indice].valorunitario = Math.round((this.vecrubros[indice].valorunitario + r.valorunitario) * 100) / 100;
                  this.vecrubros[indice].subtotal = Math.round((this.vecrubros[indice].subtotal + r.subtotal) * 100) / 100;
                  this.vecrubros[indice].valoriva = Math.round((this.vecrubros[indice].valoriva + r.valoriva) * 100) / 100;
                  this.vecrubros[indice].total = Math.round((this.vecrubros[indice].total + r.total) * 100) / 100;
               }
               j++;
            });
            i++;
            this.progreso = (i / this._facturas.length) * 100
            if (i < this._facturas.length) this.sumaRubros(i)
            else {
               this.swbuscando = false;
               this.txtbuscar = 'Buscar'
               this.swfincalc = true;
               this.swprogressbar = false;
               this.swgenerar = true;
            };
         },
         error: err => console.error(err.error)
      });
   }

   regresar() { this.router.navigate(['/inicio']); }

   definir() { this.router.navigate(['/definir']); }

   claveAcceso() {
      this.claveacceso = '';
      let fecha = formatearFecha(1, this._facturas[0].fechacobro);   //1: Sin slash para la Clave de acceso
      let ruc = this.empresa.ruc;
      let ambiente = this.empresa.tipoambiente.toString();  //1: Pruebas  2: Producción
      let estab = this._facturas[0].nrofactura.slice(0, 3);
      let ptoemi = this._facturas[0].nrofactura.slice(4, 7);
      let serie = estab + ptoemi;
      let secuencial = this._facturas[0].nrofactura.slice(8, 17);
      let codigonumerico = codigoNumerico(this._facturas[0].nrofactura.slice(9, 17));
      let tipoemision = '1';  //1: Normal
      this.claveacceso = this.claveacceso + fecha + '01' + ruc + ambiente + serie + secuencial + codigonumerico + tipoemision;
      let verificador = modulo11(this.claveacceso);
      this.claveacceso = this.claveacceso + verificador	//Dígito Verificador (Módulo 11)
      // console.log('this.claveacceso: ', this.claveacceso)
   }
   async getAbonado(idabonado: number): Promise<any> {
      const abo = await this.aboService.getById(idabonado).toPromise();
      return abo;
   }

   async generarXmlFile() {
      console.log(this._facturas)
      const abonado: Abonados = await this.getAbonado(this._facturas[0].idabonado);
      let nom: String = '';
      let ced: String = '';
      let dir: String = '';
      if (this._facturas[0].idmodulo.idmodulo === 4 || (this._facturas[0].idmodulo.idmodulo === 3 && this._facturas[0].idabonado != 0)) {
         nom = abonado.idresponsable.nombre;
         ced = abonado.idresponsable.cedula;
         dir = abonado.direccionubicacion;
      } else {
         nom = this._facturas[0].idcliente.nombre;
         ced = this._facturas[0].idcliente.cedula;
         dir = this._facturas[0].idcliente.direccion;
      }
      this.claveAcceso();
      let claveacceso = this.claveacceso;
      let estab = this._facturas[0].nrofactura.slice(0, 3);
      let ptoemi = this._facturas[0].nrofactura.slice(4, 7);
      let secuencial = this._facturas[0].nrofactura.slice(8, 17);
      let direccion = this.empresa.direccion;
      let fecha = formatearFecha(2, this._facturas[0].feccrea);   //2: Con slash para el XML
      let fechaC = formatearFecha(2, this._facturas[0].fechacobro);   //2: Con slash para el XML
      let tpIdentifica = this._facturas[0].idcliente.idtpidentifica_tpidentifica.codigo;
      let nombre = nom;
      let cedula = ced;
      // let subtotal = this.sumsubtotal
      let cuenta = this._facturas[0].idabonado;
      let dircli = dir;
      let email = this._facturas[0].idcliente.email;

      const detalles: Detalle[] = [];

      for (const key in this.vecrubros) {
         //Datos para calcular el IVA
         const baseImponible = this.vecrubros[key].subtotal;
         const [codigoPorcentaje, tarifa, valorIVA] = calculosIVA(this.vecrubros[key].swiva, this.vecrubros[key].subtotal, this.porciva);

         const detalle: Detalle = {
            codigoPrincipal: this.vecrubros[key].idrubro.toString().padStart(4, '0'),
            descripcion: this.vecrubros[key].descripcion,
            cantidad: this.vecrubros[key].cantidad,
            precioUnitario: this.vecrubros[key].valorunitario,
            descuento: '0',
            precioTotalSinImpuesto: this.vecrubros[key].subtotal,
            impuestos: [
               {
                  codigo: '2',
                  codigoPorcentaje: codigoPorcentaje,
                  tarifa: tarifa,
                  baseImponible: baseImponible.toString(),
                  valor: valorIVA,
               },
            ],
         };
         detalles.push(detalle);
      }

      //Genera el XML
      let json = {
         _declaration: {
            _attributes: {
               version: "1.0",
               encoding: "UTF-8"
            }
         },
         factura: {
            _attributes: {
               id: "comprobante",
               version: "1.0.0"
            },
            infoTributaria: {
               ambiente: this.empresa.tipoambiente, tipoEmision: 1, /* en ambiente a loque se vaya a pasar a produccion cambiar  this.empresa.ambiente */
               razonSocial: this.empresa.razonsocial,
               nombreComercial: this.empresa.nombrecomercial,
               ruc: this.empresa.ruc,
               claveAcceso: claveacceso,
               codDoc: '01',
               estab: estab, ptoEmi: ptoemi,
               secuencial: secuencial,
               dirMatriz: direccion,
            },
            infoFactura: {
               fechaEmision: fecha,
               obligadoContabilidad: 'SI',
               tipoIdentificacionComprador: tpIdentifica,
               razonSocialComprador: nombre,
               identificacionComprador: cedula,
               direccionComprador: `${dircli} CUENTA  ${cuenta}  `,
               totalSinImpuestos: this.sumsubtotal.toFixed(2),
               totalDescuento: '0.00',
               totalConImpuestos: {
                  totalImpuesto: {
                     codigo: '2', codigoPorcentaje: '0', baseImponible: this.sumsubtotal.toFixed(2), valor: this.sumvaloriva.toFixed(2),
                  }
               },
               propina: '0.00',
               importeTotal: this.sumtotal.toFixed(2),
               moneda: 'DOLAR',
               pagos: {
                  pago: {
                     formaPago: '20',
                     total: this.sumtotal.toFixed(2),
                  }
               }
            },

            detalles: {
               detalle: detalles.map(detalle => ({
                  codigoPrincipal: { _text: detalle.codigoPrincipal },
                  descripcion: { _text: detalle.descripcion },
                  cantidad: { _text: detalle.cantidad },
                  precioUnitario: { _text: (+detalle.precioUnitario!).toFixed(2) },
                  descuento: { _text: detalle.descuento },
                  precioTotalSinImpuesto: { _text: (+detalle.precioTotalSinImpuesto!).toFixed(2) },
                  impuestos: {
                     impuesto: detalle.impuestos.map((impuesto: { codigo: any; codigoPorcentaje: any; tarifa: any; baseImponible: any; valor: any; }) => ({
                        codigo: { _text: impuesto.codigo },
                        codigoPorcentaje: { _text: impuesto.codigoPorcentaje },
                        tarifa: { _text: impuesto.tarifa },
                        baseImponible: { _text: (+impuesto.baseImponible!).toFixed(2) },
                        valor: { _text: impuesto.valor }
                     }))
                  }
               }))
            },

            infoAdicional: {
               campoAdicional: [
                  { _attributes: { nombre: 'Dirección' }, _text: dircli },
                  { _attributes: { nombre: "e-mail" }, _text: email },
                  { _attributes: { nombre: "Cuenta" }, _text: cuenta },
                  { _attributes: { nombre: "Fecha emisión" }, _text: fecha },
                  { _attributes: { nombre: "Fecha cobro" }, _text: fechaC }
               ]
            }
         }
      };

      let options = { compact: true, ignoreComment: true, spaces: 4 };
      let xmlData = require('xml-js').js2xml(json, options);

      // Crear y descargar el archivo XML
      const blob = new Blob([xmlData], { type: 'text/xml' });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'Fac_' + this.nrofactura + '.xml';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      this.swgenerar = false;
      this.swencuentra = false;
      this.formBuscar.controls['nrofactura'].setValue('');
   }

}


//Transforma la fecha: opcion 1: para la clave de acceso sin slash opcion=2 para el XML con slash
function formatearFecha(opcion: number, fecha: string): string {
   const dia = fecha.slice(8, 11);
   const mes = fecha.slice(5, 7);
   const año = fecha.slice(0, 4);
   if (opcion == 1) return `${dia}${mes}${año}`;
   else return `${dia}/${mes}/${año}`;
}

interface Detalle {
   codigoPrincipal: string;
   descripcion: string;
   cantidad: string;
   precioUnitario: string;
   descuento: string;
   precioTotalSinImpuesto: string;
   impuestos: Impuesto[];
}

interface Impuesto {
   codigo: string;
   codigoPorcentaje: string;
   tarifa: string;
   baseImponible: string;
   valor: string;
}

function valoresIVA(swiva: Boolean, baseImponible: number, porciva: number): [number, number] {
   const valorIVA = swiva ? Math.round((baseImponible * porciva) * 100) / 100 : 0;
   const total = swiva ? Math.round((baseImponible + baseImponible * porciva) * 100) / 100 : baseImponible;
   return [valorIVA, total];
}

function calculosIVA(swiva: boolean, baseImponible: number, porciva: number): [string, string, string] {
   const codigoPorcentaje = swiva ? '2' : '0';
   const tarifa = swiva ? porciva.toString() : '0';
   const valorIVA = swiva ? (Math.round((baseImponible * porciva) * 100) / 100).toFixed(2) : '0.00';
   return [codigoPorcentaje, tarifa, valorIVA];
}

//Código numérico de la Clave de acceso
function codigoNumerico(as_numero: string): string {
   let ls_rtn = "";
   for (let li_i = as_numero.length - 1; li_i >= 0; li_i--) {
      ls_rtn += as_numero.charAt(li_i);
   }
   return ls_rtn;
}

function modulo11(as_clave: string): string {
   //Clave al reves
   let ls_evalc = "";
   for (let li_i = 47; li_i >= 0; li_i--) {
      ls_evalc += as_clave.charAt(li_i);
   }

   //Multiplica cada caracter por (2,3,4,5,6,7) y acumula
   let ll_kont = 0;
   let ll_total = 0;
   const multiplicadores = [2, 3, 4, 5, 6, 7]; // Arreglo de multiplicadores
   for (let li_i = 0; li_i < ls_evalc.length; li_i++) {
      const ll_numero = parseInt(ls_evalc.charAt(li_i), 10);
      const ll_producto = ll_numero * multiplicadores[ll_kont]; // Aplica el multiplicador
      ll_total += ll_producto;
      ll_kont = (ll_kont + 1) % 6; // Actualiza el contador cíclico (0-5)
   }

   //Calcula el Residuo y el Dígito verificador
   let ll_residuo = ll_total % 11;
   let ll_rtn = 11 - ll_residuo;

   //Cambia 11 a 0 y 10 a 1
   let ls_rtn: string;
   switch (ll_rtn) {
      case 11:
         ls_rtn = "0";
         break;
      case 10:
         ls_rtn = "1";
         break;
      default:
         ls_rtn = ll_rtn.toString();
   }
   return ls_rtn;
}