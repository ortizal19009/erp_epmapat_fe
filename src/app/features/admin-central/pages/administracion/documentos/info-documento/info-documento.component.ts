import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';

@Component({
   selector: 'app-info-documento',
   templateUrl: './info-documento.component.html',
   styleUrls: ['./info-documento.component.css']
})

export class InfoDocumentoComponent implements OnInit {

   documento = {} as Documento; //Interface para los datos del Documento
   elimdisabled = false;
   nocuentas: true;
   _movimientos: any;
   _cuentas: any;

   constructor(private router: Router, private docuService: DocumentosService) { }

   ngOnInit(): void { this.datosDocumento() }

   datosDocumento() {
      let iddocumento = sessionStorage.getItem('iddocumentoToInfo');
      this.docuService.getById(+iddocumento!).subscribe({
         next: resp => {
            this.documento.iddocumento = resp.iddocumento;
            this.documento.nomdoc = resp.nomdoc;
            this.documento.nomtipdoc = nombre(resp.tipdoc);
            this.documento.tipocomprobante = resp.idtabla4.tipocomprobante;
            this.documento.nomcomprobante = resp.idtabla4.nomcomprobante;
            if (resp.tipdoc > 0 || resp.iddocumento == 1) { this.elimdisabled = true }
         },
         error: err => console.error(err.error),
      })
   }

   regresar() { this.router.navigate(['/documentos']); }

   modiDocumento() {
      sessionStorage.setItem("iddocumentoToModi", this.documento.iddocumento.toString());
      this.router.navigate(['/modi-documento']);
   }

   eliminarDocumento() {
      if (this.documento.iddocumento != null) {
         this.docuService.deleteDocumento(this.documento.iddocumento).subscribe({
            next: resp => this.router.navigate(['/documentos']),
            error: err => console.error('Al eliminar un Documento: ', err.error),
         });
      }
   }
}

interface Documento {
   iddocumento: number;
   nomdoc: String;
   nomtipdoc: String;
   tipocomprobante: String;
   nomcomprobante: String;
}

//Nombre de tipdoc
function nombre(tipdoc: number): String {

   var nombreTipdoc: String;

   switch (tipdoc) {
      case 0: nombreTipdoc = '(Ninguno)';
         break;
      case 1: nombreTipdoc = 'Depósito';
         break;
      case 2: nombreTipdoc = 'Nota de crédito';
         break;
      case 3: nombreTipdoc = 'Nota de dédito';
         break;
      case 4: nombreTipdoc = 'Cheque/Transferencia';
         break;
      case 5: nombreTipdoc = 'Factura';
         break;
      case 6: nombreTipdoc = 'Retención Fuente';
         break;
      default:
         nombreTipdoc = '';
   }
   return nombreTipdoc;
}
