import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { time } from 'console';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Contemergencia } from 'src/app/modelos/rrhh/contemergencia';
import { Personal } from 'src/app/modelos/rrhh/personal';
import { CargosService } from 'src/app/servicios/rrhh/cargos.service';
import { ContemergenciaService } from 'src/app/servicios/rrhh/contemergencia.service';
import { PersonalService } from 'src/app/servicios/rrhh/personal.service';
import { TpcontratosService } from 'src/app/servicios/rrhh/tpcontratos.service';

@Component({
  selector: 'app-add-personal',
  templateUrl: './add-personal.component.html',
  styleUrls: ['./add-personal.component.css'],
})
export class AddPersonalComponent implements OnInit {
  f_personal: FormGroup;
  f_buscarContEmergencia: FormGroup;
  f_contEmergencia: FormGroup;
  _personal: any;
  _cargos: any;
  _contemergencia: any;
  _tpcontratos: any;
  formulario: boolean = true;
  contemergencia: any;
  date: Date = new Date();
  personal: Personal = new Personal();
  constructor(
    private coloresService: ColoresService,
    private fb: FormBuilder,
    private s_tpcontratos: TpcontratosService,
    private s_contemergencia: ContemergenciaService,
    private s_cargos: CargosService,
    private s_personal: PersonalService,
    private router: Router,
    public authService: AutorizaService
  ) {}

  ngOnInit(): void {
    this.f_personal = this.fb.group({
      bspersonal: '',
      codigo: '',
      idcargo_cargos: '',
      idtpcontrato_tpcontratos: '',
      identificacion: '',
      apellidos: '',
      nombres: '',
      fecnacimiento: '',
      email: '',
      celular: '',
      direccion: '',
      idcontemergencia_contemergencias: '',
    });
    this.f_buscarContEmergencia = this.fb.group({
      contemergencia: '',
    });
    this.f_contEmergencia = this.fb.group({
      nombre: '',
      celular: '',
      parentesco: '',
    });
    sessionStorage.setItem('ventana', '/personal');
    let coloresJSON = sessionStorage.getItem('/personal');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();
    this.getAllCargos();
    this.getAllTpcontratos();
    this.getAllContEmergencia();
  }

  get f() {
    return this.f_personal.controls;
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, 'abonados');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/abonados', coloresJSON);
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
  changeNuevo() {
    this.formulario = !this.formulario;
  }
  savePersonal() {
    let valuesForm: any = this.f_personal.value;
    this.personal.nombres = valuesForm.nombres;
    this.personal.apellidos = valuesForm.apellidos;
    this.personal.identificacion = valuesForm.identificacion;
    this.personal.email = valuesForm.email;
    this.personal.celular = valuesForm.celular;
    this.personal.direccion = valuesForm.direccion;
    this.personal.idcargo_cargos = valuesForm.idcargo_cargos;
    this.personal.idtpcontrato_tpcontratos =
      valuesForm.idtpcontrato_tpcontratos;
    this.personal.estado = true;
    this.personal.fecnacimiento = valuesForm.fecnacimiento;
    this.personal.codigo = valuesForm.codigo;
    this.personal.feccrea = this.date;
    this.personal.usucrea = this.authService.idusuario;
    this.s_personal.savePaersonal(this.personal).subscribe({
      next: (datos: any) => {
        this.router.navigate(['/personal']);
      },
      error: (e: any) => console.error(e),
    });
  }
  regresar() {}
  onContEmergenciaSelected(e: any) {
    const debouncedGetAllContEmergenciaByNombre = debounce((value: string) => {
      this.getAllContEmergenciaByNombre(value);
    }, 1000);

    // Llama a la función "debounced"
    debouncedGetAllContEmergenciaByNombre(e.target.value);
  }
  setContactoEmergencia(contemer: any) {
    console.log(contemer);
    this.f_personal.patchValue({
      idcontemergencia_contemergencias: contemer.nombre,
    });
    this.personal.idcontemergencia_contemergencias = contemer;
  }
  saveContEmergencia() {
    this.s_contemergencia
      .saveContEmergencia(this.f_contEmergencia.value)
      .subscribe({
        next: (datos: any) => {
          console.log(datos);
          this.f_personal.patchValue({
            idcontemergencia_contemergencias: datos.nombre,
          });
          this.personal.idcontemergencia_contemergencias = datos;
          this.changeNuevo();
          this.f_contEmergencia.reset();
        },
        error: (e: any) => console.error(e),
      });
  }
  getAllTpcontratos() {
    this.s_tpcontratos.getAllTpcontratos().subscribe({
      next: (datos: any) => {
        console.log(datos);
        this._tpcontratos = datos;
        this.f_personal.patchValue({
          idtpcontrato_tpcontratos: datos[0],
        });
      },
      error: (e: any) => console.error(e),
    });
  }
  getAllContEmergencia() {
    this.s_contemergencia.getAllContEmergencia().subscribe({
      next: (datos: any) => {
        this._contemergencia = datos;
      },
      error: (e: any) => console.error(e),
    });
  }
  getAllContEmergenciaByNombre(nombre: string) {
    console.log(nombre);
    this.s_contemergencia.getAllContEmergenciaByNombre(nombre).subscribe({
      next: (datos: any) => {
        this.contemergencia = datos;
      },
      error: (e: any) => console.error(e),
    });
  }
  getAllCargos() {
    this.s_cargos.getAllCargos().subscribe({
      next: (datos: any) => {
        console.log(datos);
        this._cargos = datos;
        this.f_personal.patchValue({
          idcargo_cargos: datos[0],
        });
      },
      error: (e: any) => console.error(e),
    });
  }
}
function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}
