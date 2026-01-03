import { Usuarios } from './../../../modelos/administracion/usuarios.model';
import { Component, OnInit } from '@angular/core';
import { Rutas } from 'src/app/modelos/rutas.model';
import { UsuarioService } from 'src/app/servicios/administracion/usuario.service';
import { EmisionService } from 'src/app/servicios/emision.service';
import { RutasService } from 'src/app/servicios/rutas.service';

@Component({
  selector: 'app-ruta-to-lector',
  templateUrl: './ruta-to-lector.component.html',
  styleUrls: ['./ruta-to-lector.component.css']
})
export class RutaToLectorComponent implements OnInit {
  _usuarios: any[] = [];
  filtro: string = '';
  _rutas: any[] = [];
  _emisiones: any[] = [];
  constructor(private usuarioService: UsuarioService, private emisionesService: EmisionService, private rutasService: RutasService) { }

  ngOnInit(): void {
    this.getUsuarioLectores();
    this.getAllRutas();
    this.getEmisiones();
  }
  getUsuarioLectores() {
    this.usuarioService.getByCargos(52).subscribe((data) => {
      console.log(data);
      this._usuarios = data;
    });
  }
  onCellClick(event: any, usuario: any) {
    console.log('Celda clickeada:', usuario);
  }
  getAllRutas() {
    this.rutasService.getListaRutas().subscribe((data) => {
      console.log(data);
    });

  }
  getEmisiones() {
    this.emisionesService.getAllEmisiones().then((data) => {
      console.log(data);
      this._emisiones = data;
    });
  }
}
