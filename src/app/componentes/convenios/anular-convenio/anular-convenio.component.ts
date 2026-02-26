import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Convenios } from 'src/app/modelos/convenios.model';
import { ConvenioService } from 'src/app/servicios/convenio.service';
import { CuotasService } from 'src/app/servicios/cuotas.service';
import { FacxconvenioService } from 'src/app/servicios/facxconvenio.service';

@Component({
  selector: 'app-anular-convenio',
  templateUrl: './anular-convenio.component.html',
  styleUrls: ['./anular-convenio.component.css'],
})
export class AnularConvenioComponent implements OnInit {
  _convenio: any;

  _cuotas: any[] = [];
  _facxconvenio: any[] = [];

  // ✅ listas para tablas desplegables
  facNuevas: any[] = [];
  facViejas: any[] = [];

  // ✅ estados UI
  loading = false;
  error: string | null = null;

  // configura cuántos días después de feccrea vence (ajusta a tu regla real)
  DIAS_VENCIMIENTO = 30;

  // flags UI
  tieneFacturaVencidaNueva = false;
  cantVencidasNuevas = 0;

  tieneFacturaPagadaNueva = false;
  tieneFacturaPendienteNueva = false;

  constructor(
    private actRouter: ActivatedRoute,
    private s_convenio: ConvenioService,
    private s_cuota: CuotasService,
    private s_facxconvenios: FacxconvenioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const idconvenio = Number(
      this.actRouter.snapshot.paramMap.get('idconvenio')
    );
    if (!idconvenio) {
      this.error = 'No se encontró el convenio.';
      return;
    }
    this.getDatosConvenio(idconvenio);
  }

  getDatosConvenio(idconvenio: number) {
    this.loading = true;
    this.error = null;

    // ✅ Mejor: cargar todo junto
    forkJoin({
      convenio: this.s_convenio.getById(idconvenio),
      cuotas: this.s_cuota.getByIdconvenio(idconvenio),
      facxconvenio: this.s_facxconvenios.getFacByConvenio(idconvenio),
    }).subscribe({
      next: (res: any) => {
      console.log(res)
        this._convenio = res.convenio;
        this._cuotas = Array.isArray(res.cuotas) ? res.cuotas : [];
        this._facxconvenio = Array.isArray(res.facxconvenio)
          ? res.facxconvenio
          : [];

        // ✅ separar facturas
        this.separarFacturas();
        this.separarFacturas();
        this.calcularReglasBotones();
        this.separarFacturas();
        this.recalcularVencidas();

        this.loading = false;
      },
      error: (e: any) => {
        console.error(e);
        this.error = 'No se pudieron cargar los datos del convenio.';
        this.loading = false;
      },
    });
  }

  toggleFacturas() {
    const $nuevas = $('#collapseFacNuevas') as any;
    const $viejas = $('#collapseFacViejas') as any;

    const abiertas = $nuevas.hasClass('show') || $viejas.hasClass('show');

    if (abiertas) {
      $nuevas.collapse('hide');
      $viejas.collapse('hide');
    } else {
      $nuevas.collapse('show');
      $viejas.collapse('show');
    }
  }

  /**
   * ✅ Aquí defines la lógica real para separar "nuevas" vs "viejas"
   * Ajusta los campos según tu API.
   */
  private getIdFactura(x: any): number | null {
    if (!x) return null;

    // Caso: idfactura es número
    if (typeof x === 'number') return x;

    // Caso: idfactura es objeto { idfactura: 123 }
    if (typeof x === 'object') {
      if (typeof x.idfactura === 'number') return x.idfactura;

      // Caso raro: { id: 123 }
      if (typeof x.id === 'number') return x.id;

      // Caso: { idfactura_facturas: { idfactura: 123 } }
      if (
        x.idfactura_facturas &&
        typeof x.idfactura_facturas.idfactura === 'number'
      ) {
        return x.idfactura_facturas.idfactura;
      }
    }

    return null;
  }
  separarFacturas() {
    // Normalizar arrays
    const cuotas = Array.isArray(this._cuotas) ? this._cuotas : [];
    const facx = Array.isArray(this._facxconvenio) ? this._facxconvenio : [];

    // 1) Facturas NUEVAS: desde cuotas[*].idfactura
    const mapNuevas = new Map<number, any>();
    for (const c of cuotas) {
      const fac = c?.idfactura; // aquí viene la factura (objeto o id)
      const id = this.getIdFactura(fac);
      if (id != null && !mapNuevas.has(id)) {
        mapNuevas.set(id, fac); // guardo la factura completa
      }
    }

    // 2) Facturas VIEJAS: desde facxconvenio[*].idfactura_facturas
    const mapViejas = new Map<number, any>();
    for (const fx of facx) {
      const fac = fx?.idfactura_facturas; // aquí viene la factura (objeto o id)
      const id = this.getIdFactura(fac);
      if (id != null && !mapViejas.has(id)) {
        mapViejas.set(id, fac);
      }
    }

    // 3) Si una factura aparece en ambos, la dejamos como NUEVA y la quitamos de VIEJAS
    for (const id of mapNuevas.keys()) {
      if (mapViejas.has(id)) mapViejas.delete(id);
    }

    this.facNuevas = Array.from(mapNuevas.values());
    this.facViejas = Array.from(mapViejas.values());
  }

  // ✅ helpers de totales (por si quieres sumar en el template)
  get totalFacNuevas(): number {
    return this.facNuevas.reduce((acc, f) => acc + Number(f?.total || 0), 0);
  }

  get totalFacViejas(): number {
    return this.facViejas.reduce((acc, f) => acc + Number(f?.total || 0), 0);
  }

  anularConvenio() {
    if (!this._convenio.idconvenio) return;

    if (!confirm('¿Desea anular este convenio?')) return;

    // this.s_convenio.anular(this._convenio.idconvenio).subscribe(...)
    console.log('Anulando convenio', this._convenio.nroconvenio);
  }

  eliminarConvenio() {
    if (!this._convenio?.idconvenio) return;

    if (
      !confirm('⚠️ Esta acción es irreversible. ¿Desea eliminar el convenio?')
    )
      return;

    // this.s_convenio.eliminar(this._convenio.idconvenio).subscribe(...)
    console.log('Eliminando convenio', this._convenio.nroconvenio);
  }

  cancelar() {
    this.router.navigate(['/convenios']);
  }

  private esPagadaNueva(f: any): boolean {
    // Ajusta si tu backend maneja pagado distinto:
    // - a veces es 1/0
    // - a veces true/false
    // - a veces un número pagado > 0
    return f?.pagado === 1 && f?.estado === 1;
  }

  private calcularReglasBotones() {
    const nuevas = Array.isArray(this.facNuevas) ? this.facNuevas : [];

    this.tieneFacturaPagadaNueva = nuevas.some((f) => this.esPagadaNueva(f));
    this.tieneFacturaPendienteNueva = nuevas.some(
      (f) => !this.esPagadaNueva(f)
    );
  }

  // helper: convierte feccrea a Date (acepta Date, string ISO, "yyyy-MM-dd", etc.)
  private toDate(fecha: any): Date | null {
    if (!fecha) return null;
    if (fecha instanceof Date) return fecha;

    // si viene tipo "2025-12-23T10:15:00" o "2025-12-23"
    const d = new Date(fecha);
    if (!isNaN(d.getTime())) return d;

    // fallback para "dd/MM/yyyy" (si tu API lo manda así)
    if (typeof fecha === 'string' && fecha.includes('/')) {
      const [dd, mm, yyyy] = fecha.split('/').map(Number);
      if (dd && mm && yyyy) return new Date(yyyy, mm - 1, dd);
    }

    return null;
  }

  private isVencidaByFeccrea(f: any): boolean {
    // si está pagada no la consideramos vencida (opcional)
    if (f?.pagado === 1) return false;

    const feccrea = this.toDate(f?.feccrea);
    if (!feccrea) return false;

    const venc = new Date(feccrea);
    venc.setDate(venc.getDate() + this.DIAS_VENCIMIENTO);

    const hoy = new Date();
    return hoy > venc;
  }

  private recalcularVencidas() {
    const vencidas = (this.facNuevas || []).filter((f) =>
      this.isVencidaByFeccrea(f)
    );
    this.cantVencidasNuevas = vencidas.length;
    this.tieneFacturaVencidaNueva = vencidas.length > 0;
  }
}
