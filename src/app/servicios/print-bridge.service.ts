import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

export type PrinterMode = 'auto' | 'tm-t88v' | 'manual';
export type PdfPaperFormat = 'ticket80' | 'ticket58' | 'a4';
export type PrintProfile = 'default' | 'consumo' | 'servicios' | 'convenio';

interface PrintPdfRequest {
  jobName: string;
  printerName: string;
  copies: number;
  silent: boolean;
  pdfScaleFactor: number;
  pdfPaperFormat: PdfPaperFormat;
  pdfBase64: string;
}

interface PrintTextRequest {
  jobName: string;
  printerName: string;
  copies: number;
  silent: boolean;
  lines: string[];
}

@Injectable({
  providedIn: 'root',
})
export class PrintBridgeService {
  private readonly profileSelectionKey = 'print.bridge.profile.current';
  private readonly bridgeUrl = String((environment as any).PRINT_BRIDGE_URL ?? 'http://localhost:8787').replace(/\/+$/, '');
  private readonly bridgeToken = String((environment as any).PRINT_BRIDGE_TOKEN ?? '').trim();
  private connecting: Promise<void> | null = null;

  getSavedProfileSelection(): PrintProfile {
    const value = localStorage.getItem(this.profileSelectionKey) as PrintProfile | null;
    return this.normalizeProfile(value);
  }

  setSavedProfileSelection(profile: PrintProfile): PrintProfile {
    const normalized = this.normalizeProfile(profile);
    localStorage.setItem(this.profileSelectionKey, normalized);
    return normalized;
  }

  getSavedPrinterMode(profile: PrintProfile = 'default'): PrinterMode {
    const raw = localStorage.getItem(this.profileKey(profile, 'mode')) as PrinterMode | null;
    return raw === 'auto' || raw === 'tm-t88v' || raw === 'manual'
      ? raw
      : this.getDefaultPrinterMode(profile);
  }

  getSavedPrinterName(profile: PrintProfile = 'default'): string {
    return localStorage.getItem(this.profileKey(profile, 'name'))?.trim() ?? '';
  }

  getSavedCopies(profile: PrintProfile = 'default'): number {
    const raw = localStorage.getItem(this.profileKey(profile, 'copies')) ?? String(this.getDefaultCopies(profile));
    const copies = this.normalizeCopies(Number(raw));
    return copies;
  }

  setPrinterPreference(mode: PrinterMode, printerName = '', profile: PrintProfile = 'default'): void {
    localStorage.setItem(this.profileKey(profile, 'mode'), mode);

    if (mode === 'manual') {
      const safePrinterName = printerName.trim();
      if (safePrinterName) {
        localStorage.setItem(this.profileKey(profile, 'name'), safePrinterName);
      }
      return;
    }

    if (mode === 'auto') {
      localStorage.removeItem(this.profileKey(profile, 'name'));
    }
  }

  setDefaultCopies(copies: number, profile: PrintProfile = 'default'): number {
    const normalized = this.normalizeCopies(copies);
    localStorage.setItem(this.profileKey(profile, 'copies'), String(normalized));
    return normalized;
  }

  getSilentPrinting(profile: PrintProfile = 'default'): boolean {
    const value = localStorage.getItem(this.profileKey(profile, 'silent'));
    return value === null ? this.getDefaultSilent(profile) : value === 'true';
  }

  setSilentPrinting(enabled: boolean, profile: PrintProfile = 'default'): void {
    localStorage.setItem(this.profileKey(profile, 'silent'), String(!!enabled));
  }

  getSavedPdfScale(profile: PrintProfile = 'default'): number {
    const raw = localStorage.getItem(this.profileKey(profile, 'pdfScale')) ?? String(this.getDefaultPdfScale(profile));
    return this.normalizePdfScale(Number(raw));
  }

  setPdfScale(scale: number, profile: PrintProfile = 'default'): number {
    const normalized = this.normalizePdfScale(scale);
    localStorage.setItem(this.profileKey(profile, 'pdfScale'), String(normalized));
    return normalized;
  }

  getSavedPdfPaperFormat(profile: PrintProfile = 'default'): PdfPaperFormat {
    const value = localStorage.getItem(this.profileKey(profile, 'pdfPaperFormat')) as PdfPaperFormat | null;
    return value === 'ticket58' || value === 'a4' ? value : this.getDefaultPdfPaperFormat(profile);
  }

  setPdfPaperFormat(format: PdfPaperFormat, profile: PrintProfile = 'default'): PdfPaperFormat {
    const normalized = format === 'ticket58' || format === 'a4' ? format : 'ticket80';
    localStorage.setItem(this.profileKey(profile, 'pdfPaperFormat'), normalized);
    return normalized;
  }

  async connect(): Promise<void> {
    if (this.connecting) {
      await this.connecting;
      return;
    }

    this.connecting = this.requestJson<{ ok: boolean }>('/health')
      .then(() => undefined)
      .finally(() => {
        this.connecting = null;
      });

    await this.connecting;
  }

  async listPrinters(): Promise<string[]> {
    const response = await this.requestJson<{ printers: string[] }>('/printers');
    return Array.isArray(response.printers) ? response.printers : [];
  }

  async getDefaultPrinter(): Promise<string> {
    const response = await this.requestJson<{ printer: string }>('/printers/default');
    return String(response.printer ?? '').trim();
  }

  async printPdf(pdf: Blob, jobName = 'Comprobante', printerName = '', profile: PrintProfile = 'default'): Promise<void> {
    if (!pdf) {
      throw new Error('No hay PDF para imprimir.');
    }

    await this.connect();
    const printer = String(printerName ?? '').trim() || await this.resolvePrinter(profile);
    const payload: PrintPdfRequest = {
      jobName,
      printerName: printer,
      copies: this.getSavedCopies(profile),
      silent: this.getSilentPrinting(profile),
      pdfScaleFactor: this.getSavedPdfScale(profile),
      pdfPaperFormat: this.getSavedPdfPaperFormat(profile),
      pdfBase64: await this.blobToBase64(pdf),
    };

    await this.requestJson('/print/pdf', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async printTestTicket(message = 'PRUEBA DE IMPRESION EPMAPAT', profile: PrintProfile = 'default'): Promise<void> {
    await this.connect();
    const printer = await this.resolvePrinter(profile);
    const payload: PrintTextRequest = {
      jobName: 'Prueba de impresion',
      printerName: printer,
      copies: this.getSavedCopies(profile),
      silent: this.getSilentPrinting(profile),
      lines: [
        '\x1B@',
        '\n\n',
        '================================\n',
        `${message}\n`,
        '================================\n',
        `Fecha: ${new Date().toLocaleString('es-EC')}\n`,
        'Impresora: puente local de impresion\n',
        '\n\n\n',
      ],
    };

    await this.requestJson('/print/text', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  private async resolvePrinter(profile: PrintProfile = 'default'): Promise<string> {
    const mode = this.getSavedPrinterMode(profile);
    const stored = this.getSavedPrinterName(profile);

    if (mode === 'manual' && stored) {
      return stored;
    }

    if (mode === 'manual' && !stored) {
      throw new Error('Selecciona una impresora para el modo manual.');
    }

    const hints = mode === 'tm-t88v'
      ? ['tm-t88v', 'epson', 'receipt', 'ticket']
      : ['epson', 'receipt', 'ticket'];

    let defaultPrinter = '';
    try {
      defaultPrinter = await this.getDefaultPrinter();
    } catch {
      defaultPrinter = '';
    }

    const printers = await this.listPrinters();
    const hintedPrinter = this.pickPrinterName(printers, hints);

    if (mode === 'tm-t88v') {
      if (defaultPrinter && this.matchesAnyHint(defaultPrinter, hints)) {
        return defaultPrinter;
      }

      if (hintedPrinter) {
        return hintedPrinter;
      }
    }

    if (mode === 'auto') {
      if (hintedPrinter) {
        return hintedPrinter;
      }

      if (defaultPrinter && !this.matchesAnyHint(defaultPrinter, ['pdf', 'onenote', 'xps'])) {
        return defaultPrinter;
      }
    }

    if (stored) {
      return stored;
    }

    if (hintedPrinter) {
      return hintedPrinter;
    }

    if (defaultPrinter) {
      return defaultPrinter;
    }

    throw new Error('No se encontro una impresora compatible en el puente local.');
  }

  private pickPrinterName(printers: string[], hints: string[] = ['tm-t88v', 'epson', 'receipt', 'ticket']): string {
    if (!Array.isArray(printers) || !printers.length) {
      return '';
    }

    for (const hint of hints) {
      const match = printers.find((printer) => this.matchesAnyHint(printer, [hint]));
      if (match) {
        return match;
      }
    }

    return printers[0] ?? '';
  }

  private matchesAnyHint(value: string, hints: string[]): boolean {
    const lower = String(value ?? '').toLowerCase();
    return hints.some((hint) => lower.includes(hint.toLowerCase()));
  }

  private normalizeCopies(copies: number): number {
    const normalized = Math.floor(Number(copies) || 0);
    if (!Number.isFinite(normalized) || normalized < 1) {
      return 2;
    }
    return Math.min(normalized, 20);
  }

  private normalizePdfScale(scale: number): number {
    const normalized = Number(scale);
    if (!Number.isFinite(normalized) || normalized <= 0) {
      return 1;
    }
    return Math.min(Math.max(Math.round(normalized * 100) / 100, 0.5), 3);
  }

  private profileKey(profile: PrintProfile, suffix: string): string {
    return `print.bridge.${this.normalizeProfile(profile)}.${suffix}`;
  }

  private normalizeProfile(profile: PrintProfile | null | undefined): PrintProfile {
    return profile === 'consumo' || profile === 'servicios' || profile === 'convenio' ? profile : 'default';
  }

  private getDefaultPrinterMode(profile: PrintProfile): PrinterMode {
    return profile === 'convenio' ? 'auto' : 'tm-t88v';
  }

  private getDefaultCopies(profile: PrintProfile): number {
    return profile === 'convenio' ? 1 : 2;
  }

  private getDefaultSilent(profile: PrintProfile): boolean {
    return true;
  }

  private getDefaultPdfScale(profile: PrintProfile): number {
    if (profile === 'convenio') {
      return 1;
    }

    return 1.15;
  }

  private getDefaultPdfPaperFormat(profile: PrintProfile): PdfPaperFormat {
    return profile === 'convenio' ? 'a4' : 'ticket80';
  }

  private async requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
    let response: Response;
    try {
      response = await fetch(this.buildUrl(path), {
        method: init.method ?? 'GET',
        headers: this.buildHeaders(init.headers, !!init.body),
        body: init.body,
      });
    } catch (error) {
      throw new Error(this.getNetworkErrorMessage(path, error));
    }

    if (!response.ok) {
      throw new Error(await this.readErrorMessage(response));
    }

    if (response.status === 204) {
      return {} as T;
    }

    const text = await response.text();
    return text ? JSON.parse(text) as T : ({} as T);
  }

  private buildUrl(path: string): string {
    const suffix = path.startsWith('/') ? path : `/${path}`;
    return `${this.bridgeUrl}${suffix}`;
  }

  private buildHeaders(headers: HeadersInit | undefined, hasBody: boolean): HeadersInit {
    const baseHeaders: Record<string, string> = {};

    if (this.bridgeToken) {
      baseHeaders['Authorization'] = `Bearer ${this.bridgeToken}`;
    }

    if (hasBody) {
      baseHeaders['Content-Type'] = 'application/json';
    }

    if (!headers) {
      return baseHeaders;
    }

    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        baseHeaders[key] = value;
      });
      return baseHeaders;
    }

    if (Array.isArray(headers)) {
      headers.forEach(([key, value]) => {
        baseHeaders[key] = value;
      });
      return baseHeaders;
    }

    return { ...baseHeaders, ...headers };
  }

  private async readErrorMessage(response: Response): Promise<string> {
    if (response.status === 404 && this.bridgeUrl.startsWith('/')) {
      return 'Angular no esta aplicando el proxy del puente local. Reinicia ng serve con --proxy-config proxy.conf.json.';
    }

    const fallback = `El puente local respondio con error (${response.status}).`;
    try {
      const text = await response.text();
      return text.trim() || fallback;
    } catch {
      return fallback;
    }
  }

  private getNetworkErrorMessage(path: string, error: unknown): string {
    const suffix = path.startsWith('/') ? path : `/${path}`;
    const message = error instanceof Error ? error.message : String(error ?? '');

    if (this.bridgeUrl.startsWith('/')) {
      return `No se pudo conectar al puente local via proxy en ${suffix}. Verifica que Angular este iniciado con --proxy-config proxy.conf.json. ${message}`.trim();
    }

    if (this.bridgeUrl.includes('8788')) {
      return `No se pudo conectar al puente local de desarrollo en ${this.buildUrl(path)}. Verifica que ejecutes .\\scripts\\run-bridge-dev.ps1. ${message}`.trim();
    }

    return `No se pudo conectar al puente local en ${this.buildUrl(path)}. ${message}`.trim();
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result ?? '');
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer el PDF.'));
      reader.readAsDataURL(blob);
    });
  }
}
