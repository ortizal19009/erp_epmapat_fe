import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Ptoemision } from 'src/app/modelos/ptoemision';
import { PtoemisionService } from 'src/app/servicios/ptoemision.service';

@Component({
  selector: 'app-add-ptoemision',
  templateUrl: './add-ptoemision.component.html',
  styleUrls: ['./add-ptoemision.component.css']
})
export class AddPtoemisionComponent implements OnInit {

  ptoemision: Ptoemision = new Ptoemision();
  formularioPtoEmision: any;
  validar: boolean;

  constructor(private ptoemisionS: PtoemisionService, private router: Router, private authService: AutorizaService) { }
  
  ngOnInit(): void {
    let date: Date = new Date();
    this.ptoemision.usucrea =  this.authService.idusuario;
    this.ptoemision.feccrea = date;
    this.ptoemision.estado = 1;
    this.validarEstablecimiento();
  }

  validarEstablecimiento() {
    let i_establecimiento = document.getElementById("establecimiento") as HTMLInputElement;
    let i_nroautorizacion = document.getElementById("nroautorizacion") as HTMLInputElement;
    let v = this.validar;
    i_establecimiento.addEventListener('keyup', () => {
      let ie_value = i_establecimiento.value;
      if (ie_value.length === 3) {
        v = true;
        i_establecimiento.style.border = '';
      } else if (ie_value.length < 3 || ie_value.length > 3) {
        v = false;
        i_establecimiento.style.border = "#F54500 1px solid";
      }
      this.validar = v;
    });
    i_nroautorizacion.addEventListener('keyup', () => {
      let ina_value = i_nroautorizacion.value;
      if (ina_value.length > 10 || ina_value.length < 10) {
        v = false;
        i_nroautorizacion.style.border = "#F54500 1px solid";
      }else{
        v = true;
        i_nroautorizacion.style.border = "";
      }
      this.validar = v;
    });
  }

  guardarPtoEmision() {
    if (this.validar === true) {
      this.ptoemisionS.savePtoEmision(this.ptoemision).subscribe(datos => {
        this.returnListaPtoEmision();
        window.location.reload();
      }, error => console.log(error));
    } else {
      alert("ERROR DE INGRESO DE INFORMACIÓN");
    }
  }

  onSubmit() {
    this.guardarPtoEmision();
  }

  returnListaPtoEmision() { this.router.navigate(["/listar-ptoemision"]);  }

}
