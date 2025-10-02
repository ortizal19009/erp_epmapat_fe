import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Ubicacionm } from 'src/app/modelos/ubicacionm.model';
import { UbicacionmService } from 'src/app/servicios/ubicacionm.service';

@Component({
  selector: 'app-ubicacionm',
  templateUrl: './ubicacionm.component.html'
})
export class UbicacionmComponent implements OnInit {

  id!: number;
  descripcion: any;  //Ubicacion enviada como mensaje a eliminar y a info
  rtn: number;
  _ubicacionm: any;

  constructor(private ubiService: UbicacionmService, private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void { this.listarAll(); }

  public listarAll() {
    this.ubiService.getAll().subscribe(datos => { this._ubicacionm = datos })
    //    console.log(this._ubicacionm.length)
  }

  eliminarUbicacionm(idubicacionm: number, descripcion: String) {
    localStorage.setItem("idubicacionmToDelete", idubicacionm.toString());
    this.descripcion = descripcion
    this.rtn = 0;
    if (idubicacionm <= 2) {
      this.rtn = 1;
    }
  }

  confirmaEliminarUbicacionm() {
    let id = localStorage.getItem("idubicacionmToDelete");
    if (id != null) {
      this.ubiService.delete(+id!).subscribe(datos => {
        this.listarAll();
      }, error => console.log(error));
    }
  }

  modificar(id: number) {
    this.router.navigate(['modiubicacionm', id]);
  }

  info(id: number, descripcion: String) {
    //localStorage.setItem("idubicacionm", this._ubicacionm.idubicacionm.toString());
    this.descripcion = descripcion;
  }

}
