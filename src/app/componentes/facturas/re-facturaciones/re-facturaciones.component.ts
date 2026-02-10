import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { EmisionService } from 'src/app/servicios/emision.service';
import { EmisionIndividualService } from 'src/app/servicios/emision-individual.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { NovedadesService } from 'src/app/servicios/novedades.service';
import { RutasxemisionService } from 'src/app/servicios/rutasxemision.service';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Abonados } from 'src/app/modelos/abonados';
import { Subscription } from 'rxjs';
type Vista = 'LISTA' | 'NUEVA';

@Component({
  selector: 'app-re-facturaciones',
  templateUrl: './re-facturaciones.component.html',
})
export class ReFacturacionesComponent implements OnInit, OnDestroy {
  // UI
  vista: Vista = 'LISTA';
  cargando = false;

  // filtro lista
  filterimp = '';

  // selector emisión
  emisionSeleccionada!: number;
  _allemisiones: any[] = [];
  _emisionindividual: any[] = [];

  // catálogo novedades
  novedades: any[] = [];

  // forms
  f_emisionIndividual!: FormGroup;
  f_lecturas!: FormGroup;

  // data
  abonado: Abonados = new Abonados();
  cliente: any = {};
  ruta: any = {};
  optabonado = true;
  btnCrearLectura = false;
  _lectura: any = {};

  // control cambios / guardado
  cambiosPendientes = false; // si hubo edición
  guardadoOk = false; // si se guardó realmente
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

    // ✅ Detectar cambios SOLO cuando estás en NUEVA
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

  // =======================
  //   NAVEGACIÓN / MENÚ
  // =======================

  private limpiarSiNoGuardado(): void {
    // “retención/refacturación no hecha” = hubo cambios y no se guardó
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
  }

  // =======================
  //   IMPRIMIR (MENÚ)
  // =======================

  imprimirEmisionActual(): void {
    if (!this._emisionindividual?.length) return;

    // Si tu impresión abre PDF/ventanas, mejor secuencial con delay
    const lista = [...this._emisionindividual];

    const imprimirSecuencial = async () => {
      for (const it of lista) {
        this.imprimirItem(it);
        await new Promise((r) => setTimeout(r, 250)); // evita que el browser bloquee popups
      }
    };

    imprimirSecuencial();
  }

  // =======================
  //        LIMPIEZA
  // =======================

  limpiarNueva(): void {
    this.optabonado = true;
    this.btnCrearLectura = false;
    this._lectura = {};
    this.abonado = new Abonados();
    this.cliente = {};
    this.ruta = {};

    // reset forms (sin disparar valueChanges)
    this.f_emisionIndividual.patchValue({ abonado: '' }, { emitEvent: false });

    this.f_lecturas.patchValue(
      { lecturaanterior: 0, lecturaactual: 0, idnovedad_novedades: '' },
      { emitEvent: false },
    );

    this.cambiosPendientes = false;
    this.guardadoOk = false;
  }

  // =======================
  //         DATA
  // =======================

  getAllEmisiones(): void {
    this.emiService.findAllEmisiones().subscribe({
      next: (datos: any[]) => {
        this._allemisiones = datos || [];
        this.emisionSeleccionada = this._allemisiones?.[0]?.idemision;

        this.f_emisionIndividual.patchValue(
          { emision: this.emisionSeleccionada },
          { emitEvent: false },
        );

        if (this.emisionSeleccionada) {
          this.getEmisionIndividualByIdEmision(this.emisionSeleccionada);
        }
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
    // ✅ si estás en NUEVA y no guardaste, primero limpia
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
  //     ABONADOS / UI
  // =======================

  viewAbonadosOpt(): void {
    this.optabonado = false;
  }

  retornar(): void {
    this.optabonado = true;
  }

  setAbonado(abonado: any): void {
    this.abonado = abonado;
    this.cliente = abonado?.idcliente_clientes;
    this.ruta = abonado?.idruta_rutas;
    this.optabonado = true;

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
        next: (datos: any[]) => {
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
  //        GUARDAR
  // =======================

  async guardarRefacturacion(): Promise<void> {
    try {
      // ✅ pega aquí tu flujo real (tu “retención/refacturación”):
      // - generaRutaxemisionIndividual()
      // - generaLecturaIndividual()
      // - planilla()
      //
      // EJEMPLO (solo referencia):
      // await firstValueFrom(this.ruxemiService.generar(...))
      // await firstValueFrom(this.s_lecturas.generar(...))
      // await firstValueFrom(this.facService.planilla(...))

      console.log('Guardar refacturación...', {
        emision: this.f_emisionIndividual.value.emision,
        abonado: this.f_emisionIndividual.value.abonado,
        lecturas: this.f_lecturas.value,
      });

      // ✅ si todo OK:
      this.guardadoOk = true;
      this.cambiosPendientes = false;

      // refresca lista
      this.getEmisionIndividualByIdEmision(this.emisionSeleccionada);

      // opcional: volver a lista
      // this.irLista();
    } catch (e) {
      console.error(e);
      this.guardadoOk = false;
      // cambiosPendientes queda true => al salir limpia
    }
  }

  // =======================
  //        IMPRIMIR
  // =======================

  imprimirItem(item: any): void {
    // TODO: tu iEmisionIndividual() (jsPDF) aquí
    console.log('Imprimir item:', item);
  }
}
