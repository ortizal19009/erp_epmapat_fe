import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Clientes } from 'src/app/modelos/clientes';
import { Facturas } from 'src/app/modelos/facturas.model';
import { Modulos } from 'src/app/modelos/modulos.model';
import { Rubros } from 'src/app/modelos/rubros.model';
import { FacturaService } from 'src/app/servicios/factura.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { RutasxemisionService } from 'src/app/servicios/rutasxemision.service';
import { Pliego24Service } from 'src/app/servicios/pliego24.service';
import { NovedadesService } from 'src/app/servicios/novedades.service';
import { Novedad } from 'src/app/modelos/novedad.model';
import { ColoresService } from 'src/app/compartida/colores.service';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { nextTick } from 'process';
import { LoadingService } from 'src/app/servicios/loading.service';

@Component({
  selector: 'app-lecturas',
  templateUrl: './lecturas.component.html',
  styleUrls: ['./lecturas.component.css'],
})
export class LecturasComponent implements OnInit {
  idrutaxemision: number; //Para obtener idrutaxemisionToLectura
  rutaxemision = {} as Rutaxemision; //Interface para los datos de la Ruta y la Emision
  _lecturas: any;
  _lectura: any;
  formValor: FormGroup;
  _rutaxemision: any;
  filtro: string;
  sumtotal: number;
  totales: number[] = Array(3);
  cuenta: number;
  abonados: number;
  swfiltro: boolean;
  swcargado: boolean; //
  //Para actualizar el consumo actual
  idlectura: number;
  fila: number;
  datosLectura: any;
  //Para cerrar
  disabled: boolean;
  btncerrar: boolean;
  modulo: Modulos;
  kontador: number;
  fecha: Date;
  tarifa: any;
  factura: any;
  arrprecios: number[] = [];
  arridfactura: number[] = [];
  public progreso = 0;
  // private contador = 0;
  otraPagina: boolean = false;
  archExportar: string;
  swmulta: boolean;
  vecmultas: boolean[] = [];
  rubros: any = [];
  totalcalc: number;
  m3: number;
  /* mostrar historial de consumo */
  idabonado: any;
  s_historial: boolean = false;
  antIndice = 0;

  novedades: any;

  porcResidencial: number[] = [
    0.777, 0.78, 0.78, 0.78, 0.78, 0.778, 0.778, 0.778, 0.78, 0.78, 0.78, 0.68,
    0.68, 0.678, 0.68, 0.68, 0.678, 0.678, 0.68, 0.68, 0.678, 0.676, 0.678,
    0.678, 0.678, 0.68, 0.647, 0.65, 0.65, 0.647, 0.647, 0.65, 0.65, 0.647,
    0.647, 0.65, 0.65, 0.65, 0.65, 0.65, 0.65, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7,
    0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7,
    0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7,
  ];

  constructor(
    private router: Router,
    private lecService: LecturasService,
    private coloresService: ColoresService,
    public authService: AutorizaService,
    private rutaxemiService: RutasxemisionService,
    public fb: FormBuilder,
    private facService: FacturaService,
    private rubxfacService: RubroxfacService,
    private pli24Service: Pliego24Service,
    private s_novedad: NovedadesService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/lecturas');
    let coloresJSON = sessionStorage.getItem('/lecturas');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    this.idrutaxemision = +sessionStorage.getItem('idrutaxemisionToLectura')!;
    this.rutaxemisionDatos(this.idrutaxemision);
    this.lecService.getLecturas(this.idrutaxemision).subscribe({
      next: (resp) => {
        this._lecturas = resp;
        this.abonados = this._lecturas.length;
        this.total();
      },
      error: (err) => console.error(err.error),
    });

    //Formulario para modificar Lectura Actual
    this.formValor = this.fb.group({
      lecturaanterior: 0,
      lecturaactual: 0,
      disabled: false,
      consumo: 0,
      idnovedad_novedades: '',
    });

    this.formValor.get('lecturaactual')?.valueChanges.subscribe((valor) => {
      this.formValor.controls['consumo'].setValue(
        valor - this.formValor.get('lecturaanterior')?.value
      );
    });
    this.fecha = new Date();
    this.totales = [0, 0, 0];
    this.listNovedades();
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
        'lecturas'
      );
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/lecturas', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  rutaxemisionDatos(idrutaxemision: number) {
    this.rutaxemiService.getById(idrutaxemision).subscribe({
      next: (datos) => {
        this._rutaxemision = datos;
        this.rutaxemision.emision = datos.idemision_emisiones.emision;
        this.rutaxemision.codigo = datos.idruta_rutas.codigo;
        this.rutaxemision.ruta = datos.idruta_rutas.descripcion;
        this.rutaxemision.estado = datos.estado;
      },
      error: (err) => console.error(err.error),
    });
  }

  lecturas() {
    this.archExportar =
      this.rutaxemision.codigo + '_' + this.rutaxemision.emision.toString();
  }
  actualizarLeturaAnterior() {
    this.loadingService.showLoading();
    this._lecturas.forEach((lectura: any, i: number) => {
      this.lecService
        .getUltimaLecturaByEmisionAsync(
          lectura.idabonado_abonados.idabonado,
          lectura.idemision - 1
        )
        .then(async (lecturaanterior: any) => {
          let nlectura = lectura;
          nlectura.lecturaanterior = lecturaanterior;
          await this.lecService.updateLecturaAsync(
            nlectura.idlectura,
            nlectura
          );
          i++;
          if (i === this._lecturas.length) {
            this.loadingService.hideLoading();
          }
        });
    });
  }
  exportToCSV() {
    const columnTitles: string[] = [
      'Cuenta',
      'Nro. Medidor',
      'Abonado',
      'Lectura Anterior',
      'Direccion',
      'Categoria',
      'Promedio',
      'Lectura Actual',
      'Consumo',
      'Novedad',
      'Observaciones',
      'Xcord',
      'Ycord',
      'Procesado',
      'Recorrido',
      'Secuencia',
      'Identificador',
    ];

    const csvData = [
      columnTitles,
      ...this._lecturas.map((lectura: any) => [
        lectura.idabonado_abonados.idabonado,
        lectura.idabonado_abonados.nromedidor,
        lectura.idabonado_abonados.idcliente_clientes.nombre,
        lectura.lecturaanterior,
        lectura.idabonado_abonados.direccionubicacion,
        lectura.idabonado_abonados.idcategoria_categorias.descripcion,
        60,
        '',
        '',
        '',
        '',
        '',
        '',
        0,
        'Ciclo 02/Sector 040' + lectura.idabonado_abonados.direccionubicacion,
        lectura.idabonado_abonados.secuencia,
        lectura.idlectura,
      ]),
    ];

    const csvContent = this.convertArrayToCSV(csvData, ';');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.archExportar + '.csv';
    a.click();
  }

  private convertArrayToCSV(array: any[], delimiter: string): string {
    const rows = [];
    for (const row of array) {
      rows.push(
        row.map((item: any) => this.escapeCSVValue(item)).join(delimiter)
      );
    }
    return rows.join('\n');
  }

  private escapeCSVValue(value: any): string {
    // Escapar comillas dobles y manejar otros casos según sea necesario
    if (typeof value === 'string') {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  cargar() {
    this.router.navigate(['/impor-lecturas']);
  }

  regresar() {
    this.router.navigate(['/emisiones']);
  }

  imprimir() {
    this.router.navigate(['/imp-lecturas']);
  }

  total() {
    let suma: number = 0;
    let promedio = 0;
    let arecaudar = 0;
    this.swcargado = false;
    let i = 0;
    this._lecturas.forEach(() => {
      //Suma solo los positivos. this.swcargada controla si ya se han cargado las lecturas (si ya hay uno positivo )
      if (
        this._lecturas[i].lecturaactual - this._lecturas[i].lecturaanterior >
        0
      ) {
        this.swcargado = true;
        suma +=
          this._lecturas[i].lecturaactual - this._lecturas[i].lecturaanterior;
      }
      promedio += this._lecturas[i].idabonado_abonados.promedio;
      arecaudar += this._lecturas[i].total1;
      i++;
    });
    this.sumtotal = suma;
    this.totales[0] = suma;
    this.totales[1] = promedio;
    this.totales[2] = arecaudar;
  }

  onInputChange() {
    if (this.filtro.trim() !== '') {
      this.swfiltro = true;
    } else {
      this.swfiltro = false;
    }
  }

  valor(idlectura: number, fila: number) {
    this.antIndice = fila;
    if (this.rutaxemision.estado == 1)
      this.formValor.get('lecturaactual')?.disable();
    this.idlectura = idlectura;
    this.fila = fila;
    this.lecService.getByIdlectura(idlectura).subscribe({
      next: (resp) => {
        this.datosLectura = resp;
        this.cuenta = resp.idabonado_abonados.idabonado;
        this.formValor.patchValue({
          lecturaanterior: resp.lecturaanterior,
          lecturaactual: resp.lecturaactual,
          consumo: resp.lecturaactual - resp.lecturaanterior,
          idnovedad_novedades: resp.idnovedad_novedades,
        });
      },
      error: (err) => console.error(err.error),
    });
  }

  actuValor() {
    this.datosLectura.lecturaanterior = this.formValor.value.lecturaanterior;
    this.datosLectura.lecturaactual = this.formValor.value.lecturaactual;
    this.datosLectura.idnovedad_novedades =
      this.formValor.value.idnovedad_novedades;
    this.lecService.updateLectura(this.idlectura, this.datosLectura).subscribe({
      next: (nex) => {
        this._lecturas[this.fila].lecturaanterior =
          this.formValor.value.lecturaanterior;
        this._lecturas[this.fila].lecturaactual =
          this.formValor.value.lecturaactual;
        this._lecturas[this.fila].idnovedad_novedades =
          this.formValor.value.idnovedad_novedades;

        this.total();
      },
      error: (err) => console.error(err.error),
    });
  }

  arecaudar(lectura: any, fila: number) {
    this.antIndice = fila;
    this.cuenta = lectura.idabonado_abonados.idabonado;
    let categoria =
      lectura.idabonado_abonados.idcategoria_categorias.idcategoria;
    let consumo = lectura.lecturaactual - lectura.lecturaanterior;
    this.m3 = consumo;
    let adultomayor = lectura.idabonado_abonados.adultomayor;

    if (adultomayor && categoria === 9 && consumo > 34) categoria = 1;
    if (adultomayor && categoria === 9 && consumo <= 34) categoria = 9;
    if (!adultomayor && categoria === 9 && consumo > 10) categoria = 1;
    if (categoria === 9 && consumo > 34) categoria = 1;
    if (categoria === 1 && consumo > 70) categoria = 2;
    let municipio = lectura.idabonado_abonados.municipio;
    let swcate9: boolean = false; //No hay Tarifas para Categoria 9 es el 50% de la 1
    if (categoria == 9) {
      categoria = 1;
      swcate9 = true;
    }
    let swmunicipio: boolean; //Instituciones del Municipio 50% de la Tarifa Oficial
    if (categoria == 4 && municipio) {
      swmunicipio = true;
    }

    // Obtiene la tarifa del nuevo Pliego
    let num1: number;
    this.pli24Service.getBloque(categoria, consumo).subscribe({
      next: (resp) => {
        if (resp.length == 0) {
          console.log('No hay Tarifa para esta Categoría y Consumo');
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
          suma =
            Math.round((num1 + num2 + num3 + num4 + num5 + 0.1 + num7) * 100) /
            100;
          //Categoria 9 no tiene tarifario es el 50% de la Residencial. Abonados del Municipio también 50%
          if (swcate9 || swmunicipio) suma = Math.round((suma / 2) * 100) / 100;
          this.totalcalc = suma;
          let r: any = {};
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
            let rub1001 =
              Math.round((suma - rub1002 - rub1003 - 0.1) * 100) / 100;
            r = { descripcion: 'Agua Potable', valorunitario: rub1001 };
            this.rubros.push(r);
            r = { descripcion: 'Alcantarillado', valorunitario: rub1002 };
            this.rubros.push(r);
            r = { descripcion: 'Saneamiento', valorunitario: rub1003 };
            this.rubros.push(r);
            r = { descripcion: 'Conservación Fuentes', valorunitario: 0.1 };
            this.rubros.push(r);
          } else {
            r = { descripcion: 'Agua Potable', valorunitario: num1 + num3 };
            this.rubros.push(r);
            r = {
              descripcion: 'Alcantarillado',
              valorunitario: num2 + num4 + num7,
            };
            this.rubros.push(r);
            r = { descripcion: 'Saneamiento', valorunitario: num5 };
            this.rubros.push(r);
            r = { descripcion: 'Conservación Fuentes', valorunitario: 0.1 };
            this.rubros.push(r);
          }
        }
      },
      error: (err) => console.error(err.error),
    });
  }

  //Calcula los valores a recaudar
  async calcular() {
    for (let i = 0; i < this._lecturas.length; i++) {
      let categoria =
        this._lecturas[i].idabonado_abonados.idcategoria_categorias.idcategoria;
      let consumo =
        this._lecturas[i].lecturaactual - this._lecturas[i].lecturaanterior;
      let adultomayor = this._lecturas[i].idabonado_abonados.adultomayor;
      if (adultomayor && categoria == 9 && consumo > 34) categoria = 1;
      if (adultomayor && categoria == 9 && consumo <= 34) categoria = 9;
      if (!adultomayor && categoria == 9 && consumo > 10) categoria = 1;
      if (categoria == 9 && consumo > 34) categoria = 1;
      if (categoria == 1 && consumo > 70) categoria = 2;
      let municipio = this._lecturas[i].idabonado_abonados.municipio;
      let swcate9: boolean = false;
      if (categoria == 9) {
        categoria = 1;
        swcate9 = true;
      }
      let swmunicipio: boolean = false;
      if (categoria == 4 && municipio) {
        swmunicipio = true;
      }
      let num1: number;
      await this.getTarifa(categoria, consumo);
      // console.log('this.tarifa: ', i, this.tarifa)
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
        Math.round(consumo * this.tarifa[0].agua * this.tarifa[0].porc * 100) /
        100;
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
      suma =
        Math.round((num1 + num2 + num3 + num4 + num5 + 0.1 + num7) * 100) / 100;
      if (swcate9 || swmunicipio) suma = Math.round((suma / 2) * 100) / 100;
      this.totalcalc = suma;
      this._lecturas[i].total1 = suma;
      await this.updateLectura(this._lecturas[i].idlectura, this._lecturas[i]);
      this.progreso = (i / (this._lecturas.length - 1)) * 100;
    }
    this.btncerrar = true;
  }

  async getTarifa(idcategoria: number, m3: number): Promise<void> {
    try {
      this.tarifa = await this.pli24Service.getBloqueAsync(idcategoria, m3);
    } catch (error) {
      console.error(`Al obtener la Tarifa: `, error);
    }
  }

  async updateLectura(idlectura: number, lectura: any): Promise<void> {
    try {
      await this.lecService.updateLecturaAsync(idlectura, lectura);
      //   console.log('Actualizacion lectura Ok!')
    } catch (error) {
      console.error(`Al actualizar la Lectura: `, error);
    }
  }

  //Genera Planillas (Tabla Facturas)
  generar() {
    this.disabled = true;
    this.modulo = new Modulos();
    this.modulo.idmodulo = 4;
    this.kontador = 0;
    this.planillas();
  }

  async getPendientesAbonado(idabonado: number): Promise<number> {
    try {
      const facturasPendientes =
        await this.facService.getPendientesAbonadoAsync(idabonado);
      return facturasPendientes;
    } catch (error) {
      console.error('Al contar las pendientes: ', error);
      return -1;
    }
  }

  async planillas() {
    let swmulta: boolean = false;
    let multa = await this.getPendientesAbonado(
      this._lecturas[this.kontador].idabonado_abonados.idabonado
    );
    if (multa === 3) swmulta = true;
    // console.log(this._lecturas[this.kontador].idabonado_abonados.idabonado, multa, swmulta)
    let categoria =
      this._lecturas[this.kontador].idabonado_abonados.idcategoria_categorias
        .idcategoria;
    let consumo =
      this._lecturas[this.kontador].lecturaactual -
      this._lecturas[this.kontador].lecturaanterior;
    let adultomayor =
      this._lecturas[this.kontador].idabonado_abonados.adultomayor;
    let noAlcantarillado =
      this._lecturas[this.kontador].idabonado_abonados.swalcantarillado;

    let factura: Facturas = new Facturas();
    if (adultomayor) {
      if (categoria == 9 && consumo > 34) categoria = 1;
    } else if (categoria == 9 && consumo > 10) categoria = 1;
    if (categoria == 9 && consumo > 34) categoria = 1;
    if (categoria == 1 && consumo > 70) categoria = 2;
    let municipio = this._lecturas[this.kontador].idabonado_abonados.municipio;
    if (consumo < 0) {
      this.kontador++;
      this.progreso = (this.kontador / this._lecturas.length) * 100;
      if (this.kontador < this._lecturas.length) this.planillas();
    } else {
      this.facService
        .getById(this._lecturas[this.kontador].idfactura)
        .subscribe({
          next: (datos) => {
            factura = datos;
            this.arrprecios = [];
            let num1: number;
            let cliente: Clientes = new Clientes();
            cliente.idcliente = this._lecturas[this.kontador].idresponsable;
            let swcate9: boolean; //No hay Tarifas para Categoria 9 es el 50% de la 1
            if (categoria == 9) {
              categoria = 1;
              swcate9 = true;
            }
            let swmunicipio: boolean; //Instituciones del Municipio 50% de la Tarifa Oficial
            if (categoria == 4 && municipio) {
              swmunicipio = true;
            }
            // Obtiene lo tarifa del nuevo Pliego
            this.pli24Service.getBloque(categoria, consumo).subscribe({
              next: (resp) => {
                // if (!resp) {
                if (resp.length == 0) {
                  this.kontador++;
                  this.progreso = (this.kontador / this._lecturas.length) * 100;
                  if (this.kontador < this._lecturas.length) this.planillas();
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
                  suma =
                    Math.round(
                      (num1 + num2 + num3 + num4 + num5 + 0.1 + num7) * 100
                    ) / 100;
                  //Categoria 9 no tiene tarifario es el 50% de la Residencial. Abonados del Municipio también 50%
                  if (swcate9 || swmunicipio)
                    suma = Math.round((suma / 2) * 100) / 100;
                  if (swmulta) suma = suma + 2;
                  factura.totaltarifa = suma;
                  factura.valorbase = suma;
                  factura.estado = 1;
                  let modulo: Modulos = new Modulos();
                  modulo.idmodulo = 4;
                  factura.idmodulo = modulo;
                  const fechaEmision =
                    this._lecturas[this.kontador].fechaemision;
                  const fechaEmisionDate = new Date(Date.parse(fechaEmision));
                  const primerDiaDelMesSiguiente = new Date(
                    fechaEmisionDate.getFullYear(),
                    fechaEmisionDate.getMonth() + 1,
                    1
                  );
                  factura.feccrea = primerDiaDelMesSiguiente;
                  this.facService.updateFacturas(factura).subscribe({
                    next: (fac: any) => {
                      this.factura = fac;
                      this.lecService
                        .getByIdlectura(this._lecturas[this.kontador].idlectura)
                        .subscribe({
                          next: (datos) => {
                            this._lectura = datos;
                            this._lectura.idfactura = this.factura.idfactura;
                            this.lecService
                              .updateLectura(
                                this._lecturas[this.kontador].idlectura,
                                this._lectura
                              )
                              .subscribe({
                                next: (nex: any) => {
                                  if (swcate9 || swmunicipio) {
                                    let rub1002: number;
                                    let rub1003: number;
                                    //Alcantarillado / 2
                                    if (num2 + num4 + num7 > 0) {
                                      rub1002 =
                                        Math.round(
                                          ((num2 + num4 + num7) / 2) * 100
                                        ) / 100;
                                    } else {
                                      rub1002 = 0;
                                    }
                                    //Saneamiento / 2
                                    if (num5 > 0) {
                                      rub1003 =
                                        Math.round((num5 / 2) * 100) / 100;
                                    } else {
                                      rub1003 = 0;
                                    }
                                    //Agua portable por diferencia con la suma
                                    let r1001 = suma - rub1002 - rub1003 - 0.1;
                                    this.arrprecios.push(
                                      r1001,
                                      rub1002,
                                      rub1003,
                                      0.1
                                    );
                                  } else {
                                    this.arrprecios.push(
                                      num1 + num3,
                                      num2 + num4 + num7,
                                      num5,
                                      0.1
                                    );
                                  }

                                  let i = 0;
                                  this.addrubros(i, swmulta);

                                  this.kontador++;
                                  this.progreso =
                                    (this.kontador / this._lecturas.length) *
                                    100;
                                  if (this.kontador < this._lecturas.length) {
                                    this.planillas();
                                  }
                                  // if (this.kontador < 3) this.planillas();
                                  else {
                                    //Actualiza el estado, totales y fecha de cierre de la Ruta por Emisión
                                    this._rutaxemision.estado = 1;
                                    this._rutaxemision.usuariocierre = 1;
                                    this._rutaxemision.fechacierre = this.fecha;
                                    this._rutaxemision.m3 = this.sumtotal;
                                    this.rutaxemiService
                                      .updateRutaxemision(
                                        this.idrutaxemision,
                                        this._rutaxemision
                                      )
                                      .subscribe({
                                        next: (nex) => (this.btncerrar = true),
                                        error: (err) =>
                                          console.error(err.error),
                                      });
                                  }
                                },
                                error: (err) => console.error(err.error),
                              });
                          },
                          error: (err) => console.error(err.error),
                        });
                    },
                    error: (err) => console.error(err.error),
                  });
                }
              },
              error: (err) => console.error(err.error),
            });
          },
          error: (e) => {
            console.error(e);
          },
        });
    }
  }

  addrubros(i: number, swmulta: boolean) {
    let rubrosxpla = {} as Rubrosxpla;
    rubrosxpla.cantidad = 1;
    rubrosxpla.estado = 1;
    let factura: Facturas = new Facturas();
    factura.idfactura = this.factura.idfactura;
    rubrosxpla.idfactura_facturas = factura;
    let rubro: Rubros = new Rubros();
    //Cuando hay multa n=5 y si i es 4 coloca la multa
    if (i != 4) {
      rubro.idrubro = 1001 + i;
      if (rubrosxpla.valorunitario < 0) {
        console.log('RUBRO MENOR A ZERO ', rubrosxpla.idrubro_rubros);
        console.log('RUBRO MENOR A _ZERO ', rubro.idrubro);
      }
      rubrosxpla.valorunitario = this.arrprecios[i];
    } else {
      rubro.idrubro = 6; //6= idrubro de Multa
      rubrosxpla.valorunitario = 2;
    }
    rubrosxpla.idrubro_rubros = rubro;
    /*     if (rubrosxpla.valorunitario < 0) {
      rubrosxpla.valorunitario = 0;
    } */
    this.rubxfacService.saveRubroxfac(rubrosxpla).subscribe({
      next: (nex: any) => {
        i = i + 1;
        let n = 4;
        if (swmulta) {
          n = 5;
        }
        if (i < n) {
          this.addrubros(i, swmulta);
        }
      },
      error: (err) => console.error(err.error),
    });
  }

  sort(columnName: string) {
    this._lecturas.sort(
      (a: { [x: string]: number }, b: { [x: string]: number }) => {
        if (a[columnName] < b[columnName]) {
          return -1;
        } else if (a[columnName] > b[columnName]) {
          return 1;
        } else {
          return 0;
        }
      }
    );
  }
  /* para historial de consumo */
  setIdabonado(datos: any, fila: number) {
    this.antIndice = fila;
    this.idabonado = datos.idabonado_abonados.idabonado;
    this.s_historial = true;
  }
  resetHistorial() {
    this.s_historial = false;
  }
  listNovedades() {
    this.s_novedad.getNovedadesByestado(1).subscribe({
      next: (datos) => {
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
}

interface Rutaxemision {
  emision: String;
  codigo: String;
  ruta: String;
  estado: number;
  usuariocierre: number;
  fechacierre: Date;
}

interface Rubrosxpla {
  idrubroxfac: number;
  cantidad: number;
  valorunitario: number;
  estado: number;
  idfactura_facturas: Facturas;
  idrubro_rubros: Rubros;
}
