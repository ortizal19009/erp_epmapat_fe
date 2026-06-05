import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { UsuarioService } from 'src/app/servicios/administracion/usuario.service';
import { PersonalService } from 'src/app/servicios/rrhh/personal.service';

@Component({
  selector: 'app-modi-usuario',
  templateUrl: './modi-usuario.component.html',
  styleUrls: ['./modi-usuario.component.css'],
})
export class ModiUsuarioComponent implements OnInit {
  formUsuario: FormGroup;
  idusuarioModi: number;
  date: Date = new Date();
  usu = {} as Usu;
  _personal: any[] = [];
  filtrarPersonal: string;
  personalSeleccionadoId: number | null = null;
  personalSeleccionadoLabel: string = '';
  personalOriginalId: number | null = null;

  constructor(
    public fb: FormBuilder,
    private router: Router,
    public authService: AutorizaService,
    private usuService: UsuarioService,
    private coloresService: ColoresService,
    private personalService: PersonalService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/usuarios');
    const coloresJSON = sessionStorage.getItem('/usuarios');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    this.idusuarioModi = +sessionStorage.getItem('idusuarioToModi')!;
    sessionStorage.removeItem('idusuarioToModi');

    this.formUsuario = this.fb.group(
      {
        identificausu: [
          {
            value: '',
            disabled: this.authService.idusuario > 1 || this.idusuarioModi == 1,
          },
          [Validators.required, Validators.minLength(3), Validators.maxLength(20)],
        ],
        alias: [
          { value: '', disabled: this.idusuarioModi == 1 },
          [Validators.required, Validators.minLength(5), Validators.maxLength(20)],
        ],
        nomusu: [
          {
            value: '',
            disabled: this.authService.idusuario > 1 || this.idusuarioModi == 1,
          },
          [Validators.required, Validators.minLength(5), Validators.maxLength(100)],
        ],
        codusu: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(50)]],
        reingreso: [
          '',
          [Validators.required, Validators.minLength(5), Validators.maxLength(50)],
          this.valReingreso.bind(this),
        ],
        estado: { value: '', disabled: this.authService.idusuario > 1 },
        otrapestania: '',
        email: '',
        fdesde: '',
        fhasta: '',
        feccrea: '',
        usumodi: '',
        fecmodi: '',
        personal: new FormControl(null),
      },
      { updateOn: 'blur' }
    );

    this.getListarPersonal();

    this.formUsuario.get('codusu')!.valueChanges.subscribe((valor) => {
      if (valor !== '') this.formUsuario.get('reingreso')!.reset();
    });

    this.buscaUsuario();
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(
        this.authService.idusuario,
        'usuarios'
      );
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/usuarios', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  get f() {
    return this.formUsuario.controls;
  }

  buscaUsuario() {
    this.usuService.getByIdusuario(this.idusuarioModi).subscribe({
      next: (datos: any) => {
        this.formUsuario.setValue({
          identificausu: datos.identificausu,
          alias: datos.alias,
          nomusu: datos.nomusu,
          codusu: datos.codusu,
          reingreso: datos.codusu,
          estado: datos.estado,
          otrapestania: datos.otrapestania,
          email: datos.email,
          fdesde: datos.fdesde,
          fhasta: datos.fhasta,
          feccrea: datos.feccrea,
          usumodi: this.authService.idusuario,
          fecmodi: this.date,
          personal: null,
        });
        this.filtrarPersonal = datos.identificausu;
        this.cargarPersonalVinculado(datos);
      },
      error: (err) => console.error(err.error),
    });
  }

  guardar() {
    if (this.formUsuario.get('codusu')!.dirty) {
      const b = myFun(this.formUsuario.get('codusu')!.value);
      this.formUsuario.get('codusu')!.setValue(b);
    }

    const valoresFormulario = this.formUsuario.getRawValue();
    valoresFormulario.usumodi = this.authService.idusuario;
    valoresFormulario.fecmodi = this.date;
    delete valoresFormulario.personal;

    const personalActualId = this.obtenerPersonalIdDesdeControl(
      this.formUsuario.get('personal')?.value
    );

    this.usuService
      .updateUsuario(this.idusuarioModi, valoresFormulario)
      .pipe(
        switchMap(() => {
          if (personalActualId) {
            return this.usuService.linkPersonal(
              this.idusuarioModi,
              personalActualId,
              this.authService.idusuario
            );
          }

          if (this.personalOriginalId) {
            return this.usuService.unlinkPersonal(
              this.idusuarioModi,
              this.authService.idusuario
            );
          }

          return of(null);
        })
      )
      .subscribe({
        next: () => this.regresar(),
        error: (err) => console.error(err.error),
      });
  }

  getListarPersonal() {
    this.personalService.getAllPersonal().subscribe({
      next: (datos: any) => {
        this._personal = datos || [];
      },
      error: (err: any) => console.error(err.error),
    });
  }

  regresar() {
    if (this.authService.idusuario == 1) this.router.navigate(['/usuarios']);
    else this.router.navigateByUrl('/inicio');
  }

  valReingreso(control: AbstractControl) {
    if (this.formUsuario.value.codusu != control.value) {
      return of({ invalido: true });
    }
    return of(null);
  }

  unirPersonal(per: any) {
    this.formUsuario.get('personal')?.setValue({
      idpersonal: per.idpersonal,
    });

    this.personalSeleccionadoId = per.idpersonal;
    this.personalSeleccionadoLabel = `${per.apellidos} ${per.nombres}`.trim();
    this.filtrarPersonal = `${per.apellidos} ${per.nombres}`;
    this.formUsuario.markAsDirty();
  }

  limpiarPersonal() {
    this.formUsuario.get('personal')?.setValue(null);
    this.personalSeleccionadoId = null;
    this.personalSeleccionadoLabel = '';
    this.filtrarPersonal = '';
    this.formUsuario.markAsDirty();
  }

  private obtenerPersonalIdDesdeControl(value: any): number | null {
    const id = Number(
      value?.idpersonal ??
        value?.personalIdpersonal ??
        value?.personal_idpersonal ??
        value?.idpersonal_personal ??
        value?.idpersonal ??
        value ??
        0
    );
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  private cargarPersonalVinculado(usuario: any) {
    const idpersonal = this.obtenerPersonalIdDesdeControl(
      usuario?.personal ??
        usuario?.personalIdpersonal ??
        usuario?.personal_idpersonal ??
        usuario?.idpersonal_personal ??
        usuario?.idpersonal
    );

    this.personalOriginalId = idpersonal;

    if (!idpersonal) {
      this.personalSeleccionadoId = null;
      this.personalSeleccionadoLabel = '';
      this.formUsuario.get('personal')?.setValue(null);
      return;
    }

    const personal =
      this._personal.find((per: any) => Number(per?.idpersonal) === idpersonal) ??
      usuario?.personal;

    this.formUsuario.get('personal')?.setValue({ idpersonal });
    this.personalSeleccionadoId = idpersonal;

    if (personal) {
      const apellidos = personal?.apellidos ?? '';
      const nombres = personal?.nombres ?? '';
      const identificacion = personal?.identificacion ?? '';
      this.personalSeleccionadoLabel = `${apellidos} ${nombres}`.trim();
      this.filtrarPersonal = [apellidos, nombres, identificacion]
        .filter((item) => !!item)
        .join(' ')
        .trim();
      return;
    }

    this.personalSeleccionadoLabel = `ID Personal: ${idpersonal}`;
    this.filtrarPersonal = this.personalSeleccionadoLabel;
  }
}

function myFun(x: string): string {
  let y = '';
  for (let i = 0; i < x.length; i++) {
    y += String(x.charCodeAt(i));
  }
  let rtn = '';
  for (let i = 0; i < y.length; i += 2) {
    rtn += y[i];
  }
  rtn += String(x.trim().length);
  for (let i = y.length - 1; i >= 0; i -= 2) {
    rtn += y[i];
  }
  return rtn;
}

interface Usu {
  identificausu: string;
}
