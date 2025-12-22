import { Time } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Catalogoitems } from 'src/app/modelos/catalogoitems.model';
import { Clientes } from 'src/app/modelos/clientes';
import { Facturacion } from 'src/app/modelos/facturacion.model';
import { Facturas } from 'src/app/modelos/facturas.model';
import { Modulos } from 'src/app/modelos/modulos.model';
import { Rubros } from 'src/app/modelos/rubros.model';
import { Usoitems } from 'src/app/modelos/usoitems.model';
import { CatalogoitemService } from 'src/app/servicios/catalogoitem.service';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { FacturacionService } from 'src/app/servicios/facturacion.service';
import { ItemxfactService } from 'src/app/servicios/itemxfact.service';
import { LiquidafacService } from 'src/app/servicios/liquidafac.service';
import { ModulosService } from 'src/app/servicios/modulos.service';
import { RubrosService } from 'src/app/servicios/rubros.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { UsoitemsService } from 'src/app/servicios/usoitems.service';

@Component({
  selector: 'app-add-facturacion',
  templateUrl: './add-facturacion.component.html',
  styleUrls: ['./add-facturacion.component.css'],
})
export class AddFacturacionComponent implements OnInit {
  formFacturacion: FormGroup;
  formBusClientes: FormGroup; //Formulario para buscar Clientes del Modal
  filtro: string;
  _clientes: any;
  swvalido = 1; //Búsqueda de Clientes
  privez = true; //Para resetear los datos de Búsqueda de Clientes
  _modulos: any;
  formDetalle: FormGroup;
  _usoitems: any;
  _productos: any;
  _facturacion: any;
  arrRubros: any[] = [];
  formModiValor: FormGroup;
  totProductos: number; //Para el botón de agregar todos
  totfac: number;
  totiva: number;
  indice: number;
  formCuotas: FormGroup;
  cliente: any;
  modulo: any;
  factura: any;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private clieService: ClientesService,
    public fb1: FormBuilder,
    public fb2: FormBuilder,
    private moduService: ModulosService,
    private usoiService: UsoitemsService,
    private catiService: CatalogoitemService,
    private factuService: FacturacionService,
    private facService: FacturaService,
    private ixfService: ItemxfactService,
    private rubxfacService: RubroxfacService,
    private rubService: RubrosService,
    private liqfacService: LiquidafacService,
    private authService: AutorizaService
  ) { }

  ngOnInit(): void {
    //Formulario de la cabecera
    let cliente: Clientes = new Clientes();
    cliente.idcliente = 1;
    this.formFacturacion = this.fb.group({
      fecha: new Date().toISOString().substring(0, 10),
      cliente: '',
      idcliente_clientes: this.cliente,
      descripcion: '',
      estado: 1,
      formapago: '',
      total: 0,
      cuotas: 1,
      usucrea: this.authService.idusuario,
      feccrea: new Date().toISOString().substring(0, 10),
    });
    //Formulario de Busqueda de Clientes (Modal)
    this.formBusClientes = this.fb1.group({
      nombre_identifica: [null, [Validators.required, Validators.minLength(5)]],
    });
    //Formulario del detalle
    var modulos: Modulos = new Modulos();
    var usoitems: Usoitems = new Usoitems();
    this.formDetalle = this.fb2.group({
      seccion: modulos,
      uso: usoitems,
    });
    //Formulario para modificar Cantidad y Valor
    this.formModiValor = this.fb2.group({
      rubro: '',
      cantidad: 0,
      valor: 0,
      indice: 0,
    });
    //Formulario Cuotas
    this.formCuotas = this.fb2.group({
      cliente: '',
      total: '',
      formapago: 1,
      cuotas: 1,
    });

    //Seccion
    setTimeout(() => {
      this.moduService.getListaModulos().subscribe({
        next: (datos) => {
          this._modulos = datos;
        },
        error: (err) => console.error(err.error),
      });
    }, 1000);
    const seccion = document.getElementById('seccion') as HTMLSelectElement;
    seccion.addEventListener('change', () => {
      this._usoitems = [];
      this._productos = [];
      // Recupera los Usos de la Sección(antes Módulo)
      this.usoiService
        .getByIdmodulo(this.formDetalle.value.seccion.idmodulo)
        .subscribe({
          next: (datos) => (this._usoitems = datos),
          error: (err) => console.error(err.error),
        });
    });
    //Uso
    const uso = document.getElementById('uso') as HTMLSelectElement;
    uso.addEventListener('change', () => {
      this._productos = [];
      // Recupera los Productos del Uso
      this.catiService
        .getByIdusoitems(this.formDetalle.value.uso.idusoitems)
        .subscribe({
          next: (datos) => {
            this._productos = datos;
            this.totProductos = this._productos.length;
          },
          error: (err) => console.error(err.error),
        });
    });
  }

  onSubmit() {
    this.formCuotas.controls['cliente'].setValue(
      this.formFacturacion.value.cliente
    );
    if (this.totfac + this.totiva > 0)
      this.formCuotas.controls['total'].setValue(
        (this.totfac + this.totiva).toFixed(2).toString()
      );
  }

  guardar() {
    this.formFacturacion.value.idcliente_clientes = this.cliente;
    this.formFacturacion.value.total = this.formCuotas.value.total;
    this.formFacturacion.value.cuotas = this.formCuotas.value.cuotas;
    this.formFacturacion.value.formapago = this.formCuotas.value.formapago;
    this.factuService.save(this.formFacturacion.value).subscribe({
      next: (resp) => {
        this._facturacion = resp;
        this.itemxfacturacion();
        this.facturas();
      },
      error: (err) => console.error(err.error),
    });
  }

  itemxfacturacion() {
    let i = 0;
    this.arrRubros.forEach(() => {
      let prodxfact = {} as Prodxfact; //Interface para los datos de los Productos x Facturación
      prodxfact.cantidad = this.arrRubros[i][1];
      prodxfact.descuento = 0;
      prodxfact.estado = 0;
      prodxfact.valorunitario =
        this.arrRubros[i][2] / this.formCuotas.value.cuotas;
      prodxfact.idfacturacion_facturacion = this._facturacion;
      this.catiService.getById(this.arrRubros[i][4]).subscribe({
        //El elemento cuatro es el Id del Producto
        next: (resp) => {
          prodxfact.idcatalogoitems_catalogoitems = resp;
          this.ixfService.save(prodxfact).subscribe({
            next: (resp1) => {
              // console.log("Ok!");
            },
            error: (err) => console.error(err.error),
          });
        },
        error: (err) => console.error(err.error),
      });
      i++;
    });
  }

  //Cabecera de la(s) Planilla(s) (Tabla Factura)
  facturas() {
    let n = this.formCuotas.value.cuotas;
    for (let i = 1; i <= n; i++) {
      // console.log("i del lazo= " + i)
      let planilla = {} as Planilla;
      planilla.idmodulo = this.formDetalle.value.seccion;
      planilla.idcliente = this.cliente;
      planilla.idabonado = 0;
      planilla.porcexoneracion = 0;
      planilla.totaltarifa = (this.totfac + this.totiva) / n;
      planilla.pagado = 0;
      planilla.conveniopago = 0;
      planilla.estadoconvenio = 0;
      planilla.formapago = this.formCuotas.value.formapago;
      planilla.valorbase = (this.totfac + this.totiva) / n;
      planilla.usucrea = this.authService.idusuario;
      planilla.estado = 1;
      //planilla.fechaanulacion= ;
      planilla.swiva = this.totiva;
      planilla.valornotacredito = 0;
      planilla.secuencialfacilito = '';
      //planilla.interescobrado = 0;
      let fecha: Date = new Date();
      fecha.setMonth(fecha.getMonth() + (i - 1));
      planilla.feccrea = fecha;
      this.facService.saveFactura(planilla).subscribe({
        next: (resp) => {
          this.factura = resp;
          this.rubrosxfactura();
          // console.log("Envia i= " + i)

          // ========== this.creaLiquidafac(i); Genera la Liquidación ===========
          let liquidafac = {} as Liquidafac; //Interface para los datos de la Liquidación de la Facturación
          // let cuota = i;
          liquidafac.cuota = i;
          liquidafac.valor = this.totfac;
          liquidafac.estado = 0;
          liquidafac.idfacturacion_facturacion = this._facturacion;
          liquidafac.idfactura_facturas = this.factura;
          liquidafac.usucrea = this.authService.idusuario;
          // let fecha: Date = new Date();
          let fecha = new Date();
          // console.log("Cuota= " + i)
          fecha.setMonth(fecha.getMonth() + (i - 1));
          liquidafac.feccrea = fecha;
          this.liqfacService.saveLiquidafac(liquidafac).subscribe({
            next: (nex) => '',
            // console.log("liquidaxfac Ok!")
            error: (err) => console.error(err.error),
          });
        },
        error: (err) => console.error(err.error),
      });
    }
  }

  //Detalle de la(s) Planilla(s) (Tabla rubroxfac)
  rubrosxfactura() {
    let i = 0;
    this.arrRubros.forEach(() => {
      let rubrosxpla = {} as Rubrosxpla; //Interface para los datos de los Rubros x Planilla
      rubrosxpla.cantidad = this.arrRubros[i][1];
      rubrosxpla.valorunitario =
        this.arrRubros[i][2] / this.formCuotas.value.cuotas;
      rubrosxpla.estado = 0;
      rubrosxpla.idfactura_facturas = this.factura;
      this.rubService.getRubroById(this.arrRubros[i][5]).subscribe({
        //El elemento 5 es el Id del Rubro
        next: (resp) => {
          rubrosxpla.idrubro_rubros = resp;
          this.rubxfacService.saveRubroxfac(rubrosxpla).subscribe({
            next: (nex) => { },
            error: (err) => console.error(err.error),
          });
        },
        error: (err) => console.error(err.error),
      });
      i++;
    });
    this.listarFacturacion();
  }

  listarFacturacion() {
    this.router.navigate(['facturacion']);
  }

  clientesModal() {
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
          next: (datos) => (this._clientes = datos),
          error: (err) => console.error(err.error),
        });
    }
  }

  selecCliente(cli: Clientes) {
    this.formFacturacion.controls['cliente'].setValue(cli.nombre);
    this.cliente = cli;
  }

  aniadir(producto: Catalogoitems) {
    let nuevo = this.arrRubros.push([
      producto.idrubro_rubros.descripcion.toString(),
      1,
      +producto.idrubro_rubros.valor!,
      +producto.idrubro_rubros.swiva!,
      +producto.idcatalogoitems!,
      +producto.idrubro_rubros.idrubro!,
    ]);
    this.subtotal();
  }

  todos() {
    let i = 0;
    this._productos.forEach(() => {
      this.arrRubros.push([
        this._productos[i].idrubro_rubros.descripcion.toString(),
        1,
        +this._productos[i].idrubro_rubros.valor!,
        +this._productos[i].idrubro_rubros.swiva!,
        +this._productos[i].idcatalogoitems!,
        +this._productos[i].idrubro_rubros.idrubro!,
      ]);
      i++;
    });
    this.subtotal();
  }

  modiValor(indice: number) {
    this.indice = indice;
    this.formModiValor.controls['rubro'].setValue(this.arrRubros[indice][0]);
    this.formModiValor.controls['cantidad'].setValue(this.arrRubros[indice][1]);
    this.formModiValor.controls['valor'].setValue(this.arrRubros[indice][2]);
  }

  aceptarModiValor(indice: number) {
    this.arrRubros[this.indice][1] = this.formModiValor.value.cantidad;
    this.arrRubros[this.indice][2] = this.formModiValor.value.valor;
    this.subtotal();
  }

  quitar(indice: number) {
    this.arrRubros.splice(indice, 1);
    this.subtotal();
  }

  subtotal() {
    let suma12 = 0;
    let sumiva = 0;
    let i = 0;
    this.arrRubros.forEach(() => {
      suma12 += this.arrRubros[i][1] * this.arrRubros[i][2];
      if (this.arrRubros[i][3] == 1) {
        sumiva += this.arrRubros[i][1] * this.arrRubros[i][2] * 0.15;
      }
      i++;
    });
    this.totfac = suma12;
    this.totiva = sumiva;
  }
}

type Prodxfact = {
  iditemxfact: number;
  estado: number;
  cantidad: number;
  valorunitario: number;
  descuento: number;
  idfacturacion_facturacion: Facturacion;
  idcatalogoitems_catalogoitems: Catalogoitems;
};

interface Planilla {
  idfactura: number;
  idmodulo: Modulos;
  idcliente: Clientes;
  idabonado: number; //Probar con Abonados;
  nrofactura: String;
  porcexoneracion: number;
  razonexonera: String;
  totaltarifa: number;
  pagado: number;
  usuariocobro: number;
  fechacobro: Date;
  fechaanulacion: Date;
  estado: number;
  usuarioanulacion: number;
  razonanulacion: String;
  usuarioeliminacion: number;
  fechaeliminacion: Date;
  razoneliminacion: String;
  conveniopago: number;
  fechaconvenio: Date;
  estadoconvenio: number;
  formapago: number;
  reformapago: String;
  horacobro: Time;
  usuariotransferencia: number;
  fechatransferencia: Date;
  usucrea: number;
  feccrea: Date;
  usumodi: number;
  fecmodi: Date;
  valorbase: number;
  interescobrado: number;
  swiva: number;
  swcondonar: boolean;
  valornotacredito: number;
  secuencialfacilito: string;
  fechacompensacion: Date;
}

interface Rubrosxpla {
  idrubroxfac: number;
  cantidad: number;
  valorunitario: number;
  estado: number;
  idfactura_facturas: Facturas;
  idrubro_rubros: Rubros;
}

interface Liquidafac {
  idliquidafac: number;
  cuota: number;
  valor: number;
  usuarioeliminacion: number;
  fechaeliminacion: Date;
  razoneliminacion: String;
  estado: number;
  observacion: String;
  idfacturacion_facturacion: Facturacion;
  idfactura_facturas: Facturas;
  usucrea: number;
  feccrea: Date;
}
