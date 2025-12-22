import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RutasxemisionService } from 'src/app/servicios/rutasxemision.service'; //Ok. Usa el mismo modelo y servicio que rutasxemision

@Component({
  selector: 'app-emiactual',
  templateUrl: './emiactual.component.html'
})

export class EmiactualComponent implements OnInit {

  _emiactual: any;
  filtro: string;
  ruta: String;
  nocerrar = false;

  constructor(private router: Router, private ruxemiService:RutasxemisionService) { }

  ngOnInit(): void {
    // let idemision = sessionStorage.getItem("idemisionToEmiactual")
    // this.ruxemiService.getEmisionActual(+idemision!).subscribe(datos => {
    //   this._emiactual = datos;
    // }, error => console.error(error));

  }

  regresar() { this.router.navigate(['/emisiones']); }

  lecturas(idrutaxemision: number){
    sessionStorage.setItem("idrutaxemisionToLectura", idrutaxemision.toString());
    this.router.navigate(['lecturas']);
 }

  cerrar(ruta: String){
    this.ruta = ruta;
  }

}
