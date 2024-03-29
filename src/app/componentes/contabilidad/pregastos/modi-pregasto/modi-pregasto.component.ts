import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Presupue } from 'src/app/modelos/contabilidad/presupue.model';
import { ClasificadorService } from 'src/app/servicios/clasificador.service';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucion.service';
import { EstrfuncService } from 'src/app/servicios/contabilidad/estrfunc.service';
import { PregastoService } from 'src/app/servicios/contabilidad/pregasto.service';

@Component({
  selector: 'app-modi-pregasto',
  templateUrl: './modi-pregasto.component.html',
  styleUrls: ['./modi-pregasto.component.css'],
})
export class ModiPregastoComponent implements OnInit {
  formPregasto: any;
  idpresupue: number;
  _actividades: any;
  _clasificador: any;
  antcodpar: String;
  codactividad: String;
  codificado: number;
  reformas: number;
  movimientos: boolean;

  constructor(
    public fb: FormBuilder,
    public pregasService: PregastoService,
    private estrfuncService: EstrfuncService,
    private clasiService: ClasificadorService,
    private router: Router,
    private ejecuService: EjecucionService,
    private authService: AutorizaService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/modi-pregasto');
    this.setcolor();
    this.idpresupue = +sessionStorage.getItem('idpresupueGToModi')!;

    this.formPregasto = this.fb.group(
      {
        tippar: 2,
        codigo: '',
        idestrfunc: '',
        codacti: ['', Validators.required],
        intcla: [
          ,
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(8),
          ],
        ],
        codpart: ['', Validators.required],
        codpar: [
          '',
          [
            Validators.required,
            Validators.minLength(17),
            Validators.maxLength(17),
          ],
          this.valCodpar.bind(this),
        ],
        nompar: [null, [Validators.required, Validators.minLength(3)]],
        inicia: ['', [Validators.required]],
        totmod: [],
        totcerti: [],
        totmisos: '',
        totdeven: '',
        nomcla: '',
        usucrea: this.authService.idusuario,
        feccrea: '',
        usumodi: this.authService.idusuario,
        fecmodi: '',
        swpluri: Boolean,
      },
      { updateOn: 'blur' }
    );
    this.datosPargasto();
  }

  setcolor() {
    let colores: string[];
    let coloresJSON = sessionStorage.getItem('/modi-pregasto');
    if (!coloresJSON) {
      colores = ['rgb(80, 83, 54)', 'rgb(228, 248, 205)'];
      const coloresJSON = JSON.stringify(colores);
      sessionStorage.setItem('/modi-pregasto', coloresJSON);
    } else colores = JSON.parse(coloresJSON);

    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  datosPargasto() {
    let date: Date = new Date();
    this.pregasService.getById(this.idpresupue).subscribe({
      next: (datos) => {
        this.antcodpar = datos.codpar;
        this.codactividad = datos.codacti;
        this.reformas = datos.totmod;
        this.codificado = datos.inicia + datos.totmod;
        this.formPregasto.patchValue({
          idestrfunc: datos.idestrfunc,
          codacti: datos.codacti,
          intcla: datos.intcla,
          codpart: datos.codpart,
          nompar: datos.nompar,
          codpar: datos.codpar,
          inicia: datos.inicia,
          totcerti: datos.totcerti,
          totmod: datos.totmod,
          totmisos: datos.totmisos,
          totdeven: datos.totdeven,
          nomcla: datos.intcla.nompar,
          usucrea: datos.usucrea,
          feccrea: datos.feccrea,
          usumodi: 1,
          fecmodi: date,
          swpluri: datos.swpluri,
        });
        this.movimi();
      },
      error: (err) => console.error(err.error),
    });
  }

  movimi() {
    this.ejecuService.tieneEjecucion(this.antcodpar.toString()).subscribe({
      next: (resp) => (this.movimientos = resp),
      error: (err) =>
        console.error('Al buscar la Ejecucuón de la Partida: ', err.error),
    });
  }

  get f() {
    return this.formPregasto.controls;
  }

  listaActividades(e: any) {
    if (e.target.value != '') {
      this.estrfuncService
        .getCodigoNombre(e.target.value.toLowerCase())
        .subscribe({
          next: (datos) => {
            this._actividades = datos;
            this.codactividad = e.target.value;
            this.formPregasto.controls['codpar'].setValue(e.target.value);
          },
          error: (err) => console.error(err.error),
        });
    }
  }

  listaClasificador(e: any) {
    if (e.target.value != '') {
      this.clasiService.getPartidasG(e.target.value.toLowerCase()).subscribe({
        next: (datos) => {
          this._clasificador = datos;
          this.formPregasto.controls['codpar'].setValue(
            this.codactividad + '.' + e.target.value
          );
        },
        error: (err) => console.error(err.error),
      });
    }
  }

  reinicia() {
    if (this.formPregasto.get('codpar').value.length < 2) {
      this.formPregasto.patchValue({
        codacti: '',
        codpart: '',
      });
      this.formPregasto.controls['codacti'].touched = false;
      this.formPregasto.controls['codpart'].touched = false;
    }
    if (this.formPregasto.get('codpar').value.length < 11) {
      this.formPregasto.patchValue({
        codpart: '',
      });
      this.formPregasto.controls['codpart'].touched = false;
    }
  }

  onSubmit() {
    const codpar: string = this.formPregasto.get('codpar').value;
    this.formPregasto.value.codacti = codpar.substring(0, 2);
    this.formPregasto.value.codigo = codpar.substring(3, 20);
    this.formPregasto.value.codpart = codpar.substring(3, 11);
    this.pregasService
      .updatePregasto(this.idpresupue, this.formPregasto.value)
      .subscribe({
        next: (resp) => {
          if (this.antcodpar != codpar) {
            this.ejecuService
              .actualizarCodpar(this.idpresupue, codpar)
              .subscribe({
                next: (nex) => {},
                error: (err) => console.error(err.error),
              });
          }
          this.regresar();
        },
        error: (err) => console.error(err.error),
      });
  }

  regresar() {
    this.router.navigate(['/pregastos']);
  }

  valCodpar(control: AbstractControl) {
    return this.pregasService
      .getByCodigo(control.value)
      .pipe(
        map((result) =>
          result.length == 1 && control.value != this.antcodpar
            ? { existe: true }
            : null
        )
      );
  }
}
