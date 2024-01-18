import { Injectable } from '@angular/core';

@Injectable({
   providedIn: 'root'
})

export class AutorizaService {

   enabled = [false, false, false, false, false, false];
   colorenabled = false;
   modulos: String[];
   modulo: number;
   nomodulo: String;
   moduActual: number;
   sessionlog: boolean;
   idusuario: number;
   alias: string;

   constructor() { }

   public enabModulos(): void {
      this.enabled = [true, false, false, false, false, true];
      this.colorenabled = true;

      if (this.moduActual == null) this.modulo = 1
      else this.modulo = this.moduActual

      this.modulos = ["Comercialización", "Contabilidad gubernamental", "Inventario",
         "Propiedad, planta y equipo", "Recursos humanos", "Administración central"];

      this.nomodulo = this.modulos[this.moduActual - 1];
   }

   public selecModulo(opcion: number) {
      this.modulo = opcion;
      this.moduActual = opcion;
      // sessionStorage.setItem("tmpmodu", opcion.toString())
      // sessionStorage.setItem("tmpusu", this.idusuario.toString())
      // sessionStorage.setItem("tmpalias", this.alias)
      // const abc = sessionStorage.getItem('abc');
      const values = JSON.parse(atob(sessionStorage.getItem('abc')!));
      values.object.modulo = opcion;
      values.object.moduActual = opcion;
      sessionStorage.setItem('abc', btoa(JSON.stringify(values)));

      // const retrievedEncodedValues = sessionStorage.getItem('abc');
      // if (retrievedEncodedValues !== null) {
      //    const retrievedValues = JSON.parse(atob(retrievedEncodedValues));
      //    retrievedValues.object.modulo = opcion;
      //    retrievedValues.object.moduActual = opcion;
      //    sessionStorage.setItem('abc', btoa(JSON.stringify(retrievedValues)));
      // }

      // sessionStorage.setItem('abc', btoa(JSON.stringify(abc)));
   }

   valsession() {
      const retrievedEncodedValues = sessionStorage.getItem('abc');
      if (retrievedEncodedValues !== null) {
         const retrievedValues = JSON.parse(atob(retrievedEncodedValues));
         // const xyz = retrievedValues.object.xyz;
         this.sessionlog = true;
         this.idusuario = retrievedValues.idusuario;
         this.alias = retrievedValues.alias;
         this.modulo = retrievedValues.object.modulo;
         this.moduActual = retrievedValues.object.moduActual;
         this.enabModulos();
      } else console.log('retrievedEncodedValues es nulo')
   }

}
