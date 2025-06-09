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
  _abonados: any[] = []; // o el tipo correcto si ya lo tienes

  private states: any = [
    {
      type: 'Feature',
      properties: { party: 'Republican' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-104.05, 48.99],
            [-97.22, 48.98],
            [-96.58, 45.94],
            [-104.03, 45.94],
            [-104.05, 48.99],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { party: 'Democrat' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-109.05, 41.0],
            [-102.06, 40.99],
            [-102.03, 36.99],
            [-109.04, 36.99],
            [-109.05, 41.0],
          ],
        ],
      },
    },
  ];
  edificioMatriz: any = [0.8038125013453109, -77.72763063596486];
  private map!: L.Map | undefined;

  constructor(
    private s_emisiones: EmisionService,
    private s_abonados: AbonadosService,
    private s_rutas: RutasService
  ) {}

  ngOnInit(): void {
    /* https://www.youtube.com/watch?v=e4urW6Ud3WU  */
    this.getResumenEmisiones(12);
    this.getDatosAbonados();
    this.getRutas();
  }

  ngAfterViewInit(): void {
    /*     // 1. Crear el mapa en el contenedor con id="map"
    const map = L.map('map').setView(
      [0.8038125013453109, -77.72763063596486],
      20
    );

    // 2. Añadir la capa de mosaicos (tiles) de OpenStreetMap
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://epmapatulcan.gob.ec/wp/">ErpEpmapa-Tulcán</a>',
    }).addTo(map);

    // 3. (Opcional) Añadir un marcador de ejemplo
    L.marker([0.8038125013453109, -77.72763063596486])
      .addTo(map)
      .bindPopup('Aquí está EPMAPA-T!')
      .openPopup(); */

    /* ============== */

    //this.initMap();
    this.drawAllCuentas();
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [46.0, -100.0],
      zoom: 5,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    L.geoJSON(this.states, {
      style: (feature: any) => {
        switch (feature.properties.party) {
          case 'Republican':
            return { color: '#ff0000' };
          case 'Democrat':
            return { color: '#0000ff' };
        }
        return {};
      },
    }).addTo(this.map);
  }

  drawAllCuentas(): void {
    const cuenta: L.Marker[] = [];

    // Si hay abonados, agregarlos como marcadores
    if (this._abonados.length > 0) {
      this._abonados.forEach((item: any) => {
        try {
          const coordsArray: L.LatLngExpression = JSON.parse(
            item.geolocalizacion
          );
          console.log('Coordenadas:', coordsArray);

          const marker = L.marker(coordsArray).bindPopup(
            `Abonado ID: ${item.idabonado}`
          );
          cuenta.push(marker);
        } catch (e) {
          console.error('Error al parsear coordenadas:', item.geolocalizacion);
        }
      });
    } else {
      // Si no hay abonados, mostrar solo el edificio matriz
      const marker = L.marker(this.edificioMatriz).bindPopup(
        `Edificio Epmapa-T`
      );
      cuenta.push(marker);
    }

    const cities = L.layerGroup(cuenta);

    // Capas base
    const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    });

    const osmHOT = L.tileLayer(
      'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution:
          '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team',
      }
    );

    const baseMaps = {
      OpenStreetMap: osm,
      'OpenStreetMap HOT': osmHOT,
    };

    const overlayMaps = {
      Cuentas: cities,
    };

    // Si el mapa ya existe, limpiarlo y volver a cargar capas
    if (this.map) {

      this.map.eachLayer((layer: any) => {
        this.map!.removeLayer(layer);
      });

      osm.addTo(this.map);
      cities.addTo(this.map);
      L.control.layers(baseMaps, overlayMaps).addTo(this.map);
      this.map.setView(this.edificioMatriz, 10);
    } else {
      // Si no existe, crear el mapa desde cero
      this.map = L.map('map', {
        center: this.edificioMatriz,
        zoom: 19,
        layers: [osm, cities],
      });

      L.control.layers(baseMaps, overlayMaps).addTo(this.map);
    }
  }

  async getResumenEmisiones(limit: number) {
    this._resumenEmisiones = await this.s_emisiones.getResumenEmision(limit);
  }

  async getDatosAbonados() {
    this._ByCategorias = await this.s_abonados.getCuentasByCategoria();
    this._ByEstados = await this.s_abonados.getCuentasByEstado();
  }
  getRutas() {
    this.s_rutas.getNcuentasByRutas().subscribe({
      next: (datos: any) => {
        this._rutas = datos;
      },
      error: (e: any) => console.error(e.error),
    });
  }
  async getAbonadosByRutas(idruta: number) {
    this._abonados = await this.s_abonados.getByIdrutaAsync(idruta);
    console.log(this._abonados);
    this.drawAllCuentas();
  }
}
