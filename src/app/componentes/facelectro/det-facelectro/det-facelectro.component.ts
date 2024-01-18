import { Component, OnInit } from '@angular/core';
import { FacelectroService } from 'src/app/servicios/facelectro.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';

@Component({
  selector: 'app-det-facelectro',
  templateUrl: './det-facelectro.component.html'
})

export class DetFacelectroComponent implements OnInit {

  _facelectro: any;
  nrofac: String;
  fecha: Date;
  claveacceso: String;
  nomcli: String;
  direccion: String;
  telefono: String;
  email: String;
  rubroxfac: any;
  idfactura: number;
  suma12: number;
  suma0: number;
  valoriva: number;
  id: number; //Id de la Factura electrónica
  numautorizacion: String;

  constructor(private faceleService: FacelectroService, private facService: FacturaService, private rxfService: RubroxfacService) { }

  ngOnInit(): void {
    this.getFacelectro();
    //this.getDatosFactura();
    //    this.getRubroxfac();
  }

  getFacelectro() {
    //let nrofac = sessionStorage.getItem('nrofacToInfo');
    let nrofac = '001025000017583';
    let idfacelectro: number = 3497044;

    this.faceleService.getByNrofac(nrofac).subscribe(datos => {
      this._facelectro = datos;
      //this.fecha = datos.feccrea;
      // alert("this.fecha= " + this.fecha)
      this.getByIdfacelectro();
    }, error => console.log(error));
    // this.faceleService.getByNrofac(nrofac).subscribe(datos => {
    //   this.facelectro = datos;
    //   this.claveacceso = datos.claveacceso;
    //   alert("this.claveacceso=" + this.claveacceso)

    //   this.fecha = this.facelectro.feccrea;
    //   this.idfactura = this.facelectro.idfactura;
    // }, error => console.log(error));
  }

  getByIdfacelectro() {
    // let i = 0;
    // this._facelectro.forEach(() => {
    //   this.id = this._facelectro[i].idfacelectro;
    //   alert("id= " + this.id)
    //   i++;
    // });
    this.id = this._facelectro[0].idfacelectro;
    this.faceleService.getByIdfacelectro(this.id).subscribe(datos1 => {
      this._facelectro = datos1;
      this.fecha = datos1.feccrea;
      this.numautorizacion = datos1.numautorizacion;
      this.claveacceso = datos1.claveacceso;
    }, error => console.log(error));
  }

  // getDatosFactura() {
  //   let idFactura = sessionStorage.getItem('idfacturaToInfo');
  //   this.facService.getById(+idFactura!).subscribe(factura => {
  //     this.fecha = factura.feccrea;
  //     this.nomcli = factura.idcliente.nombre;
  //     this.direccion = factura.idcliente.direccion;
  //     this.telefono = factura.idcliente.telefono;
  //     this.email = factura.idcliente.email;
  //     this.idfactura = factura.idfactura;
  //   }, error => console.log(error));
  // }

}
