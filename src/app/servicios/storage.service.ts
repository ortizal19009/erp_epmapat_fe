import { HttpClient, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly baseUrl = `${environment.API_URL}/api/storage`;

  constructor(private http: HttpClient) {}

  upload(file: File, folder: string, entidadId: number): Observable<HttpEvent<any>> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);
    fd.append('entidadId', String(entidadId));

    return this.http.post<any>(`${this.baseUrl}/upload`, fd, {
      reportProgress: true,
      observe: 'events',
    });
  }

  viewUrl(ruta: string): string {
    return `${this.baseUrl}/view?ruta=${encodeURIComponent(ruta)}`;
  }
}
