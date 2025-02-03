import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ColoresService } from 'src/app/compartida/colores.service';
import { RemisionService } from 'src/app/servicios/coactivas/remision.service';

@Component({
  selector: 'app-remision',
  templateUrl: './remision.component.html',
  styleUrls: ['./remision.component.css'],
})
export class RemisionComponent implements OnInit {
  f_buscar: FormGroup;
  filtro: string;
  _facturas: any;
  today: Date = new Date();
  _remisiones: any;
  
    /* variables para hacer la paginación  */
    page: number = 0;
    size: number = 20;
    _cuentasPageables?: any;
    totalPages: number = 0; // Total de páginas
    pages: number[] = []; // Lista de números de página
    maxPagesToShow: number = 5; // Máximo número de botones a mostrar
  
  constructor(
    private fb: FormBuilder,
    private coloresService: ColoresService,
    private s_remision: RemisionService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/cv-facturas');
    let coloresJSON = sessionStorage.getItem('/cv-facturas');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();
    let d = this.today.toISOString().slice(0, 10);
    this.f_buscar = this.fb.group({
      sDate: d,
      filtro: '',
    });
    this.getAllRemisiones(this.page, this.size);
  }
  onChangeDate(e: any) {}
  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }
  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, 'cv-facturas');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/cv-facturas', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }
  getAllRemisiones(page: number, size: number) {
    this.s_remision.getAllRemisiones(page, size).subscribe({
      next: (datos: any) => {
        this._remisiones = datos.content;
      },
      error: (e: any) => console.error(e),
    });
  }
    /* Inicio de configuracion de paginacion */
    onPreviousPage(): void {
      if (this.page > 0) {
        //this.getByPagesCuentas(this.page - 1, this.size);
      }
    }
    onNextPage(): void {
      if (this.page <= this.totalPages - 1) {
        this.getAllRemisiones(this.page + 1, this.size);
      }
    }
    onGoToPage(page: number): void {
      if (page >= 0 && page < this.totalPages) {
        this.getAllRemisiones(page, this.size);
      }
    }
  
    updatePages(): void {
      const halfRange = Math.floor(this.maxPagesToShow / 2);
      let startPage = Math.max(this.page - halfRange, 0);
      let endPage = Math.min(this.page + halfRange, this.totalPages - 1);
      // Ajusta el rango si estás al principio o al final
      if (this.page <= halfRange) {
        endPage = Math.min(this.maxPagesToShow - 1, this.totalPages - 1);
      } else if (this.page + halfRange >= this.totalPages) {
        startPage = Math.max(this.totalPages - this.maxPagesToShow, 0);
      }
      // Genera los números de las páginas visibles
      this.pages = Array.from(
        { length: endPage - startPage + 1 },
        (_, i) => startPage + i
      );
    }
    /* Fin de configuracion de paginacion */
}
