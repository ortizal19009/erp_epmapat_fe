import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ColoresService } from 'src/app/compartida/colores.service';

@Component({
  selector: 'app-ntacredito',
  templateUrl: './ntacredito.component.html',
  styleUrls: ['./ntacredito.component.css'],
})
export class NtacreditoComponent implements OnInit {
  f_bntacredito: FormGroup;
  filterTerm: string;
  _ntacreditos: any;
  constructor(private router: Router, private coloresService: ColoresService) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/ntacredito');
    let coloresJSON = sessionStorage.getItem('/ntacredito');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();
  }
  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, 'ntacredito');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/ntacredito', coloresJSON);
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
  onSubmit() {}
  detallesnotasnc(notacredito: any) {}
}
