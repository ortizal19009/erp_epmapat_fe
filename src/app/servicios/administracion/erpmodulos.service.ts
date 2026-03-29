import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/erpmodulos`;

@Injectable({
  providedIn: 'root',
})
export class ErpmodulosService {
  constructor(private http: HttpClient) {}
  getAllErpModulos() {
    return this.http.get<any[]>(`${baseUrl}`);
  }

  save(modulo: { descripcion: string; platform: string }) {
    return this.http.post<any>(`${baseUrl}`, modulo);
  }

  update(id: number, modulo: { descripcion: string; platform: string }, usumodi: number) {
    return this.http.put<any>(`${baseUrl}/${id}?usumodi=${usumodi}`, modulo);
  }
  async findByPlatform(plataform: string): Promise<any> {
    return await firstValueFrom(
      this.http.get<any>(`${baseUrl}/platform/${plataform}`)
    );
  }

  _findByPlatform(plataform: string) {
    return this.http.get<any>(`${baseUrl}/platform/${plataform}`);
  }
}
