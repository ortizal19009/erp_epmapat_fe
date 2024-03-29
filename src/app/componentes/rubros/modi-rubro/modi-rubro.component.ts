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
import { RubrosService } from 'src/app/servicios/rubros.service';

@Component({
  selector: 'app-modi-rubro',
  templateUrl: './modi-rubro.component.html',
  styleUrls: ['./modi-rubro.component.css'],
})
export class ModiRubroComponent implements OnInit {
  formRubro: FormGroup;
  disabled = true;
  _modulos: any;
  antdescripcion: String;
  idrubro: number; //Id del Rubro que se modifica
  idmodulo: number;

  constructor(
    public fb: FormBuilder,
    private router: Router,
    private moduService: ModulosService,
    private rubService: RubrosService,
    private authService: AutorizaService
  ) {}

  ngOnInit(): void {
    this.idrubro = +sessionStorage.getItem('idrubroToModi')!;
    let modulo: Modulos = new Modulos();
    this.listarModulos();

    this.formRubro = this.fb.group(
      {
        idmodulo_modulos: modulo,
        descripcion: [
          null,
          [Validators.required, Validators.minLength(3)],
          this.valNombre.bind(this),
        ],
        estado: '',
        valor: 0,
        calculable: '',
        swiva: '',
        facturable: '',
        tipo: '',
        usucrea: this.authService.idusuario,
        feccrea: '',
        usumodi: this.authService.idusuario,
        fecmodi: '',
      },
      { updateOn: 'blur' }
    );
    this.datosRubro();

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

  datosRubro() {
    let date: Date = new Date();
    this.rubService.getRubroById(this.idrubro).subscribe({
      next: (datos) => {
        this.antdescripcion = datos.descripcion;
        this.formRubro.setValue({
          idmodulo_modulos: datos.idmodulo_modulos,
          descripcion: datos.descripcion,
          estado: datos.estado,
          valor: datos.valor,
          calculable: datos.calculable,
          swiva: datos.swiva,
          facturable: datos.facturable,
          tipo: datos.tipo,
          usucrea: datos.usucrea,
          feccrea: datos.feccrea,
          usumodi: this.authService.idusuario,
          fecmodi: date,
        });
      },
      error: (err) => console.log(err.msg.error),
    });
  }

  get f() {
    return this.formRubro.controls;
  }

  onSubmit() {
    this.rubService.updateRubro(this.idrubro, this.formRubro.value).subscribe({
      next: (resp) => this.retornar(),
      error: (err) => console.log(err.error),
    });
  }

  retornar() {
    this.router.navigate(['/info-rubro']);
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
    return this.rubService
      .getByNombre(this.idrubro, control.value)
      .pipe(
        map((result) =>
          result.length == 1 && control.value != this.antdescripcion
            ? { existe: true }
            : null
        )
      );
  }
}
