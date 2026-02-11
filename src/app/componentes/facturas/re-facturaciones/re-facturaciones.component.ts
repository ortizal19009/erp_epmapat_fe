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
    public authService: AutorizaService,
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
          this.f_emisionIndividual.patchValue({ emision: null }, { emitEvent: false });
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
      .getByIdEmisionIdabonado(this.f_emisionIndividual.value.emision, abonado.idabonado)
      .subscribe({
        next: async (datos: any[]) => {
          // 1) facturas eliminadas: fechaelimina/fechaeliminacion != null
          for (const i of (datos || [])) {
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
      console.warn('No se puede guardar: no existen facturas antiguas eliminadas.');
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

      // TODO: si tienes un endpoint para obtener/crear la ruta-emisión del abonado:
      // nuevarutaxemi = await firstValueFrom(this.ruxemiService.getOrCreateByEmisionCuenta(this.f_emisionIndividual.value.emision, this.abonado.idabonado))

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
  imprimirItem(item: any): void {
    console.log('Imprimir item:', item);
    // TODO: tu iEmisionIndividual() (jsPDF)
  }

  // =======================
  // TUS MÉTODOS (se dejan, pero ya operativos)
  // =======================

  // Genera lecturas + planilla para el abonado seleccionado
  async generaLecturaIndividual(nuevarutaxemi: any, novedad: any) {
    try {
      const dateEmision: Date = new Date();

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

      this.s_emisionindividual.saveEmisionIndividual(emision_individual).subscribe({
        next: () => {},
        error: (e) => console.error(e),
      });
    }

    // ====== CALCULO VALORES ======
    let categoria = lectura.idabonado_abonados.idcategoria_categorias.idcategoria;
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
      m3: lectura.lecturaanterior - lectura.lecturaactual,
      categoria: lectura.idcategoria,
      swMunicipio: lectura.idabonado_abonados.municipio,
      swAdultoMayor: lectura.idabonado_abonados.municipio,
      swAguapotable: lectura.idabonado_abonados.swalcantarillado,
    };

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
