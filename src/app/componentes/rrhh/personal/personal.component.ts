import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ColoresService } from 'src/app/compartida/colores.service';
import { PersonalService } from 'src/app/servicios/rrhh/personal.service';

@Component({
  selector: 'app-personal',
  templateUrl: './personal.component.html',
  styleUrls: ['./personal.component.css'],
})
export class PersonalComponent implements OnInit {
  f_personal: FormGroup;
  filterTerm: String;
  _personal: any;
  constructor(
    private s_personal: PersonalService,
    private coloresService: ColoresService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.f_personal = this.fb.group({
      bspersonal: '',
    });
    sessionStorage.setItem('ventana', '/personal');
    let coloresJSON = sessionStorage.getItem('/personal');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();
    this.getAllPersonal();
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, 'abonados');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/abonados', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }
  getAllPersonal() {
    this.s_personal.getAllPersonal().subscribe({
      next: (datos: any) => {
        console.log(datos);
        this._personal = datos;
      },
      error: (e: any) => console.error(e),
    });
  }
}
