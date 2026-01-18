export interface Abonado {
  idabonado: number;
  nromedidor: string;
  direccionubicacion?: string;
  localizacion?: string;
  estado?: number;

  // opcional si tu backend lo devuelve como objeto (muchas veces con DTO sí)
  idruta_rutas?: { idruta: number; nombre?: string };
  idresponsable?: { idcliente: number; nombres?: string; apellidos?: string };
}
