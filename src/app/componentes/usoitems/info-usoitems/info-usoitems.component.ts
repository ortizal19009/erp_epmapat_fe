import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CatalogoitemService } from 'src/app/servicios/catalogoitem.service';
import { UsoitemsService } from 'src/app/servicios/usoitems.service';

@Component({
  selector: 'app-info-usoitems',
  templateUrl: './info-usoitems.component.html',
  styleUrls: ['./info-usoitems.component.css']
})
export class InfoUsoitemsComponent implements OnInit {

  usoitem = {} as UsoitemView;
  elimdisabled = true;
  noMovimientos = true;
  _catalogoitems: ProductoUsoView[] = [];
  productosPaginados: ProductoUsoView[] = [];
  productoSeleccionado: ProductoUsoView | null = null;

  currentPage = 1;
  pageSize = 8;
  totalPages = 1;

  constructor(
    private router: Router,
    private usoiService: UsoitemsService,
    private cataiService: CatalogoitemService
  ) { }

  ngOnInit(): void {
    this.datosUsoitem();
  }

  datosUsoitem() {
    const idusoitems = Number(sessionStorage.getItem('idusoitemsToInfo'));

    this.usoiService.getUsoitemById(idusoitems).subscribe({
      next: (resp: any) => {
        this.usoitem.idusoitems = resp.idusoitems;
        this.usoitem.nommodulo = resp.idmodulo_modulos?.descripcion || 'No definido';
        this.usoitem.idmodulo = resp.idmodulo_modulos?.idmodulo || null;
        this.usoitem.descripcion = resp.descripcion;
        this.usoitem.estado = !!resp.estado;
        this.usoitem.feccrea = resp.feccrea;
      },
      error: err => console.error(err.error),
    });

    this.catalogoitemsxUsoi(idusoitems);
  }

  catalogoitemsxUsoi(idusoitems: number) {
    this.cataiService.getByIdusoitems(idusoitems).subscribe({
      next: (datos: any) => {
        const productos = Array.isArray(datos) ? datos : [];
        this._catalogoitems = productos.map((item: any) => this.mapProducto(item));
        this.noMovimientos = this._catalogoitems.length === 0;
        this.currentPage = 1;
        this.refreshPagination();

        this.productoSeleccionado = this._catalogoitems.length ? this._catalogoitems[0] : null;
      },
      error: err => console.error(err.error)
    });
  }

  seleccionarProducto(producto: ProductoUsoView): void {
    this.productoSeleccionado = producto;
  }

  refreshPagination(): void {
    const totalItems = this._catalogoitems.length;
    this.totalPages = Math.max(1, Math.ceil(totalItems / this.pageSize));

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.productosPaginados = this._catalogoitems.slice(start, end);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.refreshPagination();
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get visiblePages(): Array<number | string> {
    if (this.totalPages <= 7) {
      return this.pages;
    }

    const pages = new Set<number>();
    pages.add(1);
    pages.add(this.totalPages);

    for (let page = this.currentPage - 1; page <= this.currentPage + 1; page++) {
      if (page > 1 && page < this.totalPages) {
        pages.add(page);
      }
    }

    if (this.currentPage <= 3) {
      pages.add(2);
      pages.add(3);
      pages.add(4);
    }

    if (this.currentPage >= this.totalPages - 2) {
      pages.add(this.totalPages - 1);
      pages.add(this.totalPages - 2);
      pages.add(this.totalPages - 3);
    }

    const sortedPages = Array.from(pages)
      .filter(page => page >= 1 && page <= this.totalPages)
      .sort((a, b) => a - b);

    const result: Array<number | string> = [];

    sortedPages.forEach((page, index) => {
      if (index > 0) {
        const previousPage = sortedPages[index - 1];
        if (page - previousPage === 2) {
          result.push(previousPage + 1);
        } else if (page - previousPage > 2) {
          result.push('...');
        }
      }
      result.push(page);
    });

    return result;
  }

  get totalProductos(): number {
    return this._catalogoitems.length;
  }

  get productosFacturables(): number {
    return this._catalogoitems.filter(producto => producto.facturable).length;
  }

  get productosActivos(): number {
    return this._catalogoitems.filter(producto => producto.estado).length;
  }

  regresar() { this.router.navigate(['/usoitems']); }

  modiUsoitem() {
    sessionStorage.setItem('idusoitemsToModi', this.usoitem.idusoitems.toString());
    this.router.navigate(['/modi-usoitems']);
  }

  eliminarUsoitem() {
    if (this.usoitem.idusoitems != null) {
      this.usoiService.deleteUsoitem(this.usoitem.idusoitems).subscribe({
        next: () => this.router.navigate(['/usoitems']),
        error: err => console.error(err.error),
      });
    }
  }

  private mapProducto(item: any): ProductoUsoView {
    return {
      idcatalogoitems: Number(item?.idcatalogoitems || 0),
      descripcion: item?.descripcion || 'Sin descripcion',
      facturable: item?.facturable === true || item?.facturable === 1,
      estado: item?.estado === true || item?.estado === 1,
      rubro: item?.idrubro_rubros?.descripcion || 'No definido',
      idrubro: item?.idrubro_rubros?.idrubro || null,
      modulo: item?.idusoitems_usoitems?.idmodulo_modulos?.descripcion || this.usoitem?.nommodulo || 'No definido'
    };
  }
}

interface UsoitemView {
  idusoitems: number;
  descripcion: String;
  estado: boolean;
  feccrea: Date;
  nommodulo: String;
  idmodulo: number | null;
}

interface ProductoUsoView {
  idcatalogoitems: number;
  descripcion: string;
  facturable: boolean;
  estado: boolean;
  rubro: string;
  idrubro: number | null;
  modulo: string;
}
