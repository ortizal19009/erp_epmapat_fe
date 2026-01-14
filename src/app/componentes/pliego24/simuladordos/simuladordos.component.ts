import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoriaService } from 'src/app/servicios/categoria.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';

@Component({
  selector: 'app-simuladordos',
  templateUrl: './simuladordos.component.html',
  styleUrls: ['./simuladordos.component.css'],
})
export class SimuladordosComponent implements OnInit {
  formBuscar: FormGroup;
  categorias: any;
  resumenPliego: any;
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private categoriaService: CategoriaService,
    private lecturaService: LecturasService
  ) {}
  ngOnInit(): void {
    this.formBuscar = this.fb.group({
      categoria: 1,
      m3: 0,
      swAdultoMayor: false,
      swAguapotable: false,
    });
    this.setcolor(); /*  */
    this.getAllCategorias();
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
  }

  setcolor() {
    let colores: string[];
    let coloresJSON = sessionStorage.getItem('/proyeccion');
    if (!coloresJSON) {
      colores = ['rgb(57, 95, 95)', 'rgb(207, 221, 210)'];
      const coloresJSON = JSON.stringify(colores);
      sessionStorage.setItem('/proyeccion', coloresJSON);
    } else colores = JSON.parse(coloresJSON);

    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }
  calcular() {
    console.log(this.formBuscar.value);
    let f = this.formBuscar.value;

    this.lecturaService.getValoresSimulados(f).subscribe({
      next: (datosSimulados: any) => {
        console.log(datosSimulados);
        this.resumenPliego = datosSimulados;
      },
      error: (e: any) => console.error(e.error),
    });
  }
  get hayExcedentes(): boolean {
    const ex = this.resumenPliego?.['Excedente'];
    return ex !== null && ex !== undefined && Number(ex) > 0;
  }

  regresar() {
    this.router.navigate(['/inicio']);
  }
  onSelectChange(e: any) {
    console.log(e.target.value);
  }
  getAllCategorias() {
    this.categoriaService.getListCategoria().subscribe({
      next: (categorias: any) => {
        console.log(categorias);
        this.categorias = categorias;
      },
      error: (e: any) => console.error(e.error),
    });
  }
}
