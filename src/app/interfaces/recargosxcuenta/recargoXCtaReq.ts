/** Payload para actualizar un recargo existente (PUT /{id}) */
export interface RecargoXCtaReq {
  idabonado_abonados: { idabonado: number };
  idemision_emisiones: { idemision: number };
  idrubro_rubros: { idrubro: number };
  tipo: 1 | 2;
  observacion: string;
  usumodi: number;
  fecmodi: string; // ISO YYYY-MM-DD
  usuresp: number;
  fecha: string;   // ISO YYYY-MM-DD
}
