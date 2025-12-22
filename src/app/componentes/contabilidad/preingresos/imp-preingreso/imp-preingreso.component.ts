import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PreingresoService } from 'src/app/servicios/contabilidad/preingreso.service';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucio.service';
import { ClasificadorService } from 'src/app/servicios/clasificador.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';

@Component({
  selector: 'app-imp-preingreso',
  templateUrl: './imp-preingreso.component.html',
  styleUrls: ['./imp-preingreso.component.css'],
})
export class ImpPreingresoComponent implements OnInit {
  swimprimir: boolean = true;
  formImprimir: FormGroup;
  opcreporte: number = 1;
  otrapagina: boolean = false;
  swbotones: boolean = false;
  swcalculando: boolean = false;
  txtcalculando = 'Calculando';
  pdfgenerado: string;
  nombrearchivo: string;
  array: any = []; //Datos del body de imprimir y para añadir a la hoja electrónica

  _presupuei: any;
  _presupuea: any;
  arreglo2: any[] = [];
  tippar: number = 1; // Partidas de Ingresos
  numreg = 0;
  totalInicia = 0;
  totalRefo = 0;
  totalCodi = 0;
  totalDeve = 0;
  totalCobp = 0;
  totalSal_Deve = 0;
  totalSal_Cobp = 0;
  cuenta: String;
  _ejecucion: any;
  saldo_dev: number = 0;
  saldo_cob: number = 0;
  reforma = 0;
  codifica: number = 0;
  nivel_par: String;

  _clasificador: any;
  cta_cla: String;
  nom_cla: String;
  ced_inicia: number = 0;
  ced_refo: number = 0;
  ced_codi: number = 0;
  ced_deve: number = 0;
  ced_cob: number = 0;
  ced_saldo_dev: number = 0;
  ced_saldo_cob: number = 0;

  constructor(
    public fb: FormBuilder,
    private router: Router,
    private preingService: PreingresoService,
    private ejeService: EjecucionService,
    private clasiService: ClasificadorService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/preingresos');
    let coloresJSON = sessionStorage.getItem('/preingresos');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

    //En preingreso siempre hay 'preingresoToImpExp' porque se buscan todas las partidas por default
    const preIngresoJSON = sessionStorage.getItem('preingresoToImpExp')!;
    const preIngreso = JSON.parse(preIngresoJSON);
    const fecha = new Date();
    const año = fecha.getFullYear();
    let buscaDesdeFecha = año + '-01-01';
    let buscaHastaFecha = año + '-01-31';
    this.formImprimir = this.fb.group({
      reporte: '1',
      codpar: preIngreso.codpar,
      nompar: preIngreso.nompar,
      desde: buscaDesdeFecha,
      hasta: buscaHastaFecha,
      nombrearchivo: ['', [Validators.required, Validators.minLength(3)]],
      otrapagina: '',
    });
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  get f() {
    return this.formImprimir.controls;
  }

  changeReporte() {
    this.opcreporte = +this.formImprimir.value.reporte;
  }

  impriexpor() {
    this.swimprimir = !this.swimprimir;
  }

  regresar() {
    this.router.navigate(['preingresos']);
  }

  async imprimir() {
    this.swbotones = true;
    this.swcalculando = true;
    let fecha = this.formImprimir.value.fecha;
    switch (this.opcreporte) {
      case 1: //Saldos de las Partidas Ingresos
        try {
          let codpar = this.formImprimir.value.codpar;
          let nompar = this.formImprimir.value.nompar;
          this._presupuei = await this.preingService.getParingresoAsync(
            codpar,
            nompar
          );
          this.saldos();
          this.swcalculando = false;
          if (this.swimprimir) this.txtcalculando = 'Mostrar';
          else this.txtcalculando = 'Descargar';
        } catch (error) {
          console.error('Error al obtener las partidas:', error);
        }
        break;
      case 2: //Cédula Presupuestaria de ingresos
        try {
          let codpar = this.formImprimir.value.codpar;
          let nompar = this.formImprimir.value.nompar;
          this._presupuei = await this.preingService.getParingresoAsync(
            codpar,
            nompar
          );
          await this.saldos_ing();
          this.swcalculando = false;
          if (this.swimprimir) this.txtcalculando = 'Mostrar';
          else this.txtcalculando = 'Descargar';
        } catch (error) {
          console.error('Error al obtener las partidas:', error);
        }
        break;
      case 3: //Partidas del Presupuesto de Ingresos
        try {
          let codpar = this.formImprimir.value.codpar;
          let nompar = this.formImprimir.value.nompar;
          this._presupuei = await this.preingService.getParingresoAsync(
            codpar,
            nompar
          );
          this.swcalculando = false;
          if (this.swimprimir) this.txtcalculando = 'Mostrar';
          else this.txtcalculando = 'Descargar';
        } catch (error) {
          console.error('Error al obtener las partidas:', error);
        }
        break;
    }
  }

  saldos() {
    let i = 0;
    this._presupuei.forEach(
      (objEjecu: { reforma: number; devengado: number; cobrado: number }) => {
        this.ejeService
          .getTotalModi(
            this._presupuei[i].codpar,
            this.formImprimir.value.desde,
            this.formImprimir.value.hasta
          )
          .subscribe({
            next: (resp) => (objEjecu.reforma = resp),
            error: (err) =>
              console.error(
                'Error al obtener el total de reformas:',
                err.error
              ),
          });
        this.ejeService
          .getTotalDeven(
            this._presupuei[i].codpar,
            this.formImprimir.value.desde,
            this.formImprimir.value.hasta
          )
          .subscribe({
            next: (resp) => (objEjecu.devengado = resp),
            error: (err) =>
              console.error('Error al obtener el total devengado:', err.error),
          });
        this.ejeService
          .getTotalCobpagado(
            this._presupuei[i].codpar,
            this.formImprimir.value.desde,
            this.formImprimir.value.hasta
          )
          .subscribe({
            next: (resp) => (objEjecu.cobrado = resp),
            error: (err) =>
              console.error('Error al obtener el total cobrado:', err.error),
          });
        i++;
      }
    );
  }

  //Muestra cada reporte
  imprime() {
    this.otrapagina = this.formImprimir.value.otrapagina;
    this.swbotones = false;
    this.swcalculando = false;
    this.txtcalculando = 'Calculando';
    switch (this.opcreporte) {
      case 1: //Saldos de la Partidas de Ingresos
        if (this.swimprimir) this.imprimeSaldos();
        else this.exportaPartidas();
        break;
      case 2: //Cédula de Ingresos
        if (this.swimprimir) this.imprimeCedula();
        else this.exportaCedula();
        break;
      case 3: //Partidas del Presupuesto de ingresos
        if (this.swimprimir) this.imprimePartidas();
        else this.exportaPartidas();
        break;
    }
  }

  async saldos_ing() {
    this.preingService.getPartidas().subscribe({
      next: (resp) => {
        this._presupuea = resp;
        this.numreg = 0;
        this.totalInicia = 0;
        this.totalRefo = 0;
        this.totalCodi = 0;
        this.totalDeve = 0;
        this.totalCobp = 0;
        this.totalSal_Deve = 0;
        this.totalSal_Cobp = 0;
        this.arreglo2 = [];
        for (let presupue of this._presupuea) {
          this.cuenta = presupue.codpar;
          this.ejeService
            .getCodparFecha(
              this.cuenta,
              this.formImprimir.value.desde,
              this.formImprimir.value.hasta
            )
            .subscribe({
              next: (datos) => {
                this._ejecucion = datos;
                this.reforma = 0;
                this.saldo_dev = 0;
                this.saldo_cob = 0;
                this.numreg = ++this.numreg;
                for (const ejecucion of this._ejecucion) {
                  this.reforma += ejecucion.modifi;
                  this.codifica = ejecucion.codificado;
                  this.saldo_dev = this.saldo_dev + ejecucion.devengado;
                  this.saldo_cob = this.saldo_cob + ejecucion.cobpagado;
                }
                presupue.refo = this.reforma;
                presupue.codi = presupue.inicia + presupue.refo;
                presupue.deve = this.saldo_dev;
                presupue.cob = this.saldo_cob;
                presupue.saldo_dev = presupue.codi - presupue.deve;
                presupue.saldo_cob = presupue.codi - presupue.cob;
                this.totalInicia += presupue.inicia;
                this.totalRefo += presupue.refo;
                this.totalCodi += presupue.codi;
                this.totalDeve += presupue.deve;
                this.totalCobp += presupue.cob;
                this.totalSal_Deve += presupue.saldo_dev;
                this.totalSal_Cobp += presupue.saldo_cob;
                this.arreglo2.push({
                  codpar: presupue.codpar,
                  nompar: presupue.nompar,
                  inicia: presupue.inicia,
                  refo: presupue.refo,
                  codi: presupue.codi,
                  deve: presupue.deve,
                  cob: presupue.cob,
                  saldo_dev: presupue.saldo_dev,
                  saldo_cob: presupue.saldo_cob,
                });
                this.nivel_par = presupue.codpar.substring(0, 1);
                this.buscar_clasificador(presupue);
                this.nivel_par = presupue.codpar.substring(0, 2);
                this.buscar_clasificador(presupue);
                this.nivel_par = presupue.codpar.substring(0, 5);
                this.buscar_clasificador(presupue);
                this.nivel_par = presupue.codpar.substring(0, 8);
                this.buscar_clasificador(presupue);
              },
              error: (err) => console.error(err.error),
            });
        }
      },
      error: (err) => console.error(err.error),
    });
  }

  async buscar_clasificador(presupue: any) {
    this.clasiService.getByCodpar(this.nivel_par).subscribe({
      next: (resp: any) => {
        this._clasificador = resp;
        this.cta_cla = this._clasificador.codpar;
        this.nom_cla = this._clasificador.nompar;
        this.ced_inicia = presupue.inicia;
        this.ced_refo = presupue.refo;
        this.ced_codi = presupue.codi;
        this.ced_deve = presupue.deve;
        this.ced_cob = presupue.cob;
        this.ced_saldo_dev = presupue.saldo_dev;
        this.ced_saldo_cob = presupue.saldo_cob;

        const objetoEncontrado = this.arreglo2.find(
          (x1) => x1.codpar === this.cta_cla
        );
        if (objetoEncontrado === undefined) {
          this.arreglo2.push({
            codpar: this.cta_cla,
            nompar: this.nom_cla,
            inicia: this.ced_inicia,
            refo: this.ced_refo,
            codi: this.ced_codi,
            deve: this.ced_deve,
            cob: this.ced_cob,
            saldo_dev: this.ced_saldo_dev,
            saldo_cob: this.ced_saldo_cob,
            negrita: 1,
          });
          this.ced_inicia = 0;
          this.ced_refo = 0;
          this.ced_codi = 0;
          this.ced_deve = 0;
          this.ced_cob = 0;
          this.ced_saldo_dev = 0;
          this.ced_saldo_cob = 0;
        } else {
          objetoEncontrado.inicia += presupue.inicia;
          objetoEncontrado.refo += presupue.refo;
          objetoEncontrado.codi += presupue.codi;
          objetoEncontrado.deve += presupue.deve;
          objetoEncontrado.cob += presupue.cob;
          objetoEncontrado.saldo_dev += presupue.saldo_dev;
          objetoEncontrado.saldo_cob += presupue.saldo_cob;
        }
      },
      error: (err: any) => console.error(err.error),
    });
  }

  imprimeSaldos() {
    const doc = new jsPDF('l', 'mm', 'a4', true);
    let m_izquierda = 10;
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('EpmapaT', m_izquierda, 10);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('SALDOS DE LAS PARTIDAS DE INGRESO', m_izquierda, 16);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('FECHA: ' + this.formImprimir.value.hasta, m_izquierda, 22);
    let cabecera = [
      'PARTIDA',
      'NOMBRE',
      'INICIAL',
      'REFORMA',
      'CODIFICADO',
      'DEVENGADO',
      'COBRADO',
      'SAL.DEVENGA',
      'SAL.COBRO',
    ];

    const datos: any = [];
    let totales: number[] = [0, 0, 0, 0, 0, 0, 0];
    let i = 0;
    this._presupuei.forEach(() => {
      totales[0] = totales[0] + this._presupuei[i].inicia;
      totales[1] = totales[1] + this._presupuei[i].reforma;
      totales[2] =
        totales[2] + this._presupuei[i].inicia + this._presupuei[i].reforma;
      totales[3] = totales[3] + this._presupuei[i].devengado;
      totales[4] = totales[4] + this._presupuei[i].cobrado;
      datos.push([
        this._presupuei[i].codpar,
        this._presupuei[i].nompar,
        this._presupuei[i].inicia,
        this._presupuei[i].reforma,
        this._presupuei[i].inicia + this._presupuei[i].reforma,
        this._presupuei[i].devengado,
        this._presupuei[i].cobrado,
      ]);
      i++;
    });
    datos.push([
      '',
      'TOTAL: ' + this._presupuei.length,
      totales[0],
      totales[1],
      totales[2],
      totales[3],
      totales[4],
    ]);

    autoTable(doc, {
      theme: 'grid',
      margin: { left: m_izquierda - 1, top: 24, right: 6, bottom: 12 },
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
      head: [cabecera],
      body: datos,

      columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'left' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
        8: { halign: 'right' },
      },

      didParseCell: function (data) {
        if (typeof data.cell.raw === 'number') {
          const formattedNumber = data.cell.raw.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          data.cell.text = [formattedNumber];
        }
        if (data.cell.raw == 0) {
          data.cell.text = [''];
        }
        if (data.row.index === datos.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        } // Total Bold
      },
    });

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

    addPageNumbers();

    this.muestraPDF(doc);
  }

  imprimeCedula() {
    const doc = new jsPDF('l', 'mm', 'a4', true);
    let m_izquierda = 10;
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('EpmapaT', m_izquierda, 10);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('CÉDULA PRESUPUESTARIA DE INGRESOS', m_izquierda, 16);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(
      'DEL ' +
        this.formImprimir.value.desde +
        ' AL ' +
        this.formImprimir.value.hasta,
      m_izquierda,
      22
    );
    let cabecera = [
      'PARTIDA',
      'DENOMINACIÓN',
      'INICIAL',
      'REFORMA',
      'CODIFICADO',
      'DEVENGADO',
      'COBRADO',
      'SAL.DEVENGA',
      'SAL.COBRO',
    ];

    // Datos para el body de la cedula
    this.array = [];
    this._presupuea = this.arreglo2;
    this._presupuea.forEach((presupuea: any) => {
      if (
        presupuea.inicia != 0 ||
        presupuea.refo != 0 ||
        presupuea.deve != 0 ||
        presupuea.cob != 0
      ) {
        this.array.push([
          presupuea.codpar,
          presupuea.nompar,
          presupuea.inicia,
          presupuea.refo,
          presupuea.codi,
          presupuea.deve,
          presupuea.cob,
          presupuea.saldo_dev,
          presupuea.saldo_cob,
        ]);
      }
    });
    this.array.sort();

    autoTable(doc, {
      theme: 'grid',
      margin: { left: m_izquierda - 1, top: 24, right: 6, bottom: 12 },
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
      head: [cabecera],
      body: this.array,

      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'left' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
        8: { halign: 'right' },
      },

      didParseCell: function (hookData) {
        if (typeof hookData.cell.raw === 'number') {
          const formattedNumber = hookData.cell.raw.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          hookData.cell.text = [formattedNumber];
        }
        if (hookData.cell.raw == 0) {
          hookData.cell.text = [''];
        }
        if (
          hookData.column.index === 0 &&
          hookData.cell.raw!.toString().length <= 8
        ) {
          Object.values(hookData.row.cells).forEach(function (cell) {
            cell.styles.fontStyle = 'bold';
          });
        }
      },
    });

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

    addPageNumbers();

    this.muestraPDF(doc);
  }

  imprimePartidas() {
    let m_izquierda = 20;
    var doc = new jsPDF();
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('EpmapaT', m_izquierda, 10);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('PRESUPUESTO DE INGRESOS', m_izquierda, 16);
    let cabecera = ['PARTIDA', 'NOMBRE', 'CODIFICADO', 'INICIAL', 'REFORMA'];

    const datos: any = [];
    let totales: number[] = [0, 0, 0];
    let i = 0;
    this._presupuei.forEach(() => {
      totales[0] =
        totales[0] + this._presupuei[i].inicia + this._presupuei[i].totmod;
      totales[1] = totales[1] + this._presupuei[i].inicia;
      totales[2] = totales[2] + this._presupuei[i].totmod;
      datos.push([
        this._presupuei[i].codpar,
        this._presupuei[i].nompar,
        this._presupuei[i].inicia + this._presupuei[i].totmod,
        this._presupuei[i].inicia,
        this._presupuei[i].totmod,
      ]);
      i++;
    });
    datos.push([
      '',
      'TOTAL: ' + this._presupuei.length,
      totales[0],
      totales[1],
      totales[2],
    ]);

    autoTable(doc, {
      theme: 'grid',
      margin: { left: m_izquierda - 1, top: 18, right: 10, bottom: 12 },
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
      head: [cabecera],
      body: datos,

      columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'left' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
      },

      didParseCell: function (data) {
        if (typeof data.cell.raw === 'number') {
          const formattedNumber = data.cell.raw.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          data.cell.text = [formattedNumber];
        }
        if (data.cell.raw == 0) {
          data.cell.text = [''];
        }
        if (data.row.index === datos.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        } // Total Bold
      },
    });

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

    addPageNumbers();

    this.muestraPDF(doc);
  }

  muestraPDF(doc: any) {
    var opciones = { filename: this.pdfgenerado };
    if (this.otrapagina) doc.output('dataurlnewwindow', opciones);
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

  exportaPartidas() {
    this.nombrearchivo = this.formImprimir.value.nombrearchivo;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(this.nombrearchivo);
    // Fila 1
    worksheet.addRow(['', '', 'PRESUPUESTO DE INGRESOS']);
    worksheet.getCell('C1').font = {
      name: 'Times New Roman',
      bold: true,
      size: 14,
      color: { argb: '002060' },
    };

    // Fila 2
    worksheet.addRow([]);

    const cabecera = [
      '#',
      'Código',
      'Nombre',
      'Codificado',
      'Inicial',
      'Reforma',
    ];
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
    let i = 0;
    this._presupuei.forEach((item: any) => {
      let fila = worksheet.addRow([
        i,
        item.codpar,
        item.nompar,
        item.inicia + item.totmod,
        item.inicia,
        item.totmod,
      ]);
      i++;
    });

    // Establece el ancho de las columnas
    const anchoConfig = [
      { columnIndex: 1, widthInChars: 6 },
      { columnIndex: 2, widthInChars: 14 },
      { columnIndex: 3, widthInChars: 50 },
      { columnIndex: 4, widthInChars: 16 },
      { columnIndex: 5, widthInChars: 16 },
      { columnIndex: 6, widthInChars: 16 },
    ];
    anchoConfig.forEach((config) => {
      worksheet.getColumn(config.columnIndex).width = config.widthInChars;
    });

    // Columnas centradas
    const columnsToCenter = [1];
    columnsToCenter.forEach((columnIndex) => {
      worksheet
        .getColumn(columnIndex)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
    });
    // Columnas a la derecha
    let columnsToRigth = [4, 5, 6];
    columnsToRigth.forEach((columnIndex) => {
      worksheet
        .getColumn(columnIndex)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = { horizontal: 'right' };
        });
    });

    // Formato numérico
    const numeroStyle = { numFmt: '#,##0.00' };
    const columnsToFormat = [4, 5, 6];
    for (let i = 4; i <= this._presupuei.length + 3; i++) {
      columnsToFormat.forEach((columnIndex) => {
        const cell = worksheet.getCell(i, columnIndex);
        cell.style = numeroStyle;
      });
    }

    //Coloca la fila del Total
    worksheet.addRow(['', '', 'TOTAL']);
    worksheet.getCell('C' + (this._presupuei.length + 4).toString()).font = {
      bold: true,
    };

    let celdaD = worksheet.getCell(
      'D' + (this._presupuei.length + 4).toString()
    );
    celdaD.numFmt = '#,##0.00';
    celdaD.font = { bold: true };
    celdaD.value = {
      formula: 'SUM(D4:' + 'D' + (this._presupuei.length + 3).toString() + ')',
      result: 0,
      sharedFormula: undefined,
      date1904: false,
    };

    let celdaE = worksheet.getCell(
      'E' + (this._presupuei.length + 4).toString()
    );
    celdaE.numFmt = '#,##0.00';
    celdaE.font = { bold: true };
    celdaE.value = {
      formula: 'SUM(E4:' + 'E' + (this._presupuei.length + 3).toString() + ')',
      result: 0,
      sharedFormula: undefined,
      date1904: false,
    };

    let celdaF = worksheet.getCell(
      'F' + (this._presupuei.length + 4).toString()
    );
    celdaF.numFmt = '#,##0.00';
    celdaF.font = { bold: true };
    celdaF.value = {
      formula: 'SUM(F4:' + 'F' + (this._presupuei.length + 3).toString() + ')',
      result: 0,
      sharedFormula: undefined,
      date1904: false,
    };

    // Crea el archivo Excel
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      // Crear un enlace para descargar el archivo
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.nombrearchivo}.xlsx`; // Usa el nombre proporcionado por el usuario
      a.click();
      window.URL.revokeObjectURL(url); // Libera recursos
    });
  }

  exportaCedula() {
    this.nombrearchivo = this.formImprimir.value.nombrearchivo;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(this.nombrearchivo);

    const customStyle14 = {
      font: {
        name: 'Times New Roman',
        bold: true,
        size: 14,
        color: { argb: '002060' },
      },
    };
    const customStyle12 = {
      font: {
        name: 'Times New Roman',
        bold: true,
        size: 12,
        color: { argb: '002060' },
      },
    };

    // Fila 1
    worksheet.addRow(['CÉDULA PRESUPUESTARIA DE INGRESOS']);
    worksheet.getCell('A1').font = customStyle14.font;

    // Fila 2
    worksheet.addRow([
      'DEL ' +
        this.formImprimir.value.desde +
        ' AL ' +
        this.formImprimir.value.hasta,
    ]);
    worksheet.getCell('A2').font = customStyle12.font;

    //Fila 3 Cabecera
    const cabecera = worksheet.addRow([
      'Partida',
      'Denominación',
      'Inicial',
      'Reforma',
      'Codificado',
      'Devengado',
      'Cobrado',
      'Sal.Devenga',
      'Sal.Cobro',
    ]);
    cabecera.eachCell((celda) => {
      celda.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '002060' },
      };
      celda.font = {
        bold: true,
        name: 'Times New Roman',
        color: { argb: 'FFFFFF' },
      };
    });

    var datos: any = [];
    this._presupuea = this.arreglo2;
    this._presupuea.forEach((presupuea: any) => {
      if (
        presupuea.inicia != 0 ||
        presupuea.refo != 0 ||
        presupuea.deve != 0 ||
        presupuea.cob != 0
      ) {
        datos.push([
          presupuea.codpar,
          presupuea.nompar,
          presupuea.inicia,
          presupuea.refo,
          presupuea.codi,
          presupuea.deve,
          presupuea.cob,
          presupuea.saldo_dev,
          presupuea.saldo_cob,
        ]);
      }
    });

    datos.sort();

    // Agrega los datos a la hoja de cálculo
    datos.forEach((item: any) => {
      worksheet.addRow([
        item[0],
        item[1],
        item[2],
        item[3],
        item[4],
        item[5],
        item[6],
        item[7],
        item[8],
      ]);
    });

    // Establece el ancho de las columnas
    const anchoConfig = [
      { columnIndex: 1, widthInChars: 14 },
      { columnIndex: 2, widthInChars: 65 },
      { columnIndex: 3, widthInChars: 14 },
      { columnIndex: 4, widthInChars: 14 },
      { columnIndex: 5, widthInChars: 14 },
      { columnIndex: 6, widthInChars: 14 },
      { columnIndex: 7, widthInChars: 14 },
      { columnIndex: 8, widthInChars: 14 },
      { columnIndex: 9, widthInChars: 14 },
    ];
    anchoConfig.forEach((config) => {
      worksheet.getColumn(config.columnIndex).width = config.widthInChars;
    });

    // Columnas a la derecha
    let columnsToRigth = [3, 4, 5, 6, 7, 8, 9];
    columnsToRigth.forEach((columnIndex) => {
      worksheet
        .getColumn(columnIndex)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = { horizontal: 'right' };
        });
    });

    // Formato numérico
    const columnsToFormat = [3, 4, 5, 6, 7, 8, 9];
    for (let i = 4; i <= datos.length + 3; i++) {
      columnsToFormat.forEach((columnIndex) => {
        worksheet.getCell(i, columnIndex).style = { numFmt: '#,##0.00' };
        //Filas en Negrita
        const celdaAi = worksheet.getCell('A' + i.toString()).value;
        if (celdaAi!.toString().length <= 8) {
          for (let col = 1; col <= 9; col++) {
            worksheet.getCell(
              String.fromCharCode(64 + col) + i.toString()
            ).font = { bold: true };
          }
        }
      });
    }

    //Coloca la fila del Total
    // worksheet.addRow(['', '', 'TOTAL']);
    // worksheet.getCell('C' + (this._presupuea.length + 4).toString()).font = { bold: true }

    // let celdaD = worksheet.getCell('D' + (this._presupuei.length + 4).toString());
    // celdaD.numFmt = '#,##0.00'; celdaD.font = { bold: true }
    // celdaD.value = { formula: 'SUM(D4:' + 'D' + (this._presupuei.length + 3).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

    // let celdaE = worksheet.getCell('E' + (this._presupuei.length + 4).toString());
    // celdaE.numFmt = '#,##0.00'; celdaE.font = { bold: true }
    // celdaE.value = { formula: 'SUM(E4:' + 'E' + (this._presupuei.length + 3).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

    // let celdaF = worksheet.getCell('F' + (this._presupuei.length + 4).toString());
    // celdaF.numFmt = '#,##0.00'; celdaF.font = { bold: true }
    // celdaF.value = { formula: 'SUM(F4:' + 'F' + (this._presupuei.length + 3).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

    // Crea el archivo Excel
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      // Crear un enlace para descargar el archivo
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.nombrearchivo}.xlsx`; // Usa el nombre proporcionado por el usuario
      a.click();
      window.URL.revokeObjectURL(url); // Libera recursos
    });
  }
}
