import { formatDate } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { Aguatramite } from 'src/app/modelos/aguatramite.model';
import { Clientes } from 'src/app/modelos/clientes';
import { AguatramiteService } from 'src/app/servicios/aguatramite.service';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { TipoTramiteService } from 'src/app/servicios/tipo-tramite.service';
import { TramiteNuevoService } from 'src/app/servicios/tramite-nuevo.service';
import { TramitesAguaService } from 'src/app/servicios/tramites-agua.service';

@Component({
   selector: 'app-aguatramite',
   templateUrl: 'aguatramite.component.html',
   styleUrls: ['aguatramite.component.css'],
})

export class AguatramiteComponent implements OnInit {
   private readonly sortStorageKey = 'aguatramite-sort';

   f_aguatramite: FormGroup;
   f_Tipotramite: FormGroup;
   formBuscar: FormGroup;
   optImprimir: FormGroup;
   _aguatramite: any;
   aguatramites: any;
   filterTerm: string;
   totalElements = 0;
   totalPages = 0;
   currentPage = 0;
   pageSize = 10;
   sortColumn: string = 'feccrea';
   sortDirection: 'asc' | 'desc' = 'desc';
   l_tipotramite: any;  //Solo 1,2,4,5,9 y cambio responsable de pago
   btnSelectTpTramite: boolean = false;
   estados: any = [
      { valor: 1, estado: 'Recien ingresado' },
      { valor: 2, estado: 'Inspeccionando' },
      { valor: 3, estado: 'Aprobado' },
      { valor: 4, estado: 'Notificado' },
      { valor: 5, estado: 'Contrato generado' },
      { valor: 6, estado: 'Negado' },
      { valor: 0, estado: 'Eliminado' },
   ];
   optAcciones: boolean;
   formulario: boolean = true
   size = "md"
   today: Date = new Date();
   pdfViewerSrc: SafeResourceUrl | null = null;
   private pdfObjectUrl: string | null = null;
   private clientesCache = new Map<number, Clientes>();

   constructor(private router: Router, private fb: FormBuilder, private aguatramiService: AguatramiteService,
      private tipotramiService: TipoTramiteService, private tramitenuevoService: TramiteNuevoService,
      private s_genpdf: TramitesAguaService,
      private sanitizer: DomSanitizer,
      private s_loading: LoadingService,
      private clientesService: ClientesService
   ) { }

   ngOnInit(): void {
      this.restaurarOrdenGuardado();
      this.f_Tipotramite = this.fb.group({
         idtitpotramite: 1,
      });

      this.formBuscar = this.fb.group({
         idtipotramite_tipotramite: 1,
         estado: 1,
         cliente: '',
         fechaDesde: this.getInicioAnioActual(),
         fechaHasta: formatDate(this.today, 'yyyy-MM-dd', 'en-US'),
      });
      this.optImprimir = this.fb.group({
         opt: 0,
         desde: this.today,
         hasta: this.today
      })
      this.listartipotramite();
      this.listarByTipoTramite();
      this.setcolor();
      this.actualizarEstadoControl();
      this.optImprimir.patchValue({
         desde: formatDate(this.today, 'yyyy-MM-dd', 'en-US'),
         hasta: formatDate(this.today, 'yyyy-MM-dd', 'en-US')
      })

   }

   setcolor() {
      let colores: string[];
      let coloresJSON = sessionStorage.getItem('/aguatramite');
      if (!coloresJSON) {
         colores = ['rgb(144, 123, 5)', 'rgb(249, 249, 175)'];
         const coloresJSON = JSON.stringify(colores);
         sessionStorage.setItem('/aguatramite', coloresJSON);
      } else colores = JSON.parse(coloresJSON);

      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1');
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   listartipotramite() {
      this.tipotramiService.getListaTipoTramite().subscribe({
         next: (datos: any) => {
            let tipTramite: any = [];
            datos.forEach((dato: any) => {
               if (
                  dato.idtipotramite === 1 ||
                  dato.idtipotramite === 2 ||
                  dato.idtipotramite === 4 ||
                  dato.idtipotramite === 5 ||
                  dato.idtipotramite === 9 ||
                  dato.idtipotramite === 10 ||
                  `${dato.descripcion || ''}`.toLowerCase().includes('responsable de pago')
               ) {
                  tipTramite.push(dato);
               }
            });
            this.l_tipotramite = tipTramite;
         },
         error: (e) => console.error(e),
      });
   }

   listarByTipoTramite() {
      this.currentPage = 0;
      this.buscarPagina();
   }

   buscarPagina(page: number = this.currentPage) {
      const idTipo = +this.formBuscar.value.idtipotramite_tipotramite!;
      const estadoConsulta = this.debeFiltrarPorEstado() ? +this.formBuscar.value.estado! : 3;
      this.optAcciones = idTipo === 1;
      this.currentPage = page;

      if (!this.debeFiltrarPorEstado()) {
         this.formBuscar.patchValue({ estado: 3 }, { emitEvent: false });
      }

      this.aguatramiService.buscarPageable({
         idtipotramite: idTipo,
         estado: estadoConsulta,
         cliente: this.formBuscar.value.cliente || null,
         fechaDesde: this.formBuscar.value.fechaDesde || null,
         fechaHasta: this.formBuscar.value.fechaHasta || null,
         page: this.currentPage,
         size: this.pageSize,
      }).subscribe({
         next: (datos: any) => {
            this._aguatramite = datos?.content || [];
            this.completarClientesFaltantes(this._aguatramite);
            this.totalElements = datos?.totalElements || 0;
            this.totalPages = datos?.totalPages || 0;
            this.aplicarOrdenActual();
         },
         error: (e) => console.error(e),
      });
   }

   onTipoTramiteChange(): void {
      this.actualizarEstadoControl();
   }

   debeFiltrarPorEstado(): boolean {
      return +this.formBuscar?.value?.idtipotramite_tipotramite === 1;
   }

   private actualizarEstadoControl(): void {
      const estadoControl = this.formBuscar?.get('estado');
      if (!estadoControl) {
         return;
      }

      if (this.debeFiltrarPorEstado()) {
         estadoControl.enable({ emitEvent: false });
         return;
      }

      estadoControl.setValue(3, { emitEvent: false });
      estadoControl.disable({ emitEvent: false });
   }

   cambiarPagina(delta: number): void {
      const nuevaPagina = this.currentPage + delta;
      if (nuevaPagina < 0 || nuevaPagina >= this.totalPages) return;
      this.buscarPagina(nuevaPagina);
   }

   irPagina(page: number): void {
      if (page < 0 || page >= this.totalPages || page === this.currentPage) return;
      this.buscarPagina(page);
   }

   cambiarTamanoPagina(size: number | string): void {
      this.pageSize = Number(size) || 10;
      this.currentPage = 0;
      this.buscarPagina(0);
   }

   get paginasVisibles(): number[] {
      if (!this.totalPages || this.totalPages <= 0) return [0];

      const maxBotones = 5;
      let inicio = Math.max(this.currentPage - 2, 0);
      let fin = Math.min(inicio + maxBotones - 1, this.totalPages - 1);

      if (fin - inicio + 1 < maxBotones) {
         inicio = Math.max(fin - maxBotones + 1, 0);
      }

      const paginas: number[] = [];
      for (let i = inicio; i <= fin; i++) {
         paginas.push(i);
      }
      return paginas;
   }

   limpiarFiltrosBusqueda(): void {
      this.formBuscar.patchValue({
         cliente: '',
         fechaDesde: this.getInicioAnioActual(),
         fechaHasta: formatDate(this.today, 'yyyy-MM-dd', 'en-US')
      });
      this.listarByTipoTramite();
   }

   getInicioAnioActual(): string {
      return `${this.today.getFullYear()}-01-01`;
   }

   toggleSort(column: string): void {
      if (this.sortColumn === column) {
         this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
         this.sortColumn = column;
         this.sortDirection = column === 'feccrea' ? 'desc' : 'asc';
      }
      this.guardarOrdenActual();
      this.aplicarOrdenActual();
   }

   getSortIcon(column: string): string {
      if (this.sortColumn !== column) {
         return 'fa-sort text-muted';
      }
      return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
   }

   private aplicarOrdenActual(): void {
      if (!Array.isArray(this._aguatramite) || this._aguatramite.length === 0) {
         return;
      }

      const direction = this.sortDirection === 'asc' ? 1 : -1;
      this._aguatramite = [...this._aguatramite].sort((a: any, b: any) =>
         this.compararValores(this.obtenerValorOrden(a, this.sortColumn), this.obtenerValorOrden(b, this.sortColumn)) * direction
      );
   }

   private obtenerValorOrden(item: any, column: string): any {
      switch (column) {
         case 'cliente':
            return this.getNombreClienteVisible(item);
         case 'cuenta':
            return this.getCuentaTramite(item);
         case 'feccrea':
            return item?.feccrea ?? '';
         case 'estado':
            return this.setEstado(item?.estado ?? 0);
         case 'observacion':
            return item?.observacion ?? '';
         default:
            return item?.[column] ?? '';
      }
   }

   private compararValores(a: any, b: any): number {
      const valorA = this.normalizarValorOrden(a);
      const valorB = this.normalizarValorOrden(b);

      if (valorA < valorB) return -1;
      if (valorA > valorB) return 1;
      return 0;
   }

   private normalizarValorOrden(valor: any): any {
      if (valor === null || valor === undefined) {
         return '';
      }

      if (typeof valor === 'number') {
         return valor;
      }

      const fecha = new Date(valor);
      if (!Number.isNaN(fecha.getTime()) && `${valor}`.includes('-')) {
         return fecha.getTime();
      }

      const numero = Number(valor);
      if (!Number.isNaN(numero) && `${valor}`.trim() !== '') {
         return numero;
      }

      return `${valor}`.toLowerCase();
   }

   private guardarOrdenActual(): void {
      sessionStorage.setItem(this.sortStorageKey, JSON.stringify({
         column: this.sortColumn,
         direction: this.sortDirection,
      }));
   }

   private restaurarOrdenGuardado(): void {
      const saved = sessionStorage.getItem(this.sortStorageKey);
      if (!saved) {
         return;
      }

      try {
         const parsed = JSON.parse(saved);
         if (parsed?.column) {
            this.sortColumn = parsed.column;
         }
         if (parsed?.direction === 'asc' || parsed?.direction === 'desc') {
            this.sortDirection = parsed.direction;
         }
      } catch {
         sessionStorage.removeItem(this.sortStorageKey);
      }
   }

   listarTramiteNuevo() {
      this.tramitenuevoService.getListaTramiteNuevo().subscribe({
         next: (datos) => this._aguatramite = datos,
         error: (e) => console.error(e),
      });
   }
   optFechas() {
      return +this.optImprimir.value.opt! === 1;
   }
   async genPdf() {
      let opt = +this.optImprimir.value.opt!
      switch (opt) {
         case 0:
            await this.repGeneralByEstado()
            break;
         case 1:
            await this.repTotalPorFecha();
            break;
      }
   }
   async repGeneralByEstado() {
      this.s_loading.showLoading();
      try {
         const tramites = await this.obtenerTramitesFiltradosParaImpresion();
         this.mostrarPdfEnModal(
            this.s_genpdf.listaTramitesAguaFiltrados(tramites, 'Trámites de agua filtrados')
         );
      } catch (error) {
         console.error(error);
      } finally {
         this.s_loading.hideLoading();
      }
   }

   async repTotalPorFecha() {
      this.s_loading.showLoading();
      try {
         const tramites = await this.obtenerTramitesPorFechaParaImpresion();
         const desde = this.optImprimir.value.desde || '';
         const hasta = this.optImprimir.value.hasta || '';
         this.mostrarPdfEnModal(
            this.s_genpdf.listaTramitesAguaFiltrados(
               tramites,
               `Trámites de agua por fecha ${desde} - ${hasta}`
            )
         );
      } catch (error) {
         console.error(error);
      } finally {
         this.s_loading.hideLoading();
      }
   }

   addAguaTramite() {
      this.router.navigate(['forms-aguatramite', +this.f_Tipotramite.value.idtitpotramite!,]);
   }

   modificarAguaTramite(aguatramite: Aguatramite) {
      localStorage.setItem('idaguatramite', aguatramite.idaguatramite.toString());
      this.router.navigate(['/modificar-aguatramite']);
   }

   async reimprimirComprobante(aguatramite: any): Promise<void> {
      await this.s_genpdf.genComprobanteTramite(aguatramite);
   }

   puedeReimprimir(aguatramite: any): boolean {
      return +aguatramite?.idtipotramite_tipotramite?.idtipotramite !== 1;
   }

   eliminarAguaTramite(idaguatramite: number) {
      localStorage.setItem('idAguaTramiteToDelete', idaguatramite.toString());
   }

   infoNuevoTramite(aguatramite: any) {
      this.tramitenuevoService.getByIdAguaTramite(aguatramite.idaguatramite).subscribe({
         next: (datos: any) => {
            if (datos.length != 0) this.router.navigate(['info-aguatramite', datos[0].idtramitenuevo]);
         },
         error: (e) => console.error(e),
      });
   }

   setEstado(i_estado: number) {
      let est = this.estados.find(
         (estado: { valor: number }) => estado.valor === i_estado
      );
      return est.estado;
   }

   getNombreClienteTramite(aguatramite: any): string {
      console.log('Obteniendo nombre cliente para trámite:', aguatramite);
      const candidato =
         aguatramite?.idcliente_clientes ||
         aguatramite?.cliente ||
         aguatramite?.abonado?.idcliente_clientes ||
         aguatramite?.idabonado_abonados?.idcliente_clientes ||
         aguatramite?.idaguatramite_aguatramite?.idcliente_clientes ||
         aguatramite?.idtramitenuevo_tramitenuevo?.idaguatramite_aguatramite?.idcliente_clientes ||
         null;

      return (
         candidato?.nombre ||
         candidato?.nombres ||
         candidato?.razonsocial ||
         aguatramite?.nombre ||
         aguatramite?.nombres ||
         aguatramite?.razonsocial ||
         ''
      );
   }

   getCuentaTramite(aguatramite: any): string {
      const cuenta =
         aguatramite?.idabonado ??
         aguatramite?.idabonado_abonados?.idabonado ??
         aguatramite?.abonado?.idabonado ??
         aguatramite?.idtramitenuevo_tramitenuevo?.idaguatramite_aguatramite?.idabonado ??
         aguatramite?.idaguatramite_aguatramite?.idabonado ??
         aguatramite?.cuenta ??
         aguatramite?.codmedidor ??
         '';

      return `${cuenta}`;
   }

   getNombreClienteVisible(aguatramite: any): string {
      const candidato = this.obtenerClienteDesdeTramite(aguatramite);

      return (
         candidato?.nombre ||
         candidato?.nombres ||
         candidato?.razonsocial ||
         aguatramite?.nombre ||
         aguatramite?.nombres ||
         aguatramite?.razonsocial ||
         ''
      );
   }

   private completarClientesFaltantes(tramites: any[]): void {
      if (!Array.isArray(tramites) || tramites.length === 0) {
         return;
      }

      tramites.forEach((tramite: any) => {
         const nombre = this.getNombreClienteVisible(tramite);
         if (nombre) {
            return;
         }

         const idcliente = this.obtenerIdClienteDesdeTramite(tramite);
         if (!idcliente) {
            return;
         }

         const clienteCacheado = this.clientesCache.get(idcliente);
         if (clienteCacheado) {
            this.asignarClienteATramite(tramite, clienteCacheado);
            return;
         }

         this.clientesService.getListaById(idcliente).subscribe({
            next: (datos: any) => {
               const clienteCompleto = Array.isArray(datos) ? datos?.[0] : datos;
               if (!clienteCompleto) {
                  return;
               }

               this.clientesCache.set(idcliente, clienteCompleto);
               this.asignarClienteATramite(tramite, clienteCompleto);
            },
            error: (e) => console.error(`No se pudo cargar el cliente ${idcliente}`, e),
         });
      });
   }

   private obtenerClienteDesdeTramite(aguatramite: any): any {
      const clienteDirecto = aguatramite?.idcliente_clientes;
      if (clienteDirecto && typeof clienteDirecto === 'object') {
         return clienteDirecto;
      }

      const candidato =
         aguatramite?.cliente ||
         aguatramite?.idcliente ||
         aguatramite?.abonado?.idcliente_clientes ||
         aguatramite?.idabonado_abonados?.idcliente_clientes ||
         aguatramite?.idaguatramite_aguatramite?.idcliente_clientes ||
         aguatramite?.idtramitenuevo_tramitenuevo?.idaguatramite_aguatramite?.idcliente_clientes ||
         null;

      return typeof candidato === 'object' ? candidato : null;
   }

   private obtenerIdClienteDesdeTramite(aguatramite: any): number | null {
      const candidato =
         this.obtenerClienteDesdeTramite(aguatramite)?.idcliente ??
         aguatramite?.idcliente_clientes?.idcliente ??
         aguatramite?.idcliente_clientes ??
         aguatramite?.idcliente?.idcliente ??
         aguatramite?.idcliente ??
         aguatramite?.cliente?.idcliente ??
         aguatramite?.abonado?.idcliente_clientes?.idcliente ??
         aguatramite?.idabonado_abonados?.idcliente_clientes?.idcliente ??
         aguatramite?.idaguatramite_aguatramite?.idcliente_clientes?.idcliente ??
         aguatramite?.idtramitenuevo_tramitenuevo?.idaguatramite_aguatramite?.idcliente_clientes?.idcliente;

      const idcliente = Number(candidato);
      return Number.isFinite(idcliente) && idcliente > 0 ? idcliente : null;
   }

   private asignarClienteATramite(aguatramite: any, cliente: Clientes): void {
      if (!aguatramite || !cliente) {
         return;
      }

      if (aguatramite?.idcliente_clientes && typeof aguatramite.idcliente_clientes === 'object') {
         aguatramite.idcliente_clientes = {
            ...aguatramite.idcliente_clientes,
            ...cliente,
         };
         return;
      }

      aguatramite.idcliente_clientes = cliente;
   }

   private async obtenerTramitesFiltradosParaImpresion(): Promise<any[]> {
      const idTipo = +this.formBuscar.value.idtipotramite_tipotramite!;
      const estadoConsulta = this.debeFiltrarPorEstado() ? +this.formBuscar.value.estado! : 3;
      const size = Math.max(this.totalElements || 0, this.pageSize, 100);
      const respuesta: any = await firstValueFrom(
         this.aguatramiService.buscarPageable({
            idtipotramite: idTipo,
            estado: estadoConsulta,
            cliente: this.formBuscar.value.cliente || null,
            fechaDesde: this.formBuscar.value.fechaDesde || null,
            fechaHasta: this.formBuscar.value.fechaHasta || null,
            page: 0,
            size,
         })
      );

      const registros = Array.isArray(respuesta?.content) ? respuesta.content : [];
      const ordenados = [...registros].sort((a: any, b: any) =>
         this.compararValores(this.obtenerValorOrden(a, this.sortColumn), this.obtenerValorOrden(b, this.sortColumn)) *
         (this.sortDirection === 'asc' ? 1 : -1)
      );

      return this.aplicarFiltroRapido(ordenados, this.filterTerm);
   }

   private async obtenerTramitesPorFechaParaImpresion(): Promise<any[]> {
      const idTipo = +this.formBuscar.value.idtipotramite_tipotramite!;
      const estadoConsulta = this.debeFiltrarPorEstado() ? +this.formBuscar.value.estado! : 3;
      const size = Math.max(this.totalElements || 0, this.pageSize, 1000);
      const respuesta: any = await firstValueFrom(
         this.aguatramiService.buscarPageable({
            idtipotramite: idTipo,
            estado: estadoConsulta,
            cliente: null,
            fechaDesde: this.optImprimir.value.desde || null,
            fechaHasta: this.optImprimir.value.hasta || null,
            page: 0,
            size,
         })
      );

      const registros = Array.isArray(respuesta?.content) ? respuesta.content : [];
      return [...registros].sort((a: any, b: any) =>
         this.compararValores(this.obtenerValorOrden(a, this.sortColumn), this.obtenerValorOrden(b, this.sortColumn)) *
         (this.sortDirection === 'asc' ? 1 : -1)
      );
   }

   private mostrarPdfEnModal(blob: Blob): void {
      if (this.pdfObjectUrl) {
         URL.revokeObjectURL(this.pdfObjectUrl);
      }

      this.pdfObjectUrl = URL.createObjectURL(blob);
      this.pdfViewerSrc = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfObjectUrl);
      this.size = 'lg';
      this.formulario = false;
   }

   private aplicarFiltroRapido(registros: any[], termino: string): any[] {
      const filtro = `${termino || ''}`.trim().toLowerCase();
      if (!filtro) {
         return registros;
      }

      return registros.filter((item: any) => {
         const valores = [
            this.getNombreClienteTramite(item),
            this.getCuentaTramite(item),
            item?.feccrea ? formatDate(item.feccrea, 'dd-MM-y', 'en-US') : '',
            this.setEstado(item?.estado),
            item?.observacion,
         ];

         return valores.some((valor) => `${valor || ''}`.toLowerCase().includes(filtro));
      });
   }

}
