import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const qz: any = require('qz-tray');

type PrinterMode = 'auto' | 'tm-t88v' | 'manual';

@Injectable({
  providedIn: 'root',
})
export class QzTrayService {
  private readonly printerModeKey = 'qz.printer.mode';
  private readonly printerNameKey = 'qz.printer.name';
  private readonly copiesKey = 'qz.print.copies';
  private readonly silentKey = 'qz.print.silent';
  private connecting: Promise<void> | null = null;
  private securityConfigured = false;

  private get isAvailable(): boolean {
    return !!qz?.websocket && !!qz?.printers && !!qz?.configs;
  }

  getSavedPrinterMode(): PrinterMode {
    const mode = localStorage.getItem(this.printerModeKey) as PrinterMode | null;
    return mode === 'auto' || mode === 'tm-t88v' || mode === 'manual' ? mode : 'auto';
  }

  getSavedPrinterName(): string {
    return localStorage.getItem(this.printerNameKey)?.trim() ?? '';
  }

  getSavedCopies(): number {
    return this.normalizeCopies(Number(localStorage.getItem(this.copiesKey) ?? 2));
  }

  setPrinterPreference(mode: PrinterMode, printerName = ''): void {
    localStorage.setItem(this.printerModeKey, mode);

    if (mode === 'manual') {
      const safePrinterName = printerName.trim();
      if (safePrinterName) {
        localStorage.setItem(this.printerNameKey, safePrinterName);
      }
      return;
    }

    if (mode === 'auto') {
      localStorage.removeItem(this.printerNameKey);
    }
  }

  setDefaultCopies(copies: number): number {
    const normalized = this.normalizeCopies(copies);
    localStorage.setItem(this.copiesKey, String(normalized));
    return normalized;
  }

  getSilentPrinting(): boolean {
    const value = localStorage.getItem(this.silentKey);
    return value === null ? true : value === 'true';
  }

  setSilentPrinting(enabled: boolean): void {
    localStorage.setItem(this.silentKey, String(!!enabled));
  }

  async listPrinters(): Promise<string[]> {
    await this.connect();
    return qz.printers.find();
  }

  async connect(): Promise<void> {
    if (!this.isAvailable) {
      throw new Error('QZ Tray no está disponible en este navegador.');
    }

    this.configureSecurity();

    const current = this.connecting;
    if (current) {
      await current;
      return;
    }

    this.connecting = qz.websocket
      .connect({ retries: 3, delay: 1 })
      .then(() => undefined)
      .finally(() => {
        this.connecting = null;
      });

    await this.connecting;
  }

  private configureSecurity() {
    if (!this.isAvailable || this.securityConfigured) {
      return;
    }

    qz.security.setCertificatePromise(async (resolve: (value: string) => void, reject: (reason?: any) => void) => {
      try {
        const response = await fetch(`${environment.API_URL}/qz/certificate`, {
          cache: 'no-store',
          headers: { 'Content-Type': 'text/plain' },
        });
        if (!response.ok) {
          throw new Error(`No se pudo cargar el certificado QZ (${response.status}).`);
        }
        resolve(await response.text());
      } catch (error) {
        reject(error);
      }
    });

    qz.security.setSignatureAlgorithm('SHA512');
    qz.security.setSignaturePromise((toSign: string) => async (resolve: (value: string) => void, reject: (reason?: any) => void) => {
      try {
        const response = await fetch(`${environment.API_URL}/qz/signature?request=${encodeURIComponent(toSign)}`, {
          cache: 'no-store',
          headers: { 'Content-Type': 'text/plain' },
        });
        if (!response.ok) {
          throw new Error(`No se pudo firmar la solicitud QZ (${response.status}).`);
        }
        resolve(await response.text());
      } catch (error) {
        reject(error);
      }
    });

    this.securityConfigured = true;
  }

  async printPdf(pdf: Blob, jobName = 'Comprobante'): Promise<void> {
    if (!pdf) {
      throw new Error('No hay PDF para imprimir.');
    }

    await this.connect();
    const printer = await this.resolvePrinter();
    const base64 = await this.blobToBase64(pdf);
    const config = qz.configs.create(printer, {
      scaleContent: false,
      jobName,
      colorType: 'default',
      copies: this.getSavedCopies(),
    });
    const data = [
      {
        type: 'pixel',
        format: 'pdf',
        flavor: 'base64',
        data: base64,
        options: {
          ignoreTransparency: true,
        },
      },
    ];

    await qz.print(config, data);
  }

  async printTestTicket(message = 'PRUEBA DE IMPRESION EPMAPAT'): Promise<void> {
    await this.connect();
    const printer = await this.resolvePrinter();
    const config = qz.configs.create(printer, {
      jobName: 'Prueba QZ Tray',
      scaleContent: false,
      colorType: 'default',
      copies: this.getSavedCopies(),
    });

    const lines = [
      '\x1B@',
      '\n\n',
      '================================\n',
      `${message}\n`,
      '================================\n',
      `Fecha: ${new Date().toLocaleString('es-EC')}\n`,
      'Impresora: Epson TM-T88V / QZ Tray\n',
      '\n\n\n',
    ];

    await qz.print(config, lines);
  }

  private async resolvePrinter(): Promise<string> {
    const mode = this.getSavedPrinterMode();
    const stored = this.getSavedPrinterName();

    if (mode === 'manual' && stored) {
      return stored;
    }

    if (mode === 'manual' && !stored) {
      throw new Error('Selecciona una impresora para el modo manual.');
    }

    const hints = mode === 'tm-t88v'
      ? ['tm-t88v', 'epson', 'receipt', 'ticket']
      : ['epson', 'receipt', 'ticket'];

    try {
      const defaultPrinter = await qz.printers.getDefault();
      if (defaultPrinter) {
        if (mode === 'auto') {
          return defaultPrinter;
        }

        if (mode === 'tm-t88v' && this.matchesAnyHint(defaultPrinter, hints)) {
          return defaultPrinter;
        }
      }
    } catch {
      // continue with search
    }

    const printers = await qz.printers.find();
    const printer = this.pickPrinterName(printers, hints);
    if (printer) {
      return printer;
    }

    if (stored) {
      return stored;
    }

    throw new Error('No se encontró una impresora compatible en QZ Tray.');
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
