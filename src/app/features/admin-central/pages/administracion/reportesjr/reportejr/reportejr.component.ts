import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from '@compartida/autoriza.service';
import { ColoresService } from '@compartida/colores.service';
import { Eliminadosapp } from '@modelos/administracion/eliminadosapp.model';
import { Reportesjr } from '@modelos/administracion/reportesjr.model';
import { EliminadosappService } from '@servicios/administracion/eliminadosapp.service';
import { ReportesjrService } from '@servicios/administracion/reportesjr.service';
import { RepoxopcionService } from '@servicios/administracion/repoxopcion.service';
import Swal from 'sweetalert2';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-reportejr',
  templateUrl: './reportejr.component.html',
  styleUrls: ['./reportejr.component.css']
})
export class ReportesjrComponent implements OnInit, OnDestroy {

  reporteVisualizado: Reportesjr | null = null;
  parametrosVisualizados: ParametroVisual[] = [];
  formVistaPrevia: FormGroup = new FormGroup({});
  cargandoDetalle = false;
  generandoVista = false;
  errorVista = '';
  pdfSeguro: SafeResourceUrl | null = null;
  private pdfUrl: string | null = null;
  private detalleSub?: Subscription;
  private vistaSub?: Subscription;
  private focoAnterior: HTMLElement | null = null;
  private overflowAnterior = '';

  formBuscar!: FormGroup;
  swbuscando?: boolean;
  txtbuscar: string = 'Buscar';
  repoxopcion: any[] = [];
  reportesjr: any[] = [];
  suminicial = 0;
  sumreforma = 0;
  sumcodificado = 0;
  sweliminar: boolean = false;
  repojrFiltrados: Reportesjr[] = [];
  ordenColumna: keyof ReportesjrVisual = 'codigo';
  ordenAscendente: boolean = true;
  totalParametros: number[] = [];
  ultIdSelec: number = -1;

  constructor(public fb: FormBuilder, private router: Router, public authService: AutorizaService,
    private coloresService: ColoresService, private repoxopService: RepoxopcionService,
    private repojrService: ReportesjrService, private elimService: EliminadosappService, private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    if (!this.authService.sessionlog) { this.router.navigate(['/inicio']); }
    sessionStorage.setItem('ventana', '/reportesjr');
    let coloresJSON = sessionStorage.getItem('/reportesjr');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    //Campos guardados o ''
    this.ultIdSelec = sessionStorage.getItem('ultidreporte') ? Number(sessionStorage.getItem('ultidreporte')) : 0;
    // console.log('ultIdSelec en ngOnInit Reportesjr:', this.ultIdSelec);
    let swbuscar: boolean;
    let codigo: string; let nomrep: string;; let desrep: string;
    const buscarReportesjrJSON = sessionStorage.getItem('buscarReportesjr');
    if (buscarReportesjrJSON) {
      swbuscar = true;
      const buscarReportesjr = JSON.parse(buscarReportesjrJSON);
      codigo = buscarReportesjr.codigo;
      nomrep = buscarReportesjr.nomrep;
      desrep = buscarReportesjr.desrep;
    } else {
      swbuscar = false;
      codigo = '';
      nomrep = '';
      desrep = '';
    }

    this.formBuscar = this.fb.group({
      repoxopcion: codigo,
      nomrep: nomrep,
      desrep: desrep,
      filtroControl: '',
    });

    this.formBuscar.get('filtroControl')?.valueChanges.subscribe((valor: any) => { this.filtrar(valor) });
    if (swbuscar) this.buscar();
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1')
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(this.authService.idusuario!, 'reportesjr');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/reportesjr', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  //Datalist de las opciones (repoxopcion)
  datalistRepoxopcion(e: any) {
    if (e.target.value != '') {
      this.repoxopService.datalist(e.target.value).subscribe({
        next: datos => this.repoxopcion = datos,
        error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar Repoxopcion', err.error); },
      });
    }
  }

  buscar(): void {
    this.swbuscando = true;
    this.txtbuscar = 'Buscando';
    this.formBuscar.get('filtroControl')?.setValue('');
    let codigo = this.formBuscar.value.repoxopcion;
    let nomrep = this.formBuscar.value.nomrep;
    let desrep = this.formBuscar.value.desrep;
    this.repojrService.getByOpcionNomrepyDesrep(codigo, nomrep, desrep).subscribe({
      next: (reportesjr: Reportesjr[]) => {
        this.reportesjr = reportesjr;
        this.calcCantidadPorRegistro()
        this.repojrFiltrados = [...reportesjr];
        //Guarda los campos de búsqueda
        const buscarReportesjr = {
          codigo: this.formBuscar.value.repoxopcion,
          nomrep: this.formBuscar.value.nomrep,
          desrep: this.formBuscar.value.desrep,
        };
        // Verifica si hay al menos un campo con valor para guardar en session
        const camposBusca = Object.values(buscarReportesjr)
          .some(valor => valor !== null && valor !== undefined && valor.toString().trim() !== '');
        if (camposBusca) sessionStorage.setItem('buscarReportesjr', JSON.stringify(buscarReportesjr));
        else sessionStorage.removeItem('buscarReportesjr');
        this.swbuscando = false;
        this.txtbuscar = 'Buscar';
      },
      error: err => {
        console.error('Error al buscar las Opciones:', err.error)
        this.swbuscando = false;
        this.txtbuscar = 'Buscar';
        this.authService.mostrarError('Error al buscar las Opciones', err.error);
      }
    });
  }

  parametrosDe(reporte: Reportesjr): ParametroVisual[] {
    try {
      const raw = typeof reporte.parametros === 'string' ? JSON.parse(reporte.parametros) : reporte.parametros;
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
      return Object.entries(raw).map(([nombre, valor]) => {
        const [tipo, ancho = '12', orden = '999'] = String(valor).split('|');
        const entrada = ['java.util.Date', 'java.sql.Date'].includes(tipo) ? 'date'
          : tipo === 'java.sql.Timestamp' ? 'datetime-local'
          : /^java\.lang\.(Integer|Long|Short|Double|Float)$/.test(tipo) || tipo === 'java.math.BigDecimal' ? 'number'
          : tipo === 'java.lang.Boolean' ? 'boolean' : 'text';
        const editable = entrada !== 'text' || tipo === 'java.lang.String';
        return { nombre, tipo, ancho: Number(ancho) || 12, orden: Number(orden) || 999, entrada, editable };
      }).sort((a, b) => a.orden - b.orden);
    } catch { return []; }
  }

  calcCantidadPorRegistro(): void {
    this.totalParametros = this.reportesjr.map(reporte => this.parametrosDe(reporte).length);
  }

  visualizar(reporte: Reportesjr): void {
    this.cerrarVisualizacion();
    this.focoAnterior = document.activeElement as HTMLElement;
    this.overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.reporteVisualizado = reporte;
    this.cargandoDetalle = true;
    this.detalleSub = this.repojrService.getById(reporte.idreporte!).subscribe({
      next: detalle => {
        this.reporteVisualizado = detalle;
        this.parametrosVisualizados = this.parametrosDe(detalle);
        const campos: Record<string, any> = {};
        this.parametrosVisualizados.filter(p => p.editable).forEach(p => {
          const entero = /^java\.lang\.(Integer|Long|Short)$/.test(p.tipo);
          campos[p.nombre] = [p.nombre === 'idusuario' ? this.authService.idusuario : '',
            entero ? Validators.pattern(/^-?\d+$/) : []];
        });
        this.formVistaPrevia = this.fb.group(campos);
        this.cargandoDetalle = false;
      },
      error: () => {
        this.cargandoDetalle = false;
        this.errorVista = 'No se pudieron cargar los datos del reporte. Cierra la ventana e intenta nuevamente.';
      }
    });
    setTimeout(() => document.getElementById('cerrarDetalleReporte')?.focus());
  }

  generarVistaPrevia(): void {
    if (!this.reporteVisualizado || this.reporteVisualizado.metodo !== 1 || this.formVistaPrevia.invalid
      || this.cargandoDetalle || this.generandoVista) return;
    this.vistaSub?.unsubscribe();
    this.liberarPdf();
    this.errorVista = '';
    this.generandoVista = true;
    const parameters = this.parametrosVisualizados.filter(p => p.editable).map(p => {
      let value = this.formVistaPrevia.get(p.nombre)?.value;
      if (p.tipo === 'java.sql.Timestamp' && value) value = value.replace('T', ' ') + (value.length === 16 ? ':00' : '');
      return { name: p.nombre, type: p.tipo, value };
    }).filter(p => p.value !== '' && p.value !== null && p.value !== undefined);
    this.vistaSub = this.repojrService.ejecutaReporteSQL({
      reportName: this.reporteVisualizado.nomrep, parameters, extension: 'pdf'
    }).subscribe({
      next: blob => {
        this.pdfUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        this.pdfSeguro = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfUrl);
        this.generandoVista = false;
      },
      error: () => {
        this.generandoVista = false;
        this.errorVista = 'No se pudo generar el PDF. Revisa los parámetros y la disponibilidad de los datos del reporte.';
      }
    });
  }

  private liberarPdf(): void {
    if (this.pdfUrl) URL.revokeObjectURL(this.pdfUrl);
    this.pdfUrl = null;
    this.pdfSeguro = null;
  }

  cerrarVisualizacion(): void {
    this.detalleSub?.unsubscribe();
    this.vistaSub?.unsubscribe();
    this.liberarPdf();
    if (this.reporteVisualizado) document.body.style.overflow = this.overflowAnterior;
    this.reporteVisualizado = null;
    this.parametrosVisualizados = [];
    this.errorVista = '';
    this.generandoVista = false;
    this.cargandoDetalle = false;
    this.focoAnterior?.focus();
    this.focoAnterior = null;
  }

  @HostListener('document:keydown', ['$event'])
  tecladoModal(event: KeyboardEvent): void {
    if (!this.reporteVisualizado) return;
    if (event.key === 'Escape') { event.preventDefault(); this.cerrarVisualizacion(); }
    if (event.key === 'Tab') {
      const controles = Array.from(document.querySelectorAll<HTMLElement>(
        '#detalleReporteDialog button:not([disabled]), #detalleReporteDialog input, #detalleReporteDialog select'));
      const primero = controles[0], ultimo = controles[controles.length - 1];
      if (event.shiftKey && document.activeElement === primero) { event.preventDefault(); ultimo?.focus(); }
      else if (!event.shiftKey && document.activeElement === ultimo) { event.preventDefault(); primero?.focus(); }
    }
  }

  ngOnDestroy(): void { this.cerrarVisualizacion(); }

  filtrar(valor: any): void {
    const filtro = String(valor || '').toLowerCase();
    if (!filtro) {
      this.repojrFiltrados = [...this.reportesjr];
      return;
    }
    this.repojrFiltrados = this.reportesjr.filter(a => {
      return [a.repoxopcion?.codigo, a.repoxopcion?.opcion, a.repoxopcion?.nombre, a.nomrep, a.desrep].some(campo =>
        String(campo).toLowerCase().includes(filtro)
      );
    });
  }

  ordenarPor(campo: keyof ReportesjrVisual): void {
    if (this.ordenColumna === campo) {
      this.ordenAscendente = !this.ordenAscendente;
    } else {
      this.ordenColumna = campo;
      this.ordenAscendente = true;
    }

    this.repojrFiltrados.sort((a: any, b: any) => {
      let valorA: any;
      let valorB: any;
      switch (campo) {
        case 'codigo':
          valorA = `${a.repoxopcion?.codigo}`;
          valorB = `${b.repoxopcion?.codigo}`;
          break;
        case 'opcion':
          valorA = a.repoxopcion?.opcion;
          valorB = b.repoxopcion?.opcion;
          break;
        default:
          valorA = a[campo];
          valorB = b[campo];
          break;
      }
      if (valorA == null && valorB == null) return 0;
      if (valorA == null) return 1;
      if (valorB == null) return -1;

      const esNumero = typeof valorA === 'number' && typeof valorB === 'number';

      if (esNumero) {
        return this.ordenAscendente ? valorA - valorB : valorB - valorA;
      } else {
        return this.ordenAscendente
          ? String(valorA).localeCompare(String(valorB))
          : String(valorB).localeCompare(String(valorA));
      }
    });
  }

  onCellClick(event: any, reportejr: Reportesjr) {
    if ((event.target as HTMLElement).closest('button, .dropdown-menu')) return;
    this.ultIdSelec = reportejr.idreporte!;
    sessionStorage.setItem('ultidreporte', this.ultIdSelec.toString());
    this.visualizar(reportejr);
  }

  imprimirReporte(reporte: Reportesjr): void {
    sessionStorage.setItem('reportejrToImpExp', JSON.stringify(reporte));
    this.cerrarVisualizacion();
    this.router.navigate(['/imp-reportejr']);
  }

  nuevo() { this.router.navigate(['/add-reportejr']); }

  parametros(repo: Reportesjr) {
    this.visualizar(repo);
  }

  modificar(reportejr: Reportesjr): void {
    this.ultIdSelec = reportejr.idreporte!;
    sessionStorage.setItem('ultidreporte', this.ultIdSelec.toString());
    const reportejrJson = JSON.stringify(reportejr);
    sessionStorage.setItem('reportejrToModi', reportejrJson);
    this.router.navigate(['/modi-reportejr']);
  }

  //Datos a eliminar
  eliminar(repo: Reportesjr): void {
    this.ultIdSelec = repo.idreporte!;
    sessionStorage.setItem('ultidreporte', this.ultIdSelec.toString());
    Swal.fire({
      // width: '500px',
      // title: 'Mensaje',
      icon: 'warning',
      title: `Eliminar el Reporte:\n${repo.repoxopcion!.codigo} ${repo.nomrep} ?`,
      // text: 'Eliminar el Reporte:\n ' + repo.repoxopcion!.codigo + ' ' + repo.nomrep + ' ?',
      showCancelButton: true,
      confirmButtonText: '<i class="fa fa-check"></i> Aceptar',
      cancelButtonText: '<i class="fa fa-times"></i> Cancelar',
      customClass: {
        popup: 'eliminar',
        title: 'robotobig',
        confirmButton: 'btn btn-info',
        cancelButton: 'btn btn-info'
      },
    }).then((resultado) => {
      if (resultado.isConfirmed) this.elimina(repo);
    });
  }

  //Elimina
  elimina(repo: Reportesjr) {
    this.repojrService.delete(repo.idreporte!).subscribe({
      next: () => {
        this.buscar();
        let fecha: Date = new Date();
        let eliminado: Eliminadosapp = new Eliminadosapp();
        eliminado.idusuario = this.authService.idusuario!;
        eliminado.modulo = this.authService.moduActual;
        eliminado.fecha = fecha;
        eliminado.routerlink = 'reportesjr';
        eliminado.tabla = 'REPORTESJR';
        eliminado.datos = `${repo.repoxopcion!.codigo} ${repo.nomrep}`;
        this.elimService.save(eliminado).subscribe({
          next: () => {
            this.authService.swal('success', `Reporte ${repo.repoxopcion!.codigo} eliminado con éxito`);
            this.buscar();
          },
          error: err => {
            console.error(err.error);
            this.authService.mostrarError('Error al eliminar', err.error);
          }
        });
      },
      error: err => {
        console.error(err.error);
        this.authService.mostrarError('Error al eliminar', err.error);
      }
    });
  }

  imprimir() {

  }

  cerrar() { this.router.navigate(['/inicio']); }

  nombreMetodo(metodo: number) {
    if (metodo == 1) return 'SQL Directo';
    if (metodo == 2) return 'Colección de Beans';
    if (metodo == 3) return 'Desde el Frontend';
    return ''
  }


}

interface ReportesjrVisual {
  codigo: string;
  opcion: string;
  nomrep: string;
  desrep: string;
}

interface BuscarReportesjr {
  codigo: string;
  nomrep: string;
  desrep: string;
}
interface ParametroVisual {
  nombre: string;
  tipo: string;
  ancho: number;
  orden: number;
  entrada: string;
  editable: boolean;
}
