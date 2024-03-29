import { Component, Input, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, map, of, switchMap, take } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Niveles } from 'src/app/modelos/contabilidad/niveles.model';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';
import { NivelesService } from 'src/app/servicios/contabilidad/niveles.service';

@Component({
  selector: 'app-add-cuenta',
  templateUrl: './add-cuenta.component.html',
  styleUrls: ['./add-cuenta.component.css'],
})
export class AddCuentaComponent implements OnInit {
  formCuenta: any;
  _niveles: any;
  grucue: string | null;
  nomgru: string | null;
  idnivel: number;
  nivcue: number;

  constructor(
    private fb: FormBuilder,
    private cuentasService: CuentasService,
    private nivelesService: NivelesService,
    private router: Router,
    private authService: AutorizaService
  ) {
    this.grucue = sessionStorage.getItem('newGrucue');
    this.nomgru = sessionStorage.getItem('newNomgru');
    this.idnivel = +sessionStorage.getItem('newIdnivel')!;
    sessionStorage.removeItem('new*');
  }

  ngOnInit() {
    this.setcolor();
    this.listaNiveles();
  }

  setcolor() {
    let colores: string[];
    let coloresJSON = sessionStorage.getItem('/cuentas');
    if (!coloresJSON) {
      colores = ['rgb(83, 93, 43)', 'rgb(209, 250, 132)'];
      const coloresJSON = JSON.stringify(colores);
      sessionStorage.setItem('/cuentas', coloresJSON);
    } else colores = JSON.parse(coloresJSON);

    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  listaNiveles() {
    this.nivelesService
      .getListaNiveles()
      .pipe(
        switchMap((resp) => {
          this._niveles = resp;
          this.nivcue = this._niveles[3].nivcue;
          return of(resp);
        })
      )
      .subscribe(() => {
        this.crearForm();
        this.formCuenta.controls['idnivel'].setValue(
          this._niveles[this.idnivel - 1]
        );
      });
  }

  crearForm() {
    let date: Date = new Date();
    let niveles: Niveles = new Niveles();
    niveles.idnivel = this.idnivel;
    this.formCuenta = this.fb.group(
      {
        codcue: [
          this.grucue + '.',
          [
            Validators.required,
            Validators.minLength(this.nivcue),
            Validators.maxLength(this.nivcue),
          ],
          this.valGrupo.bind(this),
        ],
        nomcue: [
          null,
          [Validators.required, Validators.minLength(3)],
          this.valNomcue.bind(this),
        ],
        idnivel: niveles,
        grucue: [this.grucue],
        nomgru: [this.nomgru],
        movcue: 1,
        asodebe: [''],
        asohaber: [''],
        sigef: 0,
        tiptran: 0,
        intgrupo: '',
        grufluefec: '',
        usucrea: this.authService.idusuario,
        feccrea: date,
      },
      { updateOn: 'blur' }
    );
  }

  get f() {
    return this.formCuenta.controls;
  }

  onSubmit() {
    this.cuentasService.saveCuenta(this.formCuenta.value).subscribe({
      next: (resp) => {
        // this.crearForm()
        //    this.parent.listarCuentas()
      },
      error: (err) => console.log(err.msg.error),
    });
  }

  reset() {
    // this.crearForm();
    // this.formCuenta.reset();
    //this.formCuenta.controls['nomcue'].setValue(null);
  }

  regresar() {
    this.router.navigate(['/cuentas']);
  }

  valNomcue(control: AbstractControl) {
    return this.cuentasService
      .getByNomcue(control.value)
      .pipe(map((result) => (result.length == 1 ? { existe: true } : null)));
  }

  //Valida que no se modifique el Grupo
  valGrupo(control: FormControl) {
    const grucue = this.formCuenta.get('grucue').value.toString() + '.';
    const codcue = control.value.toString().slice(0, grucue.length);
    if (grucue !== codcue) {
      return of({ invalido: true }); // Validación fallida
    } else {
      return of(null); // Validación exitosa
    }
  }
}
