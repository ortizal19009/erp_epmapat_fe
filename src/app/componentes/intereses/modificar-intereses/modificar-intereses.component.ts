import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { InteresesService } from 'src/app/servicios/intereses.service';
import { ListarInteresesComponent } from '../intereses/intereses.component';
import { map } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { TmpinteresxfacService } from 'src/app/servicios/tmpinteresxfac.service';

@Component({
  selector: 'app-modificar-intereses',
  templateUrl: './modificar-intereses.component.html',
  styleUrls: ['./modificar-intereses.component.css'],
})
export class ModificarInteresesComponent implements OnInit {
  formInteres: FormGroup;
  interes: any;
  validar: boolean;
  idinteres: number;
  antAnio: number;
  antMes: number;

  constructor(
    public fb: FormBuilder,
    private inteService: InteresesService,
    private parent: ListarInteresesComponent,
    private authService: AutorizaService,
    private s_tmpinteresxfac: TmpinteresxfacService
  ) {}

  ngOnInit(): void {
    this.idinteres = +localStorage.getItem('idinteres')!;
    let date: Date = new Date();
    this.formInteres = this.fb.group(
      {
        anio: [
          '',
          [
            Validators.required,
            Validators.minLength(4),
            Validators.maxLength(4),
          ],
          this.valAnio.bind(this),
        ],
        mes: ['', Validators.required, this.valMes.bind(this)],
        porcentaje: ['', Validators.required],
        usucrea: this.authService.idusuario,
        feccrea: date,
        usumodi: this.authService.idusuario,
        fecmodi: date,
      },
      { updateOn: 'blur' }
    );
    this.datosInteres();
  }

  get f() {
    return this.formInteres.controls;
  }

  datosInteres() {
    let date: Date = new Date();
    this.inteService.getListaById(this.idinteres).subscribe((datos) => {
      this.antAnio = datos.anio;
      this.antMes = datos.mes;
      this.formInteres.setValue({
        anio: datos.anio,
        mes: datos.mes,
        porcentaje: datos.porcentaje,
        usucrea: datos.usucrea,
        feccrea: datos.feccrea,
        usumodi: this.authService.idusuario,
        fecmodi: date,
      });
    });
  }

  onSubmit() {
    this.inteService
      .updateInteres(this.idinteres, this.formInteres.value)
      .subscribe({
        next: async (resp: any) => {
          this.parent.reset();
          this.parent.listarIntereses();
          let tempInteres = await this.inteService.recalcularBatchInteres();
          console.log(tempInteres);
        },
        error: (err) => console.log(err.error),
      });
  }

  reset() {
    this.parent.reset();
  }

  valAnio(control: AbstractControl) {
    return this.inteService
      .getByAnioMes(control.value, this.formInteres?.value.mes)
      .pipe(
        map((result) =>
          result.length == 1 && control.value != this.antAnio
            ? { existe: true }
            : null
        )
      );
  }

  valMes(control: AbstractControl) {
    return this.inteService
      .getByAnioMes(this.formInteres?.value.anio, control.value)
      .pipe(
        map((result1) =>
          result1.length == 1 && control.value != this.antMes
            ? { existe1: true }
            : null
        )
      );
  }
}
