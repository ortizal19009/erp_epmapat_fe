import { ValidacionError } from "./validacionError";

export interface ValidarBatchResponse {
  ok: boolean;
  errores: ValidacionError[];
}
