import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ColoresService } from 'src/app/compartida/colores.service';
import { NtacreditoService } from 'src/app/servicios/ntacredito.service';

@Component({
  selector: 'app-ntacredito',
  templateUrl: './ntacredito.component.html',
  styleUrls: ['./ntacredito.component.css'],
})
export class NtacreditoComponent implements OnInit {
  f_bntacredito: FormGroup;
  filterTerm: string;
  _ntacreditos: any;
  /* variables para hacer la paginación  */
  page: number = 0;
  size: number = 10;
  _cuentasPageables?: any;
  totalPages: number = 0; // Total de páginas
  pages: number[] = []; // Lista de números de página
  maxPagesToShow: number = 5;
  constructor(private router: Router, private coloresService: ColoresService, private s_ntacredito: NtacreditoService, private fb: FormBuilder) { }

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/ntacredito');
    let coloresJSON = sessionStorage.getItem('/ntacredito');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();
    this.f_bntacredito = this.fb.group({
      selecTipoBusqueda: 1,
      buscarAbonado: ''

    })
    this.getAllNotasCreditos(this.page, this.size)

  }
  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, 'ntacredito');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/ntacredito', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }
  onSubmit() { }
  detallesnotasnc(notacredito: any) { }
  getAllNotasCreditos(page: number, size: number) {
    this.s_ntacredito.getAllPageable(page, size).subscribe({
      next: (datos: any) => {
        this._ntacreditos = datos.content;
      },
      error: (e: any) => console.error(e)
    })
  }
  /* Inicio de configuracion de paginacion */
  onPreviousPage(): void {
    if (this.page > 0) {
      //this.getByPagesCuentas(this.page - 1, this.size);
    }
  }
  onNextPage(): void {
    if (this.page <= this.totalPages - 1) {
      this.getAllNotasCreditos(this.page + 1, this.size);
    }
  }
  onGoToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.getAllNotasCreditos(page, this.size);
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
