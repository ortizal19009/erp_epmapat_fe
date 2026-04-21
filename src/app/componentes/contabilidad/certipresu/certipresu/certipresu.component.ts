import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from '@compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Eliminadosapp } from 'src/app/modelos/administracion/eliminadosapp.model';
import { Certipresu } from 'src/app/modelos/contabilidad/certipresu.model';
import { EliminadosappService } from 'src/app/servicios/administracion/eliminadosapp.service';
import { CertipresuService } from 'src/app/servicios/contabilidad/certipresu.service';
import { PartixcertiService } from 'src/app/servicios/contabilidad/partixcerti.service';
import Swal from 'sweetalert2';

@Component({
   selector: 'app-certipresu',
   templateUrl: './certipresu.component.html',
   styleUrls: ['./certipresu.component.css'],
})

export class CertipresuComponent implements OnInit {

   formBuscar: FormGroup;
   certipresu: Certipresu[] = [];
   buscarCertipresu: { desdeNum: number, hastaNum: number, desdeFecha: string, hastaFecha: string }
   swdesdehasta: boolean; //Visibilidad Buscar últimos
   filtro: string;
   tot: number;
   sumvalor: number;
   swfiltro: boolean;
   ultIdSelec: number = -1;

   constructor(private fb: FormBuilder, private router: Router, public authService: AutorizaService, private coloresService: ColoresService,
      private certiService: CertipresuService, private parxcerService: PartixcertiService, private elimService: EliminadosappService) { }

   ngOnInit(): void {
      if (!this.authService.sessionlog) { this.router.navigate(['/inicio']); }
      sessionStorage.setItem('ventana', '/certipresu');
      let coloresJSON = sessionStorage.getItem('/certipresu');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      const datos = this.authService.getDatosEmpresa()
      const año = datos!.fechap.toString().slice(0, 4);
      this.formBuscar = this.fb.group({
         desdeNum: '',
         hastaNum: '',
         desdeFecha: año + '-01-01',
         hastaFecha: año + '-12-31',
      });

      //Datos de búsqueda: últimas Certificaciones o guardadas
      this.ultIdSelec = sessionStorage.getItem('ultidcerti') ? Number(sessionStorage.getItem('ultidcerti')) : 0;
      this.buscarCertipresu = JSON.parse(sessionStorage.getItem("buscarCertipresu")!);
      if (this.buscarCertipresu == null) {
         this.ultimaCertipresu();
      } else {
         this.formBuscar.patchValue({
            desdeNum: this.buscarCertipresu.desdeNum,
            hastaNum: this.buscarCertipresu.hastaNum,
            desdeFecha: this.buscarCertipresu.desdeFecha,
            hastaFecha: this.buscarCertipresu.hastaFecha
         });
         this.buscar();
         this.formBuscar.get('desdeNum')?.valueChanges.subscribe(valor => {
            if (valor != null && !isNaN(valor)) {
               this.formBuscar.patchValue({
                  hastaNum: Number(valor) + 16
               }, { emitEvent: false });
            }
         });
      }
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
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'certipresu');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/certipresu', coloresJSON);
         this.colocaColor(datos);
      } catch (error) { console.error(error); }
   }

   ultimaCertipresu() {
      this.certiService.ultima(1).subscribe({
         next: (resp: Certipresu) => {
            let desde = resp.numero - 16;
            if (desde <= 0) desde = 1;
            this.formBuscar.patchValue({
               desdeNum: desde,
               hastaNum: resp.numero,
            });
            this.buscar();
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar la última Certificación', err.error) }
      });
   }

   buscar() {
      let desdeNum: number = 1;
      if (this.formBuscar.value.desdeNum != null) { desdeNum = this.formBuscar.value.desdeNum; }
      let hastaNum: number = 999999999;
      if (this.formBuscar.value.hastaNum != null) { hastaNum = this.formBuscar.value.hastaNum; }
      this.certiService.getDesdeHasta(1, desdeNum, hastaNum, this.formBuscar.value.desdeFecha, this.formBuscar.value.hastaFecha).subscribe({
         next: (certipresu: Certipresu[]) => {
            this.certipresu = certipresu;
            //Guarda los datos de búsqueda
            this.buscarCertipresu = {
               desdeNum: this.formBuscar.value.desdeNum,
               hastaNum: this.formBuscar.value.hastaNum,
               desdeFecha: this.formBuscar.value.desdeFecha,
               hastaFecha: this.formBuscar.value.hastaFecha
            };
            sessionStorage.setItem("buscarCertipresu", JSON.stringify(this.buscarCertipresu));
            this.total();
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar', err.error) }
      });
   }

   total() {
      this.sumvalor = 0;
      this.certipresu.forEach((certipresu: Certipresu) => {
         this.sumvalor = this.sumvalor + certipresu.valor;
      });
      this.tot = this.certipresu.length;
   }

   changeDesdeHasta() { this.swdesdehasta = true; }

   busquedainicial() {
      sessionStorage.removeItem('buscarCertipresu');
      this.swdesdehasta = false;
      this.ultimaCertipresu();
   }

   changeFiltro() {
      if (this.filtro.trim() !== '') this.swfiltro = true;
      else this.swfiltro = false;
   }

   nuevo() { this.router.navigate(['add-certipresu']); }

   modiCertipresu(idcerti: number) {
      sessionStorage.setItem("idcertiToModi", idcerti.toString());
      this.router.navigate(['/modi-certipresu']);
   }

   onCellClick(event: any, certipresu: Certipresu) {
      const tagName = event.target.tagName;
      this.ultIdSelec = certipresu.idcerti!;
      sessionStorage.setItem('ultidcerti', this.ultIdSelec.toString());
      if (tagName === 'TD') {
         const datosToPartixcerti = {
            idcerti: certipresu.idcerti,
            desdeNum: this.formBuscar.value.desdeNum,
            hastaNum: this.formBuscar.value.hastaNum
         };
         sessionStorage.setItem('datosToPartixcerti', JSON.stringify(datosToPartixcerti));
         this.router.navigate(['partixcerti']);
      }
   }

   eliminar(certipresu: Certipresu) {
      this.parxcerService.countByIdcerti(certipresu.idcerti).subscribe({
         next: registros => {
            if (registros > 0) {
               Swal.fire({
                  icon: 'error',
                  title: `No puede eliminar la Certificación Nro: ${certipresu.numero}`,
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
                  text: `Eliminar la Certificación: ${certipresu.numero} ?`,
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
                  if (resultado.isConfirmed) this.elimina(certipresu);
               });
            }
         },
         error: err => { console.error('Al buscar las Partidas de la Certificación: ', err.error); },
      });
   }

   elimina(certipresu: Certipresu) {
      this.certiService.deleteCertipresu(certipresu.idcerti).subscribe({
         next: () => {
            let eliminado: Eliminadosapp = new Eliminadosapp();
            eliminado.idusuario = this.authService.idusuario!;
            eliminado.modulo = this.authService.moduActual;
            eliminado.fecha = new Date();
            eliminado.routerlink = 'certipresu';
            eliminado.tabla = 'CERTIFICACIONES';
            eliminado.datos = `Nro. ${certipresu.numero} del ${certipresu.fecha}`;
            this.elimService.save(eliminado).subscribe({
               next: () => {
                  this.authService.swal('success', `Certificación ${certipresu.numero} eliminada con éxito`);
                  this.buscar();
               },
               error: err => { console.error(err.error); this.authService.mostrarError('Error al guardar eliminado', err.error); }
            });
         },
         error: (err) => {
            if (err.status === 404) {
               this.authService.mensaje404(`La Certificación ${certipresu.numero} no existe o fue eliminada por otro Usuario`);
               this.buscar();
            } else {
               this.authService.mostrarError('Error al eliminar la Certificación', err.error);
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



