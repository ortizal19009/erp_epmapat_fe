import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, lastValueFrom } from 'rxjs';
import { Definir } from 'src/app/modelos/administracion/definir.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/definir`;

@Injectable({
    providedIn: 'root'
})

export class DefinirService {

    constructor(private http: HttpClient) { }

    getByIddefinir(iddefinir: number) {
        return this.http.get<Definir>(baseUrl + "/" + iddefinir);
    }

    async getByIddefinirAsync(iddefinir: number): Promise<Definir> {
        const source$ = this.http.get<Definir>(baseUrl + "/" + iddefinir);
        return lastValueFrom(source$);
    }

    updateDefinir(iddefinir: number, definir: Definir): Observable<Object> {
        return this.http.put(baseUrl + "/" + iddefinir, definir);
    }

}
