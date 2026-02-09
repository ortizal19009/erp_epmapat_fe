import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { FacturaService } from './../../../servicios/factura.service';
import { FecfacturaService } from 'src/app/servicios/fecfactura.service';
import { SriEmitidoRow } from 'src/app/interfaces/fec_facturas/SriEmitidoRow';

@Component({
  selector: 'app-sri-emitidos-import',
  imports: [CommonModule, FormsModule],
  templateUrl: './sri-emitidos-import.component.html',
  styleUrls: ['./sri-emitidos-import.component.css'],
  standalone: true,
})
export class SriEmitidosImportComponent {
  rows: SriEmitidoRow[] = [];
  headers: string[] = [];
  cargando = false;
  cargandoEnriquecimiento = false;
  cargandoProcesamiento = false;

  q = '';
  soloErrores = false;
  detectarCabecera: any = true;
  archivoNombre = '';

  private API_XML_AUTORIZADO =
    'http://192.168.0.165:8080/api/singsend/autorizacion';

  constructor(
    private facturaService: FacturaService,
    private fecFacturaService: FecfacturaService,
  ) {}

  // =========================
  // UI helpers
  // =========================
  limpiar(): void {
    this.rows = [];
    this.headers = [];
    this.q = '';
    this.soloErrores = false;
    this.archivoNombre = '';

    this.totalEnriq = 0;
    this.doneEnriq = 0;
    this.totalProc = 0;
    this.doneProc = 0;
  }

  async copiar(texto: string): Promise<void> {
    if (!texto) return;
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = texto;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }

  // =========================
  // 1) Cargar TXT + Parse + Enriquecer
  // =========================
  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.archivoNombre = file.name;
    this.cargando = true;
    this.rows = [];
    this.headers = [];

    try {
      const text = await file.text();
      this.parseTxt(text);

      // DEBUG: confirma que sí cargó filas
      console.log('Filas parseadas:', this.rows.length, this.rows.slice(0, 3));
    } catch (e) {
      console.error(e);
      alert('No se pudo leer el archivo');
    } finally {
      this.cargando = false;
    }

    // Enriquecer
    await this.enriquecerConFacturaERP();
  }

  private parseTxt(text: string) {
    const lines = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      this.rows = [];
      return;
    }

    // OJO: el TXT del SRI a veces viene separado por TAB o | o ;
    const delimiter = this.detectDelimiter(lines[0]);

    let startIndex = 0;
    if (this.detectarCabecera) {
      const firstCols = this.splitLine(lines[0], delimiter);
      const hasHeader = firstCols.some((c) =>
        /comprobante|serie|clave|autoriz|emisi|iva|importe|total/i.test(c),
      );
      if (hasHeader) {
        this.headers = firstCols.map((h) => h.trim());
        startIndex = 1;
      }
    }

    if (this.headers.length === 0) {
      this.headers = [
        'comprobante',
        'serie_comprobante',
        'clave_acceso',
        'fecha_autorizacion',
        'fecha_emision',
        'valor_sin_impuestos',
        'iva',
        'importe_total',
      ];
    }

    const parsed: SriEmitidoRow[] = [];

    for (let i = startIndex; i < lines.length; i++) {
      const raw = lines[i];
      const cols = this.splitLine(raw, delimiter);

      if (cols.length < 8) {
        parsed.push({
          comprobante: '',
          serie_comprobante: '',
          clave_acceso: '',
          fecha_autorizacion: '',
          fecha_emision: '',
          valor_sin_impuestos: 0,
          iva: 0,
          importe_total: 0,
          raw,
          valido: false,
          error: `Fila ${i + 1}: columnas insuficientes (${cols.length}). Delimitador='${delimiter === '\t' ? 'TAB' : delimiter}'`,
          encontrada: false,
          idfactura: null,
          fechacobro: null,
          estadoProceso: 'ERROR',
          msg: 'Columnas insuficientes',
        });
        continue;
      }

      const row: SriEmitidoRow = {
        comprobante: cols[0]?.trim() ?? '',
        serie_comprobante: cols[1]?.trim() ?? '',
        clave_acceso: cols[2]?.trim() ?? '',
        fecha_autorizacion: cols[3]?.trim() ?? '',
        fecha_emision: cols[4]?.trim() ?? '',
        valor_sin_impuestos: this.toNumber(cols[5]),
        iva: this.toNumber(cols[6]),
        importe_total: this.toNumber(cols[7]),
        raw,
        valido: true,

        encontrada: false,
        idfactura: null,
        fechacobro: null,
        estadoProceso: 'PENDIENTE',
        msg: '',
      };

      const errs: string[] = [];
      if (!row.serie_comprobante) errs.push('serie_comprobante vacía');
      if (!row.fecha_emision) errs.push('fecha_emision vacía');
      if (!row.clave_acceso) errs.push('clave_acceso vacía');

      if (errs.length > 0) {
        row.valido = false;
        row.error = errs.join(' | ');
        row.estadoProceso = 'ERROR';
        row.msg = row.error;
      }

      parsed.push(row);
    }

    this.rows = parsed;
  }
  totalEnriq = 0;
  doneEnriq = 0;

  totalProc = 0;
  doneProc = 0;

  get progresoEnriqPct(): number {
    return this.totalEnriq
      ? Math.round((this.doneEnriq / this.totalEnriq) * 100)
      : 0;
  }

  get progresoProcPct(): number {
    return this.totalProc
      ? Math.round((this.doneProc / this.totalProc) * 100)
      : 0;
  }
  // =========================
  // 2) Enriquecer con Factura ERP
  // =========================
  private async _enriquecerConFacturaERP() {
    const candidatas = this.rows.filter((r) => r.valido);
    if (candidatas.length === 0) return;

    this.cargandoEnriquecimiento = true;

    for (const r of candidatas) {
      try {
        const factura = await this.facturaService.async_getByNrofactura(
          r.serie_comprobante,
        );

        if (!factura) {
          r.encontrada = false;
          r.estadoProceso = 'NO_ENCONTRADA';
          r.msg = 'No existe en ERP';
          continue;
        }

        r.encontrada = true;
        r.idfactura = factura.idfactura ?? null;
        r.fechacobro = factura.fechacobro ?? null;
        r.estadoProceso = 'ENCONTRADA';
        r.msg = r.fechacobro ? 'Encontrada (cobrada)' : 'Encontrada';
      } catch {
        r.encontrada = false;
        r.estadoProceso = 'NO_ENCONTRADA';
        r.msg = 'No existe en ERP';
      }
    }

    this.cargandoEnriquecimiento = false;
  }

  // =========================
  // 3) Procesar: solo ENCONTRADAS
  // =========================
  async _procesarSeleccionadas() {
    const filas = this.rows.filter(
      (r) => r.valido && r.encontrada && !!r.idfactura,
    );
    if (filas.length === 0) return;

    this.cargandoProcesamiento = true;

    for (const r of filas) {
      try {
        // 1) Consultar FE por idfactura
        let fe: any = null;
        try {
          fe = await firstValueFrom(
            this.fecFacturaService.getByIdFactura(r.idfactura!),
          );
        } catch {
          fe = null; // si no existe, seguimos
        }

        if (fe && (fe.estado === 'A' || fe.estado === 'O')) {
          r.estadoProceso = 'SALTADA';
          r.msg = `Sin cambios (estado=${fe.estado})`;
          continue;
        }

        // 2) Obtener XML autorizado (string)
        const xmlAutorizado = await firstValueFrom(
          this.fecFacturaService.getXmlAutorizado(
            this.API_XML_AUTORIZADO,
            r.clave_acceso,
          ),
        );

        if (!xmlAutorizado || xmlAutorizado.trim().length < 20) {
          r.estadoProceso = 'ERROR';
          r.msg = 'No se obtuvo XML autorizado';
          continue;
        }

        // 3) PATCH parcial (estado + clave + xml)
        await firstValueFrom(
          this.fecFacturaService.patchSri(r.idfactura!, {
            claveacceso: r.clave_acceso,
            xmlautorizado: xmlAutorizado,
            estado: 'O',
          }),
        );

        r.estadoProceso = 'ACTUALIZADA';
        r.msg = 'Actualizada (clave + XML + estado O)';
      } catch (e: any) {
        r.estadoProceso = 'ERROR';
        r.msg = e?.error?.message || e?.message || 'Error procesando';
      }
    }

    this.cargandoProcesamiento = false;
  }

  // =========================
  // Getters para UI
  // =========================
  get totalOk(): number {
    return this.rows.filter((r) => r.valido).length;
  }

  get totalErr(): number {
    return this.rows.filter((r) => r.valido === false).length;
  }

  get rowsFiltradas(): SriEmitidoRow[] {
    const q = (this.q || '').toLowerCase().trim();

    return this.rows
      .filter(
        (r) =>
          !this.soloErrores ||
          r.valido === false ||
          r.estadoProceso === 'ERROR' ||
          r.estadoProceso === 'NO_ENCONTRADA',
      )
      .filter((r) => {
        if (!q) return true;
        return (
          (r.serie_comprobante || '').toLowerCase().includes(q) ||
          (r.clave_acceso || '').toLowerCase().includes(q) ||
          (r.fecha_emision || '').toLowerCase().includes(q) ||
          (r.fecha_autorizacion || '').toLowerCase().includes(q) ||
          (r.comprobante || '').toLowerCase().includes(q)
        );
      });
  }

  // =========================
  // Helpers parse
  // =========================
  private detectDelimiter(sampleLine: string): string {
    const candidates = ['|', ';', '\t', ','];
    let best = candidates[0];
    let bestCount = -1;

    for (const d of candidates) {
      const count = sampleLine.split(d).length - 1;
      if (count > bestCount) {
        best = d;
        bestCount = count;
      }
    }
    return best;
  }

  private splitLine(line: string, delimiter: string): string[] {
    return line.split(delimiter).map((c) => c.trim());
  }

  private toNumber(v: string): number {
    if (!v) return 0;
    let s = v.trim();

    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');

    if (lastComma > lastDot) {
      // coma decimal
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // punto decimal
      s = s.replace(/,/g, '');
    }

    const n = Number(s);
    return isNaN(n) ? 0 : n;
  }
  private async enriquecerConFacturaERP() {
    const candidatas = this.rows.filter((r) => r.valido);

    if (candidatas.length === 0) return;

    this.cargandoEnriquecimiento = true;

    this.totalEnriq = candidatas.length;
    this.doneEnriq = 0;

    for (const r of candidatas) {
      try {
        const factura = await this.facturaService.async_getByNrofactura(
          r.serie_comprobante,
        );

        if (!factura) {
          r.encontrada = false;
          r.estadoProceso = 'NO_ENCONTRADA';
          r.msg = 'No existe en ERP';
        } else {
          r.encontrada = true;
          r.idfactura = factura[0].idfactura ?? null;
          r.fechacobro = factura[0].fechacobro ?? null;
          r.estadoProceso = 'ENCONTRADA';
          r.msg = r.fechacobro ? 'Encontrada (cobrada)' : 'Encontrada';
        }
      } catch {
        r.encontrada = false;
        r.estadoProceso = 'NO_ENCONTRADA';
        r.msg = 'No existe en ERP';
      } finally {
        this.doneEnriq++;
      }
    }

    this.cargandoEnriquecimiento = false;
  }

  async procesarSeleccionadas() {
    console.log('PROCESANDO...');
    const filas = this.rows.filter(
      (r) => r.valido && r.encontrada && !!r.idfactura,
    );
    if (filas.length === 0) return;

    this.cargandoProcesamiento = true;

    this.totalProc = filas.length;
    this.doneProc = 0;

    for (const r of filas) {
      try {
        // 1) Consultar FE (si no existe, seguimos)
        let fe: any = null;
        try {
          fe = await firstValueFrom(
            this.fecFacturaService.getByIdFactura(r.idfactura!),
          );
        } catch {
          fe = null;
        }

        if (fe && (fe.estado === 'A' || fe.estado === 'O')) {
          r.estadoProceso = 'SALTADA';
          r.msg = `Sin cambios (estado=${fe.estado})`;
          continue;
        }

        // 2) XML autorizado
        const xmlAutorizado = await firstValueFrom(
          this.fecFacturaService.getXmlAutorizado(
            this.API_XML_AUTORIZADO,
            r.clave_acceso,
          ),
        );

        if (!xmlAutorizado || xmlAutorizado.trim().length < 20) {
          r.estadoProceso = 'ERROR';
          r.msg = 'No se obtuvo XML autorizado';
          continue;
        }

        // 3) PATCH parcial
        await firstValueFrom(
          this.fecFacturaService.updateSriFields(r.idfactura!, {
            claveacceso: r.clave_acceso,
            xmlautorizado: xmlAutorizado,
            estado: 'O',
          }),
        );

        r.estadoProceso = 'ACTUALIZADA';
        r.msg = 'Actualizada (clave + XML + estado O)';
      } catch (e: any) {
        r.estadoProceso = 'ERROR';
        r.msg = e?.error?.message || e?.message || 'Error procesando';
      } finally {
        this.doneProc++;
      }
    }

    this.cargandoProcesamiento = false;
  }
}
