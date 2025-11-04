import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/jasperReports`;

export interface JasperDTO {
  reportName: string;
  parameters: Record<string, any>;
  extencion?: string; // opcional
}

export interface MergeItem {
  idfactura: number;       // obligatorio
  idmodulo?: number | null;  // opcional
  idAbonado?: number | null; // opcional
}

export interface MergeReq {
  items: MergeItem[];
}

@Injectable({
  providedIn: 'root'
})
export class JasperReportService {
  constructor(private http: HttpClient) { }
  getReporte(datos: any): Promise<any> {
    let resp = (firstValueFrom(this.http.post(`${baseUrl}/reportes`, datos,
      { responseType: 'blob' })))
    return resp;

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
