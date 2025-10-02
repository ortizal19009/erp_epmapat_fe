import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Tpreclamo } from 'src/app/modelos/tpreclamo.model';
import { TpreclamoService } from 'src/app/servicios/tpreclamo.service';

@Component({
  selector: 'app-tpreclamos',
  templateUrl: './tpreclamos.component.html'
})
export class TpreclamosComponent implements OnInit {

  _tpreclamo: any;
  rtn:number;
  descripcion:any;  //Ubicacion enviada como mensaje a eliminar y a info

  constructor(private tprService: TpreclamoService, private router: Router) { }

  ngOnInit(): void { this.listarAll(); }

  public listarAll() {
    this.tprService.getAll().subscribe(datos => { this._tpreclamo = datos })
    console.log(this._tpreclamo.length)
  }
  
  eliminarTpreclamo(idtpreclamo: number, descripcion: String) {
    localStorage.setItem("idtpreclamoToDelete", idtpreclamo.toString());
    this.descripcion = descripcion
    this.rtn = 0;
    if ( idtpreclamo <= 8 ){
      this.rtn = 1;
    }
  }

  confirmaEliminarTpreclamo() {
    let id = localStorage.getItem("idtpreclamoToDelete");
    if (id != null) {
        this.tprService.delete(+id!).subscribe(datos => {
          this.listarAll();
        }, error => console.log(error));
      }
   }

  modificar(tpreclamo: Tpreclamo) {
    localStorage.setItem("idtpreclamo", tpreclamo.idtpreclamo.toString());
    this.router.navigate(['/modificar-tpreclamo']);
  }

  info(id: number, descripcion: String) {
    //localStorage.setItem("idubicacionm", this._ubicacionm.idubicacionm.toString());
    this.descripcion = descripcion;
  }

}
