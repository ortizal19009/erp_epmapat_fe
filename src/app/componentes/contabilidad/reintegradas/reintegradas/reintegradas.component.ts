import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Eliminadosapp } from 'src/app/modelos/administracion/eliminadosapp.model';
import { Certipresu } from 'src/app/modelos/contabilidad/certipresu.model';
import { EliminadosappService } from 'src/app/servicios/administracion/eliminadosapp.service';
import { CertipresuService } from 'src/app/servicios/contabilidad/certipresu.service';
import { PartixcertiService } from 'src/app/servicios/contabilidad/partixcerti.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reintegradas',
  templateUrl: './reintegradas.component.html',
  styleUrls: ['./reintegradas.component.css']
})
export class ReintegradasComponent implements OnInit, OnDestroy {

   formBuscar: FormGroup;
   certipresu: Certipresu[] = [];
   buscaReintegradas: { desdeNum: number | null, hastaNum: number | null, desdeFecha: string | null, hastaFecha: string | null }
   swdesdehasta = false; //Visibilidad Buscar últimos
   filtro = '';
   cargando = false;
   errorListado = '';
   private consulta?: Subscription;
   private consultaUltima?: Subscription;
   tot = 0;
   sumvalor = 0;
   swfiltro = false;
   ultIdSelec: number = -1;

   constructor(private fb: FormBuilder, private router: Router, public authService: AutorizaService, private coloresService: ColoresService,
      private certiService: CertipresuService, private parxcerService: PartixcertiService, private elimService: EliminadosappService) {
      this.formBuscar = this.fb.group({ desdeNum: null, hastaNum: null, desdeFecha: null, hastaFecha: null });
   }

   ngOnInit(): void {
      if (!this.authService.sessionlog) { this.router.navigate(['/inicio']); return; }
      sessionStorage.setItem('ventana', '/reintegradas');
      let coloresJSON = sessionStorage.getItem('/reintegradas');
      try { if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON)); else this.buscaColor(); }
      catch { this.buscaColor(); }

      let datos: any;
      try { datos = this.authService.getDatosEmpresa(); } catch {}
      const fechaEmpresa = String(datos?.fechap || '');
      const anio = /^\d{4}-/.test(fechaEmpresa) ? fechaEmpresa.slice(0, 4) : String(new Date().getFullYear());
      this.formBuscar.patchValue({
         desdeNum: '',
         hastaNum: '',
         desdeFecha: anio + '-01-01',
         hastaFecha: anio + '-12-31',
      });

      //Datos de búsqueda: últimas Certificaciones o guardadas
      this.ultIdSelec = sessionStorage.getItem('ultreintegrada') ? Number(sessionStorage.getItem('ultreintegrada')) : 0;
      let guardada: any = null;
      try { guardada = JSON.parse(sessionStorage.getItem('buscaReintegradas') || 'null'); }
      catch { sessionStorage.removeItem('buscaReintegradas'); }
      if (guardada && typeof guardada === 'object' && !Array.isArray(guardada)) {
         this.formBuscar.patchValue(guardada);
         this.swdesdehasta = true;
         this.buscar();
      } else this.ultimaReintegrada();
   }

   ngOnDestroy() { this.consulta?.unsubscribe(); this.consultaUltima?.unsubscribe(); }

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
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'reintegradas');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/reintegradas', coloresJSON);
         this.colocaColor(datos);
      } catch (error) { console.error(error); }
   }

   ultimaReintegrada() {
      this.consulta?.unsubscribe(); this.consultaUltima?.unsubscribe();
      this.cargando = true; this.errorListado = '';
      this.consultaUltima = this.certiService.ultima(2).subscribe({
         next: (resp: Certipresu | null) => {
            if (!resp) { this.certipresu = []; this.total(); this.cargando = false; return; }
            const fecha = String(resp.fecha || '');
            const anio = /^\d{4}-/.test(fecha) ? fecha.slice(0, 4) : null;
            this.formBuscar.patchValue({ desdeNum: Math.max(1, Number(resp.numero) - 16), hastaNum: Number(resp.numero),
               desdeFecha: anio ? anio + '-01-01' : null, hastaFecha: anio ? anio + '-12-31' : null });
            this.buscar();
         },
         error: () => { this.cargando = false; this.errorListado = 'No se pudo consultar la ultima reintegrada. Intente nuevamente.'; }
      });
   }

   buscar() {
      const valores = this.formBuscar.value;
      const numero = (v: any) => v === null || v === undefined || String(v).trim() === '' ? null : Number(v);
      const desdeNum = numero(valores.desdeNum), hastaNum = numero(valores.hastaNum);
      const desdeFecha = valores.desdeFecha || null, hastaFecha = valores.hastaFecha || null;
      this.errorListado = '';
      if ([desdeNum, hastaNum].some(n => n !== null && (!Number.isSafeInteger(n) || n < 1))
            || (desdeNum !== null && hastaNum !== null && desdeNum > hastaNum)) {
         this.errorListado = 'Indique numeros enteros positivos y un rango desde menor o igual que hasta.'; return;
      }
      const fechaValida = (v: string | null) => !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v);
      if (!fechaValida(desdeFecha) || !fechaValida(hastaFecha) || (desdeFecha && hastaFecha && desdeFecha > hastaFecha)) {
         this.errorListado = 'Seleccione fechas validas y un rango desde menor o igual que hasta.'; return;
      }
      const aplicados = { desdeNum, hastaNum, desdeFecha, hastaFecha };
      this.consulta?.unsubscribe(); this.consultaUltima?.unsubscribe();
      this.cargando = true; this.certipresu = []; this.total();
      this.consulta = this.certiService.getDesdeHasta(2, desdeNum, hastaNum, desdeFecha, hastaFecha).subscribe({
         next: datos => {
            this.certipresu = Array.isArray(datos) ? datos : []; this.cargando = false;
            this.buscaReintegradas = aplicados;
            sessionStorage.setItem('buscaReintegradas', JSON.stringify(aplicados)); this.total();
         },
         error: () => { this.cargando = false; this.errorListado = 'No se pudieron cargar las reintegros. Revise los filtros e intente nuevamente.'; }
      });
   }

   limpiarFiltros() {
      this.filtro = ''; this.swfiltro = false; this.swdesdehasta = true;
      this.formBuscar.reset({ desdeNum: null, hastaNum: null, desdeFecha: null, hastaFecha: null });
      sessionStorage.removeItem('buscaReintegradas'); this.buscar();
   }

   total() {
      this.sumvalor = 0;
      this.certipresu.forEach((certipresu: Certipresu) => {
         this.sumvalor += Number(certipresu.valor) || 0;
      });
      this.tot = this.certipresu.length;
   }

   changeDesdeHasta() { this.swdesdehasta = true; }

   busquedainicial() {
      sessionStorage.removeItem('buscaReintegradas');
      this.filtro = ''; this.swfiltro = false;
      this.swdesdehasta = false;
      this.ultimaReintegrada();
   }

   changeFiltro() {
      if (this.filtro.trim() !== '') this.swfiltro = true;
      else this.swfiltro = false;
   }

   nuevo() { this.router.navigate(['add-reintegrada']); }

   modiCertipresu(idcerti: number) {
      sessionStorage.setItem("idcertiToModi", idcerti.toString());
      this.router.navigate(['/modi-reintegrada']);
   }

   onCellClick(event: any, reintegrada: Certipresu) {
      const tagName = event.target.tagName;
      this.ultIdSelec = reintegrada.idcerti!;
      sessionStorage.setItem('ultreintegrada', this.ultIdSelec.toString());
      if (tagName === 'TD') {
         const datosToPartixreinte = {
            idcerti: reintegrada.idcerti,
            desdeNum: this.formBuscar.value.desdeNum,
            hastaNum: this.formBuscar.value.hastaNum
         };
         sessionStorage.setItem('datosToPartixreinte', JSON.stringify(datosToPartixreinte));
         this.router.navigate(['partixreinte']);
      }
   }

   eliminar(reintegrada: Certipresu) {
      this.parxcerService.countByIdcerti(reintegrada.idcerti).subscribe({
         next: registros => {
            if (registros > 0) {
               Swal.fire({
                  icon: 'error',
                  title: `No puede eliminar el Reintegro de Certificación Nro: ${reintegrada.numero}`,
                  text: `Tiene registrado ${registros} Partida(s)`,
                  confirmButtonText: '<i class="bi-check"></i> Continuar ',
                  customClass: {
                     popup: 'noeliminar',
                     title: 'robotobig',
                     confirmButton: 'btn btn-warning',
                  },
               });
            } else {
               Swal.fire({
                  width: '500px',
                  title: 'Mensaje',
                  text: `Eliminar el Reintegro de Certificación Nro: ${reintegrada.numero} ?`,
                  icon: 'warning',
                  showCancelButton: true,
                  confirmButtonText: '<i class="fa fa-check"></i> Aceptar',
                  cancelButtonText: '<i class="fa fa-times"></i> Cancelar',
                  customClass: {
                     popup: 'eliminar',
                     title: 'robotobig',
                     confirmButton: 'btn btn-success',
                     cancelButton: 'btn btn-success'
                  },
               }).then((resultado) => {
                  if (resultado.isConfirmed) this.elimina(reintegrada);
               });
            }
         },
         error: err => { console.error('Al buscar las Partidas de la Certificación: ', err.error); },
      });
   }

   elimina(reintegrada: Certipresu) {
      this.certiService.deleteCertipresu(reintegrada.idcerti).subscribe({
         next: () => {
            let eliminado: Eliminadosapp = new Eliminadosapp();
            eliminado.idusuario = this.authService.idusuario!;
            eliminado.modulo = this.authService.moduActual;
            eliminado.fecha = new Date();
            eliminado.routerlink = 'reintegradas';
            eliminado.tabla = 'CERTIFICACIONES';
            eliminado.datos = `Nro. ${reintegrada.numero} del ${reintegrada.fecha}`;
            this.elimService.save(eliminado).subscribe({
               next: () => {
                  this.authService.swal('success', `Reintegro de Certificación ${reintegrada.numero} eliminada con éxito`);
                  this.buscar();
               },
               error: err => { console.error(err.error); this.authService.mostrarError('Error al guardar eliminado', err.error); }
            });
         },
         error: (err) => {
            if (err.status === 404) {
               this.authService.mensaje404(`El Reintegro de Certificación ${reintegrada.numero} no existe o fue eliminada por otro Usuario`);
               this.buscar();
            } else {
               this.authService.mostrarError('Error al eliminar el Reintegro de Certificación', err.error);
            }
         }
      });
   }

   // Imprime el reporte (vista actual) en una nueva pestaña
   generaJasperDataset() {
      // let dtoPreingresos: Reporte[] = [];
      // dtoPreingresos = this.partiFiltradas.map(p => ({
      //    codigoCompuesto: `${p.proyecto.codigo}.${p.codpar}`,
      //    nompar: p.nompar,
      //    inicial: p.inicial,
      //    totmod: p.totmod,
      //    codificado: p.inicial + p.totmod
      // }));

      // // console.log('dtoPreingresos: ', dtoPreingresos)
      // const nomrep = 'preingresos';
      // this.repojrService.valNomrep(nomrep).subscribe({
      //    next: sw => {
      //       if (sw) {
      //          const datosEmpresa = this.authService.getDatosEmpresa()
      //          const empresa = datosEmpresa?.empresa;
      //          const codproy = this.buscarPreingresos.codigo;
      //          const dto: DatasetReportRequest = {
      //             reportName: nomrep,
      //             extension: 'pdf',
      //             parameters: [
      //                { name: 'empresa', type: 'string', value: empresa },
      //                { name: 'codproy', type: 'string', value: this.buscarPreingresos.codigo },
      //                { name: 'codpar', type: 'string', value: this.buscarPreingresos.codpar },
      //                { name: 'nompar', type: 'string', value: this.buscarPreingresos.nompar }
      //             ],
      //             data: dtoPreingresos
      //          };
      //          this.presuService.ejecutaPreingresos(dto).subscribe((data: Blob) => {
      //             const fileURL = URL.createObjectURL(data);
      //             window.open(fileURL);
      //          });
      //       } else {
      //          this.authService.swal('warning', `No existe el reporte: ${nomrep}.jasper`)
      //       }
      //    },
      //    error: err => {
      //       console.error(err.error);
      //       this.authService.mostrarError('Error al generar el Reporte: ', err.error);
      //    }
      // });
   }

   cerrar() { this.router.navigate(['/inicio']); }

}
