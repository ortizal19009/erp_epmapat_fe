import { ValidacionItem } from "./validacionItem";

export interface ValidarBatchRequest {
  idemision: number;
  fecha: string; // ISO string
  items: ValidacionItem[];
}
