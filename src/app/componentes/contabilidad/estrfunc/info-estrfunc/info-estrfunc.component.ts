import { Component, Inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { concat } from 'rxjs';
import { EstrfuncService } from 'src/app/servicios/contabilidad/estrfunc.service';
import { PregastoService } from 'src/app/servicios/contabilidad/pregasto.service';

@Component({
  selector: 'app-info-estrfunc',
  templateUrl: './info-estrfunc.component.html',
  styleUrls: ['./info-estrfunc.component.css'],
})
export class InfoEstrfuncComponent implements OnInit {
  estrfunc = {} as Estrfunc; //Interface para los datos de la Actividad
  intest: number;
  filtro: string;
  totales = false;
  _partidas: any;
  swfiltro: boolean;
  totCodificado = 0;
  totInicia = 0;
  totModifi = 0;

  constructor(
    private router: Router,
    private estrfuncService: EstrfuncService,
    private pregasService: PregastoService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/info-estrfunc');
    this.setcolor();
    this.intest = +sessionStorage.getItem('intestToInfo')!;
    this.datosActividad();
    this.partidas();
  }

  setcolor() {
    let colores: string[];
    let coloresJSON = sessionStorage.getItem('/info-estrfunc');
    if (!coloresJSON) {
      colores = ['rgb(80, 83, 54)', 'rgb(228, 248, 205)'];
      const coloresJSON = JSON.stringify(colores);
      sessionStorage.setItem('/info-estrfunc', coloresJSON);
    } else colores = JSON.parse(coloresJSON);

    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  datosActividad() {
    this.estrfuncService.getById(this.intest).subscribe({
      next: (datos: any) => {
        this.estrfunc.codigo = datos.codigo;
        this.estrfunc.nombre = datos.nombre;
      },
      error: (err) => console.error(err.error),
    });
  }

  onInputChange() {
    if (this.filtro.trim() !== '') this.swfiltro = true;
    else this.swfiltro = false;
  }

  partidas() {
    this.pregasService.getByActividad(this.intest).subscribe({
      next: (resp: any) => {
        console.log(resp);
        this._partidas = resp;
        this.totales = true;
        this.total();
      },
      error: (err) =>
        console.error('Al buscar las Partidas de Gastos: ', err.error),
    });
  }

  total() {
    let sumInicia: number = 0;
    let sumModifi: number = 0;
    let i = 0;
    this._partidas.forEach(() => {
      sumInicia += this._partidas[i].inicia;
      sumModifi += this._partidas[i].totmod;
      i++;
    });
    this.totInicia = sumInicia;
    this.totModifi = sumModifi;
    this.totCodificado = sumInicia + sumModifi;
  }

  regresar() {
    this.router.navigate(['/estrfunc']);
  }
}

interface Estrfunc {
  intest: number;
  codigo: String;
  nombre: String;
  movimiento: boolean;
  objcosto: number;
}
