import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from '@compartida/autoriza.service';
import { Documentos } from '@modelos/administracion/documentos.model';
import { Asientos } from '@modelos/contabilidad/asientos.model';
import { Ejecucio } from '@modelos/contabilidad/ejecucio.model';
import { Tramipresu } from '@modelos/contabilidad/tramipresu.model';
import { Transaci } from '@modelos/contabilidad/transaci.model';
import { DocumentosService } from '@servicios/administracion/documentos.service';
import { AsientosService } from '@servicios/contabilidad/asientos.service';
import { EjecucionService } from '@servicios/contabilidad/ejecucio.service';
import { TramipresuService } from '@servicios/contabilidad/tramipresu.service';
import { TransaciService } from '@servicios/contabilidad/transaci.service';
import { of } from 'rxjs';
import { EjecucioVM } from 'src/app/dtos/contabilidad/ejecucio.dto';
import { TransaciUpdateDTO } from 'src/app/dtos/contabilidad/transaci.dto';

@Component({
  selector: 'app-modi-desdetramite',
  templateUrl: './modi-desdetramite.component.html',
  styleUrls: ['./modi-desdetramite.component.css']
})

export class ModiDesdetramiteComponent implements OnInit {

   formTransaci!: FormGroup;
   inttra: number;
   idasiento: number;
   iAsiento = {} as interfaceAsiento; //Interface para los datos del Asiento
   idcuenta: number | null;
   documentos: Documentos[] = [];
   totDebe: number;
   totHaber: number;
   ejecucio: Ejecucio;
   // antdevengado: number = 0;
   tramipresu: Tramipresu;

   constructor(private router: Router, private fb: FormBuilder, private asiService: AsientosService, public authService: AutorizaService,
      private docuService: DocumentosService, private tranService: TransaciService, private ejecuService: EjecucionService,
      private tramiService: TramipresuService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/transaci');
      let coloresJSON = sessionStorage.getItem('/transaci');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      const datosToModiTransaci = JSON.parse(sessionStorage.getItem("datosToModiTransaci")!);
      this.inttra = +datosToModiTransaci.inttra;
      this.idasiento = datosToModiTransaci.idasiento;
      this.totDebe = +datosToModiTransaci.totDebe;
      this.totHaber = +datosToModiTransaci.totHaber;

      this.formTransaci = this.fb.group({
         orden: ['', Validators.required],
         cuenta: [''],
         codcue: '',
         nomcue: [''],
         debcre: [''],
         nomdebcre: '',
         valor: ['', [Validators.required, Validators.min(0.01)], [this.valValor()]],
         antvalor: '',
         intdoc: '',
         numdoc: ['', Validators.required],
         descri: ['', Validators.required],
         codpar: '',
         nompar: '',
         devengado: '',
         tramite: '',
         prmiso: '',
         totdeven: ''
      },
         { updateOn: "blur" }
      );

      this.listarDocumentos();
      this.datosAsiento();
      this.buscaTransaccion();

      this.formTransaci.get('valor')!.valueChanges.subscribe(valor => { this.actualizaDevengado() });
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
      // this.colorForaneas();
   }

   get f() { return this.formTransaci.controls; }

   listarDocumentos() {
      this.docuService.getListaDocumentos().subscribe({
         next: (documentos: Documentos[]) => this.documentos = documentos,
         error: (err) => { console.error(err.error); this.authService.mostrarError('Error al recuperar Documentos', err.error) }
      });
   }

   datosAsiento() {
      this.asiService.unAsiento(this.idasiento).subscribe({
         next: (asie: Asientos) => {
            this.iAsiento.idasiento = asie.idasiento;
            this.iAsiento.asiento = asie.asiento;
            this.iAsiento.fecha = asie.fecha;
            this.iAsiento.tipasi = asie.tipasi;
            this.iAsiento.comprobante = this.authService.comprobante(asie.tipcom, asie.compro);
            this.iAsiento.benefi = asie.idbene.nomben;
            this.iAsiento.documento = asie.intdoc.nomdoc + ' ' + asie.numdoc;
            this.iAsiento.intdoc = asie.intdoc.intdoc;
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar el Asiento', err.error) }
      });
   }

   buscaTransaccion() {
      this.tranService.getById(this.inttra).subscribe({
         next: (transaci: Transaci) => {
            this.idcuenta = transaci.idcuenta.idcuenta;
            this.formTransaci.patchValue({
               orden: transaci.orden,
               intdoc: transaci.intdoc.intdoc,
               numdoc: transaci.numdoc,
               codcue: transaci.idcuenta.codcue,
               nomcue: transaci.idcuenta.nomcue,
               nomdebcre: transaci.debcre == 1 ? 'Débito' : 'Crédito',
               valor: transaci.valor,
               antvalor: transaci.valor,
               descri: transaci.descri
            });
            this.ejecuService.getByInttra(this.inttra).subscribe({
               next: (ejecucio: Ejecucio | null) => {
                  this.ejecucio = ejecucio!;
                  // this.antdevengado = ejecucio!.devengado
                  this.formTransaci.patchValue({
                     codpar: ejecucio!.intpre.codpar,
                     nompar: ejecucio!.intpre.nompar,
                     devengado: ejecucio!.devengado
                  });
                  // Busca compromiso
                  let idprmiso = ejecucio!.idprmiso!;
                  this.ejecuService.getById(idprmiso).subscribe({
                     next: (ejecucompromiso: EjecucioVM) => {
                        // Busca tramite
                        if (ejecucompromiso) {
                           this.tramiService.findById(ejecucompromiso.idtrami).subscribe({
                              next: (tramipresu: Tramipresu) => {
                                 this.tramipresu = tramipresu;
                                 this.formTransaci.patchValue({
                                    tramite: tramipresu.numero,
                                    prmiso: ejecucompromiso.prmiso,
                                    totdeven: ejecucompromiso.totdeven
                                 });
                              },
                              error: err => {
                                 console.error(err.error); this.authService.mostrarError('Error al buscar el Trámite', err.error)
                              }
                           })
                        }
                     },
                     error: err => {
                        console.error(err.error); this.authService.mostrarError('Error al buscar el Compromiso del Devengado', err.error)
                     }
                  });
               },
               error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar la Ejecución', err.error) }
            });
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar la Transacción', err.error) }
      });
   }

   seleccionarTexto(event: FocusEvent): void {
      const input = event.target as HTMLInputElement;
      input.select();
   }

   actualizaDevengado() {
      const valor = this.formTransaci.get('valor')!.value || 0;
      const devengado = valor;
      this.formTransaci.patchValue({ devengado });
   }

   actualizar() {
      const dto: TransaciUpdateDTO = {};
      if (this.f['orden'].dirty) { dto.orden = this.formTransaci.value.orden }
      // if (this.f['idcuenta'].dirty) { dto.idcuenta = { idcuenta: this.idcuenta! } }
      if (this.f['intdoc'].dirty) { dto.intdoc = { intdoc: this.f['intdoc'].value } }
      if (this.f['numdoc'].dirty) { dto.numdoc = this.formTransaci.value.numdoc }
      // if (this.f['debcre'].dirty) { dto.debcre = this.f['debcre'].value }
      if (this.f['valor'].dirty) { dto.valor = this.f['valor'].value }
      if (this.f['descri'].dirty) { dto.descri = this.f['descri'].value }
      dto.usumodi = this.authService.idusuario;
      dto.fecmodi = new Date();
      this.tranService.updateTransa(this.inttra, dto).subscribe({
         next: (transaci: Transaci) => {
            this.authService.swal('success', `Transacción de la Cuenta ${transaci.codcue} modificada con éxito`);
            this.regresar();
         },
         error: err => console.error(err.error),
      });
      // const docSeleccionado = this.documentos.find(d => d.iddocumento === this.formTransaccion.value.documento);
      // let transaccion: Transaci = new Transacciones();
      // Object.assign(transaccion, this.formTransaccion.value);
      // transaccion.tiptran = this.transaccion.tiptran;
      // //Tablas foraneas
      // let asiento: Asientos = new Asientos();
      // asiento.idasiento = this.idasiento;
      // transaccion.asiento = asiento;

      // transaccion.documento = docSeleccionado!;

      // let cuenta: Cuentas = new Cuentas();
      // cuenta.idcuenta = this.idcuenta!;
      // transaccion.cuenta = cuenta;

      // let beneficiario: Beneficiarios = new Beneficiarios();
      // beneficiario.idbeneficiario = 1;
      // transaccion.beneficiario = beneficiario;

      // transaccion.usumodi = this.authService.idusuario;
      // transaccion.fecmodi = new Date()

      // this.tranService.updateTransaccion(this.idtransaccion, transaccion).subscribe({
      //    next: () => {
      //       // Actualiza la ejecucion asociada a la transacción. El Back actualiza el compromiso
      //       if (this.ejecucion && this.antdevengado != this.formTransaccion.value.devengado) {
      //          this.ejecucion.devengado = this.formTransaccion.value.devengado;
      //          this.ejecucion.concepto = this.formTransaccion.value.concepto;
      //          this.ejecucion.usumodi = this.authService.idusuario;
      //          this.ejecucion.fecmodi = new Date();
      //          this.ejecuService.updateEjecucionDevengado(this.ejecucion.idejecucion, this.ejecucion).subscribe({
      //             next: () => {
      //                this.authService.swal('success', 'Transacción, Ejecución y Compromiso actualizados con éxito')
      //                this.regresar();
      //             },
      //             error: err => { console.error(err.error); this.authService.mostrarError('Error al actualizar la Ejecución', err.error) }
      //          });
      //       }
      //       else {
      //          this.authService.swal('success', 'Transacción actualizada con éxito')
      //          this.regresar();
      //       }
      //    },
      //    error: err => { console.error(err.error); this.authService.mostrarError('Error al actualizar la Transacción', err.error) }
      // });
   }

   abrirTramite() {
      const datosToPrmisoxtrami = {
         idtrami: this.tramipresu.idtrami,
         desdeNum: 1,
         // hastaNum: compromiso.partixcerti?.idcerti.numero,
         padre: 'Ninguno'
      };
      sessionStorage.setItem('idtramiToPrmisoxtrami', this.tramipresu.idtrami.toString());
      // this.router.navigate(['prmisoxtrami']);
      // sessionStorage.setItem('datosToPrmisoxtrami', JSON.stringify(datosToPrmisoxtrami));
      const url = `${window.location.origin}/prmisoxtrami`;
      window.open(url, '_blank');
   }

   regresar() { this.router.navigate(['/transaci']); }

   valValor(): AsyncValidatorFn {
      return (control: AbstractControl) => {
         const nuevoValor = Number(control.value) || 0;
         const antvalor = Number(this.f['antvalor']?.value) || 0;
         if (antvalor == 0) return of(null);
         const totdevenActual = Number(this.f['totdeven'].value) || 0;
         const prmiso = Number(this.f['prmiso'].value) || 0;
         const totdevenNuevo = totdevenActual - antvalor + nuevoValor;
         const saldo = prmiso - totdevenNuevo;
         // Si saldo < 0, devuelve error y el monto máximo permitido
         if (saldo < 0) {
            const maxPermitido = antvalor + (prmiso - totdevenActual);
            return of({ saldoNegativo: { maxPermitido: maxPermitido } });
         }
         return of(null);
      };
   }

}

interface interfaceAsiento {
   idasiento: number;
   asiento: number;
   fecha: Date;
   tipasi: number;
   comprobante: string;
   documento: String;
   benefi: String;
   intdoc: number;
   concepto: string;
}

//Nombre Tipo de Comprobante
// function nomcomprobante(tipcom: number): string {
//    switch (tipcom) {
//       case 1: return 'I-';
//       case 2: return 'E-';
//       case 3: return 'DC-';
//       case 4: return 'DI-';
//       case 5: return 'DE-';
//       default: return '';
//    }
// }
