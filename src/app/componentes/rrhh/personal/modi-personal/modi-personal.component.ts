import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ColoresService } from 'src/app/compartida/colores.service';
import { PersonalService } from 'src/app/servicios/rrhh/personal.service';
import { CargosService } from 'src/app/servicios/rrhh/cargos.service';
import { TpcontratosService } from 'src/app/servicios/rrhh/tpcontratos.service';
import { ContemergenciaService } from 'src/app/servicios/rrhh/contemergencia.service';

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
      codigo: [''],
      identificacion: [''],
      apellidos: [''],
      nombres: [''],
      fecnacimiento: [''],
      email: [''],
      celular: [''],
      direccion: [''],
      idcargo_cargos: [''],
      idtpcontrato_tpcontratos: [''],
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

    this.s_personal
      .updatePersonal(this.personalId, this.f_personal.value)
      .subscribe({
        next: () => this.router.navigate(['/personal']),
        error: (e: any) => {
          console.error('Error actualizando personal', e);
          alert('No se pudo actualizar. Ver consola.');
        },
      });
  }

  regresar() {
    this.router.navigate(['/personal']);
  }
}
