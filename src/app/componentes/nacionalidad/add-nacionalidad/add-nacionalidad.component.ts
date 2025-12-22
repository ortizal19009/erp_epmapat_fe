import { Component, OnInit } from '@angular/core';
import { Nacionalidad } from 'src/app/modelos/nacionalidad';
import { NacionalidadService } from 'src/app/servicios/nacionalidad.service';
import { ListarNacionalidadComponent } from 'src/app/componentes/nacionalidad/listar-nacionalidad/listar-nacionalidad.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-nacionalidad',
  templateUrl: './add-nacionalidad.component.html',
})

export class AddNacionalidadComponent implements OnInit {

  nacionalidad: Nacionalidad = new Nacionalidad();
  //listarNacionalidades: ListarNacionalidadComponent;
  formularioNacionalidad: any;
  rtn: number;
  descripcion: String;

  constructor(private nacService: NacionalidadService, private router: Router) { }

  ngOnInit(): void {  }

  onSubmit() { this.guardarNacionalidad();  }

  guardarNacionalidad() {
    let i_descripcion = document.getElementById("descripcion") as HTMLInputElement;
    i_descripcion.addEventListener('keyup',()=>{
      i_descripcion.style.border = "";
    });
    if (i_descripcion.value === '') {
      i_descripcion.style.border = "#F54500 1px solid";
      this.rtn = 1;
    } else {
      this.nacService.getNacionalidadByDescripcion(i_descripcion.value).subscribe(datos => {
        console.log(datos);
        if (datos.length == 0) {
          this.rtn = 0;
          this.nacService.saveNacionalidad(this.nacionalidad).subscribe(datos => {
            window.location.reload();
          }, error => console.error(error));
        } else {
          i_descripcion.style.border = "#F54500 1px solid";
          this.descripcion = this.nacionalidad.descripcion;
          this.rtn = 2;
        }
      });
    }
  }

  retornarListarNacionalidad() { this.rtn = 0;  }

}
