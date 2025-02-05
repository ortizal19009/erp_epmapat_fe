import { Injectable } from '@angular/core';
import { UsrxmodulosService } from '../servicios/administracion/usrxmodulos.service';

@Injectable({
  providedIn: 'root',
})
export class AutorizaService {
  enabled = [false, false, false, false, false, false, false];
  colorenabled = false;
  modulos: String[];
  modulo: number;
  nomodulo: String;
  moduActual: number;
  sessionlog: boolean;
  idusuario: number;
  alias: string;
  priusu: string;
  perfil: string;
  msgval: boolean = true; //OJO: Obtener en el login del usuario
  modules: any;

  constructor() {}

  public enabModulos(): void {
    //OJO: Controlar con usuarios.perfil
    if (this.idusuario == 1)
      this.enabled = [true, true, false, false, true, true, true];
    else this.enabled = [true, false, false, false, false, false, true];

    this.colorenabled = true;
    

    if (this.moduActual == null) this.modulo = 1;
    else this.modulo = this.moduActual;

    this.modulos = [
      'Comercialización',
      'Contabilidad gubernamental',
      'Inventario',
      'Propiedad, planta y equipo',
      'Recursos humanos',
      'Administración central',
    ];

    this.nomodulo = this.modulos[this.moduActual - 1];
  }

  public selecModulo(opcion: number) {
    this.modulo = opcion;
    this.moduActual = opcion;
    const values = JSON.parse(atob(sessionStorage.getItem('abc')!));
    values.object.modulo = opcion;
    values.object.moduActual = opcion;
    sessionStorage.setItem('abc', btoa(JSON.stringify(values)));
  }

  valsession() {
    const retrievedEncodedValues = sessionStorage.getItem('abc');
    if (retrievedEncodedValues !== null) {
      const retrievedValues = JSON.parse(atob(retrievedEncodedValues));
      this.sessionlog = true;
      this.idusuario = retrievedValues.idusuario;
      this.alias = retrievedValues.alias;
      this.modulo = retrievedValues.object.modulo;
      this.moduActual = retrievedValues.object.moduActual;
      this.priusu = retrievedValues.priusu;

      this.enabModulos();
    }
  }
}
