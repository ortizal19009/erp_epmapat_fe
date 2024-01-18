import { Component, OnInit } from '@angular/core';
import { AutorizaService } from '../compartida/autoriza.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-sidebar',
  templateUrl: './main-sidebar.component.html',
  styleUrls: ['./main-sidebar.component.css']
})

export class MainSidebarComponent implements OnInit {

  fondo1: number;

  constructor(public authService: AutorizaService, private router: Router) { }

  ngOnInit(): void {
    //Fondo
    let fondoActual = sessionStorage.getItem("fondoActual")?.toString();
    this.fondo1 = +fondoActual!
    //Módulo
    // this.authService.modulo = +sessionStorage.getItem("moduloOld")!
    // this.authService.modulo = this.authService.moduActual
  }

  isOptionEnabled(modulo: number, i: number): boolean {
    let priusu: string = '';
    switch (modulo) {
      case 0:
        // Bloque de código para value1
        break;
      case 1:
        // Bloque de código para value2
        break;
      case 5:
        priusu = '1660';
        break;
      default:
        // Bloque de código para el caso por defecto
        break;
    }
    let x3 = priusu.slice(i, i + 1);
    if (+x3 >= 5) return true;
    else return false;
  }

  navUsuario() {
    if (this.authService.idusuario == 1) {
      this.router.navigateByUrl('/usuarios');
    } else {
      sessionStorage.setItem("idusuarioToModi", this.authService.idusuario.toString());
      // this.router.navigateByUrl('/modi-usuario');
      this.router.navigate(["/modi-usuario"]);
    }
  }

}
