export interface ReportParameterDTO {
   name: string;
   type: string;
   value: any;
}

export interface ReportRequest {
   reportName: string;
   extension: string;
   parameters: ReportParameterDTO[];
}
