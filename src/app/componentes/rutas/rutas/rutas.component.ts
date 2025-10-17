import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Rutas } from 'src/app/modelos/rutas.model';
import { RutasService } from 'src/app/servicios/rutas.service';

@Component({
  selector: 'app-rutas',
  templateUrl: './rutas.component.html',
  styleUrls: ['./rutas.component.css'],
})
export class RutasComponent implements OnInit {
  filtro: string;
  _rutas: any;
  _deudasRuta: any;

  constructor(
    private rutService: RutasService,
    private router: Router,
    private coloresService: ColoresService,
    public authService: AutorizaService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/rutas');
    let coloresJSON = sessionStorage.getItem('/rutas');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    this.listaRutas();
  }

  // @HostListener('window:beforeunload', ['$event'])
  // unloadHandler(event: Event): void {
  //    alert('Alerta')
  //    // Puedes agregar lógica aquí para determinar si permitir o no la recarga
  //    // Por ejemplo, devolver un mensaje personalizado
  //    // Este es el nuevo método para prevenir la acción predeterminada
  //    event.preventDefault();
  // }

  // onNavigationEnd() {
  //    this.router.navigate(['/app-rutas']);
  // }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, 'rutas');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/rutas', coloresJSON);
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

  public listaRutas() {
    this.rutService.getListaRutas().subscribe({
      next: (rutas) => (this._rutas = rutas),
      error: (err) => console.error(err.error),
    });
  }

  onCellClick(event: any, ruta: Rutas) {
    const tagName = event.target.tagName;
    if (tagName === 'TD') {
      //  sessionStorage.setItem('codparToAuxgasto', presupue.codpar.toString());
      //  sessionStorage.setItem('nomparToAuxiliar', presupue.nompar.toString());
      //  sessionStorage.setItem('iniciaToAuxiliar', presupue.inicia.toString());
      //  this.router.navigate(['aux-gasto']);
    }
  }

  eliminarRuta(idruta: number) {
    this.rutService.deleteRuta(idruta).subscribe({
      next: (datos) => this.listaRutas(),
      error: (err) => console.error(err.error),
    });
  }

  modificarRuta(ruta: Rutas) {
    localStorage.setItem('idruta', ruta.idruta.toString());
    this.router.navigate(['modificar-rutas']);
  }

  mostrarDatos(ruta: Rutas) {
    let cod = ruta.codigo;
    console.log(cod[0]);
  }

  public info(idruta: number) {
    sessionStorage.setItem('idrutaToInfo', idruta.toString());
    this.router.navigate(['info-ruta']);
  }
  getDeudasOfRuta(idruta: number) {
    this._deudasRuta = [];
    this.rutService.getDeudaOfCuentasByIdrutas(idruta).subscribe({
      next: (data: any) => {
      console.log(data)
        this._deudasRuta = data;
      },
    });
  }
}
