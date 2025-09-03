import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/tmpinteresxfac`;
@Injectable({
  providedIn: 'root'
})
export class TmpinteresxfacService {

  constructor(private http: HttpClient) { }
  async calcularInteresesTemporales(): Promise<any> {
    return firstValueFrom(this.http.get(`${baseUrl}/calcularInteres`))
  }
}
