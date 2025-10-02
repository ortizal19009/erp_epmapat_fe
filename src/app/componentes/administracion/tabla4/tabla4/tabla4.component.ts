import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Tabla4Service } from 'src/app/servicios/administracion/tabla4.service';

@Component({
  selector: 'app-tabla4',
  templateUrl: './tabla4.component.html',
  styleUrls: ['./tabla4.component.css']
})
export class Tabla4Component {

  _tabla4: any;
  filtro: string;
  formBuscar: FormGroup;
  rtn: number = 0;
  valor_cuenta: string;
  disabled: boolean = true;

  constructor(public fb: FormBuilder, private tabla4Service: Tabla4Service, private router: Router) { }

  ngOnInit(): void { this.listarTabla4();  }

  public listarTabla4() {
    this.tabla4Service.getListaTabla4().subscribe(datos => {
      this._tabla4 = datos;
    }, error => console.log(error));
  }

  public info(idtabla4: number) {
    sessionStorage.setItem('idtabla4ToInfo', idtabla4.toString());
    this.router.navigate(['info-tabla4']);
  }
}
