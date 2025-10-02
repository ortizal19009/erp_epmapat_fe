import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Categoria } from 'src/app/modelos/categoria.model';
import { CategoriaService } from 'src/app/servicios/categoria.service';

@Component({
  selector: 'app-modi-categoria',
  templateUrl: './modi-categoria.component.html',
})

export class ModificarCategoriaComponent implements OnInit {

  categoria: Categoria = new Categoria();
  categoriaForm: FormGroup;

  constructor(public fb:FormBuilder, private router:Router, private categoriaS:CategoriaService, private authService:AutorizaService) { }

  ngOnInit(): void{
    let date: Date= new Date ();
    this.categoriaForm = this.fb.group({
      idcategoria: [''],
      descripcion: ['', Validators.required],
      porcdescuento: ['', Validators.required],
      usumodi: this.authService.idusuario,
      fecmodi: date,
      usucrea: this.authService.idusuario,
      feccrea: date
    });
    this.actualizarCategoria();
  }

  onSubmit(){
    this.categoriaS.updateCategoria(this.categoriaForm.value).subscribe(datos => {
      this.retornarListaCategoria();
      this.mensajeSuccess(this.categoriaForm.value.descripcion);
    }, error => console.log(error));
  }

  actualizarCategoria(){
    let idcategoriaS = localStorage.getItem("idcategoria");
    this.categoriaS.getById(+idcategoriaS!).subscribe(datos =>{
      this.categoriaForm.setValue({
        idcategoria: datos.idcategoria,
        descripcion: datos.descripcion,
        aguafijo: datos.fijoagua,
        aguasanea: datos.fijosanea,
        // porcdescuento: datos.porcdescuento,
        usumodi: datos.usumodi,
        fecmodi: datos.fecmodi,
        usucrea: datos.usucrea,
        feccrea: datos.feccrea
      });
    });
  }

  retornarListaCategoria(){
    this.router.navigate(['/categorias']);
  }
  
  mensajeSuccess(n:String){
    localStorage.setItem("mensajeSuccess","Categoria <strong>"+n+"</strong> actualizada ");
  }

}
