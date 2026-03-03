import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export abstract class HttpBase {
  protected baseUrl = environment.API_URL + '/api';

  constructor(protected http: HttpClient) {}

  // si usas proxy, puedes cambiar a "/api" y listo:
  protected api(path: string) {
    // return `/api${path}`; // ✅ usando proxy
    return `${this.baseUrl}${path}`; // ✅ directo sin proxy
  }
}

