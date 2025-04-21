import { Component, OnInit, SimpleChanges } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { map, of } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Clientes } from 'src/app/modelos/clientes';
import { Nacionalidad } from 'src/app/modelos/nacionalidad';
import { PersoneriaJuridica } from 'src/app/modelos/personeria-juridica';
import { Tpidentifica } from 'src/app/modelos/tpidentifica.model';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { NacionalidadService } from 'src/app/servicios/nacionalidad.service';
import { PersoneriaJuridicaService } from 'src/app/servicios/personeria-juridica.service';
import { TpidentificaService } from 'src/app/servicios/tpidentifica.service';

@Component({
  selector: 'app-modificar-clientes',
  templateUrl: './modificar-clientes.component.html',
  styleUrls: ['./modificar-clientes.component.css'],
})
export class ModificarClientesComponent implements OnInit {
  private parent: string | null;
  formCliente: FormGroup;
  cliente: Clientes;
  nacionalidad: any;
  personeriajuridica: any;
  _tpidentifica: any;
  validar: boolean = false;
  validarporc: boolean = false;
  codidentifica: any;
  antcedula: String;
  swModifi = false;
  date: Date = new Date();

  constructor(
    public fb: FormBuilder,
    private cliService: ClientesService,
    public nacionalidadS: NacionalidadService,
    private tpidentiService: TpidentificaService,
    private router: Router,
    public personeriajuridicaS: PersoneriaJuridicaService,
    private authService: AutorizaService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/clientes');
    let coloresJSON = sessionStorage.getItem('/clientes');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    this.parent = sessionStorage.getItem('padreModiCliente');

    let date: Date = new Date();
    this.formCliente = this.fb.group(
      {
        idcliente: '',
        idnacionalidad_nacionalidad: ['', Validators.required],
        idtpidentifica_tpidentifica: '',
        cedula: [
          '',
          Validators.required,
          [this.valIdentifica.bind(this), this.busIdentifica.bind(this)],
        ],
        nombre: ['', [Validators.required, Validators.minLength(3)]],
        direccion: ['', Validators.required],
        telefono: ['', Validators.required],
        fechanacimiento: ['', Validators.required],
        discapacitado: ['', Validators.required],
        porcdiscapacidad: ['', Validators.required],
        porcexonera: ['', Validators.required],
        estado: '',
        email: ['', [Validators.required, Validators.email]],
        idpjuridica_personeriajuridica: ['', Validators.required],
        usumodi: this.authService.idusuario,
        fecmodi: date,
        usucrea: this.authService.idusuario,
        feccrea: date,
      },
      { updateOn: 'blur' }
    );

    this.listarNacionalidades();
    this.listarPersoneriaJuridica();
    this.listarTpIdentifica();
    this.buscaCliente();
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
    this.nacionalidadS.getListaNacionalidades().subscribe({
      next: (datos) => (this.nacionalidad = datos),
      error: (err) => console.error(err.error),
    });
  }

  listarPersoneriaJuridica() {
    this.personeriajuridicaS.getListaPersoneriaJuridica().subscribe({
      next: (datos) => (this.personeriajuridica = datos),
      error: (err) => console.error(err.error),
    });
  }

  listarTpIdentifica() {
    this.tpidentiService.getListaTpIdentifica().subscribe({
      next: (datos) => (this._tpidentifica = datos),
      error: (err) => console.error(err.error),
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      const change = changes[propName];
      if (change.firstChange) {
        console.log('Property ' + propName + ' changed for the first time.');
      } else {
        console.log(
          'Property ' +
            propName +
            ' changed from ' +
            change.previousValue +
            ' to ' +
            change.currentValue
        );
      }
    }
  }

  add_nacionalidad() {
    this.router.navigate(['/nacionalidades']);
  }

  buscaCliente() {
    let idcliente = sessionStorage.getItem('idclienteToModi');
    //let cli: any = this.cliService.getListaById()
    console.log(idcliente);
    this.cliService.getListaById(+idcliente!).subscribe({
      next: (datos: any) => {
        console.log(datos);
        this.cliente = datos;
        this.codidentifica = this.cliente.idtpidentifica_tpidentifica.codigo;
        this.antcedula = datos.cedula;
        this.formCliente.patchValue({
          idcliente: datos.idcliente,
          idnacionalidad_nacionalidad: datos.idnacionalidad_nacionalidad,
          idtpidentifica_tpidentifica: datos.idtpidentifica_tpidentifica,
          cedula: datos.cedula,
          nombre: datos.nombre,
          direccion: datos.direccion,
          telefono: datos.telefono,
          fechanacimiento: datos.fechanacimiento,
          discapacitado: datos.discapacitado,
          porcdiscapacidad: datos.porcdiscapacidad,
          porcexonera: datos.porcexonera,
          estado: datos.estado,
          email: datos.email,
          idpjuridica_personeriajuridica: datos.idpjuridica_personeriajuridica,
          usucrea: datos.usucrea,
          feccrea: datos.feccrea,
          usumodi: this.authService.idusuario,
          fecmodi: this.date,
        });
      },
      error: (err) => console.error(err.error),
    });
  }

  changeNacion() {
    const idtpidentificaControl = this.formCliente.get(
      'idtpidentifica_tpidentifica'
    )!;
    idtpidentificaControl.setValue('');
    const cedulaControl = this.formCliente.get('cedula');
    if (cedulaControl) {
      cedulaControl.setValue('');
    }
  }

  changeTpidentifica() {
    const cedulaControl = this.formCliente.get('cedula');
    if (cedulaControl) {
      cedulaControl.setValue('');
    }
    this.codidentifica =
      this.formCliente.value.idtpidentifica_tpidentifica.codigo;
  }

  retornar() {
    if (this.parent) this.router.navigate([this.parent]);
    else this.router.navigate(['/clientes']);
  }

  onSubmit() {
    console.log(this.formCliente.value);
    this.cliService.updateCliente(this.formCliente.value).subscribe({
      next: (datos) => {
        console.log(datos);
        this.retornar();
      },
      error: (err) => console.error(err.error),
    });
    /* if ((this.validar == true) && (this.validarporc == true)) {
      } else {
         alert("ERROR DE INGRESO DE INFORMACIÓN");
      } */
  }

  compararNacionalidad(o1: Nacionalidad, o2: Nacionalidad): boolean {
    if (o1 === undefined && o2 === undefined) {
      return true;
    } else {
      return o1 === null || o2 === null || o1 === undefined || o2 === undefined
        ? false
        : o1.idnacionalidad == o2.idnacionalidad;
    }
  }

  compararPersoneriaJuridica(
    o1: PersoneriaJuridica,
    o2: PersoneriaJuridica
  ): boolean {
    if (o1 === undefined && o2 === undefined) {
      return true;
    } else {
      return o1 === null || o2 === null || o1 === undefined || o2 === undefined
        ? false
        : o1.idpjuridica == o2.idpjuridica;
    }
  }

  compararTpIdentifica(o1: Tpidentifica, o2: Tpidentifica): boolean {
    if (o1 === undefined && o2 === undefined) {
      return true;
    } else {
      return o1 === null || o2 === null || o1 === undefined || o2 === undefined
        ? false
        : o1.idtpidentifica == o2.idtpidentifica;
    }
  }

  valIdentifica(control: AbstractControl) {
    console.log(control);
    switch (this.codidentifica) {
      case '04': // RUC
        if (control.value.length == 13) {
          const numeros = /^\d+$/.test(control.value);
          if (numeros) return of(null); // Validación exitosa
          else return of({ invalid: true });
        } else return of({ invalid: true }); // Validación fallida
      case '05': // Cedula
        if (control.value.length == 10) {
          let rtn = this.valCedula(control.value);
          if (rtn) return of(null);
          else return of({ invalid: true });
        } else return of({ invalid: true });
      case '06': //Pasaporte
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
      .pipe(
        map((result) =>
          control.value != this.antcedula && result ? { existe: true } : null
        )
      );
  }

  valCedula(cedula: String) {
    console.log(cedula);
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
}
