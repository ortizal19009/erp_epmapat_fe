import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Estadom } from 'src/app/modelos/estadom.model';
import { EstadomService } from 'src/app/servicios/estadom.service';

@Component({
  selector: 'app-listar-estadom',
  templateUrl: './listar-estadom.component.html',
})
export class ListarEstadomComponent implements OnInit {
  v_estadom: Estadom[] = [];

  constructor(private ems: EstadomService, private router: Router) {}

  ngOnInit(): void {
    this.listarEstadom();
  }

  public listarEstadom() {
    this.ems.getListEstadom().subscribe((datos) => {
      this.v_estadom = datos;
    });
  }

  eliminarEstadom(idestadom: number) {
    this.ems.deleteEstadom(idestadom).subscribe((datos) => {
      this.listarEstadom();
    });
  }

  modificarEstadom(estadom: Estadom) {
    localStorage.setItem('idestadom', estadom.idestadom.toString());
    //this.router.navigate(['/modificar-estadom']);
  }
}
