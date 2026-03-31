import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ColoresService } from 'src/app/compartida/colores.service';
import { PersonalService } from 'src/app/servicios/rrhh/personal.service';

@Component({
  selector: 'app-info-personal',
  templateUrl: './info-personal.component.html',
  styleUrls: ['./info-personal.component.css'],
})
export class InfoPersonalComponent implements OnInit {
  personal: any = {};
  personalId: number;

  constructor(
    private router: Router,
    private s_personal: PersonalService,
    private coloresService: ColoresService
  ) {}

  ngOnInit(): void {
    this.personalId = Number(sessionStorage.getItem('idpersonalToInfo'));
    sessionStorage.setItem('ventana', '/personal');
    const coloresJSON = sessionStorage.getItem('/personal');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    if (this.personalId) {
      this.loadPersonal();
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

  loadPersonal() {
    this.s_personal.getPersonalById(this.personalId).subscribe({
      next: (datos: any) => {
        this.personal = datos;
      },
      error: (e: any) => console.error(e),
    });
  }

  regresar() {
    this.router.navigate(['/personal']);
  }
}
