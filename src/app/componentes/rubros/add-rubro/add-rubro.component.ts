import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { map } from 'rxjs';
import { Modulos } from 'src/app/modelos/modulos.model';
import { ModulosService } from 'src/app/servicios/modulos.service';
import { RubrosService } from 'src/app/servicios/rubros.service';
import { RubrosComponent } from '../rubros/rubros.component';
import { AutorizaService } from 'src/app/compartida/autoriza.service';

@Component({
  selector: 'app-add-rubro',
  templateUrl: './add-rubro.component.html',
  styleUrls: ['./add-rubro.component.css'],
})
export class AddRubroComponent implements OnInit {
  @Input() idmodulo: number;

  formRubro: FormGroup;
  _modulos: any;

  constructor(
    private fb: FormBuilder,
    private rubService: RubrosService,
    private moduService: ModulosService,
    private parent: RubrosComponent,
    private authService: AutorizaService
  ) {}

  ngOnInit(): void {
    this.crearForm();
  }

  ngOnChanges() {
    this.crearForm();
  }

  crearForm() {
    let modulo: Modulos = new Modulos();
    modulo.idmodulo = this.idmodulo;
    this.formRubro = this.fb.group(
      {
        idmodulo_modulos: modulo,
        descripcion: [
          null,
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(100),
          ],
          this.valNombre.bind(this),
        ],
        estado: 1,
        valor: 0,
        calculable: 0,
        swiva: 0,
        tipo: 0,
        facturable: 1,
        usucrea: this.authService.idusuario,
        feccrea: new Date().toISOString().substring(0, 10),
      },
      { updateOn: 'blur' }
    );

    this.moduService.getListaModulos().subscribe({
      next: (resp) => (this._modulos = resp),
      error: (err) => console.log(err.error),
    });

    setTimeout(() => {
      let opcModulo: HTMLElement;
      if (this.idmodulo == null)
        opcModulo = document.getElementById(`idmodulo_3`) as HTMLElement;
      else
        opcModulo = document.getElementById(
          `idmodulo_` + this.idmodulo
        ) as HTMLElement;
      if (opcModulo != null) opcModulo.setAttribute('selected', '');
    }, 1000);

    let selectmodulo = document.getElementById(
      'selectModulo'
    ) as HTMLSelectElement;
    selectmodulo.addEventListener('change', () => {
      console.log(+selectmodulo.value!);
      this.idmodulo = +selectmodulo.value!;
      this.f['descripcion'].setValue('');
    });
  }

  get f() {
    return this.formRubro.controls;
  }

  onSubmit() {
    console.log(this.formRubro.value);
    this.moduService.getById(this.idmodulo).subscribe({
      next: (resp) => {
        console.log(resp);
        this.formRubro.value.idmodulo_modulos = resp;
        // console.log("Datos del Formulario: "+ JSON.stringify(this.formRubro.value));
        this.rubService.saveRubro(this.formRubro.value).subscribe({
          next: (resp) => {
            console.log(resp);
            this.reset();
            this.parent.listarRubros();
          },
          error: (err) => console.log(err.error),
        });
      },
      error: (err) => console.log(err.error),
    });
  }

  reset() {
    this.crearForm();
  }

  valNombre(control: AbstractControl) {
    return this.rubService
      .getByNombre(this.idmodulo, control.value)
      .pipe(map((result) => (result.length == 1 ? { existe: true } : null)));
  }
}
