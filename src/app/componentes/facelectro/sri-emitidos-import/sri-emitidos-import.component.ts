import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SriEmitidoRow } from 'src/app/interfaces/fec_facturas/SriEmitidoRow';
import { LoadingService } from 'src/app/servicios/loading.service';
import { FecfacturaService } from 'src/app/servicios/fecfactura.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import {
  SriAttachment,
  SriAutorizacionResponse,
  SriService,
} from 'src/app/servicios/sri.service';

type DocumentoManual = 'factura' | 'retencion';
type TabSri = 'manual' | 'txt';

@Component({
  selector: 'app-sri-emitidos-import',
  imports: [CommonModule, FormsModule],
  templateUrl: './sri-emitidos-import.component.html',
  styleUrls: ['./sri-emitidos-import.component.css'],
  standalone: true,
})
export class SriEmitidosImportComponent {
  tabActiva: TabSri = 'manual';
  tipoDocumentoManual: DocumentoManual = 'factura';
  xmlManual = '';
  xmlManualNombre = '';
  claveAccesoManual = '';
  ambienteManual = 2;
  correoManual = '';
  attemptsManual = 15;
  sleepMillisManual = 4000;
  procesandoManual = false;
  consultandoManual = false;
  resultadoManual: any = null;
  mensajeManual = '';
  errorManual = '';

  rows: SriEmitidoRow[] = [];
  headers: string[] = [];
  cargando = false;
  cargandoEnriquecimiento = false;
  cargandoProcesamiento = false;
  sortColumn:
    | 'serie_comprobante'
    | 'clave_acceso'
    | 'fecha_emision'
    | 'fecha_autorizacion'
    | 'valor_sin_impuestos'
    | 'iva'
    | 'importe_total'
    | 'idfactura'
    | 'fechacobro'
    | 'estadoProceso' = 'serie_comprobante';
  sortDirection: 'asc' | 'desc' = 'asc';

  q = '';
  soloErrores = false;
  detectarCabecera: any = true;
  archivoNombre = '';

  private readonly apiXmlAutorizado = '/api/singsend/autorizacion';

  constructor(
    private facturaService: FacturaService,
    private fecFacturaService: FecfacturaService,
    private sriService: SriService,
    private loadingService: LoadingService,
    private router: Router
  ) {}

  setTab(tab: TabSri): void {
    this.tabActiva = tab;
  }

  regresar() {
    this.router.navigate(['/fecfactura']);
  }

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

  limpiarManual(): void {
    this.xmlManual = '';
    this.xmlManualNombre = '';
    this.claveAccesoManual = '';
    this.correoManual = '';
    this.resultadoManual = null;
    this.mensajeManual = '';
    this.errorManual = '';
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

  async onXmlManualSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.xmlManualNombre = file.name;
    this.errorManual = '';

    try {
      const text = await file.text();
      this.xmlManual = text;
      this.claveAccesoManual = this.extraerClaveAcceso(text);
    } catch (error) {
      console.error(error);
      this.errorManual = 'No se pudo leer el archivo XML seleccionado.';
    }
  }

  async enviarXmlManual(): Promise<void> {
    if (!this.xmlManual?.trim()) {
      this.errorManual = 'Carga o pega un XML antes de enviar.';
      return;
    }

    const erroresValidacion = this.validarXmlManualAntesDeEnviar(this.xmlManual.trim());
    if (erroresValidacion.length > 0) {
      this.errorManual = erroresValidacion.join(' | ');
      return;
    }

    this.procesandoManual = true;
    this.errorManual = '';
    this.mensajeManual = '';
    this.resultadoManual = null;
    this.loadingService.showLoading();

    try {
      const xml = this.xmlManual.trim();
      this.claveAccesoManual = this.extraerClaveAcceso(xml);

      if (this.tipoDocumentoManual === 'retencion') {
        const respuesta = await firstValueFrom(
          this.sriService.procesarRetencionXml(xml, {
            ambiente: this.ambienteManual,
            emailDestino: this.correoManual || undefined,
            attempts: this.attemptsManual,
            sleepMillis: this.sleepMillisManual,
          })
        );

        this.resultadoManual = respuesta;
        this.claveAccesoManual =
          respuesta?.claveAcceso || this.claveAccesoManual;
        this.mensajeManual = this.buildResultadoLabel(respuesta);
        return;
      }

      const respuesta = await firstValueFrom(
        this.sriService.sendFacturaElectronica(xml)
      );

      this.resultadoManual = respuesta;
      this.mensajeManual = this.buildResultadoLabel(respuesta);

      const claveRespuesta =
        respuesta?.claveAcceso ||
        respuesta?.autorizacion?.claveAccesoConsultada ||
        this.extraerClaveDesdeRespuestaFactura(respuesta);

      if (claveRespuesta) {
        this.claveAccesoManual = claveRespuesta;
      }
    } catch (error: any) {
      console.error('Error al procesar XML manual:', error);
      this.errorManual =
        error?.error?.detalle ||
        error?.error?.message ||
        error?.error?.error ||
        error?.message ||
        'No se pudo procesar el XML en el SRI.';
    } finally {
      this.procesandoManual = false;
      this.loadingService.hideLoading();
    }
  }

  async consultarAutorizacionManual(): Promise<void> {
    if (!this.xmlManual?.trim()) {
      this.errorManual = 'Primero carga o pega el XML.';
      return;
    }

    this.consultandoManual = true;
    this.errorManual = '';
    this.loadingService.showLoading();

    try {
      const respuesta = await firstValueFrom(
        this.sriService.consultarAutorizacionPorXml(this.xmlManual.trim(), {
          wait: true,
          attempts: this.attemptsManual,
          sleepMillis: this.sleepMillisManual,
          includeXml: true,
        })
      );

      this.resultadoManual = {
        ...(this.resultadoManual || {}),
        ...respuesta,
      };
      this.claveAccesoManual =
        respuesta?.claveAcceso || this.claveAccesoManual;
      this.mensajeManual = this.buildResultadoLabel(respuesta);
    } catch (error: any) {
      console.error('Error al consultar autorización:', error);
      this.errorManual =
        error?.error?.detalle ||
        error?.error?.message ||
        error?.error?.error ||
        error?.message ||
        'No se pudo consultar la autorización en el SRI.';
    } finally {
      this.consultandoManual = false;
      this.loadingService.hideLoading();
    }
  }

  descargarXmlAutorizadoManual(): void {
    const xml = this.obtenerXmlAutorizadoManual();
    if (!xml) {
      this.errorManual = 'Aún no hay XML autorizado disponible para descargar.';
      return;
    }

    const tipo = this.tipoDocumentoManual === 'retencion' ? 'retencion' : 'factura';
    const clave = this.claveAccesoManual || 'sin-clave';
    this.descargarTexto(xml, `${tipo}-${clave}-autorizado.xml`, 'application/xml');
  }

  descargarPdfManual(): void {
    const pdfBase64 = this.obtenerPdfBase64Manual();
    if (!pdfBase64) {
      this.errorManual = 'Aún no hay PDF disponible en la respuesta del backend.';
      return;
    }

    const tipo = this.tipoDocumentoManual === 'retencion' ? 'retencion' : 'factura';
    const clave = this.claveAccesoManual || 'sin-clave';
    this.descargarBase64(pdfBase64, `${tipo}-${clave}.pdf`, 'application/pdf');
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

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.archivoNombre = file.name;
    this.cargando = true;
    this.rows = [];
    this.headers = [];
    this.loadingService.showLoading();

    try {
      const text = await file.text();
      this.parseTxt(text);
    } catch (e) {
      console.error(e);
      alert('No se pudo leer el archivo');
    } finally {
      this.cargando = false;
      this.loadingService.hideLoading();
    }

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

  private async enriquecerConFacturaERP() {
    const candidatas = this.rows.filter((r) => r.valido);

    if (candidatas.length === 0) return;

    this.cargandoEnriquecimiento = true;
    this.totalEnriq = candidatas.length;
    this.doneEnriq = 0;
    this.loadingService.showLoading();

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
    this.loadingService.hideLoading();
  }

  async procesarSeleccionadas() {
    const filas = this.rows.filter(
      (r) => r.valido && r.encontrada && !!r.idfactura,
    );
    if (filas.length === 0) return;

    this.cargandoProcesamiento = true;
    this.totalProc = filas.length;
    this.doneProc = 0;
    this.loadingService.showLoading();

    for (const r of filas) {
      try {
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

        const xmlAutorizado = await firstValueFrom(
          this.fecFacturaService.getXmlAutorizado(
            this.apiXmlAutorizado,
            r.clave_acceso,
          ),
        );

        if (!xmlAutorizado || xmlAutorizado.trim().length < 20) {
          r.estadoProceso = 'ERROR';
          r.msg = 'No se obtuvo XML autorizado';
          continue;
        }

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
    this.loadingService.hideLoading();
  }

  get totalOk(): number {
    return this.rows.filter((r) => r.valido).length;
  }

  get totalErr(): number {
    return this.rows.filter((r) => r.valido === false).length;
  }

  get rowsFiltradas(): SriEmitidoRow[] {
    const q = (this.q || '').toLowerCase().trim();

    const filtradas = this.rows
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

    return [...filtradas].sort((a, b) => this.compareRows(a, b));
  }

  toggleSort(
    column:
      | 'serie_comprobante'
      | 'clave_acceso'
      | 'fecha_emision'
      | 'fecha_autorizacion'
      | 'valor_sin_impuestos'
      | 'iva'
      | 'importe_total'
      | 'idfactura'
      | 'fechacobro'
      | 'estadoProceso',
  ): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      return;
    }

    this.sortColumn = column;
    this.sortDirection = 'asc';
  }

  getSortIcon(
    column:
      | 'serie_comprobante'
      | 'clave_acceso'
      | 'fecha_emision'
      | 'fecha_autorizacion'
      | 'valor_sin_impuestos'
      | 'iva'
      | 'importe_total'
      | 'idfactura'
      | 'fechacobro'
      | 'estadoProceso',
  ): string {
    if (this.sortColumn !== column) {
      return '';
    }

    return this.sortDirection === 'asc' ? '▲' : '▼';
  }

  private compareRows(a: SriEmitidoRow, b: SriEmitidoRow): number {
    const valueA = this.getSortValue(a, this.sortColumn);
    const valueB = this.getSortValue(b, this.sortColumn);

    let result = 0;

    if (typeof valueA === 'number' && typeof valueB === 'number') {
      result = valueA - valueB;
    } else {
      result = String(valueA).localeCompare(String(valueB), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    }

    return this.sortDirection === 'asc' ? result : -result;
  }

  private getSortValue(
    row: SriEmitidoRow,
    column:
      | 'serie_comprobante'
      | 'clave_acceso'
      | 'fecha_emision'
      | 'fecha_autorizacion'
      | 'valor_sin_impuestos'
      | 'iva'
      | 'importe_total'
      | 'idfactura'
      | 'fechacobro'
      | 'estadoProceso',
  ): string | number {
    switch (column) {
      case 'valor_sin_impuestos':
      case 'iva':
      case 'importe_total':
        return Number(row[column] ?? 0);
      case 'idfactura':
        return Number(row.idfactura ?? 0);
      case 'fechacobro':
        return row.fechacobro || '';
      case 'estadoProceso':
        return row.estadoProceso || '';
      default:
        return row[column] || '';
    }
  }

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

  private extraerClaveAcceso(xml: string): string {
    const match = xml.match(/<claveAcceso>([^<]+)<\/claveAcceso>/i);
    return match?.[1]?.trim() || '';
  }

  private extraerValorTag(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = xml.match(regex);
    return match?.[1]?.trim() || '';
  }

  private validarXmlManualAntesDeEnviar(xml: string): string[] {
    const errores: string[] = [];
    const claveAcceso = this.extraerClaveAcceso(xml);

    if (!claveAcceso) {
      errores.push('El XML no contiene la etiqueta claveAcceso.');
    }

    if (this.tipoDocumentoManual === 'factura') {
      const razonSocialComprador = this.extraerValorTag(xml, 'razonSocialComprador');
      const identificacionComprador = this.extraerValorTag(xml, 'identificacionComprador');
      const fechaEmision = this.extraerValorTag(xml, 'fechaEmision');

      if (!razonSocialComprador) {
        errores.push('La etiqueta razonSocialComprador está vacía.');
      }

      if (!identificacionComprador) {
        errores.push('La etiqueta identificacionComprador está vacía.');
      }

      if (!fechaEmision) {
        errores.push('La etiqueta fechaEmision está vacía.');
      }
    }

    if (this.tipoDocumentoManual === 'retencion') {
      const razonSocialSujetoRetenido = this.extraerValorTag(xml, 'razonSocialSujetoRetenido');
      const identificacionSujetoRetenido = this.extraerValorTag(xml, 'identificacionSujetoRetenido');
      const periodoFiscal = this.extraerValorTag(xml, 'periodoFiscal');

      if (!razonSocialSujetoRetenido) {
        errores.push('La etiqueta razonSocialSujetoRetenido está vacía.');
      }

      if (!identificacionSujetoRetenido) {
        errores.push('La etiqueta identificacionSujetoRetenido está vacía.');
      }

      if (!periodoFiscal) {
        errores.push('La etiqueta periodoFiscal está vacía.');
      }
    }

    return errores;
  }

  private buildResultadoLabel(resultado: any): string {
    const estado =
      resultado?.estado ||
      resultado?.recepcionEstado ||
      resultado?.autorizacion?.autorizaciones?.autorizacion?.[0]?.estado ||
      '';
    const detalle =
      resultado?.mensaje ||
      resultado?.detalle ||
      resultado?.error ||
      '';

    return [estado, detalle].filter(Boolean).join(' - ');
  }

  private extraerClaveDesdeRespuestaFactura(respuesta: any): string {
    const auth = respuesta?.autorizacion?.autorizaciones?.autorizacion?.[0];
    if (!auth) {
      return '';
    }

    const comprobante = auth?.comprobante || '';
    return this.extraerClaveAcceso(comprobante);
  }

  private obtenerXmlAutorizadoManual(): string {
    const resultado = this.resultadoManual;

    if (!resultado) {
      return '';
    }

    if (typeof resultado?.xmlAutorizado === 'string' && resultado.xmlAutorizado.trim()) {
      return resultado.xmlAutorizado;
    }

    if (typeof resultado?.xmlAutorizadoBase64 === 'string' && resultado.xmlAutorizadoBase64.trim()) {
      return this.base64ToText(resultado.xmlAutorizadoBase64);
    }

    if (typeof resultado === 'string' && resultado.trim().startsWith('<')) {
      return resultado;
    }

    const comprobante =
      resultado?.autorizacion?.autorizaciones?.autorizacion?.[0]?.comprobante ||
      resultado?.autorizaciones?.[0]?.comprobante;

    if (typeof comprobante === 'string' && comprobante.trim()) {
      return comprobante;
    }

    return '';
  }

  private obtenerPdfBase64Manual(): string {
    const resultado = this.resultadoManual;
    if (!resultado) {
      return '';
    }

    if (typeof resultado?.pdfBase64 === 'string' && resultado.pdfBase64.trim()) {
      return resultado.pdfBase64;
    }

    const attachments = resultado?.attachments || resultado?.adjuntos || [];
    const pdfAttachment = (attachments as SriAttachment[]).find((item) => {
      const type = (item?.contentType || item?.mimeType || '').toLowerCase();
      const name = (item?.fileName || item?.filename || '').toLowerCase();
      return type.includes('pdf') || name.endsWith('.pdf');
    });

    return (
      pdfAttachment?.base64Data ||
      pdfAttachment?.dataBase64 ||
      pdfAttachment?.contentBase64 ||
      ''
    );
  }

  private descargarTexto(texto: string, nombre: string, type: string): void {
    const blob = new Blob([texto], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private descargarBase64(base64: string, nombre: string, mimeType: string): void {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private base64ToText(base64: string): string {
    try {
      return decodeURIComponent(escape(atob(base64)));
    } catch {
      return atob(base64);
    }
  }
}
