import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { fx } from 'jquery';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Abonados } from 'src/app/modelos/abonados';
import { Categoria } from 'src/app/modelos/categoria.model';
import { Clientes } from 'src/app/modelos/clientes';
import { Facxremi } from 'src/app/modelos/coactivas/facxremi';
import { Remision } from 'src/app/modelos/coactivas/remision';
import { Facturas } from 'src/app/modelos/facturas.model';
import { Rutas } from 'src/app/modelos/rutas.model';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { FacxremiService } from 'src/app/servicios/coactivas/facxremi.service';
import { RemisionService } from 'src/app/servicios/coactivas/remision.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';

@Component({
  selector: 'app-add-remision',
  templateUrl: './add-remision.component.html',
  styleUrls: ['./add-remision.component.css'],
})
export class AddRemisionComponent implements OnInit {
  filtro: string;
  f_buscar: FormGroup;
  f_simular: FormGroup;
  today: Date = new Date();
  _abonado: Abonados = new Abonados();
  _cliente: Clientes = new Clientes();
  _categoria: Categoria = new Categoria();
  _ruta: Rutas = new Rutas();
  _facturas: any;
  _rubros: any;
  _documentos: any;
  subtotal: number = 0;
  intereses: number = 0;
  total: number = 0;
  totalrubros: number = 0;
  modalTitle: string = 'Simular remisión';
  swdisable: Boolean = false;
  swdmodal: string = 'simular';
  tableSize: string = 'md';
  fectopedeuda = '2024-12-09';
  fectopepago = '2025-06-30';
  constructor(
    private fb: FormBuilder,
    private coloresService: ColoresService,
    private s_abonados: AbonadosService,
    private s_clientes: ClientesService,
    private s_facturas: FacturaService,
    private s_loading: LoadingService,
    private s_rubroxfac: RubroxfacService,
    private s_documentos: DocumentosService,
    private authService: AutorizaService,
    private s_remision: RemisionService,
    private s_facxremi: FacxremiService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/cv-facturas');
    let coloresJSON = sessionStorage.getItem('/cv-facturas');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();
    let d = this.today.toISOString().slice(0, 10);
    this.f_buscar = this.fb.group({
      cuenta: '',
      fechatope: this.fectopedeuda,
    });
    this.f_simular = this.fb.group({
      porcentaje: [20, Validators.required],
      cuotas: [1, Validators.required],
      inicial: 0,
      mensual: 0,
      final: 0,
      documento: '',
      referencia: '',
    });
    this.getAllDocuments();
  }
  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }
  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, 'cv-facturas');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/cv-facturas', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }
  getFacturasByCuenta() {
    this.subtotal = 0;
    this.intereses = 0;
    this.total = 0;
    this.s_abonados.getById(+this.f_buscar.value.cuenta!).subscribe({
      next: (abonado: any) => {
        console.log(abonado);
        this._abonado = abonado;
        this._categoria = abonado.idcategoria_categorias;
        this._ruta = abonado.idruta_rutas;
        this.getCliente(abonado.idresponsable.idcliente);
      },
    });
  }
  getAllDocuments() {
    this.s_documentos.getListaDocumentos().subscribe({
      next: (documentos: any) => {
        console.log(documentos);
        this._documentos = documentos;
        this.f_simular.patchValue({
          documento: documentos[0],
        });
      },
      error: (e: any) => console.error(e),
    });
  }
  getRubros(idcliente: number) {
    this.totalrubros = 0;
    this.s_rubroxfac
      .getRubrosForRemisiones(idcliente, this.f_buscar.value.fechatope)
      .then((rubros: any) => {
        console.log(rubros);
        this._rubros = rubros;
        rubros.forEach((i: any) => {
          this.totalrubros += i.sum;
        });
      });
  }
  getCliente(idcliente: any) {
    this._facturas = [];
    this._rubros = [];
    this.s_loading.showLoading();
    this.s_clientes.getListaById(idcliente).subscribe({
      next: (cliente: any) => {
        console.log(cliente);
        this._cliente = cliente;
        this.getFacturasForRemision(cliente.idcliente);
        this.getRubros(cliente.idcliente);
      },
    });
  }
  getFacturasForRemision(idcliente: any) {
    console.log(idcliente);
    this.s_facturas
      .getFacturasForRemision(idcliente, '2024-12-10')
      .then((item: any) => {
        let subtotal = 0;
        let total = 0;
        let sumIntereses = 0;
        console.log(item);
        item.forEach((i: any) => {
          console.log(i);
          subtotal += i.total;
          sumIntereses += i.intereses;
          total += i.total + i.intereses;
        });

        this._facturas = item;
        this.s_loading.hideLoading();
        this.subtotal = subtotal;
        this.intereses = sumIntereses;
        this.total = total;
      });
  }
  suma(total: number, interes: number) {
    return (total + interes).toFixed(2);
  }

  modal(option: string) {
    this.swdmodal = option;
    switch (option) {
      case 'simular':
        this.modalTitle = 'Simular remisión';
        this.tableSize = 'lg';
        break;
      case 'rubros':
        this.modalTitle = 'Detalle Rubros';
        this.tableSize = 'md';
        break;
    }
  }
  changeCuota(e: any) {
    console.log(e.target.value);
    let f = this.f_simular.value;
    let subtotal = this.subtotal;
    if (+e.target.value! > 1) {
      console.log('Mas de una cuota, hay que calcular el valor de los rubros');
      let inicial = (subtotal * +f.porcentaje!) / 100;
      //let mensual = ((subtotal - inicial) / f.cuotas)-final;
      let p = subtotal - inicial;
      let mensual = this.calcularCuotaFija(p, 0, f.cuotas);
      let final = this.calcularCuotaFinalVariable(p, 0, f.cuotas);
      this.f_simular.patchValue({
        inicial: inicial.toFixed(2),
        mensual: mensual.toFixed(2),
        final: final.toFixed(2),
      });

      console.log(inicial, p);
    } else {
      console.log(
        'El valor de los rubros sigue normal sin cambios, hay que crear una sola factura '
      );
      this.f_simular.patchValue({
        inicial: 0,
        final: 0,
        mensual: this.subtotal.toFixed(2),
      });
    }
  }

  calcularCuotaFija(P: number, r: number, n: number): number {
    // Validaciones
    if (
      typeof P !== 'number' ||
      typeof r !== 'number' ||
      typeof n !== 'number'
    ) {
      throw new Error('Todos los parámetros deben ser números.');
    }
    if (P <= 0 || n <= 0) {
      throw new Error(
        'El monto principal (P) y el número de cuotas (n) deben ser mayores que cero.'
      );
    }
    if (r < 0) {
      throw new Error('La tasa de interés (r) no puede ser negativa.');
    }
    // Si la tasa de interés es cero
    if (r === 0) {
      console.log('La tasa de interés es cero. La cuota es simplemente P / n.');
      return P / n;
    }

    // Convertir la tasa de interés a decimal si está en porcentaje
    if (r > 1) {
      console.warn(
        'La tasa de interés (r) parece estar en porcentaje. Se convertirá a decimal.'
      );
      r = r / 100;
    }

    // Calcular el factor
    const factor = (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    // Verificar si el factor es NaN
    if (isNaN(factor)) {
      throw new Error(
        'No se pudo calcular el factor. Verifica los valores de r y n.'
      );
    }

    return P * factor;
  }

  calcularCuotaFinalVariable(P: number, r: number, n: number): number {
    const amortizacion = P / n;
    const intereses = amortizacion * r;
    return amortizacion + intereses;
  }
  aprobarRemision() {
    this.s_loading.showLoading();
    let f = this.f_simular.value;
    let remision: Remision = new Remision();
    remision.idabonado_abonados = this._abonado;
    remision.idcliente_clientes = this._cliente;
    remision.cuotas = f.cuotas;
    remision.fectopedeuda = new Date(this.fectopedeuda);
    remision.fectopepago = new Date(this.fectopepago);
    remision.totcapital = this.subtotal;
    remision.totintereses = this.intereses;
    if (f.cuotas === 1) {
      remision.swconvenio = false;
    } else {
      remision.swconvenio = true;
    }
    remision.usucrea = this.authService.idusuario;
    remision.feccrea = this.today;
    remision.iddocumento_documentos = f.documento;
    remision.detalledocumento = f.referencia;
    remision.idconvenio = 0;
    this.s_remision.saveRemision(remision).subscribe((_rem: any) => {
      console.log('GUARDANDO REMISION ', _rem);

      this._facturas.forEach(async (factura: any, i: number) => {
        let fxr: Facxremi = new Facxremi();
        let fact: Facturas = new Facturas();
        fxr.idfactura_facturas = factura;
        fxr.idremision_remisiones = _rem;
        fxr.cuota = 0;
        fxr.tipfactura = 1;
        this.s_facxremi.savefacxremi(fxr).subscribe((fr: any) => {
          console.log('GUARDANDO FXR', fr);
          this.s_loading.hideLoading();
        });
        factura.conveniopago = 1;
        factura.fechaconvenio = this.today;
        factura.usumodi = this.authService.idusuario;
        factura.fecmodi = this.today;
        await this.s_facturas.updateFacturaAsync(factura);
      });
    });

    console.log(this.f_simular.value);
    /* VALIDAR SI LAS CUOTAS SON MAYORES A 1 */
    /* SI SON MAYORES A 1 HAY QUE HACER EL CALCULO DE LOS VALORES */
    /* actualizar facturas antiguas para que esten cobradas y en estado de convenio */
    /*  */
    console.log(this._facturas);
    console.log(this._rubros);
    console.log(remision);
  }
}
