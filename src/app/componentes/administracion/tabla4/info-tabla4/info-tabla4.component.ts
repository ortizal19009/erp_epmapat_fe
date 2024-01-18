import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Tabla4Service } from 'src/app/servicios/administracion/tabla4.service';

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

  constructor(private router: Router, private tab4Service: Tabla4Service) { }

  ngOnInit(): void {
    let idtabla4 = sessionStorage.getItem('idtabla4ToInfo');
    this.tab4Service.getById(+idtabla4!).subscribe({
      next: resp => {
        this.comprobante.idtabla4 = resp.idtabla4;
        this.comprobante.tipocomprobante = resp.tipocomprobante;
        this.comprobante.nomcomprobante = resp.nomcomprobante;
        this.comprobante.feccrea = resp.feccrea;
        if(resp.idtabla4 == 1) { this.elimdisabled = true}
      },
      error: err => console.log(err.error),
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
        error: err => console.log(err.error),
      })
    }
  }
}

interface Comprobante {
  idtabla4: number;
  tipocomprobante: String;
  nomcomprobante: String;
  feccrea: Date;
}
