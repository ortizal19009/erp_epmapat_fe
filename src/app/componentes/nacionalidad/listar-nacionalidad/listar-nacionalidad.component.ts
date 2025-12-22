import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Nacionalidad } from 'src/app/modelos/nacionalidad';
import { NacionalidadService } from 'src/app/servicios/nacionalidad.service';

@Component({
  selector: 'app-listar-nacionalidad',
  templateUrl: './listar-nacionalidad.component.html',
  styleUrls: ['./listar-nacionalidad.component.css']
})

export class ListarNacionalidadComponent implements OnInit {

  nacionalidades: any;
  filtro: string;
  descripcion:any;  //Ubicacion enviada como mensaje a eliminar y a info
  rtn:number;

  constructor(private nacService: NacionalidadService, private router: Router) { }

  ngOnInit(): void { this.listarNacionalidades();  }

  public listarNacionalidades() {
    this.nacService.getListaNacionalidades().subscribe(datos => {
      this.nacionalidades = datos;
      // this.alerta();
    }, error => console.error(error))
  }

  eliminarNacionalidad(idnacionalidad: number, descripcion: String) {
    localStorage.setItem("idnacionalidadToDelete", idnacionalidad.toString());
    this.descripcion = descripcion
    this.rtn = 0;
    if ( idnacionalidad <= 12 ){
      this.rtn = 1;
    }
  }

  confirmaEliminarNacionalidad() {
    let id = localStorage.getItem("idnacionalidadToDelete");
    if (id != null) {
        this.nacService.deleteNacionalidad(+id!).subscribe(datos => {
          this.listarNacionalidades();
        }, error => console.error(error));
      }
   }

   modificarNacionalidad(nacio: Nacionalidad): void {
    let idnacionalidad = nacio.idnacionalidad;
    localStorage.setItem("idnacionalidad", idnacionalidad.toString());
    this.router.navigate(['/modi-nacionalidad']);
  }

  info(id: number, descripcion: String) {
    //localStorage.setItem("idnacionalidad", this.nacionalidades.idnacionalidad.toString());
    this.descripcion = descripcion;
  }

}
