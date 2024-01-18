import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModulosService } from 'src/app/servicios/modulos.service';
import { UsoitemsComponent } from '../usoitems/usoitems.component';
import { UsoitemsService } from 'src/app/servicios/usoitems.service';
import { Modulos } from 'src/app/modelos/modulos.model';
import { map } from 'rxjs';

@Component({
  selector: 'app-add-usoitems',
  templateUrl: './add-usoitems.component.html',
  styleUrls: ['./add-usoitems.component.css']
})
export class AddUsoitemsComponent implements OnInit {

  @Input() idmodulo: number;

  formUso: FormGroup;
  _modulos: any;

  constructor(private fb: FormBuilder, private usoService: UsoitemsService,
    private moduService: ModulosService,
    private parent: UsoitemsComponent) { }

  ngOnInit(): void {
    this.crearForm();
  }

  ngOnChanges() { this.crearForm(); }

  crearForm() {
    let modulo: Modulos = new Modulos;
    modulo.idmodulo = this.idmodulo;
    this.formUso = this.fb.group({
      idmodulo_modulos: modulo,
      descripcion: [null, [Validators.required, Validators.minLength(3), Validators.maxLength(254)], this.valNombre.bind(this)],
      estado: 1,
      usucrea: 1,
      feccrea: (new Date().toISOString().substring(0, 10))
    },
      { updateOn: "blur" });

    this.moduService.getListaModulos().subscribe({
      next: resp => this._modulos = resp,
      error: err => console.log(err.error)
    });

    setTimeout(() => {
      let opcModulo: HTMLElement;
      if (this.idmodulo == null) opcModulo = document.getElementById(`idmodulo_3`) as HTMLElement;
      else opcModulo = document.getElementById(`idmodulo_` + this.idmodulo) as HTMLElement;
      if (opcModulo != null) opcModulo.setAttribute("selected", "");
    }, 1000);

    let selectmodulo = document.getElementById("selectModulo") as HTMLSelectElement;
    selectmodulo.addEventListener("change", () => {
      this.idmodulo = +selectmodulo.value!;
      this.f['descripcion'].setValue('');
    });

  }

  get f() { return this.formUso.controls; }

  onSubmit() {
    this.moduService.getById(this.idmodulo).subscribe({
      next: resp => {
        this.formUso.value.idmodulo_modulos = resp;
      },
      error: err => console.log(err.error),
    })
    console.log("Datos del Formulario: " + JSON.stringify(this.formUso.value));
    this.usoService.saveUso(this.formUso.value).subscribe({
      next: resp => {
        this.reset();
        this.parent.listarUsoitems()
      },
      error: err => console.log(err.error)
    });
  }

  reset() {
    this.crearForm()
  }

  valNombre(control: AbstractControl) {
    return this.usoService.getByNombre(this.idmodulo, control.value)
      .pipe(
        map(result => result.length == 1 ? { existe: true } : null)
      );
  }

}
