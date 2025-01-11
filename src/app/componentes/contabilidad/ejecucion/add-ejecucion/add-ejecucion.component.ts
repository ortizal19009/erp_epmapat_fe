import { Component, OnInit } from '@angular/core';

import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucio.service';
import { Presupue } from 'src/app/modelos/contabilidad/presupue.model';
import { Reformas } from 'src/app/modelos/contabilidad/reformas.model';
import { ReformasService } from 'src/app/servicios/contabilidad/reformas.service';
import { PreingresoService } from 'src/app/servicios/contabilidad/preingreso.service';
import { EjecucionComponent } from '../ejecucion/ejecucion.component';

@Component({
   selector: 'app-add-ejecucion',
   templateUrl: './add-ejecucion.component.html',
   styleUrls: ['./add-ejecucion.component.css']
})

export class AddEjecucionComponent implements OnInit {

   formEjecucion: any;
   codpar: String;
   nompar: String;
   idrefo: number;
   reforma = {} as Reformas;
   _partidas: any;

   partida: Presupue = new Presupue;

   constructor(public fb: FormBuilder, public ejecuService: EjecucionService,
       private preingService: PreingresoService, private parent: EjecucionComponent,
      private refoService: ReformasService) { }

   ngOnInit(): void {
      this.idrefo = +sessionStorage.getItem("idrefoToEjecucion")!;
      this.refoService.getById(this.idrefo).subscribe({
         next: resp => {
            this.reforma.numero = resp.numero;
            this.reforma.fecha = resp.fecha;
            this.reforma.tipo = resp.tipo;
            this.reforma.concepto = resp.concepto;
         },
         error: err => console.error(err.error)
      })
      this.crearForm();
   }

   crearForm() {
      let fecha: Date = new Date();
      let presupue: Presupue = new Presupue;
      this.formEjecucion = this.fb.group({
         codpar: '',
         fecha_eje: fecha,
         tipeje: 3,
         modifi: 0,
         prmiso: 0,
         totdeven: 0,
         devengado: 0,
         cobpagado: 0,
         concepto: [null, [Validators.required]],
         usucrea: 0,
         feccrea: fecha,
         usumodi: 0,
         fecmodi: fecha,
         idrefo: this.idrefo,
         idtrami: 0,
         idparxcer: 0,
         idasiento: 0,
         idtransa: 0,
         intpre: [],
         idprmiso: 0,
         idevenga: 0,
         nompar: '',
         swpluri: ''
      },
         { updateOn: "blur" }
      );
   }

   onSubmit() {
      this.partida.intpre = this._partidas[0].intpre;
      this.formEjecucion.value.intpre = this.partida;
      this.formEjecucion.value.codpar = this.codpar;
      this.ejecuService.saveEjecucion(this.formEjecucion.value).subscribe({
         next: resp => {
            this.crearForm();
            this.parent.listarPartidas();
         },
         error: err => console.error('Al guardar la Partida en la Reforma: ', err.error)
      });

   }

   listarxCodigoNombre(e: any) {
      if (e.target.value != '') {
         if (this.reforma.tipo == 'I') {
            this.preingService.getByCodigoNombre(e.target.value.toLowerCase()).subscribe({
               next: datos => {
                  this._partidas = datos;
                  const inputValue = e.target.value;
                  const selectedPartida = this._partidas.find((partida: { codpar: any; }) => partida.codpar === inputValue);
                  if (selectedPartida) {
                     this.codpar = inputValue;
                     this.nompar = selectedPartida.nompar;
                  }
               },
               error: err => console.error(err.error),
            });
         }else{
            // this.pregasService.getByCodigoNombre(e.target.value.toLowerCase()).subscribe({
            //    next: datos => {
            //       this._partidas = datos;
            //       const inputValue = e.target.value;
            //       const selectedPartida = this._partidas.find((partida: { codpar: any; }) => partida.codpar === inputValue);
            //       if (selectedPartida) {
            //          this.codpar = inputValue;
            //          this.nompar = selectedPartida.nompar;
            //       }
            //    },
            //    error: err => console.error(err.error),
            // });
         }
      }
   }

}
