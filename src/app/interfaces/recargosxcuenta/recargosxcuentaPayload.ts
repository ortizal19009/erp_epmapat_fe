/** Payload que envías para guardar */
export interface RecargosxcuentaPayload {
  idrecargoxcuenta?: number | null;
  idabonado_abonados: { idabonado: number };
  idemision_emisiones: { idemision: number };
  idrubro_rubros: { idrubro: number };
  tipo: 1 | 2;
  observacion: string;
  usucrea: number;
  feccrea: string; // ISO
  usumodi?: number | null;
  fecmodi?: string | null; // ISO
  usuresp: number; // 👈 aquí va el idusuario seleccionado
  fecha: string; // ISO
}
