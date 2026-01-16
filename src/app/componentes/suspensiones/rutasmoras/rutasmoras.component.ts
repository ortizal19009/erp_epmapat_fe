import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Facturas } from 'src/app/modelos/facturas.model';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { InteresesService } from 'src/app/servicios/intereses.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { PdfService } from 'src/app/servicios/pdf.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { RutasService } from 'src/app/servicios/rutas.service';

type AccionFila = 'SUSPENDER' | 'RETIRAR_MEDIDOR' | null;

interface RowUIState {
  selected: boolean;
  notificar: boolean;
  accion: AccionFila;
}

@Component({
  selector: 'app-rutasmoras',
  templateUrl: './rutasmoras.component.html',
  styleUrls: ['./rutasmoras.component.css'],
})
export class RutasmorasComponent implements OnInit {
  _ruta: any;
  filterTerm: string = '';
  today: number = Date.now();
  titulo: string = 'Valores pendientes Abonados de la ruta ';
  abonados: any;
  _lecturas: any;
  _abonados: any = [];
  porcCarga: number = 0;
  _facSinCobro: any;
  datosImprimir: any = [];
  _abonado: any;

  /* Intereses */
  calInteres = {} as calcInteres;
  totInteres: number = 0;
  arrCalculoInteres: any = [];
  factura: Facturas = new Facturas();
  _intereses: any;
  valoriva: number = 0;
  _codigo: string = '';

  _rxf: any = [];
  rubrostotal: number = 0;
  datosCuentas: any[] = [];

  /* SORT */
  currentSortColumn: any | null = null;
  isAscending: boolean = true;

  cuenta: any;
  modalSize: string = 'lg';

  // ===== NUEVO =====
  rowUI: Record<number, RowUIState> = {};
  seleccionados: any[] = [];
  selectedCount: number = 0;
  notifyCount: number = 0;

  constructor(
    private rutaDato: ActivatedRoute,
    private lecService: LecturasService,
    private rubxfacService: RubroxfacService,
    private fb: FormBuilder,
    private s_ruta: RutasService,
    private s_abonado: AbonadosService,
    private s_facturas: FacturaService,
    private s_pdf: PdfService,
    private s_rubxfacturas: RubroxfacService,
    private interService: InteresesService,
    private s_loading: LoadingService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/mora-abonados');
    const coloresJSON = sessionStorage.getItem('/mora-abonados');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

    const idruta = this.rutaDato.snapshot.paramMap.get('idruta');
    this.getRuta(+idruta!);
    this.getDatosCuenta(+idruta!);
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');

    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  getRuta(idruta: number) {
    this.s_ruta.getByIdruta(idruta).subscribe({
      next: (rutaDatos: any) => {
        this._ruta = rutaDatos;
        this.titulo += rutaDatos.descripcion;
      },
      error: (e) => console.error(e),
    });
  }

  // =========================
  // NUEVO: Inicializar UI por fila
  // =========================
  private initRowUI(list: any[]) {
    if (!Array.isArray(list)) return;
    for (const a of list) {
      const key = Number(a.cuenta);
      if (!this.rowUI[key]) {
        this.rowUI[key] = {
          selected: false,
          notificar: false,
          accion: 'SUSPENDER',
        };
      }
    }
    this.rebuildSeleccionados();
  }

  onRowSelectedChange(abonado: any) {
    const key = Number(abonado.cuenta);
    const ui = this.rowUI[key];
    if (!ui) return;

    // Si deselecciona, apagamos notificar (opcional) pero conservamos acción
    if (!ui.selected) {
      ui.notificar = false;
    }
    this.rebuildSeleccionados();
  }

  toggleSelectAll(ev: any) {
    const checked = !!ev?.target?.checked;
    for (const a of this.datosCuentas) {
      const key = Number(a.cuenta);
      if (!this.rowUI[key]) continue;
      this.rowUI[key].selected = checked;
      if (!checked) this.rowUI[key].notificar = false;
    }
    this.rebuildSeleccionados();
  }

  clearSelection() {
    for (const a of this.datosCuentas) {
      const key = Number(a.cuenta);
      if (!this.rowUI[key]) continue;
      this.rowUI[key].selected = false;
      this.rowUI[key].notificar = false;
      // accion se mantiene por defecto, si quieres reset:
      // this.rowUI[key].accion = 'SUSPENDER';
    }
    this.rebuildSeleccionados();
  }

private rebuildSeleccionados() {
  const selected: any[] = [];
  let notify = 0;

  for (const a of this.datosCuentas) {
    const key = Number(a.cuenta);
    const ui = this.rowUI[key];
    if (!ui) continue;

    if (ui.selected) {
      selected.push({
        ...a,
        _accion: ui.accion,
        _notificar: ui.notificar === true, // ✅ fuerza boolean
      });
      if (ui.notificar) notify++;
    }
  }

  this.seleccionados = selected;
  this.selectedCount = selected.length;
  this.notifyCount = notify;
}


  // =========================
  // BOTON GLOBAL: Procesar seleccionados
  // - genera PDF con seleccionados
  // - guarda notificaciones en tabla (backend)
  // =========================
  async procesarSeleccionados() {
    if (this.seleccionados.length === 0) {
      alert('No hay filas seleccionadas.');
      return;
    }

    // Validación: acción obligatoria
    const sinAccion = this.seleccionados.filter(x => !x._accion);
    if (sinAccion.length > 0) {
      alert('Hay seleccionados sin acción. Elige Suspender o Retirar medidor.');
      return;
    }

    this.s_loading.showLoading();

    // 1) Guardar notificaciones en tabla (solo los que tienen _notificar)
    const paraNotificar = this.seleccionados.filter(x => x._notificar);
    if (paraNotificar.length > 0) {
      try {
        await this.guardarNotificaciones(paraNotificar);
      } catch (e) {
        console.error(e);
        // no bloqueamos el PDF si falla BD (tu decides)
      }
    }

    // 2) Generar PDF global con seleccionados
    this.generarPdfSeleccionados(this.seleccionados);

    this.s_loading.hideLoading();
  }

  private generarPdfSeleccionados(rows: any[]) {
    const doc = new jsPDF('p', 'pt', 'a4');
    this.s_pdf.header(`${this.titulo} - Seleccionados`, doc);

    const body = rows.map((r: any, idx: number) => ([
      idx + 1,
      r.cuenta,
      r.nombre,
      r.cedula,
      r.num_facturas,
      Number(r.subtotal).toFixed(2),
      Number(r.intereses).toFixed(2),
      Number(r.total).toFixed(2),
      r._notificar ? 'SI' : 'NO',
      r._accion === 'SUSPENDER' ? 'SUSPENDER' : 'RETIRAR MEDIDOR',
    ]));

    autoTable(doc, {
      head: [[
        '#', 'Cuenta', 'Cliente', 'Identificación', 'Deudas',
        'Subtotal', 'Interés', 'Total', 'Notificar', 'Acción'
      ]],
      body,
      styles: { fontSize: 7 },
      headStyles: { halign: 'center' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 18 },
        1: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
        8: { halign: 'center' },
        9: { halign: 'center' },
      },
    });

    this.s_pdf.setfooter(doc);

    const pdfDataUri = doc.output('datauri');
    const viewer:any = document.getElementById('pdfSeleccionadosViewer') as HTMLIFrameElement;
    viewer.src = pdfDataUri;
  }

  // =========================
  // Guardar notificaciones en tabla (backend)
  // Aquí debes conectar tu endpoint real
  // =========================
  private async guardarNotificaciones(rows: any[]): Promise<void> {
    // Payload sugerido para tu backend:
    // - cuenta
    // - idruta
    // - total, intereses, subtotal
    // - accion
    // - fecha
    const payload = rows.map((r: any) => ({
      cuenta: Number(r.cuenta),
      idruta: this._ruta?.idruta ?? null,
      total: Number(r.total),
      subtotal: Number(r.subtotal),
      intereses: Number(r.intereses),
      accion: r._accion, // 'SUSPENDER' | 'RETIRAR_MEDIDOR'
      fecha: new Date().toISOString(),
      usuario: sessionStorage.getItem('usuario') ?? null,
    }));

    // EJEMPLO: si tuvieras un servicio NotificationsService:
    // return firstValueFrom(this.notifService.guardarBatch(payload));

    // Por ahora, dejo stub:
    console.log('GUARDAR NOTIFICACIONES (BATCH) payload:', payload);
    return;
  }

  // =========================
  // TUS METODOS EXISTENTES
  // =========================
  getDatosCuenta(idruta: number) {
    this.s_loading.showLoading();
    this.s_abonado.DeudasCuentasByRuta(idruta).then((item: any) => {
      this.datosCuentas = item;

      // ✅ importantísimo para no tener undefined
      this.initRowUI(this.datosCuentas);

      this.s_loading.hideLoading();
    });
  }

  sortData(column: any) {
    if (this.currentSortColumn === column) {
      this.isAscending = !this.isAscending;
    } else {
      this.currentSortColumn = column;
      this.isAscending = true;
    }

    this.datosCuentas = this.datosCuentas.sort((a: any, b: any) => {
      if (a[column] < b[column]) return this.isAscending ? -1 : 1;
      if (a[column] > b[column]) return this.isAscending ? 1 : -1;
      return 0;
    });
  }

  detallesAbonado(cuenta: any) {
    this.cuenta = cuenta;
  }

  // ========= lo demás tuyo lo puedes dejar tal cual =========
  // Si quieres que también exista "impDatosRutaTable()" (imprimir tabla completa), déjalo igual.

}

interface calcInteres {
  anio: number;
  mes: number;
  interes: number;
  valor: number;
}
