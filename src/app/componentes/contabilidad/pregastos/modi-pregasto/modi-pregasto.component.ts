import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from '@compartida/autoriza.service';
import { Clasificador } from '@modelos/clasificador.model';
import { Cuentas } from '@modelos/contabilidad/cuentas.model';
import { Estrfunc } from '@modelos/contabilidad/estrfunc.model';
import { Presupue } from '@modelos/contabilidad/presupue.model';
import { CuentasService } from '@servicios/contabilidad/cuentas.service';
import { map } from 'rxjs';
import { ClasificadorService } from 'src/app/servicios/clasificador.service';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucio.service';
import { EstrfuncService } from 'src/app/servicios/contabilidad/estrfunc.service';
import { PregastoService } from 'src/app/servicios/contabilidad/pregasto.service';

@Component({
   selector: 'app-modi-pregasto',
   templateUrl: './modi-pregasto.component.html',
   styleUrls: ['./modi-pregasto.component.css']
})

export class ModiPregastoComponent implements OnInit {

   formPregasto: FormGroup;
   partida: Presupue;
   intpre: number;
   actividades: Estrfunc[] = [];
   clasificador: Clasificador[] = [];
   antcodpar: String;
   codactividad: String;
   codificado: number;
   reformas: number;
   movimientos: boolean;
   asocuentas: Cuentas[] = [];

   constructor(public fb: FormBuilder, public pregasService: PregastoService, private estrfuncService: EstrfuncService,
      private clasiService: ClasificadorService, private router: Router, private ejecuService: EjecucionService,
      private cueService: CuentasService, private authService: AutorizaService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/pregastos');
      let coloresJSON = sessionStorage.getItem('/pregastos');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.intpre = +sessionStorage.getItem("intpreGToModi")!;

      this.formPregasto = this.fb.group({
         intest: '',
         codacti: ['', Validators.required],
         intcla: [, [Validators.required, Validators.minLength(8), Validators.maxLength(8)]],
         codpart: ['', Validators.required],
         nomcla: '',
         codpar: ['', [Validators.required, Validators.minLength(17), Validators.maxLength(17)], this.valCodpar.bind(this)],
         nompar: [null, [Validators.required, Validators.minLength(3)]],
         inicia: ['', [Validators.required]],
         totmod: '',
         codificado: ''
      }, { updateOn: "blur" });

      this.buscaPartida();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   buscaPartida() {
      this.pregasService.getById(this.intpre).subscribe({
         next: (partida: Presupue) => {
            this.partida = partida;
            this.antcodpar = partida.codpar;
            this.codactividad = partida.codacti;
            this.reformas = partida.totmod;
            this.codificado = partida.inicia + partida.totmod;
            this.formPregasto.patchValue({
               intest: partida.intest,
               codacti: partida.codacti,
               intcla: partida.intcla,
               codpart: partida.codpart,
               nomcla: partida.intcla.nompar,
               codpar: partida.codpar,
               nompar: partida.nompar,
               inicia: partida.inicia,
               totmod: partida.totmod,
               codificado: partida.inicia + partida.totmod
            });
            this.movimi()
         },
         error: err => console.error(err.error)
      });
   }

   movimi() {
      this.ejecuService.tieneEjecucio(this.antcodpar.toString()).subscribe({
         next: resp => this.movimientos = resp,
         error: err => console.error('Al buscar la Ejecucuón de la Partida: ', err.error),
      });
   }

   get f() { return this.formPregasto.controls; }

   listaActividades(e: any) {
      if (e.target.value != '') {
         this.estrfuncService.getCodigoNombre(e.target.value.toLowerCase()).subscribe({
            next: (estrfunc: Estrfunc[]) => {
               this.actividades = estrfunc;
               this.codactividad = e.target.value;
               this.formPregasto.controls['codpar'].setValue(e.target.value);
            },
            error: err => console.error(err.error),
         });
      }
   }

   listaClasificador(e: any) {
      if (e.target.value != '') {
         this.clasiService.getPartidasG(e.target.value.toLowerCase()).subscribe({
            next: (clasificador: Clasificador[]) => {
               this.clasificador = clasificador;
               this.formPregasto.controls['codpar'].setValue(this.codactividad + '.' + e.target.value);
            },
            error: err => console.error(err.error),
         });
      }
   }

   cuentasAsociadas() {
      this.cueService.getByAsodebe(this.partida.codigo).subscribe({
         next: (cuentas: Cuentas[]) => this.asocuentas = cuentas,
         error: err => { console.error(err.error); this.authService.mostrarError('Error al recuperar las Cuentas asociadas', err.error) }
      });
   }

   actualizar() {
      const dto: PresupueUpdateDTO = {};   // Todos los campos opcionales
      if (this.f['codacti'].dirty) { dto.codacti = this.f['codacti'].value; }
      if (this.f['intest'].dirty) { dto.intest = { intest: this.f['intest'].value }; }
      if (this.f['codpart'].dirty) { dto.codpart = this.f['codpart'].value; }
      if (this.f['intcla']?.dirty) { dto.intcla = { intcla: this.f['intcla'].value }; }
      if (this.f['codpar'].dirty) { 
         dto.codpar = this.f['codpar'].value; 
         dto.codigo = this.f['codpar'].value.substring(3, 20)
      }
      if (this.f['nompar'].dirty) { dto.nompar = this.f['nompar'].value; }
      dto.usumodi = this.authService.idusuario;
      dto.fecmodi = new Date();

      const codpar: string = this.formPregasto.get('codpar')?.value;
      this.pregasService.updatePartida(this.intpre, dto).subscribe({
         next: resp => {
            if (this.antcodpar != codpar) {
               this.ejecuService.actualizarCodpar(this.intpre, codpar).subscribe({
                  next: () => {
                     // this.authService.swal('success', `Partida ${resp.codpar} actualizada con éxito`);
                  },
                  error: err => { console.error(err.error); this.authService.mostrarError('Error al actualizar Ejecución', err.error) }
               });
            }
            this.authService.swal('success', `Partida ${resp.codpar} actualizada con éxito`);
            this.regresar();
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al actualizar', err.error) }
      });
   }

   regresar() { this.router.navigate(['/pregastos']); }

   valCodpar(control: AbstractControl) {
      return this.pregasService.getByCodigo(control.value)
         .pipe(
            map(result => result.length == 1 && control.value != this.antcodpar ? { existe: true } : null)
         );
   }

}

export interface PresupueUpdateDTO {
   codacti?: String;
   intest?: { intest: number | null };
   codpart?: String;
   intcla?: { intcla: number | null };
   codpar?: String;
   codigo?: String;
   nompar?: String;
   inicia?: number;
   swpluri?: number;
   usumodi?: number;
   fecmodi?: Date;
}