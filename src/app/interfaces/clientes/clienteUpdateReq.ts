import { Clientes } from 'src/app/modelos/clientes';

/** Extiende el modelo cliente con los campos de auditoría */
export interface ClienteUpdateReq extends Clientes {
  observacion: string;
  tipo: string; // 'MODIFICACION'
}
