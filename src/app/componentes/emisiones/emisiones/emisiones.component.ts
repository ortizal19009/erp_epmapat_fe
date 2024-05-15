import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EmisionService } from 'src/app/servicios/emision.service';
import { RutasxemisionService } from 'src/app/servicios/rutasxemision.service';
import { NombreEmisionPipe } from 'src/app/pipes/nombre-emision.pipe';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { ColoresService } from 'src/app/compartida/colores.service';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { PdfService } from 'src/app/servicios/pdf.service';
import { Clientes } from 'src/app/modelos/clientes';
import { Abonados } from 'src/app/modelos/abonados';
import { Rutas } from 'src/app/modelos/rutas.model';
import { Lecturas } from 'src/app/modelos/lecturas.model';
import { Emisiones } from 'src/app/modelos/emisiones.model';
import { Novedad } from 'src/app/modelos/novedad.model';
import { Modulos } from 'src/app/modelos/modulos.model';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { NovedadesService } from 'src/app/servicios/novedades.service';
import { Pliego24Service } from 'src/app/servicios/pliego24.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { Facturas } from 'src/app/modelos/facturas.model';
import { EmisionIndividualService } from 'src/app/servicios/emision-individual.service';
import { EmisionIndividual } from 'src/app/modelos/emisionindividual.model';

@Component({
  selector: 'app-emisiones',
  templateUrl: './emisiones.component.html',
  styleUrls: ['./emisiones.component.css'],
})
export class EmisionesComponent implements OnInit {
  formBuscar: FormGroup;
  formAddEmision: FormGroup;
  f_emisionIndividual: FormGroup;
  f_lecturas: FormGroup;
  filtro: string;
  swfiltro: boolean;
  _emisiones: any;
  disabled = false;
  _rutasxemi: any;
  selEmision: string = '0';
  showDiv: boolean;
  cerrado: number; //Controla [Nuevo]
  swcerrar: boolean; //Controla 'Cerrar emision'
  abiertos: number;
  idemision: number;
  estado: number; //Para enviar a info()
  subtotal: number;
  nuevaemision: String;
  otraPagina: boolean = false;
  archExportar: string;
  opcExportar: number;
  swgenerar: boolean = false; //Controla el si hay rutas por emisión (DIV mensaje 'Gnerar ?')
  totalSuma: number = 0;
  _rubrosEmision: any;
  optImprimir = '0';
  suma: number = 0;
  _allemisiones: any;
  abonado: Abonados = new Abonados();
  cliente: Clientes = new Clientes();
  ruta: Rutas = new Rutas();
  optabonado: boolean = true;
  _lectura: Lecturas = new Lecturas();
  modulo: Modulos = new Modulos();
  fechaemision: Date;
  novedades: any;
  /* emision individual */
  _lecturas: any = [];
  tarifa: any;
  rubros: any = [];
  _rubroxfac: any;
  newtotal: number;
  lecturaestado: number = 0;
  idfactura: number;
  ctotal: number;
  listar: boolean = true;
  emision: any;
  _emisionindividual: any;

  porcResidencial: number[] = [
    0.777, 0.78, 0.78, 0.78, 0.78, 0.778, 0.778, 0.778, 0.78, 0.78, 0.78, 0.68,
    0.68, 0.678, 0.68, 0.68, 0.678, 0.678, 0.68, 0.68, 0.678, 0.676, 0.678,
    0.678, 0.678, 0.68, 0.647, 0.65, 0.65, 0.647, 0.647, 0.65, 0.65, 0.647,
    0.647, 0.65, 0.65, 0.65, 0.65, 0.65, 0.65, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7,
    0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7,
    0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7,
  ];

  constructor(
    public fb: FormBuilder,
    private emiService: EmisionService,
    private router: Router,
    private coloresService: ColoresService,
    public authService: AutorizaService,
    private ruxemiService: RutasxemisionService,
    private s_lecturas: LecturasService,
    private _pdf: PdfService,
    private aboService: AbonadosService,
    private facService: FacturaService,
    private s_novedades: NovedadesService,
    private pli24Service: Pliego24Service,
    private rxfService: RubroxfacService,
    private s_emisionindividual: EmisionIndividualService,
    private s_pdf: PdfService,
    private s_rxfService: RubroxfacService
  ) {}

  ngOnInit(): void {
    this.modulo.idmodulo = 4;
    //this.fechaemision = new Date(anio, mes - 1, 1)
    sessionStorage.setItem('ventana', '/emisiones');
    let coloresJSON = sessionStorage.getItem('/emisiones');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    this.formBuscar = this.fb.group({
      desde: '',
      hasta: '',
    });

    let hasta: String;
    this.emiService.ultimo().subscribe({
      next: (datos) => {
        this.fechaemision = datos.feccrea;
        this.cerrado = datos.estado;
        hasta = datos.emision;
        this.f_emisionIndividual.patchValue({
          emision: datos.idemision,
        });
        let desde = (+hasta.slice(0, 2)! - 1).toString() + hasta.slice(2);
        this.formBuscar.patchValue({
          desde: desde,
          hasta: hasta,
        });
        this.buscar();
      },
      error: (err) => console.error(err.error),
    });
    this.f_lecturas = this.fb.group({
      lecturaanterior: 0,
      lecturaactual: 0,
      idnovedad_novedades: '',
    });
    let date: Date = new Date();
    this.formAddEmision = this.fb.group({
      emision: '',
      estado: 0,
      observaciones: '',
      m3: 0,
      usucrea: this.authService.idusuario,
      feccrea: date,
    });
    this.f_emisionIndividual = this.fb.group({
      emision: [],
      abonado: [],
    });
    this.getAllEmisiones();
    this.getAllNovedades();
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
      const datos = await this.coloresService.setcolor(
        this.authService.idusuario,
        'emisiones'
      );
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/emisiones', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  buscar() {
    this.emiService
      .getDesdeHasta(this.formBuscar.value.desde, this.formBuscar.value.hasta)
      .subscribe({
        next: (datos) => {
          this._emisiones = datos;
          const showDivValue = sessionStorage.getItem('showDiv');
          if (showDivValue === 'true') {
            this.showDiv = true;
            let indiEmi = +sessionStorage.getItem('indiEmi')!;
            this.info(this._emisiones[indiEmi], indiEmi);
          }
        },
        error: (err) => console.error(err.error),
      });
  }

  eliminaEmision(idemision: number) {
    sessionStorage.setItem('idemisionToDelete', idemision.toString());
  }

  modificar(idemision: number) {
    this.router.navigate(['modiemision', idemision]);
  }

  //Buscas las Rutas de la emisión seleccionada (Recibe la emisión y el indice seleccionado)
  info(emision: any, indiEmi: number) {
    this.showDiv = true;
    sessionStorage.setItem('showDiv', 'true');
    sessionStorage.setItem('indiEmi', indiEmi.toString());
    this.idemision = emision.idemision;
    this.selEmision = emision.emision;
    this.estado = emision.estado;

    this.ruxemiService.getByIdEmision(this.idemision).subscribe({
      next: (datos) => {
        this._rutasxemi = datos;
        this.s_lecturas.rubrosEmitidos(this.idemision).subscribe({
          next: (datos: any) => {
            datos.forEach((item: any) => {
              if (item[0] != 5) {
                this.totalSuma += item[2];
              }
            });
            this._rubrosEmision = datos;
          },
          error: (e) => console.error(e),
        });
        this.total();
        if (this._rutasxemi.length == 0) {
          this.showDiv = false;
          this.swgenerar = true;
        } else this.swgenerar = false;
      },
      error: (err) => console.error(err.error),
    });
  }

  generar() {
    sessionStorage.setItem('idemisionToGenerar', this.idemision.toString());
    this.router.navigate(['gene-emision']);
  }

  nogenerar() {
    this.swgenerar = false;
  }

  ocultar() {
    this.showDiv = false;
    sessionStorage.setItem('showDiv', 'false');
  }

  lecturas(idrutaxemision: number) {
    sessionStorage.setItem(
      'idrutaxemisionToLectura',
      idrutaxemision.toString()
    );
    this.router.navigate(['lecturas']);
  }

  onInputChange() {
    if (this.filtro.trim() !== '') {
      this.swfiltro = true;
    } else {
      this.swfiltro = false;
    }
  }

  total() {
    let subtotal = 0;
    this.swcerrar = true;
    for (let i = 0; i < this._rutasxemi.length; i++) {
      subtotal = subtotal + this._rutasxemi[i].m3;
      if (this._rutasxemi[i].estado == 0) this.swcerrar = false;
    }
    this.subtotal = subtotal;
    if (this.estado == 1) this.swcerrar = false;
  }

  cerrar() {
    this.ruxemiService.countEstado(this.idemision).subscribe({
      next: (abiertos) => (this.abiertos = +abiertos),
      error: (err) => console.error(err.error),
    });
  }

  cerrarEmision() {
    this.emiService.getByIdemision(this.idemision).subscribe({
      next: (datos) => {
        datos.m3 = this.subtotal;
        datos.estado = 1;
        datos.usuariocierre = this.authService.idusuario;
        const fechaHora = new Date();
        const data = { fechaHora: fechaHora.toISOString() };
        datos.fechacierre = fechaHora;
        this.emiService.update(this.idemision, datos).subscribe({
          next: (nex) => {
            this.cerrado = 1;
            this.buscar();
          },
          error: (err) => console.error(err.error),
        });
      },
      error: (err) => console.error(err.error),
    });
  }

  nuevo() {
    this.emiService.ultimo().subscribe({
      next: (datos) => {
        let nuevoaño: string;
        let nuevomes: string;
        let año = datos.emision.substring(0, 2);
        let mes = datos.emision.substring(datos.emision.length - 2);
        if (mes == '12') {
          nuevomes = '01';
          nuevoaño = año + 1;
        } else {
          nuevoaño = año;
          nuevomes = (+mes + 1).toString().padStart(2, '0');
        }
        this.nuevaemision = nuevoaño.concat(nuevomes);
        this.formAddEmision.patchValue({ emision: this.nuevaemision });
      },
      error: (err) => console.error(err.error),
    });
  }

  saveEmision() {
    this.emiService.saveEmision(this.formAddEmision.value).subscribe({
      next: (dato) => {
        const idRegistroCreado = dato;
        this.cerrado = 0;
        this.formBuscar.controls['hasta'].setValue(this.nuevaemision);
        this.buscar();
      },
      error: (err) => console.error(err.error),
    });
  }

  /*=====================
  ======INDIVIDUALES=====
  =====================*/
  emisionIndividual() {}
  getAllEmisiones() {
    this.emiService.findAllEmisiones().subscribe({
      next: (datos: any) => {
        this.emision = datos[0].idemision;
        this._allemisiones = datos;
        this.getEmisionIndividualByIdEmision(datos[0].idemision);
      },
      error: (e) => console.error(e),
    });
  }
  viewAbonadosOpt() {
    this.optabonado = false;
  }
  getEmisionIndividualByIdEmision(idemision: number) {
    this.s_emisionindividual.getByIdEmision(idemision).subscribe({
      next: (datos: any) => {
        this._emisionindividual = datos;
      },
      error: (e) => console.error(e),
    });
  }
  setAbonado(abonado: any) {
    this.abonado = abonado;
    this.cliente = abonado.idcliente_clientes;
    this.ruta = abonado.idruta_rutas;
    this.optabonado = true;
    this.f_emisionIndividual.patchValue({
      abonado: abonado.idabonado,
    });
    this.s_lecturas
      .getByIdEmisionIdabonado(
        this.f_emisionIndividual.value.emision,
        abonado.idabonado
      )
      .subscribe({
        next: (datos: any) => {
          this._lectura = datos[0];
          this.f_lecturas.patchValue({
            lecturaanterior: datos[0].lecturaanterior,
            lecturaactual: datos[0].lecturaactual,
            idnovedad_novedades: datos[0].idnovedad_novedades,
          });
        },
        error: (e) => console.error(e),
      });
  }
  //Generar nueva emision individual(){
  saveEmisionIndividual() {
    this.generaRutaxemisionIndividual();
  }
  async generaRutaxemisionIndividual() {
    if (this.cerrado === 0) {
      this.lecturaestado = 0;
      let novedad: Novedad = new Novedad();
      novedad.idnovedad = 1;
      let rutasxemision = {} as Rutasxemision;
      let emision: Emisiones = new Emisiones();
      let ruta: Rutas = new Rutas();
      ruta.idruta = this.ruta.idruta;
      emision.idemision = this.idemision;
      this.ruxemiService
        .getByEmisionRuta(emision.idemision, ruta.idruta)
        .subscribe({
          next: (datos: any) => {
            rutasxemision = datos;
            this.generaLecturaIndividual(rutasxemision, novedad);
          },
          error: (e) => console.error(e),
        });
    }
    if (this.cerrado === 1) {
      this.lecturaestado = 1;
      let novedad: Novedad = new Novedad();
      novedad.idnovedad = this.f_lecturas.value.idnovedad_novedades;
      let rutasxemision = {} as Rutasxemision;
      let emision: Emisiones = new Emisiones();
      let ruta: Rutas = new Rutas();
      ruta.idruta = this.ruta.idruta;
      emision.idemision = this.idemision;
      this.ruxemiService
        .getByEmisionRuta(emision.idemision, ruta.idruta)
        .subscribe({
          next: (datos: any) => {
            rutasxemision = datos;
            this.generaLecturaIndividual(rutasxemision, novedad);
            this._lectura.estado = 1;
            this.s_lecturas.updateLecturaAsync(
              this._lectura.idlectura,
              this._lectura
            );
          },
          error: (e) => console.error(e),
        });
    }
  }
  //Genera las lecturas de los abonados de la nueva Rutaxemision
  async generaLecturaIndividual(nuevarutaxemi: any, novedad: any) {
    try {
      let dateEmision: Date = new Date();
      // for (let k = 0; k < 2; k++) {
      //Primero crea la Factura (Planilla) para cada Abonado para luego ponerla en las Lecturas
      let planilla = {} as Planilla;
      planilla.idmodulo = this.modulo;
      this.cliente = new Clientes();
      this.cliente.idcliente = this.abonado.idresponsable.idcliente;
      planilla.idcliente = this.cliente;
      planilla.idabonado = this.abonado.idabonado;
      planilla.porcexoneracion = 0;
      planilla.totaltarifa = 0;
      planilla.pagado = 0;
      planilla.conveniopago = 0;
      planilla.estadoconvenio = 0;
      planilla.formapago = 1;
      planilla.valorbase = 0;
      planilla.usucrea = this.authService.idusuario;
      planilla.estado = 1;
      planilla.feccrea = dateEmision;
      //let nuevoIdfactura = k; Solo para pruebas, para que no genere las facturas
      let nuevoIdfactura: number = 0;
      try {
        //Crea la planilla con el metodo que devuelve el idfactura generado
        nuevoIdfactura = await this.facService.saveFacturaAsyncId(planilla);
        this.idfactura = nuevoIdfactura;
      } catch (error) {
        console.error(`Al guardar la Factura (planilla)`, error);
      }
      //Ahora si crea la Lectura para cada Abonado
      let lectura = {} as Lectura;
      lectura.estado = this.lecturaestado;
      lectura.fechaemision = dateEmision;
      /*       try {
        let lecturaanterior = await this.s_lecturas.getUltimaLecturaAsync(
          this.abonado.idabonado
        );
        if (!lecturaanterior) {
          lecturaanterior = 0;
        }
        lectura.lecturaanterior = lecturaanterior;
      } catch (error) {
        console.error(`Al buscar la Última lectura`, error);
      } */
      lectura.lecturaanterior = this.f_lecturas.value.lecturaanterior;
      lectura.lecturaactual = this.f_lecturas.value.lecturaactual;
      lectura.lecturadigitada = this.f_lecturas.value.lecturaactual;
      lectura.mesesmulta = 0;
      lectura.idnovedad_novedades = novedad;
      lectura.idemision = this.idemision;
      lectura.idabonado_abonados = this.abonado;
      lectura.idresponsable = this.abonado.idresponsable.idcliente;
      lectura.idcategoria = this.abonado.idcategoria_categorias.idcategoria;
      lectura.idrutaxemision_rutasxemision = nuevarutaxemi;
      lectura.total1 = 0;
      lectura.idfactura = nuevoIdfactura;
      try {
        let newLectura = await this.s_lecturas.saveLecturaAsync(lectura);
        await this.planilla(newLectura);
      } catch (error) {
        console.error(`Al guardar La lectura`, error);
      }
    } catch (error) {
      console.error(`Al recuperar los Abonados por ruta `, error);
    }
  }
  lemisionIndividuao(e: any) {
    this.getEmisionIndividualByIdEmision(this.emision);
  }
  async planilla(lectura: Lecturas) {
    let emision_individual: EmisionIndividual = new EmisionIndividual();
    let ln = new Lecturas();
    let la = new Lecturas();
    let emi = new Emisiones();

    ln.idlectura = lectura.idlectura;
    la.idlectura = this._lectura.idlectura;
    emi.idemision = lectura.idemision;
    emision_individual.idlecturanueva = ln;
    emision_individual.idlecturaanterior = la;
    emision_individual.idemision = emi;
    this.s_emisionindividual
      .saveEmisionIndividual(emision_individual)
      .subscribe({
        next: (d_emisionIndividual: any) => {},
        error: (e) => console.error(e),
      });
    //this.swcalcular = true;
    let categoria =
      lectura.idabonado_abonados.idcategoria_categorias.idcategoria;
    let consumo = lectura.lecturaactual - lectura.lecturaanterior;
    let adultomayor = lectura.idabonado_abonados.adultomayor;
    let noAlcantarillado = lectura.idabonado_abonados.swalcantarillado;
    if (adultomayor)
      if (categoria == 9 && consumo > 34) categoria = 1;
      else if (categoria == 9 && consumo > 10) categoria = 1;
    if (categoria == 9 && consumo > 34) categoria = 1;
    if (categoria == 1 && consumo > 70) categoria = 2;
    let municipio = lectura.idabonado_abonados.municipio;
    let num1: number;
    let swcate9: boolean; //No hay Tarifas para Categoria 9 es el 50% de la 1
    if (categoria == 9) {
      categoria = 1;
      swcate9 = true;
    }
    let swmunicipio: boolean; //Instituciones del Municipio 50% de la Tarifa Oficial
    if (categoria == 4 && municipio) {
      swmunicipio = true;
    }
    // Obtiene la tarifa del nuevo Pliego
    this.pli24Service.getBloque(categoria, consumo).subscribe({
      next: async (resp) => {
        if (!resp) {
          //No hay Tarifa para esta Categoría y Consumo
        } else {
          this.tarifa = resp;

          if (categoria == 1) {
            num1 =
              Math.round(
                (this.tarifa[0].idcategoria.fijoagua - 0.1) *
                  this.porcResidencial[consumo] *
                  100
              ) / 100;
          } else {
            num1 =
              Math.round(
                (this.tarifa[0].idcategoria.fijoagua - 0.1) *
                  this.tarifa[0].porc *
                  100
              ) / 100;
          }

          let num2 =
            Math.round(
              (this.tarifa[0].idcategoria.fijosanea - 0.5) *
                this.tarifa[0].porc *
                100
            ) / 100;
          let num3 =
            Math.round(
              consumo * this.tarifa[0].agua * this.tarifa[0].porc * 100
            ) / 100;
          let num4 =
            Math.round(
              ((consumo * this.tarifa[0].saneamiento) / 2) *
                this.tarifa[0].porc *
                100
            ) / 100;
          let num5 =
            Math.round(
              ((consumo * this.tarifa[0].saneamiento) / 2) *
                this.tarifa[0].porc *
                100
            ) / 100;
          let num7 = Math.round(0.5 * this.tarifa[0].porc * 100) / 100;
          let suma: number = 0;
          if (noAlcantarillado === true) {
            num2 = 0;
            num4 = 0;
            num7 = 0;
            num5 = 0;
          }
          suma =
            Math.round((num1 + num2 + num3 + num4 + num5 + 0.1 + num7) * 100) /
            100;
          //Categoria 9 no tiene tarifario es el 50% de la Residencial. Abonados del Municipio también 50%
          if (swcate9 || swmunicipio) suma = Math.round((suma / 2) * 100) / 100;
          this.newtotal = suma;
          let rxf: any = {};
          this.rubros = [];
          if (swcate9 || swmunicipio) {
            let rub1002: number;
            let rub1003: number;
            //Alcantarillado / 2
            if (num2 + num4 + num7 > 0)
              rub1002 = Math.round(((num2 + num4 + num7) / 2) * 100) / 100;
            else rub1002 = 0;
            //Saneamiento / 2
            if (num5 > 0) rub1003 = Math.round((num5 / 2) * 100) / 100;
            else rub1003 = 0;
            //Agua portable por diferencia con la suma
            let rub1001 = suma - rub1002 - rub1003 - 0.1;
            rxf = {
              idrubro_rubros: { idrubro: 1001 },
              idfactura_facturas: { idfactura: this.idfactura },
              estado: 1,
              cantidad: 1,
              valorunitario: rub1001,
            };
            this.rubros.push(rxf);
            rxf = {
              idrubro_rubros: { idrubro: 1002 },
              idfactura_facturas: { idfactura: this.idfactura },
              estado: 1,
              cantidad: 1,
              valorunitario: rub1002,
            };
            this.rubros.push(rxf);
            rxf = {
              idrubro_rubros: { idrubro: 1003 },
              idfactura_facturas: { idfactura: this.idfactura },
              estado: 1,
              cantidad: 1,
              valorunitario: rub1003,
            };
            this.rubros.push(rxf);
            rxf = {
              idrubro_rubros: { idrubro: 1004 },
              idfactura_facturas: { idfactura: this.idfactura },
              estado: 1,
              cantidad: 1,
              valorunitario: 0.1,
            };
            this.rubros.push(rxf);
          } else {
            rxf = {
              idrubro_rubros: { idrubro: 1001 },
              idfactura_facturas: { idfactura: this.idfactura },
              estado: 1,
              cantidad: 1,
              valorunitario: num1 + num3,
            };
            this.rubros.push(rxf);
            rxf = {
              idrubro_rubros: { idrubro: 1002 },
              idfactura_facturas: { idfactura: this.idfactura },
              estado: 1,
              cantidad: 1,
              valorunitario: num2 + num4 + num7,
            };
            this.rubros.push(rxf);
            rxf = {
              idrubro_rubros: { idrubro: 1003 },
              idfactura_facturas: { idfactura: this.idfactura },
              estado: 1,
              cantidad: 1,
              valorunitario: num5,
            };
            this.rubros.push(rxf);
            rxf = {
              idrubro_rubros: { idrubro: 1004 },
              idfactura_facturas: { idfactura: this.idfactura },
              estado: 1,
              cantidad: 1,
              valorunitario: 0.1,
            };
            this.rubros.push(rxf);
          }
        }
        let calcular = 0;
        this.rubros.forEach((item: any) => {
          calcular += item.valorunitario;
          this.rxfService.saveRubroxfac(item).subscribe({
            next: (datos) => {
            },
            error: (e) => console.error(e),
          });
        });
        /*         let factu: Facturas = new Facturas();
        factu.idfactura = this.idfactura;
        factu.totaltarifa = calcular;
        factu.valorbase = calcular;
        console.log(calcular);
        console.log(factu); */
        this.facService.getById(this.idfactura).subscribe({
          next: async (factura: any) => {
            factura.totaltarifa = calcular;
            factura.valorbase = calcular;
            await this.facService.updateFacturaAsync(factura);
          },
          error: (e) => console.error(e),
        });
      },
      error: (err) => console.error(err.error),
    });
  }
  getAllNovedades() {
    this.s_novedades.getAll().subscribe({
      next: (datos: any) => {
        this.novedades = datos;
      },
      error: (e) => console.error(e),
    });
  }
  compararNovedades(o1: Novedad, o2: Novedad): boolean {
    if (o1 === undefined && o2 === undefined) {
      return true;
    } else {
      return o1 === null || o2 === null || o1 === undefined || o2 === undefined
        ? false
        : o1.idnovedad == o2.idnovedad;
    }
  }

  /*   rubroxfac() {
    this.rxfService.getByIdfactura(this.idfactura).subscribe({
      next: (datos) => {
        this._rubroxfac = datos;
        this.csubtotal();
      },
      error: (err) => console.error(err.error),
    });
  } */

  csubtotal() {
    let suma: number = 0;
    let i = 0;
    this._rubroxfac.forEach(() => {
      suma += this._rubroxfac[i].cantidad * this._rubroxfac[i].valorunitario;
      i++;
    });
    this.ctotal = Math.round(suma * 100) / 100;
    //this.finbusca = true
  }

  /* ===================================== */
  /* =============REPORTES================ */
  /* ===================================== */
  //Emisiones
  pdf() {
    const nombreEmision = new NombreEmisionPipe(); // Crea una instancia del pipe
    let m_izquierda = 20;
    var doc = new jsPDF();
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('EpmapaT', m_izquierda, 10);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('EMISIONES', m_izquierda, 16);
    // doc.setFont("times", "bold"); doc.setFontSize(11); doc.text('Emisión: ', m_izquierda, 20);
    // doc.setFont("times", "normal"); doc.setFontSize(11); doc.text(nombreEmision.transform(this.rutaxemision.emision), m_izquierda + 16, 20);
    // doc.setFont("times", "bold"); doc.setFontSize(11); doc.text('Ruta:', m_izquierda, 24);
    // doc.setFont("times", "normal"); doc.setFontSize(11); doc.text(this.rutaxemision.ruta.toString(), m_izquierda + 12, 24)

    var datos: any = [];
    var i = 0;
    this._emisiones.forEach(() => {
      datos.push([
        nombreEmision.transform(this._emisiones[i].emision),
        this._emisiones[i].m3,
        this._emisiones[i].fechacierre,
      ]);
      i++;
    });
    // datos.push(['', 'TOTAL', '', '', '', this.sumtotal.toLocaleString('en-US')]);

    const addPageNumbers = function () {
      const pageCount = doc.internal.pages.length;
      for (let i = 1; i <= pageCount - 1; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
          'Página ' + i + ' de ' + (pageCount - 1),
          m_izquierda,
          doc.internal.pageSize.height - 10
        );
      }
    };

    autoTable(doc, {
      head: [['Emision', 'm3', 'Fecha Cierre']],
      theme: 'grid',
      headStyles: {
        fillColor: [68, 103, 114],
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 1,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 40 },
        1: { halign: 'right', cellWidth: 18 },
        2: { halign: 'center', cellWidth: 60 },
      },
      margin: { left: m_izquierda - 1, top: 19, right: 8, bottom: 13 },
      body: datos,

      didParseCell: function (data) {
        var fila = data.row.index;
        var columna = data.column.index;
        if (columna > 0 && typeof data.cell.raw === 'number') {
          data.cell.text = [data.cell.raw.toLocaleString('en-US')];
        }
      },
    });
    addPageNumbers();

    var opciones = {
      filename: 'lecturas.pdf',
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    };

    if (this.otraPagina) doc.output('dataurlnewwindow', opciones);
    else {
      const pdfDataUri = doc.output('datauristring');
      //Si ya existe el <embed> primero lo remueve
      const elementoExistente = document.getElementById('idembed');
      if (elementoExistente) {
        elementoExistente.remove();
      }
      //Crea el <embed>
      var embed = document.createElement('embed');
      embed.setAttribute('src', pdfDataUri);
      embed.setAttribute('type', 'application/pdf');
      embed.setAttribute('width', '50%');
      embed.setAttribute('height', '100%');
      embed.setAttribute('id', 'idembed');
      //Agrega el <embed> al contenedor del Modal
      var container: any;
      container = document.getElementById('pdf');
      container.appendChild(embed);
    }
  }

  //Rutas por Emisión
  pdf1() {
    const nombreEmision = new NombreEmisionPipe(); // Crea una instancia del pipe
    let m_izquierda = 30;
    var doc = new jsPDF();
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('EpmapaT', m_izquierda, 10);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('RUTAS POR EMISIÓN', m_izquierda, 16);
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text('Emisión: ', m_izquierda, 20);
    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.text(nombreEmision.transform(this.selEmision), m_izquierda + 16, 20);

    var datos: any = [];
    var i = 0;
    this._rutasxemi.forEach(() => {
      let fecha: string;
      if (this._rutasxemi[i].fechacierre == null) fecha = '';
      else fecha = this._rutasxemi[i].fechacierre.slice(0, 10);
      datos.push([
        i + 1,
        this._rutasxemi[i].idruta_rutas.codigo,
        this._rutasxemi[i].idruta_rutas.descripcion,
        fecha,
        this._rutasxemi[i].m3,
      ]);
      i++;
    });
    datos.push([
      '',
      '',
      'TOTAL',
      `$ ${this.totalSuma.toFixed(2)}`,
      `${this.subtotal.toLocaleString('en-US')} m3`,
    ]);

    const addPageNumbers = function () {
      const pageCount = doc.internal.pages.length;
      for (let i = 1; i <= pageCount - 1; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
          'Página ' + i + ' de ' + (pageCount - 1),
          m_izquierda,
          doc.internal.pageSize.height - 10
        );
      }
    };

    autoTable(doc, {
      head: [['#', 'Código', 'Ruta', 'Fecha Cierre', 'm3']],
      theme: 'grid',
      headStyles: {
        fillColor: [68, 103, 114],
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 1,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'left', cellWidth: 60 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 20 },
      },
      margin: { left: m_izquierda - 1, top: 22, right: 51, bottom: 13 },
      body: datos,

      didParseCell: function (data) {
        var fila = data.row.index;
        var columna = data.column.index;
        if (columna > 0 && typeof data.cell.raw === 'number') {
          data.cell.text = [data.cell.raw.toLocaleString('en-US')];
        }
        if (fila === datos.length - 1 || columna == 0) {
          data.cell.styles.fontStyle = 'bold';
        } // Total Bold
      },
    });
    addPageNumbers();

    var opciones = {
      filename: 'lecturas.pdf',
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    };

    if (this.otraPagina) doc.output('dataurlnewwindow', opciones);
    else {
      const pdfDataUri = doc.output('datauristring');
      //Si ya existe el <embed> primero lo remueve
      const elementoExistente = document.getElementById('idembed');
      if (elementoExistente) {
        elementoExistente.remove();
      }
      //Crea el <embed>
      var embed = document.createElement('embed');
      embed.setAttribute('src', pdfDataUri);
      embed.setAttribute('type', 'application/pdf');
      embed.setAttribute('width', '70%');
      embed.setAttribute('height', '100%');
      embed.setAttribute('id', 'idembed');
      //Agrega el <embed> al contenedor del Modal
      var container: any;
      container = document.getElementById('pdf');
      container.appendChild(embed);
    }
  }
  rRubrosxEmision() {
    const nombreEmision = new NombreEmisionPipe(); // Crea una instancia del pipe
    let m_izquierda = 150;
    var doc = new jsPDF('p', 'pt', 'a4');
    this._pdf.header(
      `REPORTE DE RUBROS POR EMISION: ${nombreEmision.transform(
        this.selEmision
      )}`,
      doc
    );
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setFont('times', 'normal');
    doc.setFontSize(11);

    var datos: any = [];
    var i = 0;
    let suma: number = 0;
    this._rubrosEmision.forEach(() => {
      if (this._rubrosEmision[i][0] != 5) {
        /*       if (this._rutasxemi[i].fechacierre == null) fecha = '';
        else fecha = this._rutasxemi[i].fechacierre.slice(0, 10); */
        datos.push([
          i + 1,
          this._rubrosEmision[i][0],
          this._rubrosEmision[i][1],
          this._rubrosEmision[i][2],
        ]);
        suma += this._rubrosEmision[i][2];
      }
      i++;
    });
    datos.push([
      '',
      'TOTAL',
      `${this.subtotal.toLocaleString('en-US')} m3`,
      `$ ${suma.toFixed(2)}`,
    ]);

    const addPageNumbers = function () {
      const pageCount = doc.internal.pages.length;
      for (let i = 1; i <= pageCount - 1; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
          'Página ' + i + ' de ' + (pageCount - 1),
          m_izquierda,
          doc.internal.pageSize.height - 10
        );
      }
    };

    autoTable(doc, {
      head: [['#', 'N°Rubro', 'Descripción', 'Valor']],
      theme: 'grid',
      headStyles: {
        fillColor: [68, 103, 114],
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        font: 'helvetica',
        fontSize: 11,
        cellPadding: 1,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 30 },
        1: { halign: 'center', cellWidth: 60 },
        2: { halign: 'left', cellWidth: 150 },
        3: { halign: 'right', cellWidth: 70 },
      },
      margin: { left: m_izquierda - 1, top: 22, right: 51, bottom: 13 },
      body: datos,

      didParseCell: function (data) {
        var fila = data.row.index;
        var columna = data.column.index;
        if (columna > 0 && typeof data.cell.raw === 'number') {
          data.cell.text = [data.cell.raw.toLocaleString('en-US')];
        }
        if (fila === datos.length - 1 || columna == 0) {
          data.cell.styles.fontStyle = 'bold';
        } // Total Bold
      },
    });
    addPageNumbers();

    var opciones = {
      filename: 'RubrosEmision.pdf',
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    };

    if (this.otraPagina) doc.output('dataurlnewwindow', opciones);
    else {
      const pdfDataUri = doc.output('datauristring');
      //Si ya existe el <embed> primero lo remueve
      const elementoExistente = document.getElementById('idembed');
      if (elementoExistente) {
        elementoExistente.remove();
      }
      //Crea el <embed>
      var embed = document.createElement('embed');
      embed.setAttribute('src', pdfDataUri);
      embed.setAttribute('type', 'application/pdf');
      embed.setAttribute('width', '70%');
      embed.setAttribute('height', '100%');
      embed.setAttribute('id', 'idembed');
      //Agrega el <embed> al contenedor del Modal
      var container: any;
      container = document.getElementById('pdf');
      container.appendChild(embed);
    }
  }
  imprimirReporte() {
    let doc = new jsPDF('p', 'pt', 'a4');
    this.s_pdf.header('REPORETE DE REFACTURACION', doc);
    // doc.autoPrint();
    //doc.save('datauristring');
    doc.output('dataurlnewwindow', { filename: 'comprobante.pdf' });
  }
  async iEmisionIndividual(emisionIndividual: any) {
    let doc = new jsPDF('p', 'pt', 'a4');
    /* HEADER */
    this.s_pdf.header(
      `REPORTE DE REFACTURACION INDIVIDUAL ${emisionIndividual.idemision.emision}`,
      doc
    );

    /* LECTURAS ANTERIORES */
    let lectAnteriores = await this.s_rxfService.getByIdfacturaAsync(
      emisionIndividual.idlecturaanterior.idfactura
    );
    let l_anteriores: any = [];
    let sum_anterior: number = 0;
    let m3_anterior: number =
      emisionIndividual.idlecturaanterior.lecturaactual -
      emisionIndividual.idlecturaanterior.lecturaanterior;
    let anterior_factura = await this.facService.getByIdAsync(
      emisionIndividual.idlecturaanterior.idfactura
    );
    lectAnteriores.forEach((item: any) => {
      l_anteriores.push([
        item.idrubro_rubros.idrubro,
        item.idrubro_rubros.descripcion,
        item.cantidad,
        item.valorunitario.toFixed(2),
      ]);
      sum_anterior += item.cantidad * item.valorunitario;
    });
    autoTable(doc, {
      headStyles: {
        halign: 'center',
        fillColor: 'white',
        textColor: 'black',
      },
      bodyStyles: {
        fillColor: 'white',
        textColor: 'black',
      },
      head: [[{ content: 'Lectura anterior', colSpan: 5 }]],
      body: [
        [
          {
            content: `N° lectura: ${emisionIndividual.idlecturaanterior.idlectura} `,
          },
          {
            content: `Planilla: ${emisionIndividual.idlecturaanterior.idfactura}`,
          },
        ],
        [
          `Lectura ant: ${emisionIndividual.idlecturaanterior.lecturaanterior} `,
          `Lectura act: ${emisionIndividual.idlecturaanterior.lecturaactual} `,
          `M3: ${m3_anterior}`,
        ],
        [
          `Propietario: ${anterior_factura.idcliente.nombre}`,
          `Cuenta: ${anterior_factura.idabonado}`,
        ],
        [`Modulo: ${anterior_factura.idmodulo.descripcion}`],
      ],
    });
    autoTable(doc, {
      headStyles: {
        halign: 'center',
        fillColor: 'white',
        textColor: 'black',
      },
      bodyStyles: {
        fillColor: 'white',
        textColor: 'black',
      },
      footStyles: {
        fillColor: 'white',
        textColor: 'black',
      },
      head: [['Cod.Rubro', 'Descripción', 'Cant', 'Valor unitario']],
      body: l_anteriores,
      foot: [['TOTAL: ', sum_anterior.toFixed(2)]],
    });
    /* LECTURAS ACTUALES */
    let lectActuales = await this.s_rxfService.getByIdfacturaAsync(
      emisionIndividual.idlecturanueva.idfactura
    );
    let l_nuevos: any = [];
    let sum_nuevos: number = 0;
    lectActuales.forEach((item: any) => {
      l_nuevos.push([
        item.idrubro_rubros.idrubro,
        item.idrubro_rubros.descripcion,
        item.cantidad,
        item.valorunitario.toFixed(2),
      ]);
      sum_nuevos += item.cantidad * item.valorunitario;
    });
    let m3_nuevo: number =
      emisionIndividual.idlecturanueva.lecturaactual -
      emisionIndividual.idlecturanueva.lecturaanterior;
    let nueva_factura = await this.facService.getByIdAsync(
      emisionIndividual.idlecturanueva.idfactura
    );
    autoTable(doc, {
      headStyles: {
        halign: 'center',
        fillColor: 'white',
        textColor: 'black',
      },
      bodyStyles: {
        fillColor: 'white',
        textColor: 'black',
      },
      head: [[{ content: 'Lectura nueva', colSpan: 5 }]],
      body: [
        [
          `N° lectura: ${emisionIndividual.idlecturanueva.idlectura} `,
          `Planilla: ${emisionIndividual.idlecturanueva.idfactura}`,
        ],
        [
          `Lectura ant: ${emisionIndividual.idlecturanueva.lecturaanterior} `,
          `Lectura act: ${emisionIndividual.idlecturanueva.lecturaactual} `,
          `M3: ${m3_nuevo}`,
        ],
        [
          `Propietario: ${nueva_factura.idcliente.nombre}`,
          `Cuenta: ${nueva_factura.idabonado}`,
        ],
        [`Modulo: ${nueva_factura.idmodulo.descripcion}`],
      ],
    });
    autoTable(doc, {
      headStyles: {
        halign: 'center',
        fillColor: 'white',
        textColor: 'black',
      },
      bodyStyles: {
        fillColor: 'white',
        textColor: 'black',
      },
      footStyles: {
        fillColor: 'white',
        textColor: 'black',
      },
      head: [['Cod.Rubro', 'Descripción', 'Cant', 'Valor unitario']],
      body: l_nuevos,
      foot: [['TOTAL: ', sum_nuevos.toFixed(2)]],
    });
    let dateEmision: Date = new Date(
      emisionIndividual.idlecturanueva.fechaemision
    );
    autoTable(doc, {
      bodyStyles: {
        fillColor: 'white',
        textColor: 'black',
      },
      body: [
        [
          `Fecha emision:  ${dateEmision.getFullYear()}/${dateEmision.getMonth()}/${dateEmision.getDate()}`,
        ],
      ],
    });

    // doc.autoPrint();
    //doc.save('datauristring');
    doc.output('dataurlnewwindow', { filename: 'comprobante.pdf' });
  }
  getrubrosxfactura(idfactura: number) {}
  imprimir() {
    switch (this.optImprimir) {
      case '0':
        this.pdf1();
        break;
      case '1':
        this.rRubrosxEmision();
        break;
    }
  }
  exportar0() {
    this.archExportar = 'Emisiones';
    this.opcExportar = 0;
  }
  exportar1() {
    this.archExportar = 'Emisión_' + this.selEmision;
    this.opcExportar = 1;
  }

  exporta() {
    if (this.opcExportar == 0) this.exporta0(); //Exporta Emisiones
    else this.exporta1(); //Exporta Rutas por Emisión
  }

  //Exporta Emisiones
  async exporta0() {
    const nombreEmision = new NombreEmisionPipe(); // Crea una instancia del pipe
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Emisiones');

    worksheet.addRow(['Emisiones']);

    // Formato Celda A1
    const cellA1 = worksheet.getCell('A1');
    const customStyle = {
      font: {
        name: 'Times New Roman',
        bold: true,
        size: 14,
        color: { argb: '002060' },
      },
    };
    cellA1.font = customStyle.font;

    worksheet.addRow([]);

    const cabecera = ['Emisión', 'm3', 'Fecha Cierre'];
    const headerRowCell = worksheet.addRow(cabecera);
    headerRowCell.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '002060' },
      };
      cell.font = {
        bold: true,
        name: 'Times New Roman',
        color: { argb: 'FFFFFF' },
      };
    });

    // Agrega los datos a la hoja de cálculo
    this._emisiones.forEach((item: any) => {
      const row = [
        nombreEmision.transform(item.emision),
        item.m3,
        item.fechacierre,
      ];
      worksheet.addRow(row);
    });

    //Coloca la fila del Total
    worksheet.addRow(['TOTAL']);
    worksheet.getCell('A' + (this._emisiones.length + 4).toString()).font = {
      bold: true,
    };
    let celdaB = worksheet.getCell(
      'B' + (this._emisiones.length + 4).toString()
    );
    celdaB.numFmt = '#,##0';
    celdaB.font = { bold: true };
    celdaB.value = {
      formula: 'SUM(B4:' + 'B' + (this._emisiones.length + 3).toString() + ')',
      result: 0,
      sharedFormula: undefined,
      date1904: false,
    };

    // Establece el ancho de las columnas
    const anchoConfig = [
      { columnIndex: 1, widthInChars: 40 },
      { columnIndex: 2, widthInChars: 10 },
      { columnIndex: 3, widthInChars: 30 },
    ];
    anchoConfig.forEach((config) => {
      worksheet.getColumn(config.columnIndex).width = config.widthInChars;
    });

    // Columnas centradas
    const columnsToCenter = [3];
    columnsToCenter.forEach((columnIndex) => {
      worksheet
        .getColumn(columnIndex)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
    });
    // Columnas a la derecha
    let columnsToRigth = [2];
    columnsToRigth.forEach((columnIndex) => {
      worksheet
        .getColumn(columnIndex)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = { horizontal: 'right' };
        });
    });

    // Formato numérico
    const numeroStyle = { numFmt: '#,##0' };
    const columnsToFormat = [2];
    for (let i = 4; i <= this._emisiones.length + 2; i++) {
      columnsToFormat.forEach((columnIndex) => {
        const cell = worksheet.getCell(i, columnIndex);
        cell.style = numeroStyle;
      });
    }

    // Crea un archivo Excel
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);

      // Crear un enlace para descargar el archivo
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.archExportar}.xlsx`; // Usa el nombre proporcionado por el usuario
      a.click();

      window.URL.revokeObjectURL(url); // Libera recursos
    });
  }

  //Exporta Rutas por Emisión
  async exporta1() {
    const nombreEmision = new NombreEmisionPipe(); // Crea una instancia del pipe
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Rutas por Emisión');

    worksheet.addRow([
      '',
      '',
      'Rutas por Emisión: ' + nombreEmision.transform(this.selEmision),
    ]);

    // Formato Celda C1
    const cellC1 = worksheet.getCell('C1');
    const customStyle = {
      font: {
        name: 'Times New Roman',
        bold: true,
        size: 14,
        color: { argb: '002060' },
      },
    };
    cellC1.font = customStyle.font;

    worksheet.addRow([]);

    const cabecera = ['#', 'Código', 'Ruta', 'Fecha Cierre', 'm3'];
    const headerRowCell = worksheet.addRow(cabecera);
    headerRowCell.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '002060' },
      };
      cell.font = {
        bold: true,
        name: 'Times New Roman',
        color: { argb: 'FFFFFF' },
      };
    });

    // Agrega los datos a la hoja de cálculo
    let i = 1;
    this._rutasxemi.forEach((item: any) => {
      let fila = worksheet.addRow([
        i,
        item.idruta_rutas.codigo,
        item.idruta_rutas.descripcion,
        ,
        item.m3,
      ]);
      if (item.fechacierre != null) {
        let celdaDi = fila.getCell('D'); //Celda de Fechacierre
        let año = item.fechacierre.toString().slice(0, 4);
        let mes = item.fechacierre.toString().slice(5, 7);
        let dia = item.fechacierre.toString().slice(8, 10);
        let fecha = `DATE(${año},${mes},${dia})`;
        celdaDi.value = {
          formula: fecha,
          result: 0,
          sharedFormula: undefined,
          date1904: false,
        };
        celdaDi.numFmt = 'dd-mm-yyyy';
      }
      i++;
    });

    //Coloca la fila del Total
    worksheet.addRow(['', '', 'TOTAL']);
    worksheet.getCell('C' + (this._rutasxemi.length + 4).toString()).font = {
      bold: true,
    };
    let celdaE = worksheet.getCell(
      'E' + (this._rutasxemi.length + 4).toString()
    );
    celdaE.numFmt = '#,##0';
    celdaE.font = { bold: true };
    celdaE.value = {
      formula: 'SUM(E4:' + 'E' + (this._rutasxemi.length + 3).toString() + ')',
      result: 0,
      sharedFormula: undefined,
      date1904: false,
    };

    // Establece el ancho de las columnas
    const anchoConfig = [
      { columnIndex: 1, widthInChars: 6 },
      { columnIndex: 2, widthInChars: 12 },
      { columnIndex: 3, widthInChars: 40 },
      { columnIndex: 4, widthInChars: 16 },
      { columnIndex: 5, widthInChars: 15 },
    ];
    anchoConfig.forEach((config) => {
      worksheet.getColumn(config.columnIndex).width = config.widthInChars;
    });

    // Columnas centradas
    const columnsToCenter = [1, 2, 4];
    columnsToCenter.forEach((columnIndex) => {
      worksheet
        .getColumn(columnIndex)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
    });
    // Columnas a la derecha
    let columnsToRigth = [5];
    columnsToRigth.forEach((columnIndex) => {
      worksheet
        .getColumn(columnIndex)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = { horizontal: 'right' };
        });
    });

    // Formato numérico
    const numeroStyle = { numFmt: '#,##0' };
    const columnsToFormat = [5];
    for (let i = 4; i <= this._rutasxemi.length + 2; i++) {
      columnsToFormat.forEach((columnIndex) => {
        const cell = worksheet.getCell(i, columnIndex);
        cell.style = numeroStyle;
      });
    }

    // Crea un archivo Excel
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);

      // Crear un enlace para descargar el archivo
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.archExportar}.xlsx`; // Usa el nombre proporcionado por el usuario
      a.click();

      window.URL.revokeObjectURL(url); // Libera recursos
    });
  }
}
interface Rutasxemision {
  idrutaxemision: number;
  estado: number;
  m3: number;
  usuariocierre: number;
  fechacierre: Date;
  idemision_emisiones: Emisiones;
  idruta_rutas: Rutas;
  usucrea: number;
  feccrea: Date;
}
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
  horacobro: String;
  usuariotransferencia: number;
  fechatransferencia: Date;
  usucrea: number;
  feccrea: Date;
  usumodi: number;
  fecmodi: Date;
  valorbase: number;
}

interface Lectura {
  idlectura: number;
  estado: number;
  fechaemision: Date;
  lecturaanterior: number;
  lecturaactual: number;
  lecturadigitada: number;
  mesesmulta: number;
  observaciones: String;
  idnovedad_novedades: Novedad;
  idemision: number;
  idabonado_abonados: Abonados;
  idresponsable: number;
  idcategoria: number;
  idrutaxemision_rutasxemision: Rutasxemision;
  idfactura: number;
  total1: number;
  total31: number;
  total32: number;
}
