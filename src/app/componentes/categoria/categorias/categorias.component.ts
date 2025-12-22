import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Categoria } from 'src/app/modelos/categoria.model';
import { CategoriaService } from 'src/app/servicios/categoria.service';

@Component({
  selector: 'app-categorias',
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.css']
})

export class ListarCategoriaComponent implements OnInit {

  _categorias: Categoria[];
  tmp: String;
  lista: any;

  constructor(private cateService: CategoriaService, private router: Router) { }

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/categorias');
    this.setcolor();
    this.listarCategoria();
  }

  setcolor() {
    let colores: string[];
    let coloresJSON = sessionStorage.getItem('/categorias');
    if (!coloresJSON) {
       colores = ['rgb(57, 95, 95)', 'rgb(207, 221, 210)'];
       const coloresJSON = JSON.stringify(colores);
       sessionStorage.setItem('/categorias', coloresJSON);
    } else colores = JSON.parse(coloresJSON);

    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1')
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
 }

  public listarCategoria(){
    this.cateService.getListCategoria().subscribe({
      next: datos =>  this._categorias = datos,
      error: err => console.error(err.error),
    })
  }

  public pruebaOld(){
    this.cateService.valNombre("COME").subscribe(datos => {
      this.lista = datos;
      this.tmp = this.lista[0].descripcion;
      alert(this.lista.length)
      alert("this.tmp  = " + this.tmp);
    }, error => console.error(error));
  }

  eliminarCategoria(idcategoria: number){
    localStorage.setItem("idcategoriaToDelete", idcategoria.toString());
  }

  aprobarEliminacionCategoria(){
    let idc = localStorage.getItem("idcategoriaToDelete");
    if(idc != null){
      this.cateService.getUsedCategoria(+idc!).subscribe(datos =>{
        if(datos.length != 0){
          const divAlerta = document.getElementById("alertaCategorias");
          const alerta = document.createElement("div") as HTMLElement;
          divAlerta?.appendChild(alerta);
          alerta.innerHTML = "<div class='alert alert-danger' role='alert'><strong>ERROR!</strong> <br/>Esta categoria no se la puede borra, es usada en otra tabla.</div>";
          setTimeout(function () {
            divAlerta?.removeChild(alerta);
            localStorage.removeItem("idcategoriaToDelete");
          }, 2000);

        }
        else{
          this.cateService.deleteCategoria(+idc!).subscribe(datos => {
            localStorage.setItem("mensajeSuccess", "Categoria eliminada ");
            this.listarCategoria();
          },error=>console.error(error));

        }
      }, error => console.error(error));
    }
    localStorage.removeItem("idcategoriaToDelete");
    this.listarCategoria();
  }

  modificarCategoria(categoria: Categoria){
    localStorage.setItem("idcategoria",categoria.idcategoria.toString());
    this.router.navigate(['/modificar-categoria']);
  }

  alerta() {
    let mensaje = localStorage.getItem("mensajeSuccess");
    if (mensaje != null) {
      const divAlerta = document.getElementById("alertaCategorias");
      const alerta = document.createElement("div") as HTMLElement;
      divAlerta?.appendChild(alerta);
      alerta.innerHTML = "<div class='alert alert-success'><strong>EXITO!</strong> <br/>" + mensaje + ".</div>";
      setTimeout(function () {
        divAlerta?.removeChild(alerta);
        localStorage.removeItem("mensajeSuccess");
      }, 2000);
    }
    localStorage.removeItem("mensajeSuccess");
  }

}
