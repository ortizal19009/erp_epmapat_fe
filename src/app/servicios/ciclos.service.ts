import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/ciclos`;

@Injectable({
  providedIn: 'root'
})

export class CiclosService {

  constructor(private http:HttpClient) { }

}
