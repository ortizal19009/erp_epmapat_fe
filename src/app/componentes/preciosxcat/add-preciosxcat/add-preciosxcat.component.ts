import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Categoria } from 'src/app/modelos/categoria.model';
import { Preciosxcat } from 'src/app/modelos/preciosxcat.model';
import { CategoriaService } from 'src/app/servicios/categoria.service';
import { PreciosxcatService } from 'src/app/servicios/preciosxcat.service';

@Component({
  selector: 'app-add-preciosxcat',
  templateUrl: './add-preciosxcat.component.html',
  styleUrls: ['./add-preciosxcat.component.css'],
})
export class AddPreciosxcatComponent implements OnInit {
  precioxcatForm: FormGroup;
  preciosxcat: Preciosxcat = new Preciosxcat();
  categoria: any;

  constructor(
    private fb: FormBuilder,
    private preciosxcatS: PreciosxcatService,
    private router: Router,
    private categoriaS: CategoriaService,
    private authService: AutorizaService
  ) {}

  ngOnInit(): void {
    let date: Date = new Date();
    let categorias: Categoria = new Categoria();
    categorias.idcategoria = 1;
    // setTimeout(()=>{
    //   let o_categorias = document.getElementById("id-c"+categorias.idcategoria) as HTMLSelectElement;
    //   o_categorias.setAttribute('selected', '');
    // },300)
    this.precioxcatForm = this.fb.group({
      m3: ['', Validators.required],
      preciobase: ['', Validators.required],
      precioadicional: ['', Validators.required],
      idcategoria_categorias: categorias,
      usucrea: this.authService.idusuario,
      feccrea: date,
    });
    this.listarCategorias();
  }

  listarCategorias() {
    this.categoriaS.getListCategoria().subscribe({
      next: (datos) => (this.categoria = datos),
      error: (err) => console.log(err.error),
    });
  }

  retornarListaPrecioxCat() {
    this.router.navigate(['/pliego']);
  }

  onSubmit() {
    this.guardarPrecioxCat();
  }

  guardarPrecioxCat() {
    this.preciosxcatS.savePreciosxCat(this.precioxcatForm.value).subscribe({
      next: (datos) => {
        this.retornarListaPrecioxCat();
        window.location.reload();
      },
      error: (err) => console.log(err.error),
    });
  }
}
