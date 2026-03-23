import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Certipresu } from 'src/app/modelos/contabilidad/certipresu.model';
import { Partixcerti } from 'src/app/modelos/contabilidad/partixcerti.model';
import { Presupue } from 'src/app/modelos/contabilidad/presupue.model';
import { CertipresuService } from 'src/app/servicios/contabilidad/certipresu.service';
import { PartixcertiService } from 'src/app/servicios/contabilidad/partixcerti.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-partixreinte',
  templateUrl: './partixreinte.component.html',
  styleUrls: ['./partixreinte.component.css']
})
export class PartixreinteComponent implements OnInit {

   formPartixreinte: FormGroup;
   idcerti: number;
   iReintegrada = {} as interfaceReintegrada; //Interface para los datos del Reintegro de Certificación
   partireinte: Partixcerti[] = [];
   presupue: Presupue[] = [];
   intpre: number | null;
   partida: { codpar: String, saldo: number, newsaldo: number } = { codpar: '', saldo: 0, newsaldo: 0 };
   sweliminar: boolean = false;
   swbusca: boolean = false;
   hover: boolean = false;
   primera: number;
   navegador: number;
   ultima: number;
   sumValor: number = 0;
   mapCertipreuReintegrada = new Map<number, number>();

   constructor(private router: Router, private fb: FormBuilder, public authService: AutorizaService,
      private reinteService: CertipresuService, private parxcerService: PartixcertiService, private elimService: EliminadosappService) { }

   ngOnInit(): void {
      if (!this.authService.sessionlog) { this.router.navigate(['/inicio']); }
      sessionStorage.setItem('ventana', '/reintegradas');
      let coloresJSON = sessionStorage.getItem('/reintegradas');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      const datosToPartixreinteJSON = sessionStorage.getItem('datosToPartixreinte');
      if (datosToPartixreinteJSON) {
         const datosToPartixreinte = JSON.parse(datosToPartixreinteJSON);
         this.idcerti = datosToPartixreinte.idcerti;
         this.primera = +datosToPartixreinte.desdeNum;
         this.ultima = +datosToPartixreinte.hastaNum;
      }
      this.buscaReintegrada();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   buscaReintegrada() {
      this.reinteService.getByIdCerti(this.idcerti).subscribe({
         next: (certipresu: Certipresu) => {
            this.navegador = certipresu.numero;
            this.iReintegrada.numero = certipresu.numero;
            this.iReintegrada.fecha = certipresu.fecha;
            this.iReintegrada.docu = certipresu.intdoc.nomdoc + ' ' + certipresu.numdoc
            this.iReintegrada.respon = certipresu.idbeneres.nomben
            this.iReintegrada.descripcion = certipresu.descripcion;
            this.buscaPartixreinte();
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar el Reintegro de Certificación', err.error) }
      });
   }

   buscaPartixreinte() {
      this.parxcerService.getByIdCerti(this.idcerti).subscribe({
         next: (partixcerti: Partixcerti[]) => {
            this.swbusca = true;
            this.partireinte = partixcerti;
            this.cargarNumerosReintegradas();
            if (this.partireinte.length > 1) this.calcularTotales();
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar', err.error) }
      });
   }

   get f() { return this.formPartixreinte.controls; }

   calcularTotales(): void {
      this.sumValor = this.partireinte.map(p => Number(p.valor) || 0).reduce((acc, val) => acc + val, 0);
   }

   cargarNumerosReintegradas(): void {
      this.partireinte.forEach(p => {
         this.parxcerService.getById(p.idparxcer_!).subscribe(orig => {
            const numero = orig?.idcerti?.numero ?? 0;
            this.mapCertipreuReintegrada.set(p.idparxcer, numero);
         });
      });
   }

   nuevo() {
      sessionStorage.setItem("idcertiToAddPartixreinte", this.idcerti.toString());
      this.router.navigate(['/add-partixreinte']);

   }

   //Datalist de codpar 
   // partidaxCodpar(e: any) {
   //    if (e.target.value != '') {
   //       this.presuService.findByCodpar(2, e.target.value).subscribe({
   //          next: (partidas: Presupue[]) => this.presupue = partidas,
   //          error: err => console.error(err.error),
   //       });
   //    }
   // }
   // onPartidaSelected(e: any) {
   //    const selectedOption = this.presupue.find((x: { codpar: any; }) => x.codpar === e.target.value);
   //    if (selectedOption) {
   //       this.intpre = selectedOption.intpre;
   //       this.partida.saldo = selectedOption.inicia + selectedOption.totmod - selectedOption.totcerti;
   //       this.formPartixreinte.patchValue({
   //          nompar: selectedOption.nompar,
   //          saldo: this.partida.saldo,
   //          valor: '',
   //          newsaldo: ''
   //       });
   //    }
   //    else {
   //       this.intpre = null;
   //       this.formPartixreinte.patchValue({ nompar: '' })
   //    }
   // }

   // guardar() {
   //    const dto: PartixreinteCreateDTO = {
   //       idcerti: { idcerti: this.idcerti },
   //       intpre: { intpre: this.intpre },
   //       saldo: this.formPartixreinte.value.saldo,
   //       valor: this.formPartixreinte.value.valor,
   //       descripcion: this.formPartixreinte.value.descripcion,
   //       totprmisos: 0,
   //       swreinte: 0,
   //       usucrea: this.authService.idusuario,
   //       feccrea: new Date(),
   //    };
   //    this.parxcerService.savePartixcerti(dto).subscribe({
   //       next: (partixcerti: Partixcerti) => {
   //          this.authService.swal('success', `Partida ${partixcerti.intpre.codpar} guardada en el Reintegro de Certificación con éxito `);
   //          sessionStorage.setItem('ultidparxcer', partixcerti.idparxcer.toString());
   //          this.buscaPartixreinte();
   //          this.swnuevo = false;
   //       },
   //       error: err => { console.error(err.error); this.authService.mostrarError('Error al guardar', err.error) }
   //    });
   // }

   eliminar(partixreinte: Partixcerti) {
      Swal.fire({
         width: '500px',
         title: 'Mensaje',
         text: `Eliminar la Partida ${partixreinte.intpre.codpar} del Reintegro de Certificación Nro: ${this.iReintegrada.numero} ?`,
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
         if (resultado.isConfirmed) this.elimina(partixreinte);
      });
   }

   elimina(partixreinte: Partixcerti) {
      this.parxcerService.deletePartixcerti(partixreinte.idparxcer).subscribe({
         next: () => {
            let eliminado: Eliminadosapp = new Eliminadosapp();
            eliminado.idusuario = this.authService.idusuario!;
            eliminado.modulo = this.authService.moduActual;
            eliminado.fecha = new Date();
            eliminado.routerlink = 'partixreinte';
            eliminado.tabla = 'PARTIXCERTI';
            eliminado.datos = `Partida ${partixreinte.intpre.codpar} del Reintegro de Certificacion Nro: ${this.iReintegrada.numero}`;
            this.elimService.save(eliminado).subscribe({
               next: () => {
                  this.authService.swal('success', `Partida ${partixreinte.intpre.codpar} del Reintegro de Certificacion Nro: ${this.iReintegrada.numero} eliminada con éxito`);
                  this.buscaPartixreinte();
               },
               error: err => { console.error(err.error); this.authService.mostrarError('Error al guardar eliminado', err.error); }
            });
         },
         error: (err) => {
            if (err.status === 404) {
               this.authService.mensaje404(`La Partida ${partixreinte.intpre.codpar} de la Certificacion Nro: ${this.iReintegrada.numero} no existe o fue eliminada por otro Usuario`);
               this.buscaPartixreinte();
            } else {
               this.authService.mostrarError('Error al eliminar la Partida de la Certificación', err.error);
            }
         }
      });
   }

   imprimir() {
      sessionStorage.setItem("partixreinteToImpExp", this.iReintegrada.numero.toString());
      // this.router.navigate(['/imp-partixcerti']);
   }

   regresar() { this.router.navigate(['/reintegradas']); }
   cerrar() { this.router.navigate(['/inicio']); }

   actual() { this.navegador = this.iReintegrada.numero; }

   irPrimero() {
      this.navegador = this.primera;
      this.cargarRegistro(this.navegador);
   }

   irUltimo() {
      this.navegador = this.ultima;
      this.cargarRegistro(this.navegador);
   }

   retroceder() {
      if (this.navegador > 1) {
         this.navegador--;
         this.cargarRegistro(this.navegador);
      }
   }

   avanzar() {
      this.navegador++;
      this.cargarRegistro(this.navegador);
   }

   irA(n: number) {
      if (n > 1) {
         this.navegador = n;
         this.cargarRegistro(n);
      }
   }

   cargarRegistro(n: number) {
      this.reinteService.getByNumero(n, 2).subscribe(certi => {
         if (!certi) {
            this.authService.swal('warning', `No existe el Reintegro de Certificación Nro: ${n}`);
            return;
         }
         this.idcerti = certi.idcerti;
         this.navegador = certi.numero;
         this.iReintegrada.numero = certi.numero;
         this.iReintegrada.fecha = certi.fecha;
         this.iReintegrada.docu = certi.intdoc.nomdoc + ' ' + certi.numdoc
         this.iReintegrada.respon = certi.idbeneres.nomben
         this.iReintegrada.descripcion = certi.descripcion;
         this.buscaPartixreinte();
      });
   }

   // seleccionarTexto(event: FocusEvent): void {
   //    const input = event.target as HTMLInputElement;
   //    input.select();
   // }

   //Valida que se haya seleccionado una Partida
   // valCodpar(): AsyncValidatorFn {
   //    return (_control: AbstractControl) => {
   //       if (this.intpre == null) { return of<ValidationErrors>({ invalido: true }); }
   //       return of(null);
   //    };
   // }

   //Valida el Valor
   // valValor(_control: AbstractControl) {
   //    this.partida.newsaldo = Math.round((this.partida.saldo - +this.formPartixreinte.controls['valor'].value) * 100) / 100;
   //    this.formPartixreinte.controls['newsaldo'].setValue(this.partida.newsaldo);
   //    if (this.partida.newsaldo < 0) return of({ 'invalido': true });
   //    else return of(null);
   // }

}

interface interfaceReintegrada {
   numero: number;
   fecha: Date;
   docu: string;
   respon: string;
   descripcion: String;
}

// export interface PartixreinteCreateDTO {
//    idcerti: { idcerti: number | null };
//    intpre: { intpre: number | null };
//    saldo: number;
//    valor: number;
//    descripcion: String;
//    totprmisos: number;
//    swreinte: number
//    usucrea: number;
//    feccrea: Date;
// }

// export interface PartixcertiUpdateDTO {
//    valor?: number;
//    descripcion?: String;
//    usumodi?: number;
//    fecmodi?: Date;
// }