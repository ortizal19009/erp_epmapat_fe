import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/api/personal`;

@Injectable({
  providedIn: 'root',
})
export class PersonalService {
  constructor(private http: HttpClient) {}
  getAllPersonal() {
    return this.http.get(`${baseUrl}`);
  }
  savePaersonal(personal: any) {
    return this.http.post(`${baseUrl}`, personal);
  }

  getPersonalById(idpersonal: number) {
    return this.http.get(`${baseUrl}/${idpersonal}`);
  }

  updatePersonal(idpersonal: number, personal: any) {
    return this.http.put(`${baseUrl}/${idpersonal}`, personal);
  }

  deletePersonal(idpersonal: number) {
    return this.http.delete(`${baseUrl}/${idpersonal}`);
  }
}
