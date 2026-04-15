import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormArray, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from '@compartida/autoriza.service';
import { Certipresu } from '@modelos/contabilidad/certipresu.model';
import { Partixcerti } from '@modelos/contabilidad/partixcerti.model';
import { Tramipresu } from '@modelos/contabilidad/tramipresu.model';
import { CertipresuService } from '@servicios/contabilidad/certipresu.service';
import { EjecucionService } from '@servicios/contabilidad/ejecucio.service';
import { PartixcertiService } from '@servicios/contabilidad/partixcerti.service';
import { TramipresuService } from '@servicios/contabilidad/tramipresu.service';
import { firstValueFrom } from 'rxjs';
import { EjecucioCreateDTO } from 'src/app/dtos/contabilidad/ejecucio.dto';

@Component({
  selector: 'app-add-partixtramite',
  templateUrl: './add-partixtramite.component.html',
  styleUrls: ['./add-partixtramite.component.css']
})
export class AddPartixtramiteComponent implements OnInit {

   idtrami: number;
   iTramite = {} as interfaceTramite; //Datos del Trámite
   formCertipresu: FormGroup;
   swnumcerti: boolean = false;
   partixcerti: Partixcerti[] = [];
   formAComprometer: FormGroup;
   swfechamayor = false;
   totalesCalculados = { totalValor: 0, totalSaldo: 0, totalComprometido: 0, totalNuevoSaldo: 0 };

   constructor(private router: Router, private fb: FormBuilder, public authService: AutorizaService, private tramiService: TramipresuService,
      private certiService: CertipresuService, private parxcerService: PartixcertiService, private ejecuService: EjecucionService) { }

   ngOnInit(): void {
      if (!this.authService.sessionlog) { this.router.navigate(['/inicio']); }
      sessionStorage.setItem('ventana', '/tramipresu');
      let coloresJSON = sessionStorage.getItem('/tramipresu');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.idtrami = Number(sessionStorage.getItem('idtramiToAddPartixtramite'));

      this.formCertipresu = this.fb.group({
         numero: ['', [Validators.required, Validators.min(1)]],
         fecha: '',
         descripcion: ''
      }, { updateOn: "change" });

      this.buscaTramite();
      this.formAComprometer = this.fb.group({ acomprometer: this.fb.array([]) });
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   buscaTramite() {
      this.tramiService.findById(this.idtrami).subscribe({
         next: (tramipresu: Tramipresu) => {
            this.iTramite.numero = tramipresu.numero;
            this.iTramite.fecha = tramipresu.fecha;
            this.iTramite.docu = tramipresu.intdoc.nomdoc + ' ' + tramipresu.numdoc
            this.iTramite.beneficiario = tramipresu.idbene.nomben
            this.iTramite.descri = tramipresu.descri;
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar el Trámite', err.error) }
      });
   }

   get f() { return this.formCertipresu.controls; }

   changeNumcerti() {
      let numcerti = this.formCertipresu.value.numero;
      this.certiService.getByNumero(numcerti, 1).subscribe({
         next: (certipresu: Certipresu | null) => {
            if (certipresu == null) {
               this.swnumcerti = false;
               this.authService.swal('warning', `No existe la Certificación Nro: ${this.formCertipresu.value.numero}`);
            }
            else {
               this.swnumcerti = true;
               this.swfechamayor = false;
               if( certipresu.fecha > this.iTramite.fecha) {
                  this.swfechamayor = true;
                  this.authService.swal('warning', `La fecha de la Certificación: ${this.formCertipresu.value.numero} es mayor que la fecha del Trámite`);
               }
               this.formCertipresu.controls['fecha'].setValue(certipresu.fecha.toString());
               this.formCertipresu.controls['descripcion'].setValue(certipresu.descripcion);
               this.parxcerService.getByIdCerti(certipresu.idcerti).subscribe({
                  next: (partixcerti: Partixcerti[]) => {
                     this.partixcerti = partixcerti;
                     if (this.partixcerti.length > 0) {
                        const controles = partixcerti.map((parxcer) => {
                           const saldo = parxcer.valor - parxcer.totprmisos;
                           const control = this.fb.control(
                              { value: 0, disabled: saldo == 0 || this.swfechamayor }, [Validators.required, Validators.min(0)], [this.valCompromiso()]
                           );
                           return control;
                        })
                        this.formAComprometer.setControl('acomprometer', this.fb.array(controles));
                        this.geterFormArray.valueChanges.subscribe(() => { this.calcularTotales(); });
                        this.geterFormArray.statusChanges.subscribe(() => { this.calcularTotales() });
                        this.calcularTotales();
                     }
                     else { this.authService.swal('warning', `La Certificación Nro: ${this.formCertipresu.value.numero} no tiene Partida(s)`) }
                  },
                  error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar las Partidas', err.error) }
               });
            }
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar la Certificación', err.error) }
      })
   }

   get geterFormArray(): FormArray { return this.formAComprometer.get('acomprometer') as FormArray; }

   seleccionarTexto(event: FocusEvent): void {
      const input = event.target as HTMLInputElement;
      input.select();
   }

   dobleclick(i: number) { }

   calcularTotales() {
      let algunInvalido = false;
      this.totalesCalculados = this.partixcerti.reduce((acc, parxcer, index) => {
         const valor = parxcer.valor ?? 0;
         const totprmisos = parxcer.totprmisos ?? 0;
         const saldo = valor - totprmisos;
         const control = this.geterFormArray.at(index);
         const inputVal = control?.value ?? 0;
         if (control?.invalid || control?.pending || inputVal > saldo) { algunInvalido = true }

         acc.totalValor += valor;
         acc.totalSaldo += saldo;
         acc.totalComprometido += inputVal;
         acc.totalNuevoSaldo += (saldo - inputVal);
         return acc;
      }, { totalValor: 0, totalSaldo: 0, totalComprometido: 0, totalNuevoSaldo: 0 });
      if (algunInvalido) { this.totalesCalculados.totalComprometido = 0 }
   }

   async guardar() {
      for (let index = 0; index < this.partixcerti.length; index++) {
         const parxcer = this.partixcerti[index];
         const control = this.geterFormArray.at(index);
         const compromiso = control?.value ?? 0;
         if (control.valid && compromiso > 0) {
            const dtoEjecucio: EjecucioCreateDTO = {
               tipeje: 3,
               intpre: { intpre: parxcer.intpre.intpre },
               codpar: parxcer.intpre.codpar,
               fecha_eje: this.iTramite.fecha,
               modifi: 0,
               prmiso: compromiso,
               totdeven: 0,
               devengado: 0,
               cobpagado: 0,
               concep: this.iTramite.descri.toString(),
               idrefo: 0,
               idtrami: this.idtrami,
               idasiento: null,
               inttra: null,
               idparxcer: parxcer.idparxcer,
               idprmiso: null,
               idtrata: 0,
               usucrea: this.authService.idusuario,
               feccrea: new Date(),
            };
            try {
               await firstValueFrom(this.ejecuService.saveEjecu(dtoEjecucio));
            } catch (err) {
               console.error(err);
               this.authService.mostrarError('Error al guardar Ejecucio', err);
               return;
            }
         }
      }
      this.authService.swal('success', `Compromiso(s) de las Partida(s) del Trámite ${this.iTramite.numero} guardada(s) con éxito`);
      this.regresar();
   }

   regresar() { this.router.navigate(['/prmisoxtrami']); }

   // Valida valor a comprometer
   valCompromiso(): AsyncValidatorFn {
      return (control: AbstractControl): Promise<ValidationErrors | null> => {
         return new Promise(resolve => {
            Promise.resolve().then(() => {
               const index = this.geterFormArray.controls.indexOf(control);
               const parxcer = this.partixcerti[index];
               if (!parxcer) return resolve(null);
               const valor = parseFloat(control.value);
               const saldo = parxcer.valor - parxcer.totprmisos;
               if (isNaN(valor)) return resolve(null);
               if (valor > saldo) {
                  resolve({ compromisoExcede: { maxPermitido: saldo } });
               } else { resolve(null) }
            });
         });
      };
   }

}

interface interfaceTramite {
   numero: number;
   fecha: Date;
   docu: string;
   beneficiario: string;
   descri: String;
}
