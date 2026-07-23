import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CatalogoitemService } from 'src/app/servicios/catalogoitem.service';
import { FacturacionService } from 'src/app/servicios/facturacion.service';
import { ItemxfactService } from 'src/app/servicios/itemxfact.service';
import { LiquidafacService } from 'src/app/servicios/liquidafac.service';

@Component({
   selector: 'app-info-catalogoitems',
   templateUrl: './info-catalogoitems.component.html',
   styleUrls: ['./info-catalogoitems.component.css']
})
export class InfoCatalogoitemsComponent implements OnInit {

   producto = {} as CatalogoitemsView;
   elimdisabled = true;
   noMovimientos = true;
   _movxproducto: MovimientoProductoView[] = [];
   movimientosPaginados: MovimientoProductoView[] = [];
   idcatalogoitems: number;
   _producto: any;

   currentPage = 1;
   pageSize = 8;
   totalPages = 1;

   detalleSeleccionado: MovimientoProductoView | null = null;
   facturasDetalle: any[] = [];
   cargandoDetalle = false;
   errorDetalle = '';

   constructor(
      private router: Router,
      private prodService: CatalogoitemService,
      private ixfService: ItemxfactService,
      private facturacionService: FacturacionService,
      private liquidafacService: LiquidafacService
   ) { }

   ngOnInit(): void {
      this.idcatalogoitems = +sessionStorage.getItem('idcatalogoitemsToInfo')!;
      this.datosProducto();
   }

   datosProducto() {
      this.prodService.getById(this.idcatalogoitems).subscribe({
         next: resp => {
            this._producto = resp;
            this.producto.idcatalogoitems = resp.idcatalogoitems;
            this.producto.descripcion = resp.descripcion;
            this.producto.nommodulo = resp.idusoitems_usoitems?.idmodulo_modulos?.descripcion || 'No definido';
            this.producto.uso = resp.idusoitems_usoitems?.descripcion || 'No definido';
            this.producto.usoCodigo = resp.idusoitems_usoitems?.idusoitems || null;
            this.producto.rubro = resp.idrubro_rubros?.descripcion || 'No definido';
            this.producto.rubroCodigo = resp.idrubro_rubros?.idrubro || null;
         },
         error: err => console.error(err.error),
      });
      this.movxProducto();
   }

   movxProducto() {
      this.ixfService.getByIdcatalogoitems(this.idcatalogoitems).subscribe({
         next: (resp: any) => {
            const movimientos = Array.isArray(resp) ? resp : [];
            const movimientosBase = movimientos.map((mov: any) => this.mapMovimiento(mov));
            const idsFacturacion = Array.from(
               new Set(
                  movimientosBase
                     .map(mov => Number(mov.idfacturacion || 0))
                     .filter(id => id > 0)
               )
            );

            if (!idsFacturacion.length) {
               this._movxproducto = movimientosBase;
               this.noMovimientos = this._movxproducto.length === 0;
               this.currentPage = 1;
               this.refreshPagination();

               if (this._movxproducto.length) {
                  this.seleccionarMovimiento(this._movxproducto[0]);
               } else {
                  this.detalleSeleccionado = null;
                  this.facturasDetalle = [];
               }
               return;
            }

            const consultas: Record<string, any> = {};
            idsFacturacion.forEach((id) => {
               consultas[`fact_${id}`] = this.liquidafacService.getByIdfacturacion(id).pipe(
                  catchError(() => of([]))
               );
            });

            forkJoin(consultas).subscribe({
               next: (resultado: Record<string, any>) => {
                  const liquidacionesPorFacturacion = new Map<number, any[]>();
                  idsFacturacion.forEach((id) => {
                     const liquidaciones = Array.isArray(resultado[`fact_${id}`]) ? resultado[`fact_${id}`] : [];
                     liquidacionesPorFacturacion.set(id, liquidaciones);
                  });

                  this._movxproducto = movimientosBase.map((mov) =>
                     this.completarEstadoMovimiento(mov, liquidacionesPorFacturacion.get(mov.idfacturacion) || [])
                  );
                  this.noMovimientos = this._movxproducto.length === 0;
                  this.currentPage = 1;
                  this.refreshPagination();

                  if (this._movxproducto.length) {
                     this.seleccionarMovimiento(this._movxproducto[0]);
                  } else {
                     this.detalleSeleccionado = null;
                     this.facturasDetalle = [];
                  }
               },
               error: (err) => {
                  console.error(err);
                  this._movxproducto = movimientosBase;
                  this.noMovimientos = this._movxproducto.length === 0;
                  this.currentPage = 1;
                  this.refreshPagination();
               }
            });
         },
         error: err => {
            console.error(err.error);
            this._movxproducto = [];
            this.noMovimientos = true;
            this.refreshPagination();
         }
      });
   }

   seleccionarMovimiento(mov: MovimientoProductoView) {
      this.detalleSeleccionado = mov;
      this.facturasDetalle = [];
      this.errorDetalle = '';
      this.cargandoDetalle = true;

      forkJoin({
         facturacion: this.facturacionService.getById(mov.idfacturacion).pipe(
            catchError(() => of(mov.facturacionRaw || mov.idfacturacion_facturacion || null))
         ),
         planillas: this.liquidafacService.getByIdfacturacion(mov.idfacturacion).pipe(
            catchError(() => of([]))
         )
      }).subscribe({
         next: ({ facturacion, planillas }: any) => {
            const detalleFacturacion = facturacion || mov.facturacionRaw || mov.idfacturacion_facturacion || {};
            this.detalleSeleccionado = {
               ...mov,
               descripcionFacturacion: detalleFacturacion?.descripcion || mov.descripcionFacturacion || 'Sin descripcion',
               cliente: this.resolveClienteNombre(detalleFacturacion, mov),
               cedula: this.resolveClienteCedula(detalleFacturacion, mov),
               totalFacturacion: Number(detalleFacturacion?.total ?? mov.totalFacturacion ?? 0),
               cuotas: Number(detalleFacturacion?.cuotas ?? mov.cuotas ?? 0),
               formapago: detalleFacturacion?.formapago ?? mov.formapago ?? null,
               facturacionRaw: detalleFacturacion
            };

            const facturas = Array.isArray(planillas) ? planillas : [];
            this.facturasDetalle = facturas.map((liq: any) => {
               const factura = liq?.idfactura_facturas || {};
               const pagado = this.isFacturaPagada(factura);
               return {
                  cuota: liq?.cuota,
                  idfactura: factura?.idfactura,
                  nrofactura: factura?.nrofactura,
                  feccrea: factura?.feccrea,
                  fechacobro: factura?.fechacobro,
                  valor: Number(liq?.valor ?? factura?.totaltarifa ?? 0),
                  pagado,
                  estado: Number(factura?.estado || 0),
                  factura
               };
            });

            this.cargandoDetalle = false;
         },
         error: err => {
            console.error(err);
            this.errorDetalle = 'No se pudo cargar el detalle de la facturacion seleccionada.';
            this.cargandoDetalle = false;
         }
      });
   }

   refreshPagination() {
      const totalItems = this._movxproducto.length;
      this.totalPages = Math.max(1, Math.ceil(totalItems / this.pageSize));

      if (this.currentPage > this.totalPages) {
         this.currentPage = this.totalPages;
      }

      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      this.movimientosPaginados = this._movxproducto.slice(start, end);
   }

   changePage(page: number) {
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

   get totalMovimientos(): number {
      return this._movxproducto.length;
   }

   get totalFacturasGeneradas(): number {
      return this.facturasDetalle.length;
   }

   get facturasPagadas(): number {
      return this.facturasDetalle.filter(factura => !!factura.pagado).length;
   }

   get facturasPendientes(): number {
      return this.facturasDetalle.filter(factura => !factura.pagado).length;
   }

   get totalFacturasDetalle(): number {
      return this.facturasDetalle.reduce((total, factura) => total + Number(factura.valor || 0), 0);
   }

   getEstadoPagoTexto(mov: MovimientoProductoView): string {
      return mov.pagado ? 'Pagada' : 'Pendiente';
   }

   getEstadoPagoClase(mov: MovimientoProductoView): string {
      return mov.pagado ? 'estado-badge estado-pagada' : 'estado-badge estado-pendiente';
   }

   getFacturaEstadoTexto(factura: any): string {
      return factura?.pagado ? 'Pagada' : 'Pendiente';
   }

   getFacturaEstadoClase(factura: any): string {
      return factura?.pagado ? 'estado-badge estado-pagada' : 'estado-badge estado-pendiente';
   }

   abrirDetalleFactura(idfactura: number | null | undefined) {
      if (!idfactura) {
         return;
      }
      sessionStorage.setItem('idfacturaToInfo', idfactura.toString());
   }

   regresar() { this.router.navigate(['/catalogoitems']); }

   modiProducto() {
      sessionStorage.setItem('idproductoToModi', this.idcatalogoitems.toString());
      this.router.navigate(['/modi-catalogoitems']);
   }

   private mapMovimiento(mov: any): MovimientoProductoView {
      const facturacion = mov?.idfacturacion_facturacion || {};
      const cliente = facturacion?.idcliente_clientes || {};
      const facturas = Array.isArray(facturacion?.liquidafac) ? facturacion.liquidafac : [];
      const pagadas = facturas.filter((liq: any) => this.isFacturaPagada(liq?.idfactura_facturas)).length;
      const pendientes = facturas.filter((liq: any) => !this.isFacturaPagada(liq?.idfactura_facturas)).length;

      return {
         ...mov,
         idfacturacion: Number(facturacion?.idfacturacion || 0),
         descripcionFacturacion: facturacion?.descripcion || 'Sin descripcion',
         fecha: facturacion?.feccrea || null,
         cliente: cliente?.nombre || 'No definido',
         cedula: cliente?.cedula || 'No registrada',
         cantidad: Number(mov?.cantidad || 0),
         valorunitario: Number(mov?.valorunitario || 0),
         total: Number(mov?.cantidad || 0) * Number(mov?.valorunitario || 0),
         pagado: pendientes === 0 && pagadas > 0,
         totalFacturas: facturas.length,
         facturasPagadas: pagadas,
         facturasPendientes: pendientes,
         cuotas: Number(facturacion?.cuotas || facturas.length || 0),
         totalFacturacion: Number(facturacion?.total || 0),
         formapago: facturacion?.formapago ?? null,
         facturacionRaw: facturacion
      };
   }

   private completarEstadoMovimiento(mov: MovimientoProductoView, liquidaciones: any[]): MovimientoProductoView {
      const facturas = Array.isArray(liquidaciones) ? liquidaciones : [];
      if (!facturas.length) {
         return mov;
      }

      const pagadas = facturas.filter((liq: any) => this.isFacturaPagada(liq?.idfactura_facturas)).length;
      const pendientes = facturas.filter((liq: any) => !this.isFacturaPagada(liq?.idfactura_facturas)).length;

      return {
         ...mov,
         pagado: pendientes === 0 && pagadas > 0,
         totalFacturas: facturas.length,
         facturasPagadas: pagadas,
         facturasPendientes: pendientes,
         cuotas: Number(mov?.cuotas || facturas.length || 0)
      };
   }

   private resolveClienteNombre(facturacion: any, mov: MovimientoProductoView): string {
      return (
         facturacion?.idcliente_clientes?.nombre ||
         facturacion?.nomcli ||
         mov?.cliente ||
         'No definido'
      );
   }

   private resolveClienteCedula(facturacion: any, mov: MovimientoProductoView): string {
      return (
         facturacion?.idcliente_clientes?.cedula ||
         facturacion?.cedula ||
         mov?.cedula ||
         'No registrada'
      );
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
}

interface CatalogoitemsView {
   idcatalogoitems: number;
   descripcion: String;
   nommodulo: String;
   uso: String;
   usoCodigo: number | null;
   rubro: String;
   rubroCodigo: number | null;
}

interface MovimientoProductoView {
   idfacturacion_facturacion?: any;
   facturacionRaw?: any;
   idfacturacion: number;
   descripcionFacturacion: string;
   fecha: Date | string | null;
   cliente: string;
   cedula: string;
   cantidad: number;
   valorunitario: number;
   total: number;
   pagado: boolean;
   totalFacturas: number;
   facturasPagadas: number;
   facturasPendientes: number;
   cuotas: number;
   totalFacturacion: number;
   formapago: number | null;
}
