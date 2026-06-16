import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ColoresService } from 'src/app/compartida/colores.service';
import { PersonalService } from 'src/app/servicios/rrhh/personal.service';
import { CargosService } from 'src/app/servicios/rrhh/cargos.service';
import { TpcontratosService } from 'src/app/servicios/rrhh/tpcontratos.service';
import { ContemergenciaService } from 'src/app/servicios/rrhh/contemergencia.service';
import { PersonalValidators } from '../personal-validators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modi-personal',
  templateUrl: './modi-personal.component.html',
  styleUrls: ['./modi-personal.component.css'],
})
export class ModiPersonalComponent implements OnInit {
  f_personal: FormGroup;
  personalId: number;
  _cargos: any;
  _tpcontratos: any;
  _contemergencia: any;
  edadMinima = 18;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private s_personal: PersonalService,
    private coloresService: ColoresService,
    private s_cargos: CargosService,
    private s_tpcontratos: TpcontratosService,
    private s_contemergencia: ContemergenciaService
  ) {}

  ngOnInit(): void {
    this.personalId = Number(sessionStorage.getItem('idpersonalToModi'));

    this.f_personal = this.fb.group({
      codigo: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]],
      identificacion: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(20),
          Validators.pattern(/^[A-Za-z0-9]+$/),
        ],
      ],
      apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
      nombres: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
      fecnacimiento: ['', [PersonalValidators.edadMinima(this.edadMinima)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      celular: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{7,15}$/)]],
      direccion: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      idcargo_cargos: ['', Validators.required],
      idtpcontrato_tpcontratos: ['', Validators.required],
      idcontemergencia_contemergencias: [''],
      sufijo: [''],
      tituloprofesional: [''],
      fecinicio: [''],
      nomfirma: [''],
    });

    this.loadSelects();

    if (this.personalId) {
      this.loadPersonal();
    }

    sessionStorage.setItem('ventana', '/personal');
    const coloresJSON = sessionStorage.getItem('/personal');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  loadSelects() {
    this.s_cargos.getAllCargos().subscribe({
      next: (datos: any) => {
        this._cargos = datos;
      },
      error: (e: any) => console.error(e),
    });

    this.s_tpcontratos.getAllTpcontratos().subscribe({
      next: (datos: any) => {
        this._tpcontratos = datos;
      },
      error: (e: any) => console.error(e),
    });

    this.s_contemergencia.getAllContEmergencia().subscribe({
      next: (datos: any) => {
        this._contemergencia = datos;
      },
      error: (e: any) => console.error(e),
    });
  }

  compareById(o1: any, o2: any): boolean {
    if (!o1 || !o2) {
      return o1 === o2;
    }
    if (o1.idcargo !== undefined && o2.idcargo !== undefined) {
      return o1.idcargo === o2.idcargo;
    }
    if (o1.idtpcontratos !== undefined && o2.idtpcontratos !== undefined) {
      return o1.idtpcontratos === o2.idtpcontratos;
    }
    if (o1.idcontemergencia !== undefined && o2.idcontemergencia !== undefined) {
      return o1.idcontemergencia === o2.idcontemergencia;
    }
    return o1 === o2;
  }

  loadPersonal() {
    this.s_personal.getPersonalById(this.personalId).subscribe({
      next: (datos: any) => {
        this.f_personal.patchValue({
          codigo: datos.codigo,
          identificacion: datos.identificacion,
          apellidos: datos.apellidos,
          nombres: datos.nombres,
          fecnacimiento: datos.fecnacimiento,
          email: datos.email,
          celular: datos.celular,
          direccion: datos.direccion,
          idcargo_cargos: datos.idcargo_cargos,
          idtpcontrato_tpcontratos: datos.idtpcontrato_tpcontratos,
          idcontemergencia_contemergencias: datos.idcontemergencia_contemergencias,
          sufijo: datos.sufijo,
          tituloprofesional: datos.tituloprofesional,
          fecinicio: datos.fecinicio,
          nomfirma: datos.nomfirma,
        });
      },
      error: (e: any) => console.error(e),
    });
  }

  onSubmit() {
    if (!this.personalId) return;
    this.f_personal.markAllAsTouched();
    if (this.f_personal.invalid) {
      this.swal('warning', 'Revise los campos marcados antes de guardar.');
      return;
    }

    this.s_personal
      .updatePersonal(this.personalId, this.f_personal.value)
      .subscribe({
        next: () => {
          this.swal('success', 'Personal actualizado correctamente.');
          this.router.navigate(['/personal']);
        },
        error: (e: any) => {
          console.error('Error actualizando personal', e);
          this.swal(
            'error',
            e?.error?.message ||
              e?.error?.detail ||
              'No se pudo actualizar el personal.'
          );
        },
      });
  }

  controlInvalid(controlName: string): boolean {
    const control = this.f_personal.get(controlName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  getErrorMessage(controlName: string): string {
    const control = this.f_personal.get(controlName);
    if (!control?.errors) return '';

    if (control.errors['required']) return 'Este campo es obligatorio.';
    if (control.errors['minlength']) {
      return `Debe tener al menos ${control.errors['minlength'].requiredLength} caracteres.`;
    }
    if (control.errors['maxlength']) {
      return `No debe exceder ${control.errors['maxlength'].requiredLength} caracteres.`;
    }
    if (control.errors['email']) return 'Ingrese un correo válido.';
    if (control.errors['pattern']) {
      if (controlName === 'identificacion') {
        return 'La identificación solo puede contener letras y números, sin espacios.';
      }
      if (controlName === 'celular') {
        return 'Ingrese un teléfono válido.';
      }
      return 'Formato inválido.';
    }
    if (control.errors['edadMinima']) {
      return `Debe tener al menos ${this.edadMinima} años.`;
    }

    return 'Verifique este campo.';
  }

  private swal(icon: 'success' | 'error' | 'warning' | 'info', title: string) {
    Swal.fire({
      toast: true,
      icon,
      title,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
    });
  }

  regresar() {
    this.router.navigate(['/personal']);
  }
}
