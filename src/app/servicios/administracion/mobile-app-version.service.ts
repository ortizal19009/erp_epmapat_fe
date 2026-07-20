import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MobileAppVersion } from 'src/app/modelos/administracion/mobile-app-version.model';

@Injectable({ providedIn: 'root' })
export class MobileAppVersionService {
  private readonly baseUrl = `${environment.API_URL}/mobile-app-versions`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<MobileAppVersion[]> {
    return this.http.get<MobileAppVersion[]>(this.baseUrl);
  }

  upload(formData: FormData): Observable<MobileAppVersion> {
    return this.http.post<MobileAppVersion>(`${this.baseUrl}/upload`, formData);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  getDownloadUrl(id: number): string {
    return `${this.baseUrl}/download/${id}`;
  }

  getLatestPublic(packageName: string): Observable<MobileAppVersion> {
    return this.http.get<MobileAppVersion>(`${this.baseUrl}/public/latest`, {
      params: { packageName },
    });
  }
}
