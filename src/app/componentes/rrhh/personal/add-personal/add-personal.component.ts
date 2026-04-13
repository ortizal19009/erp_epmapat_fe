import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Personal } from 'src/app/modelos/rrhh/personal';
import { CargosService } from 'src/app/servicios/rrhh/cargos.service';
import { ContemergenciaService } from 'src/app/servicios/rrhh/contemergencia.service';
import { DetcargoService } from 'src/app/servicios/rrhh/detcargo.service';
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
  f_cargos: FormGroup;
  f_tpcontratos: FormGroup;
  f_detcargo: FormGroup;
  _personal: any;
  _cargos: any;
  _contemergencia: any;
  _tpcontratos: any;
  _detcargos: any;
  formulario: boolean = true;
  contemergencia: any;
  date: Date = new Date();
  cargoTitle: string = 'Registrar Cargo';
  cargoForm: boolean = true;
  personal: Personal = new Personal();
  mensajeError: string = '';

  constructor(
    private coloresService: ColoresService,
    private fb: FormBuilder,
    private s_tpcontratos: TpcontratosService,
    private s_contemergencia: ContemergenciaService,
    private s_cargos: CargosService,
    private s_personal: PersonalService,
    private router: Router,
    public authService: AutorizaService,
    private s_detcargo: DetcargoService
  ) {}

  ngOnInit(): void {
    this.f_personal = this.fb.group({
      bspersonal: '',
      codigo: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]],
      idcargo_cargos: [null, Validators.required],
      idtpcontrato_tpcontratos: [null, Validators.required],
      identificacion: [
        '',
        [Validators.required, Validators.minLength(5), Validators.maxLength(20), Validators.pattern(/^[0-9A-Za-z-]+$/)],
      ],
      apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
      nombres: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
      fecnacimiento: [''],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      celular: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{7,15}$/)]],
      direccion: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      idcontemergencia_contemergencias: '',
      sufijo: ['', [Validators.maxLength(20)]],
      tituloprofesional: ['', [Validators.maxLength(100)]],
      fecinicio: ['', Validators.required],
      nomfirma: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    });
    this.f_buscarContEmergencia = this.fb.group({
      contemergencia: '',
    });
    this.f_contEmergencia = this.fb.group({
      nombre: '',
      celular: '',
      parentesco: '',
    });
    this.f_cargos = this.fb.group({
      descripcion: '',
      estado: true,
      iddetcargo_detcargo: '',
    });
    this.f_tpcontratos = this.fb.group({
      descripcion: '',
    });
    this.f_detcargo = this.fb.group({
      rol: '',
      eje: '',
      grupoocupacional: '',
      estado: true,
      sueldo: 0,
    });
    this.f_personal.patchValue({
      fecinicio: this.formatDate(this.date),
    });
    sessionStorage.setItem('ventana', '/personal');
    let coloresJSON = sessionStorage.getItem('/personal');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();
    this.getAllCargos();
    this.getAllTpcontratos();
    this.getAllContEmergencia();
    this.getDetCargos();
    this.getAllPersonal();
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
  changeFormCargo() {
    this.cargoForm = !this.cargoForm;
  }
  savePersonal() {
    this.mensajeError = '';
    this.f_personal.markAllAsTouched();

    if (this.f_personal.invalid) {
      this.mensajeError = 'Revise los campos marcados antes de guardar el personal.';
      return;
    }

    let valuesForm: any = this.normalizaPersonalForm(this.f_personal.value);

    if (this.existePersonalDuplicado(valuesForm)) {
      this.mensajeError =
        'Ya existe un personal registrado con la misma identificación o código.';
      return;
    }

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
    this.personal.sufijo = valuesForm.sufijo;
    this.personal.tituloprofesional = valuesForm.tituloprofesional;
    this.personal.fecinicio = valuesForm.fecinicio;
    this.personal.nomfirma = valuesForm.nomfirma;
    this.s_personal.savePaersonal(this.personal).subscribe({
      next: (datos: any) => {
        this.router.navigate(['/personal']);
      },
      error: (e: any) => {
        console.error(e);
        this.mensajeError = this.getMensajeErrorPersonal(e);
      },
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
      idcontemergencia_contemergencias: contemer,
    });
    this.personal.idcontemergencia_contemergencias = contemer;
  }

  compareById(o1: any, o2: any): boolean {
    if (!o1 || !o2) return o1 === o2;
    if (o1.idcontemergencia !== undefined && o2.idcontemergencia !== undefined) {
      return o1.idcontemergencia === o2.idcontemergencia;
    }
    if (o1.idcargo !== undefined && o2.idcargo !== undefined) {
      return o1.idcargo === o2.idcargo;
    }
    if (o1.idtpcontratos !== undefined && o2.idtpcontratos !== undefined) {
      return o1.idtpcontratos === o2.idtpcontratos;
    }
    return o1 === o2;
  }

  saveContEmergencia() {
    this.s_contemergencia
      .saveContEmergencia(this.f_contEmergencia.value)
      .subscribe({
        next: (datos: any) => {
          console.log(datos);
          this.f_personal.patchValue({
            idcontemergencia_contemergencias: datos,
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
  getAllPersonal() {
    this.s_personal.getAllPersonal().subscribe({
      next: (datos: any) => {
        this._personal = datos || [];
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
  saveCargos() {
    console.log(this.f_cargos.value);
    this.s_cargos.saveCargo(this.f_cargos.value).subscribe({
      next: (datos: any) => {
        console.log('Cargo guardado', datos);
        this.f_cargos.patchValue({
          descripcion: '',
          idcargo_cargos: '',
        });
        this.getAllCargos();
      },
      error: (e: any) => console.error(e),
    });
  }
  saveDetCargos() {
    this.s_detcargo.saveDetCargo(this.f_detcargo.value).subscribe({
      next: (datos: any) => {
        console.log(datos);
        this.f_detcargo.reset();
        this.cargoForm = !this.cargoForm;
        this.getDetCargos();
      },
    });
  }
  getDetCargos() {
    this.s_detcargo.getAllDetCargos().subscribe({
      next: (datos: any) => {
        this._detcargos = datos;
      },
      error: (e: any) => console.error(e),
    });
  }
  saveTpContratos() {
    this.s_tpcontratos.saveTpContrato(this.f_tpcontratos.value).subscribe({
      next: (datos: any) => {
        console.log('Tipo contraro guardado');
        this.f_cargos.reset();
        this.getAllTpcontratos();
      },
      error: (e: any) => console.error(e),
    });
  }

  private normalizaPersonalForm(valuesForm: any) {
    return {
      ...valuesForm,
      codigo: this.trimValue(valuesForm.codigo),
      identificacion: this.trimValue(valuesForm.identificacion),
      apellidos: this.trimValue(valuesForm.apellidos).toUpperCase(),
      nombres: this.trimValue(valuesForm.nombres).toUpperCase(),
      email: this.trimValue(valuesForm.email).toLowerCase(),
      celular: this.trimValue(valuesForm.celular),
      direccion: this.trimValue(valuesForm.direccion),
      sufijo: this.trimValue(valuesForm.sufijo),
      tituloprofesional: this.trimValue(valuesForm.tituloprofesional),
      nomfirma: this.trimValue(valuesForm.nomfirma),
    };
  }

  private existePersonalDuplicado(valuesForm: any): boolean {
    if (!Array.isArray(this._personal)) return false;

    return this._personal.some((personal: any) => {
      const mismaIdentificacion =
        this.trimValue(personal?.identificacion).toLowerCase() ===
        valuesForm.identificacion.toLowerCase();
      const mismoCodigo =
        this.trimValue(personal?.codigo).toLowerCase() ===
        valuesForm.codigo.toLowerCase();

      return mismaIdentificacion || mismoCodigo;
    });
  }

  private getMensajeErrorPersonal(error: any): string {
    if (error?.status === 409) {
      return (
        error?.error?.message ||
        error?.error?.detail ||
        error?.error?.error ||
        'No se pudo guardar: ya existe un personal con esa identificación o código.'
      );
    }

    return (
      error?.error?.message ||
      error?.error?.detail ||
      'No se pudo guardar el personal. Revise los datos e intente nuevamente.'
    );
  }

  private trimValue(value: any): string {
    return (value ?? '').toString().trim();
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
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
