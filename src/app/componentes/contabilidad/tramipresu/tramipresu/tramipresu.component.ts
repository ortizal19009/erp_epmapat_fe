import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { TramipresuService } from 'src/app/servicios/contabilidad/tramipresu.service';

@Component({
   selector: 'app-tramipresu',
   templateUrl: './tramipresu.component.html',
   styleUrls: ['./tramipresu.component.css']
})
export class TramipresuComponent implements OnInit {

   titulo: string = 'Trámites presupuestarios';
   f_buscar: FormGroup;
   filtro: string;
   today: number = Date.now();
   v_tramipresu: any;
   v_partidas: any;
   partida: any;
   targ_partida: boolean = true;

   constructor(private s_tramipresu: TramipresuService, private fb: FormBuilder, private router: Router) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/tramipresu');
      this.setcolor();

      const fecha = new Date();
      const año = fecha.getFullYear();
      this.f_buscar = this.fb.group({
         desdeNum: 0,
         hastaNum: 0,
         desdeFecha: año + '-01-01',
         hastaFecha: año + '-12-31',
      });
      //this.listarTramiPresu();
      let buscaDesdeNum = sessionStorage.getItem('buscaDNum');
      let buscaHastaNum = sessionStorage.getItem('buscaHNum');
      let buscaDesdeFecha = sessionStorage.getItem('buscaDFecha');
      let buscaHastaFecha = sessionStorage.getItem('buscaHFecha');
      if (
         buscaDesdeNum == null ||
         buscaHastaNum == null ||
         buscaDesdeFecha == null ||
         buscaHastaFecha == null ||
         buscaDesdeNum == '0' ||
         buscaHastaNum == '0' ||
         buscaDesdeFecha == '0' ||
         buscaHastaFecha == '0'
      ) {
         this.s_tramipresu.findMax().subscribe({
            next: (datos) => {
               console.log(datos);
               let numTami = +datos.numero!;
               let desde = numTami - 10;
               if (desde <= 0) desde = 1;
               this.f_buscar.patchValue({
                  desdeNum: desde,
                  hastaNum: numTami,
               });
               this.buscar();
            },
            error: (err) => console.log(err.error),
         });
      } else
         this.f_buscar.patchValue({
            desdeNum: +buscaDesdeNum!,
            hastaNum: +buscaHastaNum!,
            desdeFecha: buscaDesdeFecha,
            hastaFecha: buscaHastaFecha,
         });
      this.buscar();
   }

   setcolor() {
      let colores: string[];
      let coloresJSON = sessionStorage.getItem('/tramipresu');
      if (!coloresJSON) {
         colores = ['rgb(70, 70, 70)', 'rgb(186, 186, 186)'];
         const coloresJSON = JSON.stringify(colores);
         sessionStorage.setItem('/tramipresu', coloresJSON);
      } else colores = JSON.parse(coloresJSON);

      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   buscar() {
      this.s_tramipresu
         .getDesdeHasta(
            this.f_buscar.value.desdeNum,
            this.f_buscar.value.hastaNum,
            this.f_buscar.value.desdeFecha,
            this.f_buscar.value.hastaFecha
         )
         .subscribe({
            next: (datos) => {
               this.v_tramipresu = datos;
               this.datosBuscar();
            },
            error: (err) => console.log(err.error),
         });
   }

   addTramite() { this.router.navigate(['add-tramipresu']);   }

   detallesTramipresu(event: any, d_tramipresu: any) {
      if (event.target.classList.contains('dropdown-toggle')) {
      } else {
         this.router.navigate(['compromiso', d_tramipresu.idtrami]);
      }
   }

   listarTramiPresu() {
      this.s_tramipresu.findTramiPresu().subscribe({
         next: (datos) => {
            console.log(datos);
            this.v_tramipresu = datos;
         },
         error: (e) => console.error(e),
      });
   }

   retroceder() { this.targ_partida = true;   }

   selectPartidas(partidas: any) {
      // console.log(partidas);
      this.router.navigate(['add-tramipresu', partidas.idparxcer]);
      /*     this.targ_partida = false;
      console.log(partidas)
      this.partida = partidas; */
   }

   datosBuscar() {
      sessionStorage.setItem('buscaDNum', this.f_buscar?.controls['desdeNum'].value.toString()      );
      sessionStorage.setItem('buscaHNum', this.f_buscar?.controls['hastaNum'].value.toString()      );
      sessionStorage.setItem('buscaDFecha', this.f_buscar?.controls['desdeFecha'].value.toString()      );
      sessionStorage.setItem('buscaHFecha', this.f_buscar?.controls['hastaFecha'].value.toString()      );
   }

   modiTramipresu(tramipresu: any) {
      // console.log(tramipresu);
      this.router.navigate(['/modi-tramipresu', tramipresu.idtrami]);
   }

}
