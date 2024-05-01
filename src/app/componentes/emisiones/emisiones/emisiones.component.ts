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
    private s_novedades: NovedadesService
  ) { }

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
        console.log(datos);
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
      lecturaanterior: '',
      lecturaactual: '',
      idnovedad_novedades: ''
    })
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
        console.log('CERRAR EMISION getByIdEmision: ', datos);
        datos.m3 = this.subtotal;
        datos.estado = 1;
        datos.usuariocierre = this.authService.idusuario;
        const fechaHora = new Date();
        const data = { fechaHora: fechaHora.toISOString() };
        datos.fechacierre = fechaHora;
        this.emiService.update(this.idemision, datos).subscribe({
          next: (nex) => {
            console.log('Emisiones cerradas', nex);
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
        console.log('ID del registro creado:', idRegistroCreado);
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
  emisionIndividual() { }
  getAllEmisiones() {
    this.emiService.findAllEmisiones().subscribe({
      next: (datos: any) => {
        console.log(datos);
        this._allemisiones = datos;
      },
      error: (e) => console.error(e),
    });
  }
  viewAbonadosOpt() {
    this.optabonado = false;
  }
  setAbonado(abonado: any) {
    console.log(abonado);
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
          console.log(datos);
          this._lectura = datos;
          this.f_lecturas.patchValue({
            lecturaanterior: datos.lecturaanterior,
            lecturaactual: datos.lecturaactual,
            idnovedad_novedades: datos.idnovedad_novedades
          })
        },
        error: (e) => console.error(e),
      });
    /*    
       this.cliente = abonado.idcliente_clientes;
       this.l_habilitaciones = false;
       if (abonado.estado != 1) {
         this.btn_habilitacion = false;
       } */
  }
  // generarLecturaIndividual(){
  /* 
  fechaemision
  lecturaanterior
  lecturaactual
  lecturadigitada
  mesesmulta
  idnovedad_novedades
  idemision
  idabonado_abonados
  idresponsable
  idcategoria
  idrutaxemision
  idfactura
  */

  // }
  saveEmisionIndividual() {
    console.log(this.f_emisionIndividual.value)
    console.log(this._lectura)
    let lectura: Lecturas = new Lecturas();
    console.log(this.f_lecturas.value)


  }
  async generaRutaxemisionIndividual() {
    if (this.cerrado === 0) {
      let fecha: Date = new Date();
      let novedad: Novedad = new Novedad();
      novedad.idnovedad = 1;
      let rutasxemision = {} as Rutasxemision;
      let emision: Emisiones = new Emisiones();
      let ruta: Rutas = new Rutas();
      ruta.idruta = this.ruta.idruta;
      emision.idemision = this.idemision;
      //rutasxemision.estado = 0; //Ruta Abierta
      //rutasxemision.m3 = 0;
      //rutasxemision.idemision_emisiones = emision;
      //rutasxemision.idruta_rutas = ruta;
      //rutasxemision.usucrea = this.authService.idusuario;
      //rutasxemision.feccrea = fecha;
      console.log(rutasxemision)
      console.log(ruta)
      console.log(novedad)
      console.log(emision)
      this.ruxemiService.getByEmisionRuta(emision.idemision, ruta.idruta).subscribe({
        next: (datos: any) => {
          console.log(datos)
          rutasxemision = datos
          this.generaLecturaIndividual(rutasxemision, novedad);
        }, error: (e) => console.error(e)
      })
      try {
        /*       const nuevaRutaxemision = await this.ruxemiService.updateRutaxemision(rutasxemision.idrutaxemision,
          rutasxemision
        ); */
      } catch (error) {
        console.error(`Al guardar Rutaxemision `, error);
      }
    }
  }
  //Genera las lecturas de los abonados de la nueva Rutaxemision
  async generaLecturaIndividual(nuevarutaxemi: any, novedad: any) {
    try {
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
      planilla.feccrea = new Date(this.fechaemision);
      //let nuevoIdfactura = k; Solo para pruebas, para que no genere las facturas
      let nuevoIdfactura: number = 0;
      try {
        //Crea la planilla con el metodo que devuelve el idfactura generado
        nuevoIdfactura = await this.facService.saveFacturaAsyncId(planilla);
      } catch (error) {
        console.error(`Al guardar la Factura (planilla)`, error);
      }
      //Ahora si crea la Lectura para cada Abonado
      let lectura = {} as Lectura;
      lectura.estado = 0;
      lectura.fechaemision = this.fechaemision;
      try {
        let lecturaanterior = await this.s_lecturas.getUltimaLecturaAsync(
          this.abonado.idabonado
        );
        if (!lecturaanterior) {
          lecturaanterior = 0;
        }
        lectura.lecturaanterior = lecturaanterior;
      } catch (error) {
        console.error(`Al buscar la Última lectura`, error);
      }
      lectura.lecturaactual = 0;
      lectura.lecturadigitada = 0;
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
        await this.s_lecturas.saveLecturaAsync(lectura);
      } catch (error) {
        console.error(`Al guardar La lectura`, error);
      }
    } catch (error) {
      console.error(`Al recuperar los Abonados por ruta `, error);
    }
  }
  getAllNovedades() {
    this.s_novedades.getAll().subscribe({
      next: (datos: any) => {
        console.log(datos);
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
