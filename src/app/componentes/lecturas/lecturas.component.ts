import { Component, HostListener, OnInit } from '@angular/core';
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
import { EmisionService } from 'src/app/servicios/emision.service';
import { PdfService } from 'src/app/servicios/pdf.service';
import { environment } from 'src/environments/environment';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';

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
  totalcalc: number = 0;
  m3: number;
  /* mostrar historial de consumo */
  idabonado: any;
  s_historial: boolean = false;
  antIndice = 0;
  enProceso: boolean = false;
  mostrarModal: boolean = false;
  idusuario: number;
  novedades: any;
  tieneLecturasNegativas: boolean = false;
  fotoLecturaUrl: string | null = null;
  fotoLecturaTitulo: string = '';

  porcResidencial: number[] = [
    0.777, 0.78, 0.78, 0.78, 0.78, 0.78, 0.778, 0.778, 0.78, 0.78, 0.78, 0.68,
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
    private loadingService: LoadingService,
    private emisionService: EmisionService,
    private pdfService: PdfService,
  ) { }

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
        const lecturasNegativas = this.getLecturasNegativas();
        this.tieneLecturasNegativas = lecturasNegativas.length > 0;
        if (lecturasNegativas.length > 0) {
          void this.mostrarLecturasNegativas(lecturasNegativas);
        }
      },
      error: (err) => console.error(err.error),
    });
    this.idusuario = this.authService.idusuario;

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
        valor - this.formValor.get('lecturaanterior')?.value,
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
        'lecturas',
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
          lectura.idemision - 1,
        )
        .then(async (lecturaanterior: any) => {
          let nlectura = lectura;
          nlectura.lecturaanterior = lecturaanterior;
          await this.lecService.updateLecturaAsync(
            nlectura.idlectura,
            nlectura,
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
        row.map((item: any) => this.escapeCSVValue(item)).join(delimiter),
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

  getFotoPath(item: any): string | null {
    const foto = item?.foto_path ?? item?.fotoPath ?? null;
    if (!foto || typeof foto !== 'string') return null;
    const normalizada = foto.trim().replace(/\\/g, '/');
    return normalizada.length > 0 ? normalizada : null;
  }

  getFotoUrl(item: any): string | null {
    const fotoPath = this.getFotoPath(item);
    if (!fotoPath) return null;
    if (/^(https?:|data:|blob:)/i.test(fotoPath)) return fotoPath;
    const baseUrl = environment.API_URL.replace(/\/$/, '');
    const path = fotoPath.replace(/^\/+/, '');
    return `${baseUrl}/${path}`;
  }

  abrirFotoLectura(lectura: any): void {
    this.fotoLecturaUrl = this.getFotoUrl(lectura);
    const cuenta = lectura?.idabonado_abonados?.idabonado ?? '';
    this.fotoLecturaTitulo = cuenta
      ? `Foto de lectura - Cuenta ${cuenta}`
      : 'Foto de lectura';
  }

  private getConsumo(lectura: any): number {
    return Number(lectura?.lecturaactual || 0) - Number(lectura?.lecturaanterior || 0);
  }

  hasNegativeConsumption(lectura: any): boolean {
    return this.getConsumo(lectura) < 0;
  }

  hasHighConsumptionVsAverage(lectura: any): boolean {
    const consumo = this.getConsumo(lectura);
    const promedio = Number(lectura?.idabonado_abonados?.promedio || 0);

    if (consumo < 0 || promedio <= 0) return false;

    return consumo > promedio * 2;
  }

  private getLecturasNegativas(): any[] {
    return (this._lecturas || []).filter((lectura: any) => this.getConsumo(lectura) < 0);
  }

  private async mostrarLecturasNegativas(lecturasNegativas: any[]): Promise<void> {
    const detalle = lecturasNegativas
      .slice(0, 12)
      .map((lectura: any, index: number) => {
        const cuenta = lectura?.idabonado_abonados?.idabonado ?? 'S/N';
        const nombre = lectura?.idabonado_abonados?.idcliente_clientes?.nombre ?? 'Sin nombre';
        const anterior = lectura?.lecturaanterior ?? 0;
        const actual = lectura?.lecturaactual ?? 0;
        const consumo = this.getConsumo(lectura);
        return `${index + 1}. Cuenta ${cuenta} - ${nombre}<br>Anterior: ${anterior} | Actual: ${actual} | Consumo: ${consumo}`;
      })
      .join('<br><br>');

    const restantes = lecturasNegativas.length - Math.min(lecturasNegativas.length, 12);
    const extra = restantes > 0 ? `<br><br>Y ${restantes} lectura(s) adicional(es).` : '';

    const result = await Swal.fire({
      icon: 'warning',
      title: 'Hay lecturas con consumo negativo',
      html: `<div style="text-align:left;max-height:280px;overflow:auto;font-size:13px;">${detalle}${extra}</div>`,
      confirmButtonText: 'Revisar',
      showDenyButton: true,
      denyButtonText: 'Imprimir',
      width: '560px',
    });

    if (result.isDenied) {
      this.imprimirLecturasNegativas(lecturasNegativas);
    }
  }

  private imprimirLecturasNegativas(lecturasNegativas: any[]): void {
    const doc = new jsPDF('p', 'pt', 'a4');
    this.pdfService.header('Lecturas con consumo negativo', doc);

    const resumen = [
      ['Emision', `${this.rutaxemision?.emision || ''}`],
      ['Ruta', `${this.rutaxemision?.ruta || ''}`],
      ['Codigo', `${this.rutaxemision?.codigo || ''}`],
      ['Total cuentas', `${lecturasNegativas.length}`],
    ];

    autoTable(doc, {
      startY: 80,
      theme: 'grid',
      body: resumen,
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 90 },
        1: { cellWidth: 390 },
      },
    });

    const body = lecturasNegativas.map((lectura: any, index: number) => {
      const cuenta = lectura?.idabonado_abonados?.idabonado ?? 'S/N';
      const abonado = lectura?.idabonado_abonados?.idcliente_clientes?.nombre ?? 'Sin nombre';
      const anterior = Number(lectura?.lecturaanterior || 0);
      const actual = Number(lectura?.lecturaactual || 0);
      const consumo = this.getConsumo(lectura);

      return [index + 1, cuenta, abonado, anterior, actual, consumo];
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 12,
      theme: 'grid',
      head: [['#', 'Cuenta', 'Abonado', 'Anterior', 'Actual', 'M3']],
      body,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { halign: 'center' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 28 },
        1: { halign: 'center', cellWidth: 55 },
        2: { cellWidth: 210 },
        3: { halign: 'right', cellWidth: 60 },
        4: { halign: 'right', cellWidth: 60 },
        5: { halign: 'right', cellWidth: 50 },
      },
    });

    this.pdfService.setfooter(doc);
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
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
    const lecturaAnterior = Number(this.formValor.value.lecturaanterior || 0);
    const lecturaActual = Number(this.formValor.value.lecturaactual || 0);
    const consumo = lecturaActual - lecturaAnterior;

    if (lecturaAnterior < 0 || lecturaActual < 0 || consumo < 0) {
      void Swal.fire({
        icon: 'warning',
        title: 'Lectura no válida',
        html: `La cuenta ${this.cuenta} tiene valores inválidos.<br>Anterior: ${lecturaAnterior} | Actual: ${lecturaActual} | Consumo: ${consumo}`,
        confirmButtonText: 'Entendido',
      });
      return;
    }

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
        this.tieneLecturasNegativas = this.getLecturasNegativas().length > 0;
      },
      error: (err) => console.error(err.error),
    });
  }

  arecaudar(lectura: any, fila: number) {
    this.totalcalc = 0;
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
        } else {
          this.tarifa = resp;

          if (categoria == 1) {
            num1 =
              Math.round(
                (this.tarifa[0].idcategoria.fijoagua - 0.1) *
                this.porcResidencial[consumo] *
                100,
              ) / 100;
          } else {
            num1 =
              Math.round(
                (this.tarifa[0].idcategoria.fijoagua - 0.1) *
                this.tarifa[0].porc *
                100,
              ) / 100;
          }

          let num2 =
            Math.round(
              (this.tarifa[0].idcategoria.fijosanea - 0.5) *
              this.tarifa[0].porc *
              100,
            ) / 100;
          let num3 =
            Math.round(
              consumo * this.tarifa[0].agua * this.tarifa[0].porc * 100,
            ) / 100;
          let num4 =
            Math.round(
              ((consumo * this.tarifa[0].saneamiento) / 2) *
              this.tarifa[0].porc *
              100,
            ) / 100;
          let num5 =
            Math.round(
              ((consumo * this.tarifa[0].saneamiento) / 2) *
              this.tarifa[0].porc *
              100,
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
    const lecturasNegativas = this.getLecturasNegativas();
    console.log('Lecturas con consumo negativo:', lecturasNegativas);
    if (lecturasNegativas.length > 0) {
      await this.mostrarLecturasNegativas(lecturasNegativas);
      return;
    }

    this.totalcalc = 0;
    for (let i = 0; i < this._lecturas.length; i++) {
      let categoria =
        this._lecturas[i].idabonado_abonados.idcategoria_categorias.idcategoria;
      let consumo =
        this._lecturas[i].lecturaactual - this._lecturas[i].lecturaanterior;
      let adultomayor = this._lecturas[i].idabonado_abonados.adultomayor;
      let municipio = this._lecturas[i].idabonado_abonados.municipio;
      let body: any = {
        m3: consumo,
        categoria: categoria,
        swMunicipio: municipio,
        swAdultoMayor: adultomayor,
        swAguapotable: this._lecturas[i].idabonado_abonados.swalcantarillado,
        swbasura: this._lecturas[i].idabonado_abonados.swbasura,

      };

      let suma = 0;
      let calculos: any = await this.lecService.getValoresSimuladosV2_async(body);
      suma = calculos.Total;
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
    } catch (error) {
      console.error(`Al actualizar la Lectura: `, error);
    }
  }

  //Genera Planillas (Tabla Facturas)
  generar() {
    const lecturasNegativas = this.getLecturasNegativas();
    if (lecturasNegativas.length > 0) {
      void this.mostrarLecturasNegativas(lecturasNegativas);
      return;
    }

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

  async _planillas() {
    let swmulta: boolean = false;
    let multa = await this.getPendientesAbonado(
      this._lecturas[this.kontador].idabonado_abonados.idabonado,
    );
    if (multa === 3) swmulta = true;
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
                        100,
                      ) / 100;
                  } else {
                    num1 =
                      Math.round(
                        (this.tarifa[0].idcategoria.fijoagua - 0.1) *
                        this.tarifa[0].porc *
                        100,
                      ) / 100;
                  }

                  let num2 =
                    Math.round(
                      (this.tarifa[0].idcategoria.fijosanea - 0.5) *
                      this.tarifa[0].porc *
                      100,
                    ) / 100;
                  let num3 =
                    Math.round(
                      consumo * this.tarifa[0].agua * this.tarifa[0].porc * 100,
                    ) / 100;
                  let num4 =
                    Math.round(
                      ((consumo * this.tarifa[0].saneamiento) / 2) *
                      this.tarifa[0].porc *
                      100,
                    ) / 100;
                  let num5 =
                    Math.round(
                      ((consumo * this.tarifa[0].saneamiento) / 2) *
                      this.tarifa[0].porc *
                      100,
                    ) / 100;
                  let num7 = Math.round(0.5 * this.tarifa[0].porc * 100) / 100;
                  let suma: number = 0;
                  suma =
                    Math.round(
                      (num1 + num2 + num3 + num4 + num5 + 0.1 + num7) * 100,
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
                    1,
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
                                this._lectura,
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
                                          ((num2 + num4 + num7) / 2) * 100,
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
                                      0.1,
                                    );
                                  } else {
                                    this.arrprecios.push(
                                      num1 + num3,
                                      num2 + num4 + num7,
                                      num5,
                                      0.1,
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
                                        this._rutaxemision,
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
  async __planillas() {
    for (
      this.kontador = 0;
      this.kontador < this._lecturas.length - 1;
      this.kontador++
    ) {
      let lectura = this._lecturas[this.kontador];
      let consumo = lectura.lecturaactual - lectura.lecturaanterior;

      if (consumo > 0) {
        let datos = {
          idemision: lectura.idemision,
          cuenta: lectura.idabonado_abonados.idabonado,
          m3: consumo,
          categoria:
            lectura.idabonado_abonados.idcategoria_categorias.idcategoria,
          idfactura: lectura.idfactura,
          swAdultoMayor: lectura.idabonado_abonados.adultomayor,
          swMunicipio: lectura.idabonado_abonados.municipio,
          swAguapotable: lectura.idabonado_abonados.swalcantarillado,
        };

        try {
          await this.lecService.calcularValores(datos);
        } catch (e) {
          console.error('Error en calcularValores:', e);
          // aquí podrías guardar logs o manejar errores
        }
      }
      this.progreso = (this.kontador / this._lecturas.length - 1) * 100;
    }
  }
  async planillas() {
    this.enProceso = true; // 🔒 Bloquear salida
    for (
      this.kontador = 0;
      this.kontador < this._lecturas.length;
      this.kontador++
    ) {
      let lectura = this._lecturas[this.kontador];
      let consumo = lectura.lecturaactual - lectura.lecturaanterior;

      if (consumo >= 0) {
        let datos = {
          idemision: lectura.idemision,
          cuenta: lectura.idabonado_abonados.idabonado,
          m3: consumo,
          categoria:
            lectura.idabonado_abonados.idcategoria_categorias.idcategoria,
          idfactura: lectura.idfactura,
          swAdultoMayor: lectura.idabonado_abonados.adultomayor,
          swMunicipio: lectura.idabonado_abonados.municipio,
          swAguapotable: lectura.idabonado_abonados.swalcantarillado,
          swbasura: lectura.idabonado_abonados.swbasura,
        };
        try {
          const totalResp = await this.lecService.asycalcular_Valores_v2(datos);
          const total = this.getTotalFromResponse(totalResp);
          this._lecturas[this.kontador].total1 = total;
          this._lecturas[this.kontador].estado = 1;

          const patch = {
            ...this._lecturas[this.kontador],
            total1: total,
            estado: 1,
          };

          await this.lecService.updateLecturaAsync(
            this._lecturas[this.kontador].idlectura,
            patch,
          );
        } catch (e) {
          console.error('Error en calcularValores:', e);
        }
      }

      this.progreso = Math.round(
        ((this.kontador + 1) / this._lecturas.length) * 100,
      );
    }

    this.progreso = 100;
    this.enProceso = false; // ✅ Proceso terminado, se puede salir
    //this.mostrarModal = false;
    this.cerrarModal();
    //Actualiza el estado, totales y fecha de cierre de la Ruta por Emisión
    this._rutaxemision.estado = 1;
    this._rutaxemision.usuariocierre = 1;
    this._rutaxemision.fechacierre = this.fecha;
    this._rutaxemision.m3 = this.sumtotal;
    this.rutaxemiService
      .updateRutaxemision(this.idrutaxemision, this._rutaxemision)
      .subscribe({
        next: (nex) => (this.btncerrar = true),
        error: (err) => console.error(err.error),
      });
  }

  private getTotalFromResponse(totalResp: any): number {
    if (totalResp == null) {
      console.warn('Respuesta de cálculo de valores es nula/indefinida. Se utiliza 0.');
      return 0;
    }

    if (typeof totalResp === 'number' && !isNaN(totalResp)) {
      return totalResp;
    }

    if (typeof totalResp === 'string' && !isNaN(Number(totalResp))) {
      return Number(totalResp);
    }

    if (typeof totalResp === 'object') {
      const possibilities = ['Total', 'total', 'total1'];
      for (const key of possibilities) {
        if (Object.prototype.hasOwnProperty.call(totalResp, key)) {
          const valor = totalResp[key];
          if (typeof valor === 'number' && !isNaN(valor)) return valor;
          if (typeof valor === 'string' && !isNaN(Number(valor))) return Number(valor);
        }
      }

      const numericValue = Object.values(totalResp).find(
        (v) => typeof v === 'number' && !isNaN(v),
      );
      if (numericValue != null) {
        return Number(numericValue);
      }
    }

    console.warn(
      'No se pudo normalizar totalResp al valor numérico:',
      totalResp,
    );
    return 0;
  }

  // 👇 Interceptar cierre o recarga de página
  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event: BeforeUnloadEvent) {
    if (this.enProceso) {
      event.preventDefault();
      event.returnValue =
        'Hay un proceso en ejecución. ¿Seguro que quieres salir?';
    }
  }

  cerrarModal() {
    this.mostrarModal = false;

    // Eliminar backdrop y clases de Bootstrap
    document.body.classList.remove('modal-open');
    const backdrops = document.getElementsByClassName('modal-backdrop');
    while (backdrops.length > 0) {
      backdrops[0].parentNode?.removeChild(backdrops[0]);
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
      rubrosxpla.valorunitario = this.arrprecios[i];
    } else {
      rubro.idrubro = 6; //6= idrubro de Multa
      rubrosxpla.valorunitario = 2;
    }
    rubrosxpla.idrubro_rubros = rubro;
    this.rubxfacService.saveRubroxfac(rubrosxpla).subscribe({
      next: (nex: any) => {
        /*      i++;
             let n = 4;
             if (swmulta) {
               n = 5;
             }
             if (i < n) this.addrubros(i, swmulta); */
      },
      error: (err) => console.error(err.error),
    });
    i++;
    let n = 4;
    if (swmulta) {
      n = 5;
    }
    if (i < n) this.addrubros(i, swmulta);
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
      },
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
  async calcularMultaBasura() {
    try {
      if (!this._rutaxemision?.idemision_emisiones?.idemision || !this._rutaxemision?.idruta_rutas?.idruta) {
        console.error('No se pudo obtener idemision o idruta desde _rutaxemision:', this._rutaxemision);
        return;
      }

      const idemision = this._rutaxemision.idemision_emisiones.idemision;
      const idruta = this._rutaxemision.idruta_rutas.idruta;
const idrutaxemision = this.idrutaxemision; // ✅ sessionStorage

      this.loadingService.showLoading();

      const resp = await this.emisionService.recalcularMultaBasura1011Async(idemision, idrutaxemision );

      // ✅ Resumen
      const total = resp.length;
      const generadas = resp.filter(x => x.estado === 'GENERADO_1011_Y_ACTUALIZADO_TOTAL').length;
      const yaTenian = resp.filter(x => x.estado === 'YA_EXISTIA_RUBRO_1011').length;
      const noAplica = resp.filter(x => x.estado === 'NO_APLICA_MULTA').length;
      const pagadas = resp.filter(x => x.estado === 'FACTURA_YA_PAGADA_NO_MODIFICADA').length;

      console.log('✅ Recalculo multa basura 1011:', {
        idemision,
        idruta,
        totalRevisadas: total,
        generadas,
        yaTenian,
        noAplica,
        pagadas,
        detalle: resp,
      });

      // Opcional: mostrar un modal/toast (si tienes)
      // alert(`Revisión: ${total}. Generadas: ${generadas}. Ya existían: ${yaTenian}. No aplica: ${noAplica}. Pagadas: ${pagadas}.`);

    } catch (err: any) {
      console.error('❌ Error recalculando multa basura 1011:', err);
    } finally {
      this.loadingService.hideLoading();
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
