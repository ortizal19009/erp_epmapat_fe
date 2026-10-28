import { ColoresService } from 'src/app/compartida/colores.service';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { ClientesReporteService, ReporteCliente } from 'src/app/servicios/clientes-reporte.service';
@Component({selector:'app-imp-cliente',templateUrl:'./imp-cliente.component.html',
  styleUrls:['../../../compartida/gestion-cuentas.css','./imp-cliente.component.css']})
export class ImpClienteComponent implements OnInit {
  tipo: ReporteCliente = 'listado'; formato: 'pdf' | 'xlsx' = 'pdf';
  busqueda = ''; soloPendientes = false; generando = false; error = ''; mensaje = '';
  colorCabecera = '#2c3e50';
  colorDetalle = '#f8fafc';
  constructor(private clientes: ClientesService, private reportes: ClientesReporteService,
    private router: Router, private ruta: ActivatedRoute,
    private colores: ColoresService, private auth: AutorizaService) {}
  ngOnInit() {
    sessionStorage.setItem('ventana','/imp-clientes');
    this.cargarColores();
  }
  private async cargarColores() {
    try {
      const guardados = sessionStorage.getItem('/imp-clientes');
      let valores: any;
      if (guardados) { try { valores = JSON.parse(guardados); } catch {} }
      if (!Array.isArray(valores) || valores.length < 2) {
        valores = await this.colores.setcolor(this.auth.idusuario, 'imp-clientes');
        if (Array.isArray(valores)) sessionStorage.setItem('/imp-clientes', JSON.stringify(valores));
      }
      if (Array.isArray(valores)) {
        if (valores[0]) this.colorCabecera = valores[0];
        if (valores[1]) this.colorDetalle = valores[1];
      }
    } catch { /* Mantener los colores del template si no hay configuracion disponible. */ }
  }
  get descripcion() { return this.reportes.configuracion(this.tipo).nota; }
  regresar() { this.router.navigate([this.ruta.snapshot.paramMap.get('page') || 'clientes']); }
  async generar() {
    if(this.generando) return;
    this.generando=true; this.error=''; this.mensaje='';
    const tipo=this.tipo, formato=this.formato, busqueda=this.busqueda.trim(), solo=this.soloPendientes;
    try {
      const datos = await firstValueFrom(this.clientes.getReporte(tipo));
      const normalizar = (v: any) => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
      const filtrados=datos.filter(r => (!busqueda || [r.nombre,r.cedula,r.idcliente,r.cuenta].some(v=>normalizar(v).includes(normalizar(busqueda))))
        && (tipo!=='pendientes' || !solo || Number(r.capital)>0));
      if(!filtrados.length) {this.error='No hay registros para los filtros seleccionados.';return;}
      await this.reportes.descargar(tipo,filtrados,formato,
        (busqueda ? 'Busqueda: '+busqueda : 'Todos los clientes') + (tipo==='pendientes' && solo ? ' | Solo con saldo pendiente' : ''));
      this.mensaje=`Reporte generado: ${filtrados.length} filas.`;
    } catch {this.error='No se pudo generar el reporte. Intente nuevamente.';}
    finally {this.generando=false;}
  }
}
