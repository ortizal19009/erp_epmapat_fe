import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { Partixcerti } from 'src/app/modelos/contabilidad/partixcerti.model';
import { CertipresuService } from 'src/app/servicios/contabilidad/certipresu.service';
import { PartixcertiService } from 'src/app/servicios/contabilidad/partixcerti.service';
import { PresupueService } from 'src/app/servicios/contabilidad/presupue.service';

@Component({
   selector: 'app-partixcerti',
   templateUrl: './partixcerti.component.html',
   styleUrls: ['./partixcerti.component.css']
})

export class PartixcertiComponent implements OnInit {

   formPartixcerti: FormGroup;
   idcerti: number;
   iCertificacion = {} as interfaceCertificacion; //Interface para los datos de la Certificación
   _partixcerti: any;
   swnuevo: boolean
   _pargas: any[] = [];
   intpre: number | null;
   partida: { codpar: String, saldo: number, newsaldo: number } = { codpar: '', saldo: 0, newsaldo: 0 };
   swmodificar: boolean;
   sweliminar: boolean = false;

   constructor(private router: Router, private fb: FormBuilder,
      private certiService: CertipresuService, private s_partixcerti: PartixcertiService, private presuService: PresupueService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/certipresu');
      let coloresJSON = sessionStorage.getItem('/certipresu');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.idcerti = +sessionStorage.getItem('idcertiToPartixcerti')!.toString();
      this.obtenerCertipresu();
      this.creaForm();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   creaForm() {
      //Form de nueva/modificar partixcerti
      this.formPartixcerti = this.fb.group({
         intpre: ['', [Validators.required], [this.valCodpar.bind(this)]],
         codpar: '',
         nompar: '',
         saldo: '',
         valor: ['', [Validators.required], [this.valValor.bind(this)]],
         newsaldo: '',
         descripcion: this.iCertificacion.descripcion
      },
         { updateOn: "blur" }
      );
   }

   obtenerCertipresu() {
      this.certiService.getByIdCerti(this.idcerti).subscribe({
         next: datos => {
            this.iCertificacion.numero = datos.numero;
            this.iCertificacion.fecha = datos.fecha;
            this.iCertificacion.docu = datos.intdoc.nomdoc + ' ' + datos.numdoc
            this.iCertificacion.respon = datos.idbeneres.nomben
            this.iCertificacion.descripcion = datos.descripcion;
            this.obtenerPartixcerti();
         },
         error: (e) => console.error(e),
      });
   }

   obtenerPartixcerti() {
      this.s_partixcerti.getByIdCerti(this.idcerti).subscribe({
         next: datos => {
            this._partixcerti = datos;
         },
         error: (e) => console.error(e),
      });
   }

   get f() { return this.formPartixcerti.controls; }

   nuevo() {
      this.swnuevo = true;
      this.creaForm();
   }

   cancelar() { 
      this.swnuevo = false; 
      this.swmodificar = false;
   }

   regresar() { this.router.navigate(['/certipresu']); }

   modificar(partixcerti: any) {
      this.swmodificar = true;
      this.intpre = partixcerti.intpre;
      this.partida.saldo = +partixcerti.saldo;
      this.partida.newsaldo = this.partida.saldo - partixcerti.valor;
      // console.log('this.partida.newsaldo: ', this.partida.newsaldo)
      this.formPartixcerti.patchValue({
         intpre: partixcerti.intpre,
         codpar: partixcerti.intpre.codpar,
         nompar: partixcerti.intpre.nompar,
         saldo: formatNumber2(this.partida.saldo),
         valor: partixcerti.valor,
         newsaldo: formatNumber2(this.partida.newsaldo),
         descripcion: partixcerti.descripcion,
      });
   }

   //Datalist de codpar 
   partidaxCodpar(e: any) {
      if (e.target.value != '') {
         this.presuService.findByCodpar(2, e.target.value).subscribe({
            next: datos => this._pargas = datos,
            error: err => console.error(err.error),
         });
      }
   }
   onPartidaSelected(e: any) {
      const selectedOption = this._pargas.find((x: { codpar: any; }) => x.codpar === e.target.value);
      if (selectedOption) {
         this.intpre = selectedOption.intpre;
         this.partida.saldo = selectedOption.inicia + selectedOption.totmod;
         this.formPartixcerti.patchValue({
            nompar: selectedOption.nompar,
            saldo: selectedOption.inicia + selectedOption.totmod,
            valor: '',
            newsaldo: ''
         });
      }
      else this.intpre = null;
   }

   handleClick(cuenta: any) {
   }

   eliminar(partixcerti: Partixcerti) {
      this.sweliminar = false;
      this.partida.codpar = partixcerti.intpre.codpar;
      // this.tranService.porIdasiento(asiento.idasiento).subscribe({
      //    next: resp => {
      //       this.sweliminar = !resp
      //       this.iAsiento.idasiento = asiento.idasiento;
      //       this.iAsiento.asiento = asiento.asiento;
      //    },
      //    error: err => console.error('Al buscar si el Asiento tiene Transacciones: ', err.error),
      // });
   }

   //Valida que se haya seleccionado una Partida
   valCodpar(control: AbstractControl) {
      if (this.intpre == null) return of({ 'invalido': true });
      else return of(null);
   }

   //Valida el Valor
   valValor(control: AbstractControl) {
      this.partida.newsaldo = Math.round(( this.partida.saldo - +this.formPartixcerti.controls['valor'].value) * 100) / 100;
      // this.partida.newsaldo = Math.round((+this.formPartixcerti.controls['saldo'].value - +this.formPartixcerti.controls['valor'].value) * 100) / 100;
      // console.log('this.partida.newsaldo (en validar): ', this.partida.newsaldo);
      this.formPartixcerti.controls['newsaldo'].setValue(formatNumber2(this.partida.newsaldo));
      if (this.partida.newsaldo < 0) return of({ 'invalido': true });
      else return of(null);
   }

}

interface interfaceCertificacion {
   numero: number;
   fecha: Date;
   docu: string;
   respon: string;
   descripcion: String;
}

function formatNumber2(num: number) {
   return num.toFixed(2).replace(/\./g, ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}