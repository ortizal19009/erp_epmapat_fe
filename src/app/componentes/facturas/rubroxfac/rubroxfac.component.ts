import { Component, OnInit } from '@angular/core';
import { FacturaService } from 'src/app/servicios/factura.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';

@Component({
   selector: 'app-rubroxfac',
   templateUrl: './rubroxfac.component.html'
})
export class RubroxfacComponent implements OnInit {

   rubroxfac: any;
   // fecha: Date;
   // nomcli: String;
   // cedula: String;
   // direccion: String;
   // telefono: String;
   // email: String;
   // idfactura: number;
   suma12: number;
   suma0: number;
   valoriva: number;

   constructor(private facService: FacturaService, private rxfService: RubroxfacService) { }

   ngOnInit(): void {
      this.getDatosFactura();
      this.getRubroxfac();
   }

   getDatosFactura() {
      let idFactura = sessionStorage.getItem('idfacturaToInfo');
      this.facService.getById(+idFactura!).subscribe(factura => {
         // this.fecha = factura.feccrea;
         // this.nomcli = factura.idcliente.nombre;
         // this.cedula = factura.idcliente.cedula;
         // this.direccion = factura.idcliente.direccion;
         // this.telefono = factura.idcliente.telefono;
         // this.email = factura.idcliente.email;
         // this.idfactura = factura.idfactura;
      }, error => console.error(error));
   }

   getRubroxfac() {
      let idFactura = sessionStorage.getItem('idfacturaToInfo');
      this.rxfService.getByIdfactura(+idFactura!).subscribe(detalle => {
         this.rubroxfac = detalle;
         this.subtotal();
      }, error => console.error(error));
   }

   subtotal() {
      let suma12: number = 0;
      let suma0: number = 0;
      let valoriva = 0;
      let i = 0;
      this.rubroxfac.forEach(() => {
         if (this.rubroxfac[i].idrubro_rubros.swiva == 1) {
            suma12 += this.rubroxfac[i].cantidad * this.rubroxfac[i].valorunitario;
            valoriva += this.rubroxfac[i].cantidad * this.rubroxfac[i].valorunitario * .12;
         }
         else {
            if (this.rubroxfac[i].idrubro_rubros.esiva == 0) {
               suma0 += this.rubroxfac[i].cantidad * this.rubroxfac[i].valorunitario;
            }
            else {
               // this.valoriva = this.rubroxfac[i].valorunitario;
            }
         }
         i++;
      });
      this.suma12 = suma12;
      this.suma0 = suma0;
      this.valoriva = valoriva;
   }

}
