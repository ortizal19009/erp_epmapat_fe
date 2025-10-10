import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Nacionalidad } from 'src/app/modelos/nacionalidad';
import { PersoneriaJuridica } from 'src/app/modelos/personeria-juridica';
import { Tpidentifica } from 'src/app/modelos/tpidentifica.model';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { NacionalidadService } from 'src/app/servicios/nacionalidad.service';
import { PersoneriaJuridicaService } from 'src/app/servicios/personeria-juridica.service';
import { TpidentificaService } from 'src/app/servicios/tpidentifica.service';
import { map, of } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import Swal from 'sweetalert2';
import { ColoresService } from 'src/app/compartida/colores.service';

@Component({
  selector: 'app-add-cliente',
  templateUrl: './add-cliente.component.html',
  styleUrls: ['./add-cliente.component.css'],
})
export class AddClienteComponent implements OnInit {
  formCliente: FormGroup;
  _tpidentifica: any;
  _nacionalidad: any;
  _personeriajuridica: any;
  tpidenti: number = 2;

  nacionalidad: Nacionalidad = new Nacionalidad();
  tpidentifica: Tpidentifica = new Tpidentifica();
  pjuridica: PersoneriaJuridica = new PersoneriaJuridica();
  ventana: string = 'add-cliente';
  rolepermission: number;

  constructor(
    public fb: FormBuilder,
    private cliService: ClientesService,
    public nacService: NacionalidadService,
    private router: Router,
    public pjService: PersoneriaJuridicaService,
    public tpidentiService: TpidentificaService,
    private authService: AutorizaService,
    private coloresService: ColoresService
  ) {}

  async ngOnInit(): Promise<void> {
    sessionStorage.setItem('ventana', `/${this.ventana}`);
    let coloresJSON = sessionStorage.getItem(`/${this.ventana}`);
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    if (
      this.coloresService.rolepermission == undefined ||
      this.coloresService.rolepermission == null
    ) {
      this.rolepermission = await this.coloresService.getRolePermission(
        this.authService.idusuario,
        this.ventana
      );
    }

    let date: Date = new Date();

    this.nacionalidad.idnacionalidad = 1;
    this.tpidentifica.idtpidentifica = 2;
    this.pjuridica.idpjuridica = 1;

    this.formCliente = this.fb.group(
      {
        idnacionalidad_nacionalidad: this.nacionalidad,
        idtpidentifica_tpidentifica: this.tpidentifica,
        cedula: [
          '',
          Validators.required,
          [this.valIdentifica.bind(this), this.busIdentifica.bind(this)],
        ],
        nombre: [
          '',
          [Validators.required, Validators.minLength(3)],
          this.valNombre.bind(this),
        ],
        direccion: ['', Validators.required],
        telefono: ['', Validators.required],
        fechanacimiento: date,
        discapacitado: 0,
        porcdiscapacidad: 0,
        porcexonera: 0,
        estado: 1,
        email: ['', [Validators.required, Validators.email]],
        idpjuridica_personeriajuridica: this.pjuridica,
        usucrea: this.authService.idusuario,
        feccrea: date,
      },
      { updateOn: 'blur' }
    );

    this.listarNacionalidades();
    this.listarTpIdentifica();
    this.listarPersoneriaJuridica();

    const idnacionalidadControl = this.formCliente.get(
      'idnacionalidad_nacionalidad'
    )!;
    const idtpidentificaControl = this.formCliente.get(
      'idtpidentifica_tpidentifica'
    )!;
    const cedulaControl = this.formCliente.get('cedula')!;

    idnacionalidadControl.valueChanges.subscribe((selectedValue) => {
      idtpidentificaControl.setValue('');
      cedulaControl.setValue('');
    });
    idtpidentificaControl.valueChanges.subscribe((selectedValue) => {
      this.tpidenti = selectedValue;
      cedulaControl.setValue('');
    });
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
    return this.formCliente.controls;
  }

  listarNacionalidades() {
    this.nacService.getListaNacionalidades().subscribe({
      next: (datos) => {
        this._nacionalidad = datos;
        this.formCliente.patchValue({ idnacionalidad_nacionalidad: 1 });
      },
      error: (err) => console.error(err.error),
    });
  }

  add_nacionalidad() {
    this.router.navigate(['/nacionalidades']);
  }

  listarTpIdentifica() {
    this.tpidentiService.getListaTpIdentifica().subscribe({
      next: (datos) => {
        console.log(datos);
        this._tpidentifica = datos;
        this.formCliente.patchValue({ idtpidentifica_tpidentifica: datos[1] });
      },
      error: (err) => console.error(err.error),
    });
  }

  listarPersoneriaJuridica() {
    this.pjService.getListaPersoneriaJuridica().subscribe({
      next: (datos) => {
        this._personeriajuridica = datos;
        this.formCliente.patchValue({ idpjuridica_personeriajuridica: 1 });
      },
      error: (err) => console.error(err.error),
    });
  }

  retornarListaClientes() {
    this.router.navigate(['/clientes']);
  }

  onSubmit() {
    this.nacionalidad.idnacionalidad = this.formCliente.get(
      'idnacionalidad_nacionalidad'
    )!.value;
    this.formCliente.value.idnacionalidad_nacionalidad = this.nacionalidad;
    this.tpidentifica.idtpidentifica = this.formCliente.get(
      'idtpidentifica_tpidentifica'
    )!.value;
    this.formCliente.value.idtpidentifica_tpidentifica = this.tpidentifica;
    this.pjuridica.idpjuridica = this.formCliente.get(
      'idpjuridica_personeriajuridica'
    )!.value;
    this.formCliente.value.idpjuridica_personeriajuridica = this.pjuridica;
    console.log(this.formCliente.value);

    this.cliService.saveClientes(this.formCliente.value).subscribe({
      next: (nex) => {
        this.retornarListaClientes();
        this.swal('success', 'Cliente creado correctamente');
      },
      error: (err) => {
        console.error(err.error),
          this.swal('warning', 'No se pudo crear el cliente, intente nuevamente');
      },
    });
  }

  valNombre(control: AbstractControl) {
    return this.cliService
      .valNombre(control.value.toLowerCase())
      .pipe(map((result) => (result ? { existe: true } : null)));
  }

  valIdentifica(control: AbstractControl) {
    // console.log('this.tpidenti: ', this.tpidenti)

    switch (this.tpidenti) {
      case 1: // RUC
        if (control.value.length == 13) {
          const numeros = /^\d+$/.test(control.value);
          if (numeros) return of(null); // Validación exitosa
          else return of({ invalid: true });
        } else return of({ invalid: true }); // Validación fallida
      case 2: // Cedula
        if (control.value.length == 10) {
          let rtn = this.valCedula(control.value);
          if (rtn) return of(null);
          else return of({ invalid: true });
        } else return of({ invalid: true });
      case 3: //Pasaporte
        if (control.value.length >= 5) {
          return of(null);
        } else return of({ invalid: true });
      default:
        return of({ invalid: true });
    }
    return of({ invalid: true }); // Si no se encuentra una validación específica, considera que es fallida
  }

  busIdentifica(control: AbstractControl) {
    return this.cliService
      .valIdentificacion(control.value)
      .pipe(map((result) => (result ? { existe: true } : null)));
  }

  valCedula(cedula: String) {
    const digitoRegion = cedula.substring(0, 2);
    let digR = parseInt(digitoRegion);
    if (digR >= 1 && digR <= 24) {
      const ultimoDigito = Number(cedula.substring(9, 10));
      const pares =
        Number(cedula.substring(1, 2)) +
        Number(cedula.substring(3, 4)) +
        Number(cedula.substring(5, 6)) +
        Number(cedula.substring(7, 8));
      let numeroUno: any = cedula.substring(0, 1);
      numeroUno = numeroUno * 2;
      if (numeroUno > 9) numeroUno = numeroUno - 9;
      let numeroTres: any = cedula.substring(2, 3);
      numeroTres = numeroTres * 2;
      if (numeroTres > 9) numeroTres = numeroTres - 9;
      let numeroCinco: any = cedula.substring(4, 5);
      numeroCinco = numeroCinco * 2;
      if (numeroCinco > 9) numeroCinco = numeroCinco - 9;
      let numeroSiete: any = cedula.substring(6, 7);
      numeroSiete = numeroSiete * 2;
      if (numeroSiete > 9) numeroSiete = numeroSiete - 9;
      let numeroNueve: any = cedula.substring(8, 9);
      numeroNueve = numeroNueve * 2;
      if (numeroNueve > 9) numeroNueve = numeroNueve - 9;
      const impares =
        numeroUno + numeroTres + numeroCinco + numeroSiete + numeroNueve;
      const sumaTotal = pares + impares;
      const primerDigitoSuma = String(sumaTotal).substring(0, 1);
      const decena = (Number(primerDigitoSuma) + 1) * 10;
      let digitoValidador = decena - sumaTotal;
      if (digitoValidador === 10) digitoValidador = 0;
      if (digitoValidador === ultimoDigito) return true;
      else return false;
    } else return false;
  }
  swal(icon: any, mensaje: any) {
    Swal.fire({
      toast: true,
      icon: icon,
      title: mensaje,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
    });
  }
}
