import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Categoria } from 'src/app/modelos/categoria.model';
import { Preciosxcat } from 'src/app/modelos/preciosxcat.model';
import { CategoriaService } from 'src/app/servicios/categoria.service';
import { PreciosxcatService } from 'src/app/servicios/preciosxcat.service';

@Component({
  selector: 'app-modificar-preciosxcat',
  templateUrl: './modificar-preciosxcat.component.html',
  styleUrls: ['./modificar-preciosxcat.component.css'],
})
export class ModificarPreciosxcatComponent implements OnInit {
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
    this.precioxcatForm = this.fb.group({
      idprecioxcat: [''],
      m3: ['', Validators.required],
      preciobase: ['', Validators.required],
      precioadicional: ['', Validators.required],
      idcategoria_categorias: ['', Validators.required],
      usumodi: this.authService.idusuario,
      fecmodi: date,
      usucrea: this.authService.idusuario,
      feccrea: date,
    });
    this.listarCategorias();
    this.obtenerPrecioxCat();
  }

  listarCategorias() {
    this.categoriaS.getListCategoria().subscribe(
      (datos) => {
        this.categoria = datos;
      },
      (error) => console.log(error)
    );
  }

  retornarListaPrecioxCat() {
    this.router.navigate(['/pliego']);
  }

  onSubmit() {
    this.preciosxcatS.savePreciosxCat(this.precioxcatForm.value).subscribe({
      next: (datos) => {
        this.mensajeSuccess(this.precioxcatForm.value.m3);
        this.retornarListaPrecioxCat();
      },
      error: (err) => console.error(err.error),
    });
  }

  mensajeSuccess(n: String) {
    localStorage.setItem('mensajeSuccess', 'Precio ' + n + ' añadido ');
    this.precioxcatForm.reset();
  }

  obtenerPrecioxCat() {
    let idprecioxcat = +sessionStorage.getItem('idprecioxcatToInfo')!;
    this.preciosxcatS.getByIdprecioxcat(idprecioxcat).subscribe({
      next: (datos) => {
        this.precioxcatForm.setValue({
          idprecioxcat: datos.idprecioxcat,
          m3: datos.m3,
          preciobase: datos.preciobase,
          precioadicional: datos.precioadicional,
          idcategoria_categorias: datos.idcategoria_categorias,
          usumodi: datos.usumodi,
          fecmodi: datos.fecmodi,
          usucrea: datos.usucrea,
          feccrea: datos.feccrea,
        });
      },
      error: (err) => console.error(err.error),
    });
  }

  compararCategorias(o1: Categoria, o2: Categoria): boolean {
    if (o1 === undefined && o2 === undefined) {
      return true;
    } else {
      return o1 === null || o2 === null || o1 === undefined || o2 === undefined
        ? false
        : o1.idcategoria == o2.idcategoria;
    }
  }
}
