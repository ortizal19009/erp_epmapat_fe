import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Certipresu } from 'src/app/modelos/contabilidad/certipresu.model';
import { Partixcerti } from 'src/app/modelos/contabilidad/partixcerti.model';
import { PartixcertiService } from 'src/app/servicios/contabilidad/partixcerti.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-add-partixreinte',
  templateUrl: './add-partixreinte.component.html',
  styleUrls: ['./add-partixreinte.component.css']
})
export class AddPartixreinteComponent implements OnInit {

   iReintegrada = {} as interfaceReintegrada;
   iCertipresu: interfaceCertipresu = { numero: 0, fecha: null, respon: '' };
   formCertipresu: FormGroup;
   idreinte: number;    //Solo es el nombre en realidad es idcerti
   partixcerti: Partixcerti[] = [];
   idcerti: number;     //Para navegar en las certificaciones
   primera: number = 1;
   navegador: number;
   ultima: number;
   sumValor: number = 0;
   sumSaldo: number = 0;
   sumMarcados: number = 0;
   mensaje: string;

   constructor(private router: Router, private fb: FormBuilder, public authService: AutorizaService, private certiService: CertipresuService,
      private parxcerService: PartixcertiService) { }

   ngOnInit(): void {
      if (!this.authService.sessionlog) { this.router.navigate(['/inicio']); }
      sessionStorage.setItem('ventana', '/reintegradas');
      let coloresJSON = sessionStorage.getItem('/reintegradas');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      const idcertiToAddPartixreinte = sessionStorage.getItem('idcertiToAddPartixreinte');
      if (idcertiToAddPartixreinte) {
         this.idreinte = +idcertiToAddPartixreinte;
         this.buscaReintegrada();

      }
      else { this.router.navigate(['/inicio']); }
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
      this.certiService.getByIdCerti(this.idreinte).subscribe({
         next: (certipresu: Certipresu) => {
            this.iReintegrada.numero = certipresu.numero;
            this.iReintegrada.fecha = certipresu.fecha;
            this.iReintegrada.docu = certipresu.intdoc.nomdoc + ' ' + certipresu.numdoc
            this.iReintegrada.respon = certipresu.idbeneres.nomben
            this.iReintegrada.descripcion = certipresu.descripcion;
            // this.buscaUltima();
            const fechaString = this.iReintegrada.fecha;
            this.certiService.obtenerUltimoNumero(fechaString)
               .subscribe(numero => { this.ultima = numero; });
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar el Reintegro de Certificación', err.error) }
      });
   }

   actual() { this.navegador = this.iCertipresu.numero; }

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
      if (n > 0) {
         this.navegador = n;
         this.cargarRegistro(n);
      }
   }

   cargarRegistro(n: number) {
      this.certiService.getByNumero(n, 1).subscribe(certi => {
         if (!certi) {
            this.authService.swal('warning', `No existe la Certificación Nro: ${n}`);
            this.iCertipresu = { numero: 0, fecha: null, respon: '' };
            this.partixcerti = [];
            this.sumMarcados = 0;
            return;
         }
         if (certi.fecha > this.iReintegrada.fecha) {
            this.authService.swal('warning', `La fecha de la Certificación Nro: ${n} es mayor que la fecha de de Reintegro`);
            // this.iCertipresu = { numero: 0, fecha: null, docu: '', respon: '', descripcion: '' };
            this.iCertipresu.fecha = certi.fecha;
            this.iCertipresu.respon = certi.idbeneres.nomben
            this.partixcerti = [];
            this.sumMarcados = 0;
            return
         }
         this.idcerti = certi.idcerti;
         this.navegador = certi.numero;
         this.iCertipresu.numero = certi.numero;
         this.iCertipresu.fecha = certi.fecha;
         // this.iCertipresu.docu = certi.intdoc.nomdoc + ' ' + certi.numdoc
         this.iCertipresu.respon = certi.idbeneres.nomben
         // this.iCertipresu.descripcion = certi.descripcion;
         this.buscaPartixcerti();
      });
   }

   buscaPartixcerti() {
      this.parxcerService.getByIdCerti(this.idcerti).subscribe({
         next: (partixcerti: Partixcerti[]) => {
            this.partixcerti = partixcerti;
            this.calculaTotales();
            this.sumMarcados = 0;
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar', err.error) }
      });
   }

   calculaTotales(): void {
      this.sumValor = this.partixcerti.map(p => Number(p.valor) || 0).reduce((acc, val) => acc + val, 0);
      this.sumSaldo = this.partixcerti.map(p => Number(p.valor - p.totprmisos) || 0).reduce((acc, val) => acc + val, 0);
   }

   onK1Change() {
      this.sumMarcados = this.partixcerti.filter(p => p.k1).map(p => Number(p.valor - p.totprmisos) || 0).reduce((acc, val) => acc + val, 0);
   }

   contarMarcados() {
      const marcados = this.partixcerti.filter(p => p.k1);
      let cantMarcados = marcados.length;
      if (cantMarcados === 1) {
         this.mensaje = `Reintegrar la Partida ${marcados[0].intpre.codpar} de la Certificación: ${this.iCertipresu.numero} ?`
      } else {
         this.mensaje = `Reintegrar las ${cantMarcados} Partidas de la Certificación: ${this.iCertipresu.numero} ?`
      }
   }

   aceptar() {
      this.contarMarcados();
      Swal.fire({
         width: '500px',
         title: 'Mensaje',
         text: this.mensaje,
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
         if (resultado.isConfirmed) this.procesarReintegros();
      });
   }

   async procesarReintegros() {
      const marcados = this.partixcerti.filter(p => p.k1);
      for (const fila of marcados) {
         try {
            const dto: PartixreinteCreateDTO = {
               idcerti: { idcerti: this.idreinte },
               intpre: { intpre: fila.intpre.intpre },
               saldo: fila.saldo,
               valor: fila.valor,
               descripcion: fila.descripcion,
               totprmisos: fila.totprmisos,
               swreinte: 0,
               idparxcer_: fila.idparxcer,   // ID del registro original
               usucrea: this.authService.idusuario,
               feccrea: new Date()
            };
            await firstValueFrom(this.parxcerService.savePartixreinte(dto));
            // console.log('Reintegrado:', fila.idparxcer_);
         } catch (err) {
            console.error('Error reintegrando', fila.idparxcer_, err);
            break;
         }
      }
      this.authService.swal('success', `Partida(s) Reintegrada(s) con éxito `);
      this.regresar();
   }

   regresar() { this.router.navigate(['/partixreinte']); }

}

interface interfaceReintegrada {
   numero: number;
   fecha: Date;
   docu: string;
   respon: string;
   descripcion: String;
}

interface interfaceCertipresu {
   numero: number;
   fecha: Date | null;
   respon: string;
}

export interface PartixreinteCreateDTO {
   idcerti: { idcerti: number };
   intpre: { intpre: number };
   saldo: number;
   valor: number;
   descripcion: String;
   totprmisos: number;
   swreinte: number;
   idparxcer_: number;
   usucrea: number;
   feccrea: Date;
}
