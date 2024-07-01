import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Intereses } from '../modelos/intereses';
import { environment } from 'src/environments/environment';
import { Facturas } from '../modelos/facturas.model';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/intereses`;

@Injectable({
   providedIn: 'root',
})
export class InteresesService {
   /* Intereses */
   calInteres = {} as calcInteres;
   totInteres: number = 0;
   arrCalculoInteres: any = [];
   factura: Facturas = new Facturas();
   _intereses: any;
   $event: any;
   valoriva: number;
   _codigo: string;

   constructor(private http: HttpClient) { }

   getListaIntereses(): Observable<Intereses[]> {
      return this.http.get<Intereses[]>(`${baseUrl}`);
   }

   //Validar por Anio y Mes
   getByAnioMes(anio: number, mes: number): Observable<any> {
      return this.http.get<Intereses>(`${baseUrl}?anio=${anio}&mes=${mes}`);
   }

   //Busca el Último
   getUltimo(): Observable<any> {
      return this.http.get<Intereses>(`${baseUrl}/ultimo`);
   }

   saveIntereses(intereses: Intereses): Observable<Object> {
      return this.http.post(`${baseUrl}`, intereses);
   }

   deleteInteres(idinteres: number) {
      return this.http.delete(`${baseUrl}/${idinteres}`);
   }

   getListaById(idinteres: number) {
      return this.http.get<Intereses>(`${baseUrl}/${idinteres}`);
   }

   // updateIntereses(intereses: Intereses): Observable<Object> {
   //    return this.http.put(`${baseUrl}/${intereses.idinteres}`, intereses);
   // }

   updateInteres(idinteres: number, interes: Intereses): Observable<Object> {
      return this.http.put(baseUrl + '/' + idinteres, interes);
   }

   /* Este metodo calcula el interes individual y la uso en el metodo de listar las facturas sin cobro */
   cInteres(factura: any) {
      this.getListaIntereses().subscribe({
         next: (datos: any) => {
            this._intereses = datos;
            this.totInteres = 0;
            this.arrCalculoInteres = [];
            let interes: number = 0;
            if (factura.estado != 3 && factura.formapago != 4) {
               let fec = factura.feccrea.toString().split('-', 2);
               let fechai: Date = new Date(`${fec[0]}-${fec[1]}-02`);
               let fechaf: Date = new Date();
               this.factura = factura;
               fechaf.setMonth(fechaf.getMonth() - 1);
               while (fechai <= fechaf) {
                  this.calInteres = {} as calcInteres;
                  let query = this._intereses.find(
                     (interes: { anio: number; mes: number }) =>
                        interes.anio === +fechai.getFullYear()! &&
                        interes.mes === +fechai.getMonth()! + 1
                  );
                  if (!query) {
                     this.calInteres.anio = +fechai.getFullYear()!;
                     this.calInteres.mes = +fechai.getMonth()! + 1;
                     this.calInteres.interes = 0;
                     query = this.calInteres;
                  } else {
                     this.calInteres.anio = query.anio;
                     this.calInteres.mes = query.mes;
                     this.calInteres.interes = query.porcentaje;
                     this.calInteres.valor = factura.total;
                     this.arrCalculoInteres.push(this.calInteres);
                  }
                  fechai.setMonth(fechai.getMonth() + 1);
               }
               this.arrCalculoInteres.forEach((item: any) => {
                  //this.totInteres += (item.interes * item.valor) / 100;
                  interes += (item.interes * item.valor) / 100;
                  // this.subtotal();
               });
            }
            return interes;
         },
         error: (err) => console.error(err.error),
      });
   }
}
interface calcInteres {
   anio: number;
   mes: number;
   interes: number;
   valor: number;
}
