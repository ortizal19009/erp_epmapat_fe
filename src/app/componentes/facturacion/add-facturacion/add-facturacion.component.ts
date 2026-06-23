import { Time } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { concatMap, finalize, forkJoin, from, map, Observable, of, switchMap, tap, toArray } from 'rxjs';
import Swal from 'sweetalert2';
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
import { LoadingService } from 'src/app/servicios/loading.service';
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
  formBusClientes: FormGroup;
  filtro: string;
  _clientes: any;
  swvalido = 1;
  privez = true;
  _modulos: any;
  formDetalle: FormGroup;
  _usoitems: any;
  _productos: any;
  _facturacion: any;
  arrRubros: any[] = [];
  formModiValor: FormGroup;
  totProductos: number;
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
    private authService: AutorizaService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
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

    this.formBusClientes = this.fb1.group({
      nombre_identifica: [null, [Validators.required, Validators.minLength(5)]],
    });

    const modulos = new Modulos();
    const usoitems = new Usoitems();
    this.formDetalle = this.fb2.group({
      seccion: modulos,
      uso: usoitems,
    });

    this.formModiValor = this.fb2.group({
      rubro: '',
      cantidad: 0,
      valor: 0,
      indice: 0,
    });

    this.formCuotas = this.fb2.group({
      cliente: '',
      total: '',
      formapago: 1,
      cuotas: 1,
    });

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
      this.usoiService
        .getByIdmodulo(this.formDetalle.value.seccion.idmodulo)
        .subscribe({
          next: (datos) => (this._usoitems = datos),
          error: (err) => console.error(err.error),
        });
    });

    const uso = document.getElementById('uso') as HTMLSelectElement;
    uso.addEventListener('change', () => {
      this._productos = [];
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
    this.formCuotas.controls['cliente'].setValue(this.formFacturacion.value.cliente);
    if (this.totfac + this.totiva > 0) {
      this.formCuotas.controls['total'].setValue((this.totfac + this.totiva).toFixed(2).toString());
    }
  }

  guardar() {
    if (!this.cliente) {
      this.authService.swal('warning', 'Seleccione un cliente');
      return;
    }
    if (!this.arrRubros.length) {
      this.authService.swal('warning', 'Debe agregar al menos un rubro');
      return;
    }

    this.formFacturacion.value.idcliente_clientes = this.cliente;
    this.formFacturacion.value.total = this.formCuotas.value.total;
    this.formFacturacion.value.cuotas = this.formCuotas.value.cuotas;
    this.formFacturacion.value.formapago = this.formCuotas.value.formapago;

    this.loadingService.showLoading();

    this.factuService
      .save(this.formFacturacion.value)
      .pipe(
        tap((resp) => (this._facturacion = resp)),
        switchMap((facturacion) =>
          forkJoin([this.guardarItemsFacturacion$(facturacion), this.guardarFacturasConRubros$(facturacion)])
        ),
        finalize(() => this.loadingService.hideLoading())
      )
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Facturación guardada',
            text: 'La facturación y todos los rubros se guardaron con éxito.',
            confirmButtonText: 'Aceptar',
          }).then(() => this.router.navigate(['facturacion']));
        },
        error: (err) => {
          console.error('Error al guardar la facturación:', err);
          this.authService.mostrarError('Error al guardar la facturación', err?.error ?? err?.message ?? err);
        },
      });
  }

  private guardarItemsFacturacion$(facturacion: Facturacion): Observable<any[]> {
    if (!this.arrRubros.length) return of([]);

    const items$ = this.arrRubros.map((item) => {
      const prodxfact = {} as Prodxfact;
      prodxfact.cantidad = item[1];
      prodxfact.descuento = 0;
      prodxfact.estado = 1;
      prodxfact.valorunitario = item[2] / this.formCuotas.value.cuotas;
      prodxfact.idfacturacion_facturacion = facturacion;

      return this.catiService.getById(item[4]).pipe(
        switchMap((producto) => {
          prodxfact.idcatalogoitems_catalogoitems = producto;
          return this.ixfService.save(prodxfact);
        })
      );
    });

    return forkJoin(items$);
  }

  private guardarFacturasConRubros$(facturacion: Facturacion): Observable<any[]> {
    const cuotas = Number(this.formCuotas.value.cuotas) || 1;
    return from(Array.from({ length: cuotas }, (_, index) => index + 1)).pipe(
      concatMap((cuota) => this.guardarFacturaCompleta$(facturacion, cuota, cuotas)),
      toArray()
    );
  }

  private guardarFacturaCompleta$(facturacion: Facturacion, cuota: number, totalCuotas: number): Observable<any> {
    const planilla = this.crearPlanilla(cuota, totalCuotas);
    return this.facService.saveFactura(planilla).pipe(
      map((facturaGuardada) => facturaGuardada as Facturas),
      switchMap((facturaGuardada) =>
        forkJoin([
          this.guardarRubrosFactura$(facturaGuardada),
          this.guardarLiquidafac$(facturacion, facturaGuardada, cuota),
        ]).pipe(
          map(([rubrosGuardados, liquidacionGuardada]) => ({
            factura: facturaGuardada,
            rubros: rubrosGuardados,
            liquidacion: liquidacionGuardada,
          }))
        )
      )
    );
  }

  private guardarRubrosFactura$(factura: Facturas): Observable<any[]> {
    if (!this.arrRubros.length) return of([]);

    const rubros$ = this.arrRubros.map((item) => {
      const rubrosxpla = {} as Rubrosxpla;
      rubrosxpla.cantidad = item[1];
      rubrosxpla.valorunitario = item[2] / this.formCuotas.value.cuotas;
      rubrosxpla.estado = 1;
      rubrosxpla.idfactura_facturas = factura;

      return this.rubService.getRubroById(item[5]).pipe(
        switchMap((rubro) => {
          rubrosxpla.idrubro_rubros = rubro;
          return this.rubxfacService.saveRubroxfac(rubrosxpla);
        })
      );
    });

    return forkJoin(rubros$);
  }

  private guardarLiquidafac$(facturacion: Facturacion, factura: Facturas, cuota: number): Observable<Object> {
    const liquidafac = {} as Liquidafac;
    liquidafac.cuota = cuota;
    liquidafac.valor = this.totfac;
    liquidafac.estado = 0;
    liquidafac.idfacturacion_facturacion = facturacion;
    liquidafac.idfactura_facturas = factura;
    liquidafac.usucrea = this.authService.idusuario;
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() + (cuota - 1));
    liquidafac.feccrea = fecha;
    return this.liqfacService.saveLiquidafac(liquidafac);
  }

  private crearPlanilla(cuota: number, totalCuotas: number): Planilla {
    const planilla = {} as Planilla;
    planilla.idmodulo = this.formDetalle.value.seccion;
    planilla.idcliente = this.cliente;
    planilla.idabonado = 0;
    planilla.porcexoneracion = 0;
    planilla.totaltarifa = (this.totfac + this.totiva) / totalCuotas;
    planilla.pagado = 0;
    planilla.conveniopago = 0;
    planilla.estadoconvenio = 0;
    planilla.formapago = this.formCuotas.value.formapago;
    planilla.valorbase = (this.totfac + this.totiva) / totalCuotas;
    planilla.usucrea = this.authService.idusuario;
    planilla.estado = 1;
    planilla.swiva = this.totiva;
    planilla.valornotacredito = 0;
    planilla.secuencialfacilito = '';
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() + (cuota - 1));
    planilla.feccrea = fecha;
    return planilla;
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
    if (this.formBusClientes.value.nombre_identifica != null && this.formBusClientes.value.nombre_identifica != '') {
      this.clieService.getByNombreIdentifi(this.formBusClientes.value.nombre_identifica).subscribe({
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
    const rubro = producto?.idrubro_rubros;
    if (!rubro) {
      console.warn('Producto sin rubro asociado, no se puede añadir a facturación', producto);
      return;
    }

    this.arrRubros.push([
      String(rubro.descripcion || producto?.descripcion || 'Rubro sin descripción'),
      1,
      Number(rubro.valor || 0),
      Number(rubro.swiva || 0),
      Number(producto?.idcatalogoitems || 0),
      Number(rubro.idrubro || 0),
    ]);
    this.subtotal();
  }

  todos() {
    let i = 0;
    this._productos.forEach(() => {
      const producto = this._productos[i];
      const rubro = producto?.idrubro_rubros;
      if (!rubro) {
        i++;
        return;
      }

      this.arrRubros.push([
        String(rubro.descripcion || producto?.descripcion || 'Rubro sin descripción'),
        1,
        Number(rubro.valor || 0),
        Number(rubro.swiva || 0),
        Number(producto?.idcatalogoitems || 0),
        Number(rubro.idrubro || 0),
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
  idabonado: number;
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
