import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Facxremi } from 'src/app/modelos/coactivas/facxremi';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/facxremi`;

@Injectable({
  providedIn: 'root',
})
export class FacxremiService {
  constructor(private http: HttpClient) {}
  savefacxremi(facxremi: Facxremi) {
    let _facxremi: any = this.http.post(`${baseUrl}`, facxremi);
    return _facxremi;
  }
}
