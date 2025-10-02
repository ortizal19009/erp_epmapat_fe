import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Tipopago } from 'src/app/modelos/tipopago.model';
import { TipopagoService } from 'src/app/servicios/tipopago.service';

@Component({
  selector: 'listar-tipopago',
  templateUrl: './listar-tipopago.component.html'
})
export class ListarTipopagoComponent implements OnInit {

  _tipopago:any;
  descripcion:String;
  rtn:number;

  constructor(private tpService: TipopagoService, private router: Router) { }

  ngOnInit(): void {
    this.listarTipopago();
  }

  public listarTipopago(){
    this.tpService.getListTipopago().subscribe(datos => {this._tipopago = datos})
    console.log(this._tipopago.length)
  }

  // eliminarTipopago(idtipopago:number, descripcion:String){
  //   this.x.deleteTipopago(idtipopago).subscribe(datos => {
  //     this.listarTipopago();
  //   })
  // }.

  eliminarTipopago(idtipopago: number, descripcion: String) {
    localStorage.setItem("idtipopagoToDelete", idtipopago.toString());
    this.descripcion = descripcion
    this.rtn = 0;
    if (idtipopago <= 3) {
      this.rtn = 1;
    }
  }

  confirmaEliminarTipopago() {
    let id = localStorage.getItem("idtipopagoToDelete");
    if (id != null) {
      this.tpService.deleteTipopago(+id!).subscribe(datos => {
        this.listarTipopago();
      }, error => console.log(error));
    }
  }

  modificarTipopago(tipopago: Tipopago){
    localStorage.setItem("idtipopago",tipopago.idtipopago.toString());
    this.router.navigate(['/modificar-tipopago']);
  }

  info(id: number, descripcion: String) {
    //localStorage.setItem("idubicacionm", this._ubicacionm.idubicacionm.toString());
    this.descripcion = descripcion;
  }

}
