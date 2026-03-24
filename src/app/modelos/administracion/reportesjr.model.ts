import { Repoxopcion } from "./repoxopcion.model";

export interface Reportesjr {
   idreporte?: number;
   nomrep?: string;
   desrep?: string;
   metodo?: number;  // 1: SQL Directo, 2: Coleccion de Beans, 3: Dataset desde frontend
   parametros?: string; // viene como JSON string desde backend
   repoxopcion?: Repoxopcion;
}

export interface ParametroReportejr {
   nombre: string;
   tipo?: string; // java.util.Date, java.lang.String, java.lang.Long, etc.
}