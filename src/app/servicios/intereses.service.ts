import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Intereses } from '../modelos/intereses';
import { environment } from 'src/environments/environment';
import { Facturas } from '../modelos/facturas.model';
import { FacturaService } from './factura.service';

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

  constructor(private http: HttpClient, private s_factura: FacturaService) {}

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
  async cInteres(factura: any) {
    console.log(factura);
    let _factura = await this.s_factura.getByIdAsync(+factura!);
    console.log(_factura);
    let int = await this.getAllIntereses();
    console.log(int);

    this._intereses = int;
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
          console.log(factura);
          this.calInteres.anio = query.anio;
          this.calInteres.mes = query.mes;
          this.calInteres.interes = query.porcentaje;
          this.calInteres.valor = factura.total;
          this.arrCalculoInteres.push(this.calInteres);
        }
        fechai.setMonth(fechai.getMonth() + 1);
      }
      this.arrCalculoInteres.forEach((item: any) => {
        console.log(item);
        //this.totInteres += (item.interes * item.valor) / 100;
        interes += (item.interes * item.valor) / 100;
        console.log(interes);
        // this.subtotal();
      });
    }
    return interes;
  }

  async getAllIntereses() {
    let intereses = await this.getListaIntereses().toPromise();
    return intereses;
  }
}
interface calcInteres {
  anio: number;
  mes: number;
  interes: number;
  valor: number;
}
