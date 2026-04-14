import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { Asientos } from 'src/app/modelos/contabilidad/asientos.model';
import { Beneficiarios } from 'src/app/modelos/contabilidad/beneficiarios.model';
import { Cuentas } from 'src/app/modelos/contabilidad/cuentas.model';
import { Presupue } from 'src/app/modelos/contabilidad/presupue.model';
import { Transaci } from 'src/app/modelos/contabilidad/transaci.model';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucio.service';
import { TramipresuService } from 'src/app/servicios/contabilidad/tramipresu.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';

@Component({
  selector: 'app-add-trandetrami',
  templateUrl: './add-trandetrami.component.html',
  styleUrls: ['./add-trandetrami.component.css']
})

export class AddTrandetramiComponent implements OnInit {

  iAsiento = {} as interfaceAsiento; //Interface para los datos del Asiento
  idasiento: number;
  nomben: string;
  formTransaci: FormGroup;
  _cuentas: any[] = [];
  _documentos: any;
  _compromisos: any;
  swinvalido: boolean;
  suma: number;
  arrCompromisos: Compromiso[] = [];  //Partidas, Beneficiarios, números de tramite y todos los necesarios de los compromisos
  isLoading: boolean = true;
  swvarias: boolean = false;
  filactual: number

  asiento: Asientos = new Asientos();
  documento: Documentos = new Documentos();
  cuenta: Cuentas = new Cuentas();
  beneficiario: Beneficiarios = new Beneficiarios();
  presupue: Presupue = new Presupue();

  constructor(private coloresService: ColoresService, private asiService: AsientosService, private router: Router, public authService: AutorizaService,
    private fb: FormBuilder, private cueService: CuentasService, private tranService: TransaciService, private docuService: DocumentosService,
    private ejecuService: EjecucionService,
    private tramiService: TramipresuService) { }

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/trandetrami');
    let coloresJSON = sessionStorage.getItem('/trandetrami');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    const datosToAddtransaci = JSON.parse(sessionStorage.getItem("datosToAddtransaci")!);
    this.idasiento = datosToAddtransaci.idasiento;
    this.asiento.idasiento = this.idasiento;

    let date: Date = new Date();
    this.formTransaci = this.fb.group({
      orden: +datosToAddtransaci.orden,
      codcue: '',
      debcre: 2,
      valor: ['', Validators.required],
      intdoc: this.documento,
      numdoc: ['', Validators.required],
      idbene: this.beneficiario,
      idasiento: this.asiento,
      tiptran: 1,
      totbene: 0,
      descri: '',
      swconcili: 0,
      usucrea: this.authService.idusuario,
      feccrea: date,
      nomben: ''
    },
      { updateOn: "blur" }
    );

    this.datosAsiento();
    this.listarDocumentos();
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, 'transaci');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/transaci', coloresJSON);
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
      next: datos => {
        this.iAsiento.idasiento = datos.idasiento;
        this.iAsiento.asiento = datos.asiento;
        this.iAsiento.fecha = datos.fecha;
        this.iAsiento.comprobante = this.codcomprobante(datos.tipcom) + datos.compro.toString();
        this.iAsiento.benefi = datos.idbene.nomben;
        this.iAsiento.documento = datos.intdoc.nomdoc + ' ' + datos.numdoc;
        this.iAsiento.numdoc = datos.numdoc;
        this.iAsiento.intdoc = datos.intdoc.intdoc;
        this.documento.intdoc = this.iAsiento.intdoc;
        this.iAsiento.totdeb = datos.totdeb;
        this.iAsiento.totcre = datos.totcre;
        this.formTransaci.patchValue({
          intdoc: this.iAsiento.intdoc,
          numdoc: datos.numdoc,
          descri: datos.glosa,
        });
      },
      error: err => console.error(err.error)
    });
  }

  listarDocumentos() {
    this.docuService.getListaDocumentos().subscribe({
      next: datos => this._documentos = datos,
      error: (err) => console.error(err.error)
    });
  }

  get f() { return this.formTransaci.controls; }

  blurNomben() { this.nomben = this.formTransaci.get('nomben')!.value; }

  //Compromisos que tienen saldo pendiente
  buscaCompromisos() {
    let nomben: string = '';
    if (this.nomben != null) nomben = this.nomben
    this.ejecuService.misosPendientes(nomben, this.iAsiento.fecha).subscribe({
      next: datos => {
        this._compromisos = datos;
        this.formTransaci.controls['valor'].setValue('');
        this.arrCompromisos = [];
        this.tramites(0);
      },
      error: err => console.error(err.error)
    });
  }

  //Beneficiario, número de tramite y todos los campos necesarios de los compromisos
  tramites(i: number) {
    const resp = this.tramiService.findById(this._compromisos[i].idtrami).subscribe({
      next: resp => {
        this.arrCompromisos.push({
          inteje: this._compromisos[i].inteje, codpar: this._compromisos[i].codpar, intpre: this._compromisos[i].intpre.intpre,
          nomben: resp.idbene.nomben, numtrami: resp.numero, estado: 0, totdeven: this._compromisos[i].totdeven
        });
        if (i < this._compromisos.length - 1) {
          i = i + 1;
          this.tramites(i);
        }
        else this.isLoading = false;
      },
      error: err => console.error(err.error)
    });
  }

  dobleclick(i: number) {
    this.arrCompromisos[i].valor = this._compromisos[i].prmiso - this._compromisos[i].totdeven;
    this.swinvalido = false;
    this.arrCompromisos[i].estado = 1;
    let asodebe = this._compromisos[i].intpre.codigo;
    this.cueService.getByAsodebe(asodebe).subscribe({
      next: datos => {
        switch (datos.length) {
          case 0:
            this.arrCompromisos[i].codcue = 'No tiene cuenta';
            this.swinvalido = true;
            break;
          case 1:
            this.arrCompromisos[i].codcue = datos[0].codcue;
            this.arrCompromisos[i].idcuenta = datos[0].idcuenta;
            break;

          default:
            if (datos.length > 1) {
              this.swvarias = true;
              this._cuentas = datos;
              this.filactual = i;
              this.arrCompromisos[i].codcue = 'Varias';
            }
            else this.arrCompromisos[i].codcue = '';
            break;
        }
      },
      error: err => console.error(err.error)
    });
    this.totales();
    this.formTransaci.controls['valor'].setValue(this.suma);
  }

  changeValor(i: number) {
    this.swinvalido = false;
    if (this.arrCompromisos[i].valor! > this._compromisos[i].prmiso - this._compromisos[i].totdeven) {
      this.swinvalido = true;
      this.arrCompromisos[i].estado = 2;
      this.arrCompromisos[i].codcue = '';
    } else {
      if (this.arrCompromisos[i].valor == 0) {
        this.arrCompromisos[i].estado = 0;
        this.arrCompromisos[i].codcue = '';
      }
      else {
        this.arrCompromisos[i].estado = 1;
        let asodebe = this._compromisos[i].intpre.codigo;
        this.cueService.getByAsodebe(asodebe).subscribe({
          next: datos => {
            switch (datos.length) {
              case 0:
                this.arrCompromisos[i].codcue = 'No tiene cuenta';
                this.swinvalido = true;
                break;
              case 1:
                this.arrCompromisos[i].codcue = datos[0].codcue;
                this.arrCompromisos[i].idcuenta = datos[0].idcuenta;
                break;

              default:
                if (datos.length > 1) {
                  this.swvarias = true;
                  this._cuentas = datos;
                  this.filactual = i;
                  this.arrCompromisos[i].codcue = 'Varias';
                }
                else this.arrCompromisos[i].codcue = '';
                break;
            }
          },
          error: err => console.error(err.error)
        });
      };
      this.totales();
      this.formTransaci.controls['valor'].setValue(this.suma);
    }
  }

  //Suma los valores y verifica si hay invalidos
  totales() {
    this.swinvalido = false;
    this.suma = 0;
    for (let i = 0; i < this.arrCompromisos.length; i++) {
      if (this._compromisos[i].estado == 2) this.swinvalido = true
      else {
        const valor = +this.arrCompromisos[i].valor! || 0; // Si es `undefined` o no numérico, usar 0
        this.suma += valor;
      }
    }
  }

  selecCuenta(event: any, cuenta: Cuentas) {
    this.swvarias = false;
    this.arrCompromisos[this.filactual].codcue = cuenta.codcue;
    this.arrCompromisos[this.filactual].idcuenta = cuenta.idcuenta;
  }

  regresar() { this.router.navigate(['/transaci']); }

  onSubmit() {
    const filterArrTramites = this.arrCompromisos.filter((y, index) => this.arrCompromisos[index].valor! > 0);
    this.guardaTransa(0, filterArrTramites);
  }

  guardaTransa(i: number, filterArrTramites: any) {
    let iTransaci = {} as interfaceTransaci;
    iTransaci.orden = this.formTransaci.get('orden')!.value;
    this.cuenta.idcuenta = filterArrTramites[i].idcuenta;
    iTransaci.idcuenta = this.cuenta;
    iTransaci.codcue = filterArrTramites[i].codcue;
    iTransaci.valor = filterArrTramites[i].valor;
    iTransaci.debcre = 1;
    iTransaci.descri = this.formTransaci.get('descri')!.value;
    iTransaci.numdoc = this.formTransaci.get('numdoc')!.value;
    iTransaci.tiptran = 1;
    iTransaci.totbene = 0;
    this.beneficiario.idbene = 1;
    iTransaci.idbene = this.beneficiario;
    iTransaci.usucrea = this.authService.idusuario;
    iTransaci.feccrea = new Date();
    iTransaci.idasiento = this.asiento;
    iTransaci.intdoc = this.documento;
    const transa: any = iTransaci;
    this.tranService.saveTransa(transa).subscribe({
      next: transaci => {
        //Registrar la nueva ejecución
        const newTransa = transaci as Transaci;
        const iEjecucio = {} as interfaceEjecucio; //Interface para guardar la Ejecución
        iEjecucio.codpar = filterArrTramites[i].codpar;
        iEjecucio.fecha_eje = this.iAsiento.fecha;
        iEjecucio.tipeje = 3;
        iEjecucio.modifi = 0;
        iEjecucio.prmiso = 0;
        const devengado = Math.round(filterArrTramites[i].valor * 100) / 100;
        // console.log('devengado: ', devengado);
        iEjecucio.devengado = filterArrTramites[i].valor;
        iEjecucio.totdeven = 0;
        iEjecucio.cobpagado = 0;
        iEjecucio.concep = this.formTransaci.value.descri;
        iEjecucio.usucrea = this.authService.idusuario;
        iEjecucio.feccrea = newTransa.feccrea;
        iEjecucio.idasiento = this.iAsiento.idasiento;
        iEjecucio.inttra = newTransa.inttra;
        this.presupue.intpre = filterArrTramites[i].intpre;
        iEjecucio.intpre = this.presupue;
        const objEjecucio: any = iEjecucio;   //Ok para llamar como Objeto any (no se puede como Interface)
        this.ejecuService.saveEjecucion(objEjecucio).subscribe({
          next: () => {
            // console.log('updateTotdeven: ', filterArrTramites[i].inteje, filterArrTramites[i].totdeven + newTransa.valor);
            this.ejecuService.updateTotdeven(filterArrTramites[i].inteje, filterArrTramites[i].totdeven + newTransa.valor).subscribe({
              next: () => { },
              error: err => console.error('Al actualizar Totdeven: ', err.error)
            })
          },
          error: err => console.error('Al guardar Ejecucio: ', err.error)
        });
        if (i < filterArrTramites.length - 1) {
          i = i + 1;
          this.guardaTransa(i, filterArrTramites);
        } else {
          //Actualiza total del Asiento
          const totcre = +this.iAsiento.totcre + +this.formTransaci.get('valor')!.value
          /*           this.asiService.updateTotdebAndTotcre(this.idasiento, +this.iAsiento.totdeb, totcre).subscribe({
                      next: () => this.regresar(),
                      error: err => console.error('Al actualizar TotdebAndTotcre: ', err.error)
                    }); */
          // this.regresar()
        };
      },
      error: error => console.error('Al guardar transaci:', error)
    });
  }

  codcomprobante(tipcom: number): string {
    if (tipcom == 1) return 'I-';
    if (tipcom == 2) return 'E-';
    if (tipcom == 3) return 'DC-';
    if (tipcom == 4) return 'DI-';
    if (tipcom == 5) return 'DE-';
    return '';
  }

}

interface interfaceAsiento {
  idasiento: number;
  asiento: number;
  fecha: Date;
  comprobante: string;
  documento: String;
  numdoc: String;
  benefi: String;
  intdoc: number;
  totdeb: number;
  totcre: number;
}

interface interfaceTransaci {
  orden: number;
  codcue?: String;
  valor: number;
  debcre: number;
  descri: string;
  numdoc: string;
  tiptran: number;
  totbene: number;
  usucrea: number;
  feccrea: Date;
  idasiento: Asientos;
  idcuenta: Cuentas;
  idbene: Beneficiarios;
  intdoc: Documentos;
}

function formatNumber(num: number) {
  return num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

type Compromiso = {
  inteje: number;
  codpar: string;
  intpre: number;
  nomben: string;
  numtrami: number;
  valor?: number;
  estado: number;   //0: Vacio, 1: Con valor, 2: Invalido
  codcue?: String;
  idcuenta?: number;
  totdeven: number;
};

interface interfaceEjecucio {
  inteje: number | null;
  codpar: String;
  fecha_eje: Date;
  tipeje: number;
  modifi: number;
  prmiso: number;
  totdeven: number;
  devengado: number;
  cobpagado: number;
  concep: string;
  usucrea: number;
  feccrea: Date;
  idasiento: number;
  inttra: number;
  intpre: Presupue;
}
