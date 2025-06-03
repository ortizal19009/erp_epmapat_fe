import { AfterViewInit, Component, OnInit } from '@angular/core';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { EmisionService } from 'src/app/servicios/emision.service';
import * as L from 'leaflet';
import { RutasService } from 'src/app/servicios/rutas.service';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, AfterViewInit {
  _resumenEmisiones: any;
  _ByEstados: any;
  _ByCategorias: any;
  _rutas: any;
  constructor(private s_emisiones: EmisionService, private s_abonados: AbonadosService, private s_rutas: RutasService) { }

  ngOnInit(): void {
    /* https://www.youtube.com/watch?v=e4urW6Ud3WU  */
    this.getResumenEmisiones(12);
    this.getDatosAbonados();
    this.getRutas();

  }

  ngAfterViewInit(): void {
    // 1. Crear el mapa en el contenedor con id="map"
    const map = L.map('map').setView([0.8038125013453109, -77.72763063596486], 20);

    // 2. Añadir la capa de mosaicos (tiles) de OpenStreetMap
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://epmapatulcan.gob.ec/wp/">ErpEpmapa-Tulcán</a>'
    }).addTo(map);

    // 3. (Opcional) Añadir un marcador de ejemplo
    L.marker([0.8038125013453109, -77.72763063596486])
      .addTo(map)
      .bindPopup('Aquí está EPMAPA-T!')
      .openPopup();
  }
  async getResumenEmisiones(limit: number) {
    this._resumenEmisiones = await this.s_emisiones.getResumenEmision(limit);
  }

  async getDatosAbonados() {
    this._ByCategorias = await this.s_abonados.getCuentasByCategoria()
    this._ByEstados = await this.s_abonados.getCuentasByEstado()
    console.table(this._ByCategorias)
    console.table(this._ByEstados)
  }
  getRutas() {
    this.s_rutas.getNcuentasByRutas().subscribe({
      next: (datos: any) => {
        this._rutas = datos
      },
      error: (e: any) => console.error(e.error)
    })
  }
  async getAbonadosByRutas(idruta: number) {
    console.log(idruta)
    let _abonados = await this.s_abonados.getByIdrutaAsync(idruta)
    console.log(_abonados);
  }

}
