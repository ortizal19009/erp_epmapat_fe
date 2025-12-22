import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Tabla4Service } from 'src/app/servicios/administracion/tabla4.service';
import { SriService } from 'src/app/servicios/sri.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-info-tabla4',
  templateUrl: './info-tabla4.component.html',
  styleUrls: ['./info-tabla4.component.css']
})

export class InfoTabla4Component implements OnInit {

  comprobante = {} as Comprobante; //Interface para los datos del Comprobante SRI
  elimdisabled = false;
  nocuentas: true;
  _movimientos: any;
  _cuentas: any;
  _filexml: any;
  fileName: string = 'Cargar archivo .xml'
  btnSend: boolean = false

  constructor(private router: Router, private tab4Service: Tabla4Service, private s_sri: SriService) { }

  ngOnInit(): void {
    let idtabla4 = sessionStorage.getItem('idtabla4ToInfo');
    this.tab4Service.getById(+idtabla4!).subscribe({
      next: resp => {
        this.comprobante.idtabla4 = resp.idtabla4;
        this.comprobante.tipocomprobante = resp.tipocomprobante;
        this.comprobante.nomcomprobante = resp.nomcomprobante;
        this.comprobante.feccrea = resp.feccrea;
        if (resp.idtabla4 == 1) { this.elimdisabled = true }
      },
      error: err => console.error(err.error),
    })
  }

  regresar() { this.router.navigate(['/tabla4']); }

  modiTabla4() {
    sessionStorage.setItem("idtabla4ToModi", this.comprobante.idtabla4.toString());
    this.router.navigate(['/modi-tabla4']);
  }

  eliminarTabla4() {
    if (this.comprobante.idtabla4 != null) {
      this.tab4Service.deleteTabla4(this.comprobante.idtabla4).subscribe({
        next: resp => this.router.navigate(['/tabla4']),
        error: err => console.error(err.error),
      })
    }
  }
  sendRetencion() {
    if (this._filexml) {
      const reader = new FileReader();

      reader.onload = () => {
        const xmlString = reader.result as string;

        this.s_sri.sendRetencion(xmlString).subscribe({
          next: (response: string) => {
            this.swal('success', "Retencion enviada correctamente  ")
            const blob = new Blob([response], { type: 'application/xml' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = this._filexml.name;
            a.click();
            window.URL.revokeObjectURL(url);
            this.fileName = 'Cargar archivo .xml'
            this._filexml = []
            this.btnSend = false

          },
          error: (err) => {
            console.error('Error al enviar XML', err);
          }
        });
      };

      reader.readAsText(this._filexml);
    } else {
      this.swal('error', 'Error al cargar archivo')
      this.btnSend = false

    }
  }
  swal(icon: any, mensaje: any) {
    Swal.fire({
      toast: true,
      icon: icon,
      title: mensaje,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
    });
  }

  onFileSelected(event: Event): void {
    this.fileName = 'Cargando ...'
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this._filexml = file
    this.fileName = this._filexml.name
    this.btnSend = true
  }

}

interface Comprobante {
  idtabla4: number;
  tipocomprobante: String;
  nomcomprobante: String;
  feccrea: Date;
}
