import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';

import { EmisionService } from 'src/app/servicios/emision.service';
import { EmisionIndividualService } from 'src/app/servicios/emision-individual.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { NovedadesService } from 'src/app/servicios/novedades.service';
import { RutasxemisionService } from 'src/app/servicios/rutasxemision.service';
import { AutorizaService } from 'src/app/compartida/autoriza.service';

import { Abonados } from 'src/app/modelos/abonados';
import { Clientes } from 'src/app/modelos/clientes';
import { Modulos } from 'src/app/modelos/modulos.model';
import { Lecturas } from 'src/app/modelos/lecturas.model';
import { EmisionIndividual } from 'src/app/modelos/emisionindividual.model';
import { Emisiones } from 'src/app/modelos/emisiones.model';
import { Rutas } from 'src/app/modelos/rutas.model';
import { Novedad } from 'src/app/modelos/novedad.model';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import { PdfService } from 'src/app/servicios/pdf.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { ColoresService } from 'src/app/compartida/colores.service';

type Vista = 'LISTA' | 'NUEVA';

@Component({
  selector: 'app-re-facturaciones',
  templateUrl: './re-facturaciones.component.html',
})
export class ReFacturacionesComponent implements OnInit, OnDestroy {
  vista: Vista = 'LISTA';
  cargando = false;

  filterimp = '';

  emisionSeleccionada!: number;
  _allemisiones: any[] = [];
  _emisionindividual: any[] = [];

  novedades: any[] = [];

  f_emisionIndividual!: FormGroup;
  f_lecturas!: FormGroup;

  abonado: Abonados = new Abonados();
  cliente: any = {};
  ruta: any = {};
  optabonado = true;
  btnCrearLectura = false;
  _lectura: any = {};

  idfactura!: number;
  modulo: Modulos = new Modulos();
  cerrado: number = 0;
  lecturaestado: number = 0;

  cambiosPendientes = false;
  guardadoOk = false;

  // Facturas antiguas eliminadas (fechaelimina/fechaeliminacion != null)
  _facturasEliminadas: any[] = [];

  private subs: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private emiService: EmisionService,
    private s_emisionindividual: EmisionIndividualService,
    private s_lecturas: LecturasService,
    private facService: FacturaService,
    private s_novedades: NovedadesService,
    private ruxemiService: RutasxemisionService,
    private coloresService: ColoresService,
    public authService: AutorizaService,
    private s_pdf: PdfService,
    private s_rxfService: RubroxfacService,
  ) {}

  ngOnInit(): void {
    this.f_emisionIndividual = this.fb.group({
      emision: [],
      abonado: [],
    });

    this.f_lecturas = this.fb.group({
      lecturaanterior: 0,
      lecturaactual: 0,
      idnovedad_novedades: '',
    });

    sessionStorage.setItem('ventana', '/re-facturacion');
    let coloresJSON = sessionStorage.getItem('/re-facturacion');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    // cambios SOLO en NUEVA
    this.subs.push(
      this.f_emisionIndividual.valueChanges.subscribe(() => {
        if (this.vista === 'NUEVA') {
          this.cambiosPendientes = true;
          this.guardadoOk = false;
        }
      }),
    );

    this.subs.push(
      this.f_lecturas.valueChanges.subscribe(() => {
        if (this.vista === 'NUEVA') {
          this.cambiosPendientes = true;
          this.guardadoOk = false;
        }
      }),
    );

    this.getAllEmisiones();
    this.getAllNovedades();
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
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
        're-facturacion',
      );
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/re-facturacion', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  // ✅ Guardar habilitado SOLO si: abonado seleccionado + existen facturas eliminadas + no cargando
  get puedeGuardar(): boolean {
    return (
      !!this.f_emisionIndividual?.value?.abonado &&
      (this._facturasEliminadas?.length || 0) > 0 &&
      !this.cargando
    );
  }

  // =======================
  // navegación
  // =======================
  private limpiarSiNoGuardado(): void {
    if (this.cambiosPendientes && !this.guardadoOk) {
      this.limpiarNueva();
    }
  }

  irLista(): void {
    this.limpiarSiNoGuardado();
    this.vista = 'LISTA';
    this.optabonado = true;
  }

  irNueva(): void {
    this.limpiarSiNoGuardado();
    this.vista = 'NUEVA';
    this.limpiarNueva();

    // setea emisión actual en el form
    this.f_emisionIndividual.patchValue(
      { emision: this.emisionSeleccionada },
      { emitEvent: false },
    );
  }

  imprimirEmisionActual(): void {
    if (!this._emisionindividual?.length) return;

    const lista = [...this._emisionindividual];
    const imprimirSecuencial = async () => {
      for (const it of lista) {
        this.imprimirItem(it);
        await new Promise((r) => setTimeout(r, 250));
      }
    };
    imprimirSecuencial();
  }

  // =======================
  // limpieza
  // =======================
  limpiarNueva(): void {
    this.optabonado = true;
    this.btnCrearLectura = false;
    this._lectura = {};
    this.abonado = new Abonados();
    this.cliente = {};
    this.ruta = {};
    this._facturasEliminadas = [];

    this.f_emisionIndividual.patchValue({ abonado: '' }, { emitEvent: false });
    this.f_lecturas.patchValue(
      { lecturaanterior: 0, lecturaactual: 0, idnovedad_novedades: '' },
      { emitEvent: false },
    );

    this.cambiosPendientes = false;
    this.guardadoOk = false;
  }

  // =======================
  // data
  // =======================
  getAllEmisiones(): void {
    this.emiService.findAllEmisiones().subscribe({
      next: (datos: any[]) => {
        // ✅ SOLO estado 1
        this._allemisiones = (datos || []).filter((e) => +e.estado === 1);

        if (!this._allemisiones.length) {
          this.emisionSeleccionada = 0 as any;
          this._emisionindividual = [];
          this.f_emisionIndividual.patchValue(
            { emision: null },
            { emitEvent: false },
          );
          return;
        }

        this.emisionSeleccionada = this._allemisiones[0].idemision;

        this.f_emisionIndividual.patchValue(
          { emision: this.emisionSeleccionada },
          { emitEvent: false },
        );

        this.getEmisionIndividualByIdEmision(this.emisionSeleccionada);
      },
      error: (e) => console.error(e),
    });
  }

  getAllNovedades(): void {
    this.s_novedades.getAll().subscribe({
      next: (d: any[]) => (this.novedades = d || []),
      error: (e) => console.error(e),
    });
  }

  onChangeEmision(idemision: any): void {
    if (this.vista === 'NUEVA') {
      this.limpiarSiNoGuardado();
    }

    this.emisionSeleccionada = +idemision;

    this.f_emisionIndividual.patchValue(
      { emision: this.emisionSeleccionada },
      { emitEvent: false },
    );

    this.getEmisionIndividualByIdEmision(this.emisionSeleccionada);
  }

  getEmisionIndividualByIdEmision(idemision: number): void {
    this.cargando = true;
    this.s_emisionindividual.getByIdEmision(idemision).subscribe({
      next: (datos: any[]) => (this._emisionindividual = datos || []),
      error: (e) => console.error(e),
      complete: () => (this.cargando = false),
    });
  }

  // =======================
  // abonados / ui
  // =======================
  viewAbonadosOpt(): void {
    this.optabonado = false;
  }

  retornar(): void {
    this.optabonado = true;
  }

  // ✅ Seleccionar abonado + buscar lecturas + traer facturas eliminadas
  async setAbonado(abonado: any): Promise<void> {
    this.abonado = abonado;
    this.cliente = abonado?.idcliente_clientes;
    this.ruta = abonado?.idruta_rutas;
    this.optabonado = true;

    this._facturasEliminadas = [];

    this.f_emisionIndividual.patchValue(
      { abonado: abonado?.idabonado },
      { emitEvent: false },
    );

    if (this.vista === 'NUEVA') {
      this.cambiosPendientes = true;
      this.guardadoOk = false;
    }

    this.s_lecturas
      .getByIdEmisionIdabonado(
        this.f_emisionIndividual.value.emision,
        abonado.idabonado,
      )
      .subscribe({
        next: async (datos: any[]) => {
          // 1) facturas eliminadas: fechaelimina/fechaeliminacion != null
          for (const i of datos || []) {
            try {
              const fac: any = await this.facService.getByIdAsync(i.idfactura);
              const fechaElimina = fac?.fechaelimina ?? fac?.fechaeliminacion;

              if (fechaElimina != null) {
                this._facturasEliminadas.push(fac);
              }
            } catch (err) {
              console.error('Error trayendo factura', i?.idfactura, err);
            }
          }

          // 2) cargar lecturas
          if (datos?.length) {
            this.btnCrearLectura = false;
            this._lectura = datos[0];

            this.f_lecturas.patchValue(
              {
                lecturaanterior: datos[0].lecturaanterior,
                lecturaactual: datos[0].lecturaactual,
                idnovedad_novedades: datos[0].idnovedad_novedades,
              },
              { emitEvent: false },
            );
          } else {
            this.btnCrearLectura = true;
            this._lectura = { observaciones: '' };

            this.f_lecturas.patchValue(
              { lecturaanterior: 0, lecturaactual: 0, idnovedad_novedades: '' },
              { emitEvent: false },
            );
          }
        },
        error: (e) => console.error(e),
      });
  }

  // =======================
  // guardar (✅ flujo real implementado)
  // =======================
  async guardarRefacturacion(): Promise<void> {
    if (!this.puedeGuardar) {
      console.warn(
        'No se puede guardar: no existen facturas antiguas eliminadas.',
      );
      return;
    }

    this.cargando = true;
    try {
      // 1) obtener Novedad seleccionada
      const novedad: any = this.f_lecturas.value.idnovedad_novedades;

      // 2) crear/obtener RutaxEmision (si en tu lógica la refacturación depende de una ruta)
      //    ✅ Si tu backend ya te devuelve la rutaxemision actual por abonado+emision, reemplaza este bloque.
      //    Aquí solo dejo el "hook":
      let nuevarutaxemi: any = null;

      nuevarutaxemi = await firstValueFrom(
        this.ruxemiService.getByEmisionRuta(
          this.f_emisionIndividual.value.emision,
          this.abonado.idruta_rutas.idruta,
        ),
      );

      // Si no lo tienes y tu lectura ya funciona con null, puedes dejarlo null.
      // (pero OJO: en tu interface Lectura, idrutaxemision_rutasxemision no debería ser null)
      if (!nuevarutaxemi) {
        // fallback mínimo (si tu API acepta objeto parcial)
        nuevarutaxemi = { idrutaxemision: 0 };
      }

      // 3) generar lectura individual (crea planilla + lectura + calcula valores + crea emision_individual dentro de planilla())
      await this.generaLecturaIndividual(nuevarutaxemi, novedad);

      // 4) marcar OK y refrescar lista
      this.guardadoOk = true;
      this.cambiosPendientes = false;

      this.getEmisionIndividualByIdEmision(this.emisionSeleccionada);
      this.irLista();
    } catch (e) {
      console.error('Error al guardar refacturación', e);
      this.guardadoOk = false;
    } finally {
      this.cargando = false;
    }
  }

  // =======================
  // imprimir
  // =======================
  async imprimirItem(emisionIndividual: any) {
    let doc = new jsPDF('p', 'pt', 'a4');
    /* HEADER */
    let date_emision: Date = new Date(emisionIndividual.idemision.feccrea);
    let fecemision = `${date_emision.getFullYear()}-${
      date_emision.getMonth() + 1
    }`;
    this.s_pdf.header(`REPORTE DE REFACTURACION INDIVIDUAL ${fecemision}`, doc);

    /* LECTURAS ANTERIORES */
    let lectAnteriores = await this.s_rxfService.getByIdfacturaAsync(
      emisionIndividual.idlecturaanterior.idfactura,
    );
    let l_anteriores: any = [];
    let sum_anterior: number = 0;
    let m3_anterior: number =
      emisionIndividual.idlecturaanterior.lecturaactual -
      emisionIndividual.idlecturaanterior.lecturaanterior;
    let anterior_factura = await this.facService.getByIdAsync(
      emisionIndividual.idlecturaanterior.idfactura,
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
      columnStyles: {
        2: { halign: 'center' },
        3: { halign: 'right' },
      },
      head: [['Cod.Rubro', 'Descripción', 'Cant', 'Valor unitario']],
      body: l_anteriores,
      foot: [['TOTAL: ', sum_anterior.toFixed(2)]],
    });
    /* LECTURAS ACTUALES */
    let lectActuales = await this.s_rxfService.getByIdfacturaAsync(
      emisionIndividual.idlecturanueva.idfactura,
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
      emisionIndividual.idlecturanueva.idfactura,
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
      columnStyles: {
        2: { halign: 'center' },
        3: { halign: 'right' },
      },
      head: [['Cod.Rubro', 'Descripción', 'Cant', 'Valor unitario']],
      body: l_nuevos,
      foot: [['TOTAL: ', sum_nuevos.toFixed(2)]],
    });
    let dateEmision: Date = new Date(
      emisionIndividual.idlecturanueva.fechaemision,
    );
    let currentDate: Date = new Date();
    autoTable(doc, {
      bodyStyles: {
        fillColor: 'white',
        textColor: 'black',
        fontSize: 8,
      },
      body: [
        [
          `Fecha emision:  ${dateEmision.getFullYear()}/${
            dateEmision.getMonth() + 1
          }/${dateEmision.getDate()}`,
        ],
        [
          `Fecha impresión:  ${currentDate.getFullYear()}/${
            currentDate.getMonth() + 1
          }/${currentDate.getDate()}`,
        ],
      ],
    });

    // doc.autoPrint();
    //doc.save('datauristring');
    doc.output('dataurlnewwindow', { filename: 'comprobante.pdf' });
  }

  // =======================
  // TUS MÉTODOS (se dejan, pero ya operativos)
  // =======================

  // Genera lecturas + planilla para el abonado seleccionado
  async generaLecturaIndividual(nuevarutaxemi: any, novedad: any) {
    try {
      const dateEmision: Date = new Date();
      this.modulo.idmodulo = 4;

      // 1) Crear Factura (Planilla)
      let planilla = {} as Planilla;
      planilla.idmodulo = this.modulo;

      this.cliente = new Clientes();
      // ⚠️ según tu estructura real:
      // si esto falla, revisa: this.abonado.idresponsable.idcliente
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

      let nuevoIdfactura: number = 0;
      nuevoIdfactura = await this.facService.saveFacturaAsyncId(planilla);
      this.idfactura = nuevoIdfactura;

      // 2) Crear Lectura
      let lectura = {} as Lectura;
      lectura.estado = this.lecturaestado;
      lectura.fechaemision = dateEmision;

      lectura.lecturaanterior = this.f_lecturas.value.lecturaanterior;
      lectura.lecturaactual = this.f_lecturas.value.lecturaactual;
      lectura.lecturadigitada = this.f_lecturas.value.lecturaactual;
      lectura.mesesmulta = 0;

      lectura.idnovedad_novedades = novedad;
      lectura.idemision = this.f_emisionIndividual.value.emision;
      lectura.idabonado_abonados = this.abonado;
      lectura.idresponsable = this.abonado.idresponsable.idcliente;
      lectura.idcategoria = this.abonado.idcategoria_categorias.idcategoria;

      lectura.idrutaxemision_rutasxemision = nuevarutaxemi;
      lectura.total1 = 0;
      lectura.idfactura = nuevoIdfactura;

      const newLectura = await this.s_lecturas.saveLecturaAsync(lectura);

      // 3) calcular planilla y crear emision_individual (tu método ya lo hace)
      if (this.f_lecturas.value.lecturaactual > 0) {
        await this.planilla(newLectura);
      }
    } catch (error) {
      console.error(`Error en generaLecturaIndividual`, error);
      throw error;
    }
  }

  async planilla(lectura: Lecturas) {
    let emision_individual: EmisionIndividual = new EmisionIndividual();

    let ln = new Lecturas();
    let la = new Lecturas();
    let emi = new Emisiones();

    if (this.cerrado === 0) {
      ln.idlectura = lectura.idlectura;
      la.idlectura = this._lectura?.idlectura;
      emi.idemision = lectura.idemision;

      emision_individual.idlecturanueva = ln;
      emision_individual.idlecturaanterior = la;
      emision_individual.idemision = emi;

      this.s_emisionindividual
        .saveEmisionIndividual(emision_individual)
        .subscribe({
          next: () => {},
          error: (e) => console.error(e),
        });
    }

    // ====== CALCULO VALORES ======
    let categoria =
      lectura.idabonado_abonados.idcategoria_categorias.idcategoria;
    let consumo = lectura.lecturaactual - lectura.lecturaanterior;
    let adultomayor = lectura.idabonado_abonados.adultomayor;

    if (adultomayor) {
      if (categoria == 9 && consumo > 34) categoria = 1;
    } else if (categoria == 9 && consumo > 10) categoria = 1;

    if (categoria == 9 && consumo > 34) categoria = 1;
    if (categoria == 1 && consumo > 70) categoria = 2;

    let body: any = {
      idemision: lectura.idemision,
      cuenta: lectura.idabonado_abonados.idabonado,
      idfactura: lectura.idfactura,
      m3: lectura.lecturaactual - lectura.lecturaanterior,
      categoria: lectura.idcategoria,
      swMunicipio: lectura.idabonado_abonados.municipio,
      swAdultoMayor: lectura.idabonado_abonados.municipio,
      swAguapotable: lectura.idabonado_abonados.swalcantarillado,
    };
    console.log(body);

    if (lectura.idemision >= 243) {
      this.s_lecturas.calcular_Valores(body).subscribe({
        next: (datos: any) => console.log(datos),
        error: (e: any) => console.error(e.error),
      });
    } else {
      this.s_lecturas.calcular_Valores_anteriores(body).subscribe({
        next: (datos: any) => console.log(datos),
        error: (e: any) => console.error(e.error),
      });
    }
  }
}

/* =======================
   INTERFACES (las tuyas)
   ======================= */

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
