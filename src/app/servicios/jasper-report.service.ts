import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PdfPaperFormat, PrintProfile } from './print-bridge.service';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/jasperReports`;

export interface JasperDTO {
  reportName: string;
  parameters: Record<string, any>;
  extencion?: string; // opcional
}

export interface MergeItem {
  idfactura: number; // obligatorio
  idmodulo?: number | null; // opcional
  idAbonado?: number | null; // opcional
}

export interface MergeReq {
  items: MergeItem[];
}

@Injectable({
  providedIn: 'root'
})
export class JasperReportService {
  constructor(private http: HttpClient) {}

  private async buildHttpErrorMessage(error: any, fallback: string): Promise<string> {
    const status = Number(error?.status ?? 0);
    const statusText = String(error?.statusText ?? '').trim();
    const url = String(error?.url ?? '').trim();
    const prefix = status ? `HTTP ${status}${statusText ? ` ${statusText}` : ''}` : 'Error HTTP';
    const source = url ? ` en ${url}` : '';

    const raw = error?.error;
    if (raw instanceof Blob) {
      try {
        const bodyText = (await raw.text()).trim();
        if (bodyText) {
          return `${prefix}${source}: ${bodyText}`;
        }
      } catch {
        // Ignore body read failures and fall back to a generic message.
      }
    }

    if (typeof raw === 'string' && raw.trim()) {
      return `${prefix}${source}: ${raw.trim()}`;
    }

    if (raw && typeof raw === 'object') {
      const message = String(raw.message ?? raw.error ?? '').trim();
      if (message) {
        return `${prefix}${source}: ${message}`;
      }
    }

    return `${prefix}${source}: ${fallback}`;
  }

  getReporte(datos: any): Promise<any> {
    return firstValueFrom(
      this.http.post(`${baseUrl}/reportes`, datos, { responseType: 'blob' })
    );
  }

  getComprobantePago(idfactura: number, profile: PrintProfile = 'default'): Promise<Blob> {
    const facturaId = Number(idfactura);
    if (!Number.isFinite(facturaId) || facturaId <= 0) {
      return Promise.reject(new Error('idfactura inválido para comprobante.'));
    }

    const paperFormat = this.resolveComprobantePaperFormat(profile);
    const url = new URL(`${environment.API_URL}/facturas/comprobante/pago`);
    url.searchParams.set('idfactura', String(facturaId));
    url.searchParams.set('profile', profile);
    url.searchParams.set('paperFormat', paperFormat);

    return firstValueFrom(
      this.http.get(url.toString(), {
        responseType: 'blob',
      })
    ).catch(async (error) => {
      const message = await this.buildHttpErrorMessage(
        error,
        'No se pudo generar el comprobante de pago.'
      );
      throw new Error(message);
    });
  }

  openPdfInViewer(pdf: Blob, viewer: string | HTMLIFrameElement = 'pdfViewer', revokeAfterMs = 30000): string {
    const blob = pdf instanceof Blob ? pdf : new Blob([pdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const iframe = typeof viewer === 'string'
      ? document.getElementById(viewer) as HTMLIFrameElement | null
      : viewer;

    if (iframe) {
      iframe.src = url;
    }

    if (revokeAfterMs > 0) {
      setTimeout(() => URL.revokeObjectURL(url), revokeAfterMs);
    }

    return url;
  }

  openPdfInNewTab(pdf: Blob, title = 'PDF', revokeAfterMs = 30000): Window | null {
    const blob = pdf instanceof Blob ? pdf : new Blob([pdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const tab = window.open('', '_blank');

    if (!tab) {
      URL.revokeObjectURL(url);
      return null;
    }

    tab.document.title = title;
    tab.location.href = url;

    if (revokeAfterMs > 0) {
      setTimeout(() => URL.revokeObjectURL(url), revokeAfterMs);
    }

    return tab;
  }

  private resolveComprobantePaperFormat(profile: PrintProfile): PdfPaperFormat {
    return 'ticket80';
  }

  /**
   * Unifica varios comprobantes en un solo PDF (backend merge).
   * POST /jasperReports/comprobantes/merge
   */
  mergeComprobantes(req: MergeReq): Promise<Blob> {
    return firstValueFrom(
      this.http.post(`${baseUrl}/comprobantes/merge`, req, { responseType: 'blob' })
    );
  }

  /**
   * (Opcional) Enviar PDF para imprimir en servidor
   * POST /jasperReports/comprobante (multipart)
   */
  imprimirEnServidor(pdf: Blob): Promise<string> {
    const form = new FormData();
    form.append('pdf', pdf, 'comprobante.pdf');
    return firstValueFrom(
      this.http.post(`${baseUrl}/comprobante`, form, { responseType: 'text' })
    );
  }
}
