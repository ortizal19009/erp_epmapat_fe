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
import { Clasificador } from 'src/app/modelos/clasificador.model';
import { ClasificadorService } from 'src/app/servicios/clasificador.service';
import { EstrfuncService } from 'src/app/servicios/contabilidad/estrfunc.service';
import { PregastoService } from 'src/app/servicios/contabilidad/pregasto.service';

@Component({
  selector: 'app-add-pregasto',
  templateUrl: './add-pregasto.component.html',
  styleUrls: ['./add-pregasto.component.css'],
})
export class AddPregastoComponent implements OnInit {
  formPregasto: any;
  _actividades: any;
  _clasificador: any;
  filtro: string;
  codactividad: String;
  clasifi: Clasificador = new Clasificador();
  date: Date = new Date();
  constructor(
    public fb: FormBuilder,
    public pregasService: PregastoService,
    private estrfuncService: EstrfuncService,
    private clasiService: ClasificadorService,
    private router: Router,
    private authService: AutorizaService
  ) {}

  ngOnInit(): void {
    this.setcolor();
    this.formPregasto = this.fb.group(
      {
        tippar: 2,
        codigo: '',
        nomcla: '',
        idestrfunc: ['', Validators.required],
        intcla: [
          ,
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(8),
          ],
        ],
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
        totmod: 0,
        totcerti: 0,
        totmisos: 0,
        totdeven: 0,
        codacti: '',
        codpart: '',
        usucrea: this.authService.idusuario,
        feccrea: this.date,
        swpluri: false,
      },
      { updateOn: 'blur' }
    );
  }

  setcolor() {
    let colores: string[];
    let coloresJSON = sessionStorage.getItem('/pregastos');
    if (!coloresJSON) {
      colores = ['rgb(70, 70, 70)', 'rgb(186, 186, 186)'];
      const coloresJSON = JSON.stringify(colores);
      sessionStorage.setItem('/pregastos', coloresJSON);
    } else colores = JSON.parse(coloresJSON);

    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  get f() {
    return this.formPregasto.controls;
  }

  reinicia() {
    if (this.formPregasto.get('codpar').value.length < 2) {
      this.formPregasto.patchValue({
        idestrfunc: '',
        intcla: '',
      });
      this.formPregasto.controls['idestrfunc'].touched = false;
      this.formPregasto.controls['intcla'].touched = false;
    }
    if (this.formPregasto.get('codpar').value.length < 11) {
      this.formPregasto.patchValue({
        intcla: '',
      });
      this.formPregasto.controls['intcla'].touched = false;
    }
  }

  onSubmit() {
    this.clasifi.intcla = this._clasificador[0].intcla;
    this.formPregasto.value.intcla = this.clasifi;
    this.formPregasto.value.idestrfunc = this._actividades[0].idestrfunc;
    const codpar: string = this.formPregasto.get('codpar').value;
    this.formPregasto.value.codacti = codpar.substring(0, 2);
    this.formPregasto.value.codigo = codpar.substring(3, 20);
    this.formPregasto.value.codpart = codpar.substring(3, 11);
    this.formPregasto.value.feccrea = new Date();
    this.pregasService.savePregasto(this.formPregasto.value).subscribe({
      next: (resp) => this.regresar(),
      error: (err) =>
        console.error('Al guardar la nueva Partida de Gastos: ', err.error),
    });
  }

  regresar() {
    this.router.navigate(['/pregastos']);
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

  valCodpar(control: AbstractControl) {
    return this.pregasService
      .getByCodigo(control.value)
      .pipe(map((result) => (result.length == 1 ? { existe: true } : null)));
  }
}
