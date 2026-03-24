import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormArray, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { VisualFormatDirective } from 'src/app/directives/visual-format.directive';
import { PagoscobrosCreateDTO } from 'src/app/dtos/contabilidad/pagoscobros.dto';
import { TransaciCreateDTO } from 'src/app/dtos/contabilidad/transaci.dto';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { Asientos } from 'src/app/modelos/contabilidad/asientos.model';
import { Benextran } from 'src/app/modelos/contabilidad/benextran.model';
import { Cuentas } from 'src/app/modelos/contabilidad/cuentas.model';
import { Ejecucio } from 'src/app/modelos/contabilidad/ejecucio.model';
import { Presupue } from 'src/app/modelos/contabilidad/presupue.model';
import { Transaci } from 'src/app/modelos/contabilidad/transaci.model';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import { BenextranService } from 'src/app/servicios/contabilidad/benextran.service';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucio.service';
import { PagoscobrosService } from 'src/app/servicios/contabilidad/pagoscobros.service';
import { PresupueService } from 'src/app/servicios/contabilidad/presupue.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';

@Component({
  selector: 'app-add-pagoscobros',
  templateUrl: './add-pagoscobros.component.html',
  styleUrls: ['./add-pagoscobros.component.css']
})

export class AddPagoscobrosComponent implements OnInit {

  formTransaci!: FormGroup;
  formBeneficiarios!: FormGroup;
  iAsiento = {} as interfaceAsiento; //Interface para los datos del Asiento
  totDebe!: number;
  totHaber!: number
  idasiento!: number;
  tiptran!: { numero: number; nombre: string, cabecera1: string, cabecera2: string };
  nomben!: string;
  nomDebcre: string = 'Haber';
  cuentas: Cuentas[] = [];
  idcuenta!: number | null;
  documentos: Documentos[] = [];
  benextran: Benextran[] = [];
  hayregistros: boolean | null = null;
  ejecucionBenxtra: Ejecucio[] = [];
  presupue: Presupue[] = [];
  partidaSeleccionada: (Presupue | null)[] = [];
  totales: { totalValor: number; totalSaldo: number; totalLiquida: number; totalNuevosaldo: number; } = {
    totalValor: 0, totalSaldo: 0, totalLiquida: 0, totalNuevosaldo: 0
  };

  constructor(private router: Router, private fb: FormBuilder, private coloresService: ColoresService, private asiService: AsientosService,
    public authService: AutorizaService, private cueService: CuentasService, private tranService: TransaciService,
    private docuService: DocumentosService, private bxtService: BenextranService, private pagcobService: PagoscobrosService,
    private ejecuService: EjecucionService, private presuService: PresupueService) { }

  ngOnInit(): void {
    if (!this.authService.sessionlog) { this.router.navigate(['/inicio']); }
    sessionStorage.setItem('ventana', '/add-pagoscobros');
    let coloresJSON = sessionStorage.getItem('/add-pagoscobros');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    const datosToAddtransaci = JSON.parse(sessionStorage.getItem("datosToAddtransaci")!);
    this.idasiento = datosToAddtransaci.idasiento;
    this.totDebe = datosToAddtransaci.totDebe;
    this.totHaber = datosToAddtransaci.totHaber;
    const tiptranInfo = nombreTiptran(datosToAddtransaci.tiptran);
    this.tiptran = { numero: datosToAddtransaci.tiptran, nombre: tiptranInfo.nombre, cabecera1: tiptranInfo.cabecera1, cabecera2: tiptranInfo.cabecera2 };
    if (this.tiptran.numero > 10) this.nomDebcre = 'Debe';  //tiptran 8,9 y 10 => Haber  11 y 12 => Debe

    this.formTransaci = this.fb.group({
      orden: [+datosToAddtransaci.orden, Validators.required],
      idcuenta: ['', Validators.required, this.valCuenta()],
      codcue: '',
      nomcue: ['', Validators.required],
      valor: ['', Validators.required],
      intdoc: this.documentos,
      numdoc: ['', Validators.required],
      descri: '',
      nomben: ''
    }, { updateOn: "blur" });

    this.datosAsiento();
    this.listarDocumentos();

    this.formBeneficiarios = this.fb.group({ liquida: this.fb.array([]) });
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(this.authService.idusuario, 'add-pagoscobros');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/add-pagoscobros', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
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

  datosAsiento() {
    this.asiService.unAsiento(this.idasiento).subscribe({
      next: (asiento: Asientos) => {
        this.iAsiento.numero = asiento.asiento;
        this.iAsiento.fecha = asiento.fecha;
        this.iAsiento.comprobante = this.authService.comprobante(asiento.tipcom, asiento.compro);
        this.iAsiento.beneficiario = asiento.idbene.nomben;
        this.iAsiento.documento = asiento.intdoc.nomdoc + ' ' + asiento.numdoc;
        this.iAsiento.numdoc = asiento.numdoc;
        this.iAsiento.iddocumento = asiento.intdoc.intdoc;
        this.formTransaci.patchValue({
          intdoc: this.iAsiento.iddocumento,
          numdoc: asiento.numdoc,
          descri: asiento.glosa,
        });
      },
      error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar el Asiento', err.error) }
    });
  }

  listarDocumentos() {
    this.docuService.getListaDocumentos().subscribe({
      next: (documentos: Documentos[]) => this.documentos = documentos,
      error: (err) => console.error(err.error)
    });
  }

  // listaPartidas() {
  //    let tippar = 9
  //    if(this.tiptran.numero == 12) tippar = 2;
  //    this.presuService.getTippar(tippar).subscribe({
  //       next: (presupue: Presupue[]) => this.presupue = presupue,
  //       error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar las Partidas', err.error) }
  //    });
  // }

  get f() { return this.formTransaci.controls; }

  get formArrayLiquida(): FormArray { return this.formBeneficiarios.get('liquida') as FormArray; }

  cuentasxTiptran(e: any) {
    if (e.target.value != '') {
      this.cueService.findByTiptran(this.tiptran.numero - 6, e.target.value).subscribe({
        next: (cuentas: Cuentas[]) => this.cuentas = cuentas,
        error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar Cuentas por TipTran', err.error) },
      });
    }
  }
  onCuentaSelected(e: any) {
    const selectedOption = this.cuentas.find((x: { codcue: any; }) => x.codcue === e.target.value);
    if (selectedOption) {
      // console.log('Coloca: ', selectedOption.idcuenta)
      this.idcuenta = selectedOption.idcuenta;
      this.f['codcue'].setValue(selectedOption.codcue);
      this.formTransaci.controls['nomcue'].setValue(selectedOption.nomcue);
    }
    else {
      this.idcuenta = null;
      this.formTransaci.controls['nomcue'].setValue('');
    };
  }

  blurNomben() { this.nomben = this.formTransaci.get('nomben')!.value; }

  //Benextran de la cuenta seleccionada
  sinliquidar(): void {
    const hasta = this.iAsiento.fecha
    // console.log('hasta: ', hasta)
    const nomben = this.nomben ?? '';
    const tiptran = this.tiptran.numero - 6;
    const codcue = String(this.cuentas[0].codcue);
    this.bxtService.getACFP(hasta, nomben, tiptran, codcue).subscribe({
      next: (benextran: Benextran[]) => {
        this.benextran = benextran;
        this.benextran = this.benextran.map(bx => ({
          ...bx,
          presupue: this.presupue.find(p => p.intpre === bx.inttra.intpre) ?? null
        }));
        // console.log('presupue: ', benextran.presupue)
        if (this.benextran.length == 0) {
          this.hayregistros = false;
        } else {
          this.hayregistros = true;
          const controles = benextran.map(() =>
            this.fb.control(0, [Validators.required, Validators.min(0)], [this.valLiquida.bind(this)])
          );
          this.formBeneficiarios.setControl('liquida', this.fb.array(controles));
          this.formTransaci.controls['valor'].setValue(null);
          // this.partidaSeleccionada = benextran.map(bx => bx.inttra.intpre ?? null);
          // this.partidaSeleccionada = this.benextran[0].inttra.intpre;
          this.sumaTotales();
        }
      },
      error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar Benextran', err.error); }
    });
  }

  dobleclick(i: number): void {
    const fila = this.benextran[i];
    if (!fila) return;
    const control = this.formArrayLiquida.at(i);
    const saldo = fila.valor - fila.totpagcob;
    control.setValue(saldo);
    control.markAsTouched();
    control.updateValueAndValidity();
    this.sumaTotales();

    // Esperar a que el control esté VALID antes de evaluar
    const esperarValidacion = () => {
      const todosEditadosValidos = this.formArrayLiquida.controls
        .filter(c => c.touched)
        .every(c => c.status === 'VALID');

      this.formTransaci.controls['valor'].setValue(
        todosEditadosValidos ? this.totales.totalLiquida : null
      );
    };
    // Monitorear el estado del control hasta que sea VALID
    const sub = control.statusChanges.subscribe(status => {
      if (status === 'VALID') {
        esperarValidacion();
        sub.unsubscribe(); // limpiar suscripción
      }
    });
  }

  seleccionarTexto(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  changeValor(i: number) {
    this.sumaTotales();
    if (this.formArrayLiquida.valid && this.totales.totalLiquida > 0) {
      this.formTransaci.controls['valor'].setValue(this.totales.totalLiquida);
    } else { this.formTransaci.controls['valor'].setValue(null); }
  }

  sumaTotales(): void {
    let totalValor = 0;
    let totalSaldo = 0;
    let totalLiquida = 0;
    let totalNuevosaldo = 0;
    for (let i = 0; i < this.benextran.length; i++) {
      const benextran = this.benextran[i];
      const valor = benextran.valor || 0;
      const totpagcob = benextran.totpagcob || 0;
      const liquida = this.formArrayLiquida?.at(i)?.value || 0;

      totalValor += valor;
      totalSaldo += valor - totpagcob;
      totalLiquida += liquida;
      totalNuevosaldo += valor - totpagcob - liquida;
    }
    this.totales.totalValor = totalValor;
    this.totales.totalSaldo = totalSaldo;
    this.totales.totalLiquida = totalLiquida;
    this.totales.totalNuevosaldo = totalNuevosaldo;
  }

  //Recupera las ejecuciones del asiento de CxC o Cxp (Para PagadoCobrado)
  getPartidas(benextran: Benextran) {
    this.ejecuService.findByIdAsiento(benextran.inttra.idasiento.idasiento).subscribe({
      next: (ejecuciones: Ejecucio[]) => this.ejecucionBenxtra = ejecuciones,
      error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar la Ejecución', err.error) },
    });
  }

  changePartida(index: number, ejecucio: Ejecucio): void {
    this.partidaSeleccionada[index] = ejecucio.intpre;
  }

  async guardar() {
    try {
      // Filtra los que tienen valor
      const benxtraFilter = this.benextran
        .map((fila, i) => {
          const valorLiquida = parseFloat(this.formArrayLiquida.at(i).value);
          return !isNaN(valorLiquida) && valorLiquida != 0 ? { ...fila, liquida: valorLiquida } : null;
        })
        .filter(fila => fila !== null);

      const dtoTransaci: TransaciCreateDTO = {
        idasiento: { idasiento: this.idasiento },
        tiptran: this.tiptran.numero,
        orden: this.formTransaci.value.orden,
        idcuenta: { idcuenta: this.idcuenta! },
        codcue: this.formTransaci.value.codcue,
        debcre: this.nomDebcre === 'Haber' ? 2 : 1,
        valor: this.formTransaci.value.valor,
        intdoc: { intdoc: this.formTransaci.value.intdoc },
        numdoc: this.formTransaci.value.numdoc,
        descri: this.formTransaci.value.descri,
        idbene: { idbene: benxtraFilter[0]!.idbene!.idbene! },
        totbene: benxtraFilter.length,
        intpre: null,  //OJO: Chequear si se coloca intpre en pagoscobros
        usucrea: this.authService.idusuario,
        feccrea: new Date(),
      };
      const newTransaci: Transaci = await firstValueFrom(this.tranService.saveTransaci(dtoTransaci));
      sessionStorage.setItem('ultinttra', newTransaci.inttra.toString());
      //Si es cobro o pago añade la ejecucion
      if (this.tiptran.numero == 8 || this.tiptran.numero == 8) await this.guardaEjecucion(newTransaci, this.partidaSeleccionada[0]!, this.formTransaci.value)
      // Guarda los Pagoscobros (await en bucle)
      for (let i = 0; i < benxtraFilter.length; i++) {
        try {
          const dtoPagoscobros: PagoscobrosCreateDTO = {
            inttra: { inttra: newTransaci.inttra },
            idbene: { idbene: benxtraFilter[i]!.idbene!.idbene! },
            idbenxtra: { idbenxtra: benxtraFilter[i]!.idbenxtra! },
            // intpre: { intpre: number };
            valor: +benxtraFilter[i]!.liquida
          }
          // console.log('dtoPagoscobros: ', dtoPagoscobros)
          await firstValueFrom(this.pagcobService.savePagocobro(dtoPagoscobros));
        } catch (error) {
          console.error(`Error en la iteración ${i}:`, error);
          this.authService.mostrarError('Error al guardar', error);
        }
      }
      this.authService.swal('success', `Cuenta: ${newTransaci.codcue} guardada con éxito en el Asiento: ${this.iAsiento.numero}`);
      this.regresar();
    } catch (err: any) {
      this.authService.mostrarError('Error al guardar', err.error);
      console.error(err.error);
    }
  }

  // Crea la ejecucion (CobroPago)
  async guardaEjecucion(nuevaTransaccion: Transaci, partida: Presupue, cobpagado: number) {
    let ejecucion: Ejecucio = new Ejecucio();
    ejecucion.fecha_eje = this.iAsiento.fecha;
    ejecucion.tipeje = 4; //Cobro
    // ejecucion.anticipo = 0;
    ejecucion.modifi = 0;
    ejecucion.prmiso = 0;
    ejecucion.totdeven = 0;
    ejecucion.devengado = 0;
    ejecucion.cobpagado = cobpagado;
    ejecucion.concep = this.formTransaci.value.concepto;
    ejecucion.inttra = nuevaTransaccion.inttra;
    ejecucion.idasiento = this.idasiento;

    ejecucion.usucrea = this.authService.idusuario!;
    ejecucion.feccrea = new Date();

    let presupue: Presupue = new Presupue();
    presupue.intpre = partida.intpre;
    ejecucion.intpre = presupue;

    try {
      await firstValueFrom(this.ejecuService.saveEjecucion(ejecucion));
      // Puedes agregar lógica adicional aquí si lo necesitas
    } catch (err: any) {
      this.authService.mostrarError('Error al guardar la Ejecucion', err);
      console.error('Al guardar Ejecucion: ', err.error);
    }
  }

  regresar() { this.router.navigate(['/transaci']); }

  //Valida Cuenta
  valCuenta(): AsyncValidatorFn {
    return (_control: AbstractControl): Observable<ValidationErrors | null> => {
      const esValido = this.idcuenta != null;
      return of(esValido ? null : { invalido: true });
    };
  }


  //Valida el valor a liquidar
  valLiquida(control: AbstractControl): Promise<ValidationErrors | null> {
    return new Promise((resolve) => {
      const index = this.formArrayLiquida.controls.indexOf(control);
      const benextran = this.benextran[index];
      if (!benextran) return resolve(null);
      const valor = parseFloat(control.value);
      const saldo = benextran.valor - benextran.totpagcob;
      if (isNaN(valor)) return resolve(null);
      if (valor > saldo) {
        resolve({
          liquidaExcede: {
            maxPermitido: saldo,
            valorIngresado: valor
          }
        });
      } else {
        resolve(null);
      }
    });
  }

}

interface interfaceAsiento {
  numero: number;
  fecha: Date;
  comprobante: string;
  documento: String;
  numdoc: String;
  beneficiario: String;
  iddocumento: number;
}

function nombreTiptran(tiptran: number): { nombre: string, cabecera1: string, cabecera2: string } {
  if (tiptran == 8) return { nombre: 'Registro de Liquidación de Anticipo(s)', cabecera1: 'Anticipo', cabecera2: 'Liquida' };
  if (tiptran == 9) return { nombre: 'Registro de Cobro(s)', cabecera1: 'CxC', cabecera2: 'Cobro' };
  if (tiptran == 10) return { nombre: 'Cobro(s) del año anterior', cabecera1: 'CxC AA', cabecera2: 'Cobro' };
  if (tiptran == 11) return { nombre: 'Liquidación de Fondos de Terceros', cabecera1: 'F.Terceros', cabecera2: 'Liquida' };
  if (tiptran == 12) return { nombre: 'Registro de Pago(s)', cabecera1: 'CxP', cabecera2: 'Pago' };
  return { nombre: '(Ninguno)', cabecera1: 'Error', cabecera2: ' ' };
}
