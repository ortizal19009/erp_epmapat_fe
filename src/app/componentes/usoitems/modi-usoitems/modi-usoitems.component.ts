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
import { Modulos } from 'src/app/modelos/modulos.model';
import { ModulosService } from 'src/app/servicios/modulos.service';
import { UsoitemsService } from 'src/app/servicios/usoitems.service';

@Component({
  selector: 'app-modi-usoitems',
  templateUrl: './modi-usoitems.component.html',
  styleUrls: ['./modi-usoitems.component.css'],
})
export class ModiUsoitemsComponent implements OnInit {
  formUso: FormGroup;
  disabled = true;
  _modulos: any;
  antdescripcion: String;
  idusoitems: number; //Id del Usoitem que se modifica
  idmodulo: number;
  date: Date = new Date();

  constructor(
    public fb: FormBuilder,
    private router: Router,
    private moduService: ModulosService,
    private usoService: UsoitemsService,
    private authService: AutorizaService
  ) {}

  ngOnInit(): void {
    this.idusoitems = +sessionStorage.getItem('idusoitemsToModi')!;
    let modulo: Modulos = new Modulos();
    this.listarModulos();

    this.formUso = this.fb.group(
      {
        idmodulo_modulos: modulo,
        descripcion: [
          null,
          [Validators.required, Validators.minLength(3)],
          this.valNombre.bind(this),
        ],
        estado: '',
        usucrea: this.authService.idusuario,
        feccrea: this.date,
        usumodi: this.authService.idusuario,
        fecmodi: this.date,
      },
      { updateOn: 'blur' }
    );
    this.datosUso();

    const selectmodulo = document.getElementById(
      'selectModulo'
    ) as HTMLSelectElement;
    selectmodulo.addEventListener('change', () => {
      this.idmodulo = +selectmodulo.value!;
      this.f['descripcion'].setValue('');
    });
  }

  listarModulos() {
    this.moduService.getListaModulos().subscribe({
      next: (resp) => (this._modulos = resp),
      error: (err) => console.log(err.error),
    });
  }

  datosUso() {
    let date: Date = new Date();
    this.usoService.getUsoitemById(this.idusoitems).subscribe({
      next: (datos) => {
        this.antdescripcion = datos.descripcion;
        this.formUso.setValue({
          idmodulo_modulos: datos.idmodulo_modulos,
          descripcion: datos.descripcion,
          estado: datos.estado,
          usucrea: datos.usucrea,
          feccrea: datos.feccrea,
          usumodi: 1,
          fecmodi: date,
        });
      },
      error: (err) => console.log(err.msg.error),
    });
  }

  get f() {
    return this.formUso.controls;
  }

  onSubmit() {
    this.usoService.updateUso(this.idusoitems, this.formUso.value).subscribe({
      next: (resp) => this.retornar(),
      error: (err) => console.log(err.error),
    });
  }

  retornar() {
    this.router.navigate(['/info-usoitems']);
  }

  compararModulo(o1: Modulos, o2: Modulos): boolean {
    if (o1 === undefined && o2 === undefined) {
      return true;
    } else {
      return o1 === null || o2 === null || o1 === undefined || o2 === undefined
        ? false
        : o1.idmodulo == o2.idmodulo;
    }
  }

  valNombre(control: AbstractControl) {
    return this.usoService
      .getByNombre(this.idusoitems, control.value)
      .pipe(
        map((result) =>
          result.length == 1 && control.value != this.antdescripcion
            ? { existe: true }
            : null
        )
      );
  }
}
