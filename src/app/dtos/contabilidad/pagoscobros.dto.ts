export interface PagoscobrosCreateDTO {
   inttra: { inttra: number };
   idbene: { idbene: number };
   idbenxtra: { idbenxtra: number };
   intpre?: { intpre: number };
   valor: number;
}

export interface PagoscobrosUpdateDTO {
   idbene?: { idbene: number };
   intpre?: { intpre: number };
   valor?: number;
   codparreci?: string;
   codcuereci?: string;
   asierefe?: number;
}