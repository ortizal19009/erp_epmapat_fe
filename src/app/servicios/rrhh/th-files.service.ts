import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/api/th-files`;

@Injectable({ providedIn: 'root' })
export class ThFilesService {
  constructor(private http: HttpClient) {}

  save(payload: any) {
    return this.http.post(baseUrl, payload);
  }

  byPersonal(idpersonal: number) {
    return this.http.get(`${baseUrl}/persona/${idpersonal}`);
  }
  permissions() { return this.http.get<{userId: number; canWrite: boolean}>(`${baseUrl}/permissions`); }
  upload(payload: any, file: File) {
    const body = new FormData();
    body.append('metadata', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    body.append('file', file, file.name);
    return this.http.post(baseUrl + '/upload', body);
  }
  download(id: number) { return this.http.get(`${baseUrl}/${id}/download`, { responseType: 'blob' }); }
  changeState(id: number, estado: string) { return this.http.patch(`${baseUrl}/${id}/estado`, { estado }); }
}
