import { UsrxrutaServiceService } from './../../../servicios/usrxruta-service.service';
import { Usuarios } from './../../../modelos/administracion/usuarios.model';
import { Component, OnInit } from '@angular/core';
import { Rutas } from 'src/app/modelos/rutas.model';
import { UsuarioService } from 'src/app/servicios/administracion/usuario.service';
import { EmisionService } from 'src/app/servicios/emision.service';
import { RutasService } from 'src/app/servicios/rutas.service';
import Swal from 'sweetalert2';

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
  usrxrutas: any;
  _rutasAsignadas: any[] = [];
  usuarioSeletced: any;
  usrxruta: any;
  swaddruta: boolean = false;
  filtrarRutas: string;
  ocupadas = new Set<number>();


  constructor(
    private usuarioService: UsuarioService,
    private emisionesService: EmisionService,
    private rutasService: RutasService,
    private UsrxrutaService: UsrxrutaServiceService
  ) { }

  ngOnInit(): void {
    this.getUsuarioLectores();
    this.getAllRutas();
    this.getEmisiones();
  }
  getUsuarioLectores() {
    this.usuarioService.getByCargos(45).subscribe({
      next: (data: any) => {
        this.usuarioSeletced = data[0];
        this._usuarios = data;
      },
      error: (e: any) => console.error(e.error),
    });
  }
  onCellClick(event: any, usuario: any) {
    console.log('Celda clickeada:', usuario);
    //Buscar las rutas segun la emision y el usuario
    console.log(this.emisionSelected);
    this.usuarioSeletced = usuario;
    this.UsrxrutaService.findByUsuarioAndEmision(
      usuario.idusuario,
      this.emisionSelected.idemision
    ).subscribe({
      next: (datos: any) => {
        if (!datos) {
          this.usrxrutas = null;
          this._rutasAsignadas = [];
          return;
        }
        this.usrxrutas = datos;
        this._rutasAsignadas = datos?.rutas ?? [];
      },
      error: () => {
        this.usrxrutas = null;
        this._rutasAsignadas = [];
      }
    });


  }
  getAllRutas() {
    this.rutasService.getListaRutas().subscribe((data: any) => {
      console.log(data);
      this._rutas = data;
    });
  }
  getEmisiones() {
    this.emisionesService.getAllEmisiones().then((data) => {
      this._emisiones = data;
      this.emisionSelected = data[0];
      console.log(data[0]);
      if (data[0].estado === 0) {
        this.swaddruta = true;
      } else {
        this.swaddruta = false;
      }
    });
  }

  cargarOcupadas() {
    this.UsrxrutaService.getRutasOcupadas(this.emisionSelected.idemision).subscribe({
      next: (ids: number[]) => this.ocupadas = new Set(ids),
      error: (e) => console.error(e)
    });
  }

  esOcupada(r: any): boolean {
    return this.ocupadas.has(r.idruta);
  }
  /* Select rutas */
  selectRuta(e: any, r: any) {
    console.log(r);
    if (!e.target.checked) {
      this.dropRuta(r);
      return;
    }

    const existe = this._rutasAsignadas.some(
      (ruta: any) => ruta.idruta === r.idruta
    );

    if (existe) return;

    this._rutasAsignadas = [...this._rutasAsignadas, r];
  }

  dropRuta(r: any) {
    this._rutasAsignadas = this._rutasAsignadas.filter(
      (ruta: any) => ruta.idruta !== r.idruta
    );
  }
  isRutaAsignada(r: any): boolean {
    if (this._rutasAsignadas && this._rutasAsignadas.length > 0) {
      return this._rutasAsignadas.some((ruta: any) => ruta.idruta === r.idruta);
    }
    return false;
  }

  onSubmit() {
    this.usrxruta = {
      rutas: this._rutasAsignadas,
      idusuario_usuarios: { idusuario: this.usuarioSeletced.idusuario },
      idemision_emisiones: { idemision: this.emisionSelected.idemision },
    };

    this.UsrxrutaService.save(this.usrxruta).subscribe({
      next: (datos: any) => {
        console.log(datos);
        this.swal('success', 'Datos guardados');
      },
      error: (e: any) => console.error(e.error),
    });
  }


  private swal(icon: 'success' | 'error' | 'info' | 'warning', mensaje: string) {
    Swal.fire({
      toast: true,
      icon,
      title: mensaje,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
    });
  }
}
