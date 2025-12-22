import { Component, OnInit } from '@angular/core';
import { ModulosService } from 'src/app/servicios/modulos.service';

@Component({
  selector: 'app-modulos',
  templateUrl: './modulos.component.html'
})

export class ModulosComponent implements OnInit {

  modulo: any;

  constructor(private moduServicio: ModulosService ) { }

  ngOnInit(): void {
    this.listar();
  }

  public listar(){
    this.moduServicio.getListaModulos().subscribe(datos => {
      this.modulo = datos;
    }, error => console.error(error));
  }

}
