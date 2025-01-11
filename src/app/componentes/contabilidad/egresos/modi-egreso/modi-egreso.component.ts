import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map, of } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import { BeneficiariosService } from 'src/app/servicios/contabilidad/beneficiarios.service';

@Component({
   selector: 'app-modi-egreso',
   templateUrl: './modi-egreso.component.html',
   styleUrls: ['./modi-egreso.component.css']
})
export class ModiEgresoComponent implements OnInit {

   formEgreso: FormGroup;
   idasiento: number;
   _documentos: any;
   antcompro: number;

   constructor(private fb: FormBuilder, private router: Router, public authService: AutorizaService,
      private asiService: AsientosService, private docService: DocumentosService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/egresos');
      let coloresJSON = sessionStorage.getItem('/egresos');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.idasiento = +sessionStorage.getItem("idasientoToModi")!;
      sessionStorage.removeItem("idasientoToModi") //Quitar comentario 

      this.listaDocumentos();
      this.buscaEgreso();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   buscaEgreso() {
      this.asiService.getById(this.idasiento).subscribe({
         next: datos => {
            this.antcompro = datos.compro;
            let fecha: Date = new Date();
            this.formEgreso = this.fb.group({
               asiento: datos.asiento,
               fecha: datos.fecha,
               tipasi: datos.tipasi,
               tipcom: datos.tipcom,
               compro: [datos.compro, [Validators.required, Validators.min(1)], this.valCompro.bind(this)],
               numcue: datos.numcue,
               totdeb: datos.totdeb,
               totcre: datos.totcre,
               glosa: datos.glosa,
               numdoc: datos.numdoc,
               numdocban: datos.numdocban,
               cerrado: datos.cerrado,
               swretencion: datos.swretencion,
               totalspi: datos.totalspi,
               intdoc: datos.intdoc,
               idbene: datos.idbene,
               idcueban: datos.idcueban,
               usucrea: datos.usucrea,
               feccrea: datos.feccrea,
               usumodi: this.authService.idusuario,
               fecmodi: fecha,
               nomben: datos.idbene.nomben,
            },
               { updateOn: "blur" }
            );
         },
         error: err => console.error(err.error)
      });
   }

   //Documentos para el combo
   listaDocumentos() {
      this.docService.getListaDocumentos().subscribe({
         next: datos => this._documentos = datos,
         error: err => console.error('Al recuperar los documentos', err.error)
      });
   }

   comparaDocumentos(o1: Documentos, o2: Documentos): boolean { return o1.intdoc == o2.intdoc; }

   get f() { return this.formEgreso.controls; }

   actualizar() {
      this.asiService.updateAsiento(this.idasiento, this.formEgreso.value).subscribe({
         next: nex => this.regresar(),
         error: err => console.error(err.error),
      });
   }
   
   regresar() { this.router.navigate(['/egresos']); }

   //Valida el número de egreso
   valCompro(control: AbstractControl) {
      return this.asiService.valCompro(2, control.value)
         .pipe(
            map(result => control.value != this.antcompro && result ? { existe: true } : null)
         );
   }

}
