import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucion.service';
import { ReformasService } from 'src/app/servicios/contabilidad/reformas.service';

import { Presupue } from 'src/app/modelos/contabilidad/presupue.model';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
// import { PresupueService } from 'src/app/servicios/contabilidad/preingreso.service';

@Component({
  selector: 'app-modi-ejecucion',
  templateUrl: './modi-ejecucion.component.html',
  styleUrls: ['./modi-ejecucion.component.css'],
})
export class ModiEjecucionComponent implements OnInit {
  ejecucionForm: any;
  disabled = true;
  antcodpar: String;
  idejecu: number; //Id del ejecucion que se modifica
  _gruposbene: any;

  formBusPresupue: FormGroup; //Formulario para buscar Partidas del Presupue del Modal
  swvalido = 1; //Búsqueda de Partida en el Presupue Presupuestario
  privez = true; //Para resetear los datos de Búsqueda en el Presupue
  _presupue: any;
  filtro: string;
  reforma = {} as Reforma; //Interface para los datos de la Reforma
  tippar: number;

  constructor(
    public fb: FormBuilder,
    public ejecucionService: EjecucionService,
    private refoService: ReformasService,
    private router: Router,
    private authService: AutorizaService
  ) {}

  ngOnInit(): void {
    let idrefo = +sessionStorage.getItem('idrefoToEjecucion')!;
    this.refoService.getById(idrefo).subscribe({
      next: (resp) => {
        this.reforma.numero = resp.numero;
        this.reforma.fecha = resp.fecha;
        this.reforma.tipo = resp.tipo;
        this.reforma.concepto = resp.concepto;
      },
      error: (err) => console.log(err.error),
    });

    this.idejecu = +sessionStorage.getItem('idejecuToModi')!;
    let fecha: Date = new Date();
    let presupue: Presupue = new Presupue();
    this.listarPresupue();

    this.ejecucionForm = this.fb.group(
      {
        codpar: [null, [Validators.required, Validators.minLength(10)]],
        fecha_eje: fecha,
        tipeje: 0,
        modifi: 0,
        prmiso: 0,
        totdeven: 0,
        devengado: 0,
        cobpagado: 0,
        concepto: [null, [Validators.required]],
        usucrea: this.authService.idusuario,
        feccrea: fecha,
        usumodi: this.authService.idusuario,
        fecmodi: fecha,
        idrefo: 0,
        idtrami: 0,
        idparxcer: 0,
        idasiento: 0,
        idtransa: 0,
        idpresupue: presupue,
        idprmiso: 0,
        idevenga: 0,
        nompar: [null],
      },
      { updateOn: 'blur' }
    );
    this.datosEjecucion();
    //Formulario de Busqueda de Partidas (Modal)
    this.formBusPresupue = this.fb.group({
      tippar: 0,
      codpar: '',
      nompar: '',
      filtrar: '',
    });
  }

  listarPresupue() {
    // this.presupueService.getListaPresupue().subscribe({
    //   next: resp => this._presupue = resp,
    //   error: err => console.log(err.error.msg)
    // });
  }

  datosEjecucion() {
    let date: Date = new Date();
    this.ejecucionService.getById(this.idejecu).subscribe({
      next: (datos) => {
        this.antcodpar = datos.codpar;
        this.ejecucionForm.setValue({
          codpar: datos.codpar,
          fecha_eje: datos.fecha_eje,
          tipeje: datos.tipeje,
          modifi: datos.modifi,
          prmiso: datos.prmiso,
          totdeven: datos.totdeven,
          devengado: datos.devengado,
          cobpagado: datos.cobpagado,
          concepto: datos.concepto,
          usucrea: datos.usucrea,
          feccrea: datos.feccrea,
          usumodi: datos.usumodi,
          fecmodi: datos.fecmodi,
          idrefo: datos.idrefo,
          idtrami: datos.idtrami,
          idparxcer: datos.idparxcer,
          idasiento: datos.idasiento,
          idtransa: datos.idtransa,
          // idpresupue: datos.idpresupue.idpresupue,
          idprmiso: datos.idprmiso,
          idevenga: datos.idevenga,
          // nompar: datos.idpresupue.nompar
        });
      },
      error: (err) => console.log(err.msg.error),
    });
  }

  get codpar() {
    return this.ejecucionForm.get('codpar');
  }

  onSubmit() {
    this.ejecucionService
      .updateEjecucion(this.idejecu, this.ejecucionForm.value)
      .subscribe({
        next: (resp) => this.retornar(),
        error: (err) => console.log(err.error.msg),
      });
  }

  retornar() {
    this.router.navigate(['/ejecucion']);
    //   location.reload(); // Agregar esta línea para refrescar la página
  }

  presupueModal() {
    this.swvalido = 1;
    if (this.privez) {
      this.privez = false;
    } else {
      this.formBusPresupue.reset();
      this._presupue = [];
    }
  }

  buscarPresupue() {
    console.log(
      'Envia: ' +
        this.formBusPresupue.value.codpar +
        '  ' +
        this.formBusPresupue.value.nompar
    );
    if (this.reforma.tipo == 'G') {
      this.tippar = 2;
    } else {
      this.tippar = 1;
    }
    // this.presupueService.getCodNom(this.tippar, this.formBusPresupue.value.codpar, this.formBusPresupue.value.nompar).subscribe({
    //   next: datos => {
    //     this._presupue = datos;
    //     console.log("this._presupue.length= " + this._presupue.length)
    //   },
    //   error: err => console.log(err.error)
    // })
  }

  selecPresupue(presupue: Presupue) {
    this.ejecucionForm.controls['nompar'].setValue(presupue.nompar);
    this.ejecucionForm.controls['codpar'].setValue(presupue.codpar);
    this.ejecucionForm.controls['idpresupue'].setValue(presupue);
  }

  valCodpar(control: AbstractControl) {
    return this.ejecucionService
      .getByIdrefo(control.value)
      .pipe(
        map((result) =>
          result.length == 1 && control.value != this.antcodpar
            ? { existe: true }
            : null
        )
      );
  }

  compararPresupue(o1: Presupue, o2: Presupue): boolean {
    if (o1 === undefined && o2 === undefined) {
      return true;
    } else {
      return o1 === null || o2 === null || o1 === undefined || o2 === undefined
        ? false
        : o1.idpresupue == o2.idpresupue;
    }
  }
}

interface Reforma {
  idrefo: number;
  numero: number;
  fecha: Date;
  documento: String;
  concepto: String;
  valor: number;
  tipo: string;
}
