import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { ConciliaBan } from 'src/app/modelos/contabilidad/concilia-ban.model';
import { Transaci } from 'src/app/modelos/contabilidad/transaci.model';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { ConciliaBanService } from 'src/app/servicios/contabilidad/concilia-ban.service';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';

@Component({
  selector: 'app-bancos',
  templateUrl: './bancos.component.html',
  styleUrls: ['./bancos.component.css']
})
export class BancosComponent implements OnInit {

  bancos: any = [];
  meses: any = [
    { valor: 0, nombre: 'Ninguno' },
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' },
  ];
  bscrControl: FormGroup;
  controlBancos: any;
  debito: number;
  credito: number;
  btn_conciliar: boolean = true;
  btncondisable: boolean = true;
  documentos: any;
  conciliaBan: ConciliaBan = new ConciliaBan();

  constructor(private cueService: CuentasService, private tranService: TransaciService,
    private docuService: DocumentosService, private fb: FormBuilder, private router: Router,
    private s_conciliaBan: ConciliaBanService) { }

  ngOnInit(): void {
    this.listarBancos();
    this.listarDocumentos();
    this.bscrControl = this.fb.group({
      banco: 5,
      mes: 1,
    });
  }

  onSubmit() {
    this.s_conciliaBan.getByCuentaMes(+this.bscrControl.value.banco!, +this.bscrControl.value.mes!).subscribe({
      next: (datos: any) => {
        if (datos.length === 0) {
          this.btn_conciliar = true;
          this.btncondisable = false;
        } else {
          this.btncondisable = true;
          this.btn_conciliar = false;
        }
      },
      error: (e) => console.error(e),
    });
    this.listarTransaci();
  }

  listarBancos() {
    this.cueService.getBancos().subscribe({
      next: (datos: any) => {
        datos.forEach((banco: any) => {
          let codcue = banco.codcue.split('.');
          if (+codcue[1]! >= 2) {
            this.bancos.push(banco);
          }
        });
      },
      error: (e) => console.error(e),
    });
  }

  listarTransaci() {
    this.tranService.getControlesBancos(+this.bscrControl.value.banco!, +this.bscrControl.value.mes!).subscribe({
      next: (datos) => {
        this.controlBancos = datos;
      },
      error: (e) => console.error(e),
    });
  }

  listarDocumentos() {
    this.docuService.getListaDocumentos().subscribe({
      next: (datos) => {
        this.documentos = datos;
      },
      error: (e) => console.error(e),
    });
  }

  comDocumentos(o1: Documentos, o2: Documentos): boolean {
    if (o1 === undefined && o2 === undefined) {
      return true;
    } else {
      return o1 === null || o2 === null || o1 === undefined || o2 === undefined
        ? false
        : o1.iddocumento == o2.iddocumento;
    }
  }

  cambioDatos(e: any, transaci: any) {
    this.tranService.updateTransaci(transaci).subscribe({
      next: (datos) => {
        e.target.style.border = 'green 1px solid';
        setTimeout(() => {
          e.target.style.border = '';
        }, 1000);
      },
      error: (e) => console.error(e),
    });
  }

  cambioDatosCheck(e: any, transaci: any) {
    let date: Date = new Date();
    console.log(e.target.checked);

    if (e.target.checked === false) {
      transaci.mesconcili = 0;
      this.updateTransaci(transaci);
      console.log(transaci);
    } else if (e.target.checked === true) {
      transaci.mesconcili = date.getMonth();
      //transaci.mesconcili = 1;
      this.updateTransaci(transaci);
    }
    e.target.style.border = 'green 1px solid';
    setTimeout(() => {
      e.target.style.border = '';
    }, 1000);
  }

  updateTransaci(transaci: any) {
    this.tranService.updateTransaci(transaci).subscribe({
      next: datos => { },
      error: (e) => console.error(e),
    });
  }

  mal(transaci: Transaci) {
    if (
      transaci.iddocumento.nomdoc === 'N/Debito' ||
      transaci.iddocumento.nomdoc === 'Depósito' ||
      transaci.iddocumento.nomdoc === 'N/Credito'
    ) {
      return false;
    } else {
      return true;
    }
  }

  // conciliarBanco(){ this.router.navigate(['conciliaban', +this.bscrControl.value.banco!, +this.bscrControl.value.mes]) }
  // conciliarBanco() { this.router.navigate(['conciliaban']) }

  optdisabled(swconcili: any) {
    return swconcili;
  }

  infconciliarBanco() {
    this.router.navigate([
      'infconciliacionban',
      +this.bscrControl.value.banco!,
      +this.bscrControl.value.mes,
    ]);
  }

  conciliarBanco() {
    this.tranService.getControlesBancos(this.bscrControl.value.banco, this.bscrControl.value.mes).subscribe({
        next: (datos: any) => {
          let debito = 0;
          let credito = 0;
          //console.log(datos);
          datos.forEach((dato: any) => {
            if (
              dato.iddocumento.tipdoc === 1 ||
              dato.iddocumento.tipdoc === 3
            ) {
              //console.log('Debitos', dato);
              debito += dato.valor;
              this.conciliaBan.libdebitos = debito;
            }
            if (
              dato.iddocumento.tipdoc === 2 ||
              dato.iddocumento.tipdoc === 4
            ) {
              //console.log('Creditos', dato);
              credito += dato.valor;
              this.conciliaBan.libcreditos = credito;
            }
          });
          console.log(debito, credito);
        },
        error: (e) => {
          console.error(e);
        },
      });
    let cuenta: any = { idcuenta: this.bscrControl.value.banco };
    this.conciliaBan.mes = this.bscrControl.value.mes;
    this.conciliaBan.libinicial = 0;
    this.conciliaBan.libdepositos = 0;
    this.conciliaBan.libcheques = 0;
    this.conciliaBan.liberrores = 0;
    this.conciliaBan.baninicial = 0;
    this.conciliaBan.bancreditos = 0;
    this.conciliaBan.bandebitos = 0;
    this.conciliaBan.bancheaa = 0;
    this.conciliaBan.bannc = 0;
    this.conciliaBan.bannd = 0;
    this.conciliaBan.banerrores = 0;
    this.conciliaBan.observa = '';
    this.conciliaBan.idcuenta = cuenta;
    console.log(this.conciliaBan);
    this.s_conciliaBan.saveConciliaBan(this.conciliaBan).subscribe({
      next: (datos) => {
        // console.log('DATOS GUARDADOS', datos);
      },
      error: (e) => console.error(e),
    });
  }

}
