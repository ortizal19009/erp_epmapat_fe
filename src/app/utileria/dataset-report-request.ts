import { ReportParameterDTO } from "./report-request";

export interface DatasetReportRequest {

   reportName: string;
   extension: string;
   parameters?: ReportParameterDTO[]; // opcional, para parametros para encabezados
   data: any[]; // dataset completo enviado al backend

}