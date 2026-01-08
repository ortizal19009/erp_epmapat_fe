import { UsrxrutaServiceService } from './../../../servicios/usrxruta-service.service';
import { Usuarios } from './../../../modelos/administracion/usuarios.model';
import { Component, OnInit } from '@angular/core';
import { Rutas } from 'src/app/modelos/rutas.model';
import { UsuarioService } from 'src/app/servicios/administracion/usuario.service';
import { EmisionService } from 'src/app/servicios/emision.service';
import { RutasService } from 'src/app/servicios/rutas.service';

@Component({
  selector: 'app-ruta-to-lector',
  templateUrl: './ruta-to-lector.component.html',
  styleUrls: ['./ruta-to-lector.component.css'],
})
export class RutaToLectorComponent implements OnInit {
  _usuarios: any[] = [];
  filtro: string = '';
  _rutas: any[] = [];
  _emisiones: any[] = [];
  emisionSelected: any;
  usrxrutas: any[] = [];
  _rutasAsignadas: any[] = [];
  constructor(
    private usuarioService: UsuarioService,
    private emisionesService: EmisionService,
    private rutasService: RutasService,
    private UsrxrutaService: UsrxrutaServiceService
  ) {}

  ngOnInit(): void {
    this.getUsuarioLectores();
    this.getAllRutas();
    this.getEmisiones();
  }
  getUsuarioLectores() {
    this.usuarioService.getByCargos(45).subscribe({
      next: (data) => {
        this._usuarios = data;
      },
      error: (e: any) => console.error(e.error),
    });
  }
  onCellClick(event: any, usuario: any) {
    console.log('Celda clickeada:', usuario);
    //Buscar las rutas segun la emision y el usuario
    console.log(this.emisionSelected);
    this.UsrxrutaService.findByUsuarioAndEmision(
      usuario.idusuario,
      this.emisionSelected.idemision
    ).subscribe({
      next: (datos: any) => {
        console.log(datos);
        this.usrxrutas = datos;
        this._rutasAsignadas = datos.rutas;
      },
      error: (e: any) => console.error(e.error),
    });
  }
  getAllRutas() {
    this.rutasService.getListaRutas().subscribe((data) => {
      console.log(data);
      this._rutas = data;
    });
  }
  getEmisiones() {
    this.emisionesService.getAllEmisiones().then((data) => {
      this._emisiones = data;
      this.emisionSelected = data[0];
    });
  }
}
