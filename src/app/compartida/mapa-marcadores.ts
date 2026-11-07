import * as L from 'leaflet';

export type TipoMarcadorMapa = 'cuenta' | 'edificio' | 'lector';

/** SVG embebido: no solicita marker-icon.png ni marker-shadow.png al servidor. */
export function crearIconoMapa(tipo: TipoMarcadorMapa = 'cuenta'): L.DivIcon {
  const colores: Record<TipoMarcadorMapa, string> = {
    cuenta: '#007bff', edificio: '#2c3e50', lector: '#198754'
  };
  return L.divIcon({
    className: 'epmapat-map-pin',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40" aria-hidden="true" focusable="false" style="display:block;overflow:visible">
      <path d="M15 38C12 34 2 23 2 15a13 13 0 1 1 26 0c0 8-10 19-13 23Z" fill="${colores[tipo]}" stroke="#fff" stroke-width="2"/>
      <circle cx="15" cy="15" r="5" fill="#fff"/>
    </svg>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -38],
    tooltipAnchor: [0, -28]
  });
}
