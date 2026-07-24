import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CatalogoitemService } from 'src/app/servicios/catalogoitem.service';
import { RubrosService } from 'src/app/servicios/rubros.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';

@Component({
   selector: 'app-info-rubro',
   templateUrl: './info-rubro.component.html',
   styleUrls: ['./info-rubro.component.css']
})
export class InfoRubroComponent implements OnInit {

   rubro = {} as RubroView;
   elimdisabled = true;
   noProductos = true;
   noPlanillas = true;
   _catalogoitems: ProductoRubroView[] = [];
   _rubroxfac: PlanillaRubroView[] = [];
   productosPaginados: ProductoRubroView[] = [];
   planillasPaginadas: PlanillaRubroView[] = [];
   productoSeleccionado: ProductoRubroView | null = null;
   planillaSeleccionada: PlanillaRubroView | null = null;
   planillaDetalleId: number | null = null;
   planillaDetalleTitulo = '';
   idrubro: number;

   currentProductosPage = 1;
   totalProductosPages = 1;
   currentPlanillasPage = 1;
   totalPlanillasPages = 1;
   pageSize = 8;

   constructor(
      private router: Router,
      private rubService: RubrosService,
      private cataiService: CatalogoitemService,
      private rxfacService: RubroxfacService
   ) { }

   ngOnInit(): void {
      this.idrubro = +sessionStorage.getItem('idrubroToInfo')!;
      this.datosRubro();
   }

   datosRubro() {
      this.rubService.getRubroById(this.idrubro).subscribe({
         next: (resp: any) => {
            this.rubro.idrubro = resp.idrubro;
            this.rubro.descripcion = resp.descripcion;
            this.rubro.valor = Number(resp.valor || 0);
            this.rubro.calculable = !!resp.calculable;
            this.rubro.swiva = !!resp.swiva;
            this.rubro.facturable = !!resp.facturable;
            this.rubro.tipo = Number(resp.tipo || 0);
            this.rubro.nommodulo = resp.idmodulo_modulos?.descripcion || 'No definido';
            this.rubro.idmodulo = resp.idmodulo_modulos?.idmodulo || null;
         },
         error: err => console.error(err.error),
      });

      this.catalogoitemsxRub();
      this.movxidrubro();
   }

   catalogoitemsxRub() {
      this.cataiService.getByIdrubro(this.idrubro).subscribe({
         next: (datos: any) => {
            const productos = Array.isArray(datos) ? datos : [];
            this._catalogoitems = productos.map((produ: any) => this.mapProducto(produ));
            this.noProductos = this._catalogoitems.length === 0;
            this.currentProductosPage = 1;
            this.refreshProductosPagination();
            this.productoSeleccionado = this._catalogoitems.length ? this._catalogoitems[0] : null;
         },
         error: err => console.error(err.error)
      });
   }

   movxidrubro() {
      this.rxfacService.getByIdrubro(this.idrubro).subscribe({
         next: (resp: any) => {
            const planillas = Array.isArray(resp) ? resp : [];
            this._rubroxfac = planillas.map((item: any) => this.mapPlanilla(item));
            this.noPlanillas = this._rubroxfac.length === 0;
            this.currentPlanillasPage = 1;
            this.refreshPlanillasPagination();
            this.planillaSeleccionada = this._rubroxfac.length ? this._rubroxfac[0] : null;
         },
         error: err => console.error(err.error)
      });
   }

   seleccionarProducto(producto: ProductoRubroView): void {
      this.productoSeleccionado = producto;
   }

   seleccionarPlanilla(planilla: PlanillaRubroView): void {
      this.planillaSeleccionada = planilla;
   }

   verDetallePlanilla(planilla: PlanillaRubroView): void {
      this.planillaSeleccionada = planilla;
      this.planillaDetalleId = planilla?.idfactura || null;
      this.planillaDetalleTitulo = planilla?.facturaElectronica || `Planilla ${planilla?.idfactura || ''}`;
   }

   refreshProductosPagination(): void {
      this.totalProductosPages = Math.max(1, Math.ceil(this._catalogoitems.length / this.pageSize));
      if (this.currentProductosPage > this.totalProductosPages) {
         this.currentProductosPage = this.totalProductosPages;
      }
      const start = (this.currentProductosPage - 1) * this.pageSize;
      this.productosPaginados = this._catalogoitems.slice(start, start + this.pageSize);
   }

   refreshPlanillasPagination(): void {
      this.totalPlanillasPages = Math.max(1, Math.ceil(this._rubroxfac.length / this.pageSize));
      if (this.currentPlanillasPage > this.totalPlanillasPages) {
         this.currentPlanillasPage = this.totalPlanillasPages;
      }
      const start = (this.currentPlanillasPage - 1) * this.pageSize;
      this.planillasPaginadas = this._rubroxfac.slice(start, start + this.pageSize);
   }

   changeProductosPage(page: number): void {
      if (page < 1 || page > this.totalProductosPages || page === this.currentProductosPage) {
         return;
      }
      this.currentProductosPage = page;
      this.refreshProductosPagination();
   }

   changePlanillasPage(page: number): void {
      if (page < 1 || page > this.totalPlanillasPages || page === this.currentPlanillasPage) {
         return;
      }
      this.currentPlanillasPage = page;
      this.refreshPlanillasPagination();
   }

   get productosPages(): number[] {
      return Array.from({ length: this.totalProductosPages }, (_, index) => index + 1);
   }

   get planillasPages(): number[] {
      return Array.from({ length: this.totalPlanillasPages }, (_, index) => index + 1);
   }

   get visibleProductosPages(): Array<number | string> {
      return this.buildVisiblePages(this.currentProductosPage, this.totalProductosPages, this.productosPages);
   }

   get visiblePlanillasPages(): Array<number | string> {
      return this.buildVisiblePages(this.currentPlanillasPage, this.totalPlanillasPages, this.planillasPages);
   }

   get totalProductos(): number {
      return this._catalogoitems.length;
   }

   get productosFacturables(): number {
      return this._catalogoitems.filter(item => item.facturable).length;
   }

   get totalPlanillas(): number {
      return this._rubroxfac.length;
   }

   get planillasPagadas(): number {
      return this._rubroxfac.filter(item => item.pagado).length;
   }

   regresar() { this.router.navigate(['/rubros']); }

   modiRubro() {
      sessionStorage.setItem('idrubroToModi', this.rubro.idrubro.toString());
      this.router.navigate(['/modi-rubro']);
   }

   eliminarRubro() {
      if (this.rubro.idrubro != null) {
         this.rubService.deleteRubro(this.rubro.idrubro).subscribe({
            next: () => this.router.navigate(['/rubros']),
            error: err => console.error(err.error),
         });
      }
   }

   private mapProducto(produ: any): ProductoRubroView {
      return {
         idcatalogoitems: Number(produ?.idcatalogoitems || 0),
         descripcion: produ?.descripcion || 'Sin descripcion',
         uso: produ?.idusoitems_usoitems?.descripcion || 'No definido',
         modulo: produ?.idusoitems_usoitems?.idmodulo_modulos?.descripcion || 'No definido',
         facturable: produ?.facturable === true || produ?.facturable === 1,
         estado: produ?.estado === true || produ?.estado === 1
      };
   }

   private mapPlanilla(item: any): PlanillaRubroView {
      const factura = item?.idfactura_facturas || {};
      const cliente = factura?.idcliente || factura?.idcliente_clientes || {};
      const modulo = factura?.idmodulo || factura?.idmodulo_modulos || {};
      const estadoFactura = this.getEstadoFactura(factura);
      const pagado = estadoFactura.codigo === 'PAGADA';
      const fecha =
         factura?.fechacobro ||
         factura?.feccrea ||
         factura?.fechaconvenio ||
         factura?.fechaanulacion ||
         factura?.fechaeliminacion ||
         null;

      return {
         idfactura: Number(factura?.idfactura || 0),
         fecha,
         cliente: cliente?.nombre || cliente?.razonsocial || 'Sin cliente',
         cedula: cliente?.cedula || 'No registrada',
         modulo: modulo?.descripcion || 'No definido',
         valor: Number(item?.valorunitario || 0),
         pagado,
         facturaElectronica: factura?.nrofactura || 'Sin numero',
         estadoDescripcion: estadoFactura.descripcion,
         estadoClase: estadoFactura.clase
      };
   }

   private buildVisiblePages(currentPage: number, totalPages: number, pages: number[]): Array<number | string> {
      if (totalPages <= 7) {
         return pages;
      }

      const pageSet = new Set<number>();
      pageSet.add(1);
      pageSet.add(totalPages);

      for (let page = currentPage - 1; page <= currentPage + 1; page++) {
         if (page > 1 && page < totalPages) {
            pageSet.add(page);
         }
      }

      if (currentPage <= 3) {
         pageSet.add(2);
         pageSet.add(3);
         pageSet.add(4);
      }

      if (currentPage >= totalPages - 2) {
         pageSet.add(totalPages - 1);
         pageSet.add(totalPages - 2);
         pageSet.add(totalPages - 3);
      }

      const sortedPages = Array.from(pageSet)
         .filter(page => page >= 1 && page <= totalPages)
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

   private isFacturaPagada(factura: any): boolean {
      if (!factura) {
         return false;
      }

      if (Number(factura?.pagado || 0) === 1) {
         return true;
      }

      if (factura?.fechacobro) {
         return true;
      }

      return Number(factura?.estado || 0) === 2;
   }

   private getEstadoFactura(factura: any): { codigo: string; descripcion: string; clase: string } {
      if (factura?.fechaeliminacion) {
         return { codigo: 'ELIMINADA', descripcion: 'Eliminada', clase: 'estado-cancel' };
      }

      if (factura?.fechaanulacion) {
         return { codigo: 'ANULADA', descripcion: 'Anulada', clase: 'estado-cancel' };
      }

      if (factura?.fechaconvenio) {
         return { codigo: 'CONVENIO', descripcion: 'Convenio', clase: 'estado-info' };
      }

      if (this.isFacturaPagada(factura)) {
         return { codigo: 'PAGADA', descripcion: 'Pagada', clase: 'estado-ok' };
      }

      if (factura?.nrofactura) {
         return { codigo: 'EMITIDA', descripcion: 'Emitida', clase: 'estado-info' };
      }

      return { codigo: 'PENDIENTE', descripcion: 'Pendiente', clase: 'estado-warn' };
   }
}

interface RubroView {
   idrubro: number;
   descripcion: String;
   valor: number;
   calculable: boolean;
   swiva: boolean;
   nommodulo: String;
   idmodulo: number | null;
   facturable: boolean;
   tipo: number;
}

interface ProductoRubroView {
   idcatalogoitems: number;
   descripcion: string;
   uso: string;
   modulo: string;
   facturable: boolean;
   estado: boolean;
}

interface PlanillaRubroView {
   idfactura: number;
   fecha: Date | string | null;
   cliente: string;
   cedula: string;
   modulo: string;
   valor: number;
   pagado: boolean;
   facturaElectronica: string;
   estadoDescripcion: string;
   estadoClase: string;
}
