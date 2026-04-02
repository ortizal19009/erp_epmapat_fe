import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ConvenioService } from 'src/app/servicios/convenio.service';
import { FacxconvenioService } from 'src/app/servicios/facxconvenio.service';
import { CuotasService } from 'src/app/servicios/cuotas.service';
import { PdfService } from 'src/app/servicios/pdf.service';
import { Facxconvenio } from 'src/app/modelos/facxconvenio.model';
import { Convenios } from 'src/app/modelos/convenios.model';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';

@Component({
   selector: 'app-convenios',
   templateUrl: './convenios.component.html',
   styleUrls: ['./convenios.component.css']
})

export class ConveniosComponent implements OnInit {

   formBuscar: FormGroup;
   filtro: string;
   nroconve: any;  //Nro de convenio enviado como mensaje a eliminar
   _convenios: any;
   _conveniosFiltered: any;
   convenioStats: { [id: number]: { total: number; pagadas: number; pendientes: number } } = {};
   rtn: number;
   swdesdehasta: boolean; //Visibilidad Buscar últimos
   currentIndex = -1;
   swbuscando: boolean;
   txtbuscar: string;

   constructor(
      private convService: ConvenioService,
      private facxconvenioService: FacxconvenioService,
      private cuotaService: CuotasService,
      private pdfService: PdfService,
      private router: Router,
      private fb: FormBuilder,
      public authService: AutorizaService,
      private coloresService: ColoresService
   ) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/convenios');
      let coloresJSON = sessionStorage.getItem('/convenios');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      this.formBuscar = this.fb.group({
         desde: [''],
         hasta: [''],
         nombre: [''],
         estado: [''],
         minPendientes: [''],
         maxPendientes: [''],
      });

      this.formBuscar.get('nombre')?.valueChanges.subscribe((value) => {
         if (value) {
            this.formBuscar.patchValue({ estado: '', minPendientes: '', maxPendientes: '' }, { emitEvent: false });
         }
         this.applyFilters();
      });

      this.formBuscar.get('estado')?.valueChanges.subscribe((value) => {
         if (value !== null && value !== undefined) {
            this.formBuscar.patchValue({ nombre: '', minPendientes: '', maxPendientes: '' }, { emitEvent: false });
         }
         this.applyFilters();
      });

      this.formBuscar.get('minPendientes')?.valueChanges.subscribe((value) => {
         if (value !== null && value !== '') {
            this.formBuscar.patchValue({ nombre: '', estado: '' }, { emitEvent: false });
         }
         this.applyFilters();
      });

      this.formBuscar.get('maxPendientes')?.valueChanges.subscribe((value) => {
         if (value !== null && value !== '') {
            this.formBuscar.patchValue({ nombre: '', estado: '' }, { emitEvent: false });
         }
         this.applyFilters();
      });

      if (sessionStorage.getItem("desdeconvenio") != null && sessionStorage.getItem("hastaconvenio") != null) {
         this.formBuscar.controls['desde'].setValue(sessionStorage.getItem("desdeconvenio"));
         this.formBuscar.controls['hasta'].setValue(sessionStorage.getItem("hastaconvenio"));
         this.buscaConvenios();
      } else {
         this.ultimoNroconvenio();
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
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'convenios');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/convenios', coloresJSON);
         this.colocaColor(datos);
      } catch (error) { console.error(error); }
   }

   ultimoNroconvenio() {
      this.convService.ultimoNroconvenio().subscribe({
         next: resp => {
            this.formBuscar.controls['hasta'].setValue(resp.nroconvenio);
            let desde = 1;
            if (resp.nroconvenio > 10) desde = resp.nroconvenio - 10
            this.formBuscar.controls['desde'].setValue(desde);
            this.buscaConvenios();
         },
         error: err => console.error(err.error)
      });
   }

   buscaConvenios() {
      this.swbuscando = true;
      this.txtbuscar = 'Buscando'
      sessionStorage.setItem("desdeconvenio", this.formBuscar.value.desde);
      sessionStorage.setItem("hastaconvenio", this.formBuscar.value.hasta);
      let desde = +this.formBuscar.value.desde;
      let hasta = +this.formBuscar.value.hasta;
      if (desde > 0 && hasta > 0) {
         if (hasta - desde < 200) {
            this.convService.conveniosDesdeHasta(desde, hasta).subscribe({
               next: datos => {
                  this._convenios = datos;
                  this._conveniosFiltered = this._convenios;
                  this.swbuscando = false;
                  this.txtbuscar = 'Buscar';
                  this.loadConvenioStats();
                  this.applyFilters();
               },
               error: err => console.error(err.error)
            });
         } else {
            //Advertencia
         }
      }
   }

   public listainicial() {
      sessionStorage.removeItem('desdeconvenio');
      sessionStorage.removeItem('hastaconvenio');
      this.swdesdehasta = false;
      this.ultimoNroconvenio();
   }

   private getIdFactura(obj: any): number | null {
      if (!obj) return null;
      if (typeof obj === 'number') return obj;
      if (typeof obj === 'object') {
         if (typeof obj.idfactura === 'number') return obj.idfactura;
         if (typeof obj.id === 'number') return obj.id;
         if (obj.idfactura_facturas && typeof obj.idfactura_facturas.idfactura === 'number')
            return obj.idfactura_facturas.idfactura;
      }
      return null;
   }

   private isFacturaPagada(obj: any): boolean {
      if (!obj) return false;
      const pagado = obj.pagado ?? obj.idfactura_facturas?.pagado;
      const normalized = String(pagado).toLocaleLowerCase();
      return [1, '1', true, 'true', 'pagado', 'si', 's', 'pago'].includes(pagado) ||
         ['1', 'true', 'pagado', 'si', 's', 'pago'].includes(normalized);
   }

   loadConvenioStats() {
      if (!Array.isArray(this._convenios)) {
         return;
      }

      const requests = this._convenios.map((convenio: any) =>
         forkJoin({
            facx: this.facxconvenioService.getFacByConvenio(convenio.idconvenio),
            cuotas: this.cuotaService.getByIdconvenio(convenio.idconvenio)
         }).pipe(
            map((res: any) => {
               const facx: Facxconvenio[] = Array.isArray(res.facx) ? res.facx : [];
               const cuotas: any[] = Array.isArray(res.cuotas) ? res.cuotas : [];

               const viejasIds = new Set<number>(
                  facx
                     .map((f) => this.getIdFactura(f.idfactura_facturas))
                     .filter((id): id is number => id !== null)
               );

               const nuevas = cuotas
                  .map((c) => {
                     const fact = c?.idfactura ?? c?.idfactura_facturas;
                     return { fact, id: this.getIdFactura(fact), original: c };
                  })
                  .filter((x) => x.id !== null && !viejasIds.has(x.id));

               const total = nuevas.length;
               const pagadas = nuevas.filter((x) => this.isFacturaPagada(x.fact)).length;
               const pendientes = total - pagadas;

               return { id: convenio.idconvenio, total, pagadas, pendientes };
            })
         )
      );

      forkJoin(requests).subscribe((stats: any[]) => {
         this.convenioStats = {};
         stats.forEach((s) => {
            this.convenioStats[s.id] = s;
         });
         this.applyFilters();
      });
   }

   applyFilters() {
      const { nombre, estado, minPendientes, maxPendientes } = this.formBuscar.value;
      this._conveniosFiltered = (this._convenios || []).filter((convenio: any) => {
         const matchesNombre = nombre
            ? (convenio.idabonado?.idcliente_clientes?.nombre || '').toLowerCase().includes(nombre.toLowerCase())
            : true;
         const matchesEstado = estado ? convenio.estado === Number(estado) : true;

         const stats = this.convenioStats[convenio.idconvenio] || { pendientes: 0 };
         const matchesMinPendientes = minPendientes ? stats.pendientes >= Number(minPendientes) : true;
         const matchesMaxPendientes = maxPendientes ? stats.pendientes <= Number(maxPendientes) : true;

         return matchesNombre && matchesEstado && matchesMinPendientes && matchesMaxPendientes;
      });
   }

   changeDesdeHasta() {
      this.swdesdehasta = true;
      // this.formBuscar.get('desde')!.valueChanges.subscribe(x => {

      //  });
   }

   setActive(m: Convenios, index: number): void {
      this.currentIndex = index;
   }

   public listar10() {
      // this.swbusca = false;
      sessionStorage.removeItem("desde");
      sessionStorage.removeItem("hasta");
      // this.inicia();
      // this.convService.getAll().subscribe(datos => { this._convenios = datos })
   }

   // public buscaConvenios() {
   //    let desde = this.formBuscar.value.desde;
   //    let hasta = this.formBuscar.value.hasta;
   //    let desdeB = document.getElementById("desde") as HTMLInputElement;
   //    let hastaB = document.getElementById("hasta") as HTMLInputElement;

   //    if (desde == '' || hasta == '' || desde == null || hasta == null) {
   //       desdeB.style.border = "#f50000 1px solid";
   //       hastaB.style.border = "#f50000 1px solid";
   //    } else if (desde != null && hasta != null) {
   //       if ((+desdeB.value!) > (+hastaB.value!)) {
   //          desdeB.style.border = "#f50000 1px solid";
   //          hastaB.style.border = "#f50000 1px solid";
   //       } else {
   //          desdeB.style.border = "";
   //          hastaB.style.border = "";
   //          // this.swbusca = true;
   //          sessionStorage.setItem('desde', desde.toString());
   //          sessionStorage.setItem('hasta', hasta.toString());
   //          this.convService.getConveniosQuery(desde, hasta).subscribe({
   //             next: datos => this._convenios = datos,
   //             error: err => console.error(err.error)
   //          });
   //       }
   //    }
   // }

   nuevo() {
      this.router.navigate(['add-convenio']);
   }

   info(event: any, idconvenio: number) {
      const tagName = event.target.tagName;
      if (tagName === 'TD') {
         sessionStorage.setItem('idconvenioToInfo', idconvenio.toString());
         this.router.navigate(['info-convenio']);
      }
   }

   public modiConvenio(idconvenio: number) {
      sessionStorage.setItem('idconvenioToModi', idconvenio.toString());
      this.router.navigate(["modi-convenio"]);
   }

   imprimir() {
      const convenios = this._conveniosFiltered || this._convenios || [];
      if (!convenios.length) {
         alert('No hay convenios para imprimir (filtrados).');
         return;
      }

      const doc = new jsPDF('p', 'pt', 'a4');
      this.pdfService.header('Reporte de convenios filtrados', doc);

      const body = convenios.map((c: any, index: number) => {
         const fecha = c?.feccrea ? new Date(c.feccrea).toLocaleDateString('es-ES') : '';
         const total = Number(c?.totalconvenio || 0).toFixed(2);
         const cuotas = c?.cuotas ?? 0;
         const estado = c?.estado === 1 ? 'Activo' : 'Inactivo';
         const pendientes = this.convenioStats[c.idconvenio]?.pendientes ?? 0;
         const pagadas = this.convenioStats[c.idconvenio]?.pagadas ?? 0;

         return [
            index + 1,
            c?.nroconvenio ?? '',
            fecha,
            c?.referencia ?? '',
            c?.idabonado?.idcliente_clientes?.nombre ?? '',
            total,
            cuotas,
            pendientes,
            pagadas,
            estado,
         ];
      });

      autoTable(doc, {
         startY: 110,
         theme: 'grid',
         head: [[
            '#',
            'Nro',
            'Fecha',
            'Referencia',
            'Abonado',
            'Total',
            'Cuotas',
            'Pendientes',
            'Pagadas',
            'Estado',
         ]],
         body,
         styles: { fontSize: 8, cellPadding: 2 },
         headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], halign: 'center' },
         columnStyles: {
            0: { halign: 'center', cellWidth: 20 },
            1: { halign: 'center', cellWidth: 35 },
            2: { halign: 'center', cellWidth: 55 },
            3: { cellWidth: 80 },
            4: { cellWidth: 110 },
            5: { halign: 'right', cellWidth: 48 },
            6: { halign: 'center', cellWidth: 32 },
            7: { halign: 'center', cellWidth: 40 },
            8: { halign: 'center', cellWidth: 40 },
            9: { halign: 'center', cellWidth: 50 },
         },
      });

      this.pdfService.setfooter(doc);

      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
   }

}
