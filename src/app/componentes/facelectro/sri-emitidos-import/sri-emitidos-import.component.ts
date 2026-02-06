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

  // endpoint para traer XML autorizado (ajusta)
  private API_XML_AUTORIZADO = 'http://192.168.0.165:8080/api/singsend/autorizacion';

  constructor(
    private facturaService: FacturaService,
    private fec_facturaService: FecfacturaService,
  ) {}

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
    } catch (e) {
      alert('No se pudo leer el archivo');
    } finally {
      this.cargando = false;
    }

    // Enriquecer: buscar en ERP por cada fila
    await this.enriquecerConFacturaERP();
  }

  private parseTxt(text: string) {
    const lines = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

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
          error: `Fila ${i + 1}: columnas insuficientes (${cols.length}).`,
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

  // =========================
  // 1) ENRIQUECER CON ERP
  // =========================
  private async enriquecerConFacturaERP() {
    const candidatas = this.rows.filter(r => r.valido);

    if (candidatas.length === 0) return;

    this.cargandoEnriquecimiento = true;

    // Importante: hacerlo en serie evita saturar el backend.
    for (const r of candidatas) {
      try {
        const factura = await this.facturaService.async_getByNrofactura(r.serie_comprobante);

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
      } catch (e: any) {
        // Si tu servicio lanza error cuando no encuentra, lo manejas aquí
        r.encontrada = false;
        r.estadoProceso = 'NO_ENCONTRADA';
        r.msg = 'No existe en ERP';
      }
    }

    this.cargandoEnriquecimiento = false;
  }

  // =========================
  // 2) PROCESAR (SOLO ENCONTRADAS)
  // =========================
  async procesarSeleccionadas() {
    const filas = this.rows.filter(r => r.valido && r.encontrada && r.idfactura);

    if (filas.length === 0) return;

    this.cargandoProcesamiento = true;

    for (const r of filas) {
      try {
        // 1) Consultar FE por idfactura
        const fe:any = await firstValueFrom(this.fec_facturaService.getByIdFactura(r.idfactura!));

        // Si existe y ya está A u O => no hacer nada
        if (fe && (fe.estado === 'A' || fe.estado === 'O')) {
          r.estadoProceso = 'SALTADA';
          r.msg = `Sin cambios (estado=${fe.estado})`;
          continue;
        }

        // 2) Traer XML autorizado (tu endpoint)
        const xmlResp: any = await firstValueFrom(
          this.fec_facturaService.httpGet(this.API_XML_AUTORIZADO, { claveAcceso: r.clave_acceso })
        );
        // Ajusta según tu respuesta real:
        const xmlAutorizado = typeof xmlResp === 'string' ? xmlResp : (xmlResp?.xml ?? '');

        if (!xmlAutorizado) {
          r.estadoProceso = 'ERROR';
          r.msg = 'No se obtuvo XML autorizado';
          continue;
        }

        // 3) Actualizar FE (crear o actualizar)
        const payload = {
          idfactura: r.idfactura,
          claveacceso: r.clave_acceso,
          xmlautorizado: xmlAutorizado,
          estado: 'O',
        };

        //await firstValueFrom(this.fec_facturaService.actualizarClaveXmlEstado(payload));

        r.estadoProceso = 'ACTUALIZADA';
        r.msg = 'Actualizada (clave + XML + estado O)';
      } catch (e: any) {
        r.estadoProceso = 'ERROR';
        r.msg = e?.message ?? 'Error procesando';
      }
    }

    this.cargandoProcesamiento = false;
  }

  // =========================
  // Helpers
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
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
    const n = Number(s);
    return isNaN(n) ? 0 : n;
  }

  get totalOk(): number {
    return this.rows.filter((r) => r.valido).length;
  }
  get totalErr(): number {
    return this.rows.filter((r) => r.valido === false).length;
  }

  get rowsFiltradas(): SriEmitidoRow[] {
    const q = (this.q || '').toLowerCase().trim();
    return this.rows
      .filter((r) => !this.soloErrores || r.valido === false || r.estadoProceso === 'ERROR')
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
  limpiar(): void {
  this.rows = [];
  this.headers = [];
  this.q = '';
  this.soloErrores = false;
  this.archivoNombre = '';
}

async copiar(texto: string): Promise<void> {
  if (!texto) return;

  try {
    await navigator.clipboard.writeText(texto);
    // Si quieres, aquí puedes mostrar un toast o alert pequeño
    // alert('Copiado');
  } catch {
    // Fallback por si el navegador bloquea clipboard
    const ta = document.createElement('textarea');
    ta.value = texto;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}


}
