import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ColoresService } from 'src/app/compartida/colores.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';

@Component({
  selector: 'app-cv-rubros',
  templateUrl: './cv-rubros.component.html',
  styleUrls: ['./cv-rubros.component.css'],
})
export class CvRubrosComponent implements OnInit {
  filtro: string;
  f_buscar: FormGroup;
  today: Date = new Date();
  _rubros: any;
  constructor(
    private coloresService: ColoresService,
    private s_rxf: RubroxfacService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/cv-rubros');
    let coloresJSON = sessionStorage.getItem('/cv-rubros');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();
    let d = this.today.toISOString().slice(0, 10);
    this.f_buscar = this.fb.group({
      sDate: d,
      filtro: '',
    });
    this.getCarteraVencidaxRubros(d);
  }
  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }
  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, 'clientes');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/clientes', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }
  getCarteraVencidaxRubros(date: any) {
    this.s_rxf.getCarteraVencidaxRubros(date).subscribe({
      next: (datos: any) => {
        console.log(datos);
        this._rubros = datos;
      },
      error: (e: any) => console.error(e),
    });
  }
  onChaneDate(e: any) {
    this.getCarteraVencidaxRubros(this.f_buscar.value.sDate);
  }
}
