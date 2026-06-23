import { Component, OnInit, SimpleChanges } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, map, of } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Clientes } from 'src/app/modelos/clientes';
import { Nacionalidad } from 'src/app/modelos/nacionalidad';
import { PersoneriaJuridica } from 'src/app/modelos/personeria-juridica';
import { Tpidentifica } from 'src/app/modelos/tpidentifica.model';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { NacionalidadService } from 'src/app/servicios/nacionalidad.service';
import { PersoneriaJuridicaService } from 'src/app/servicios/personeria-juridica.service';
import { TpidentificaService } from 'src/app/servicios/tpidentifica.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modificar-clientes',
  templateUrl: './modificar-clientes.component.html',
  styleUrls: ['./modificar-clientes.component.css'],
})
export class ModificarClientesComponent implements OnInit {
  private parent: string | null;
  formCliente: FormGroup;
  cliente: Clientes;
  nacionalidad: Nacionalidad[] = [];
  personeriajuridica: PersoneriaJuridica[] = [];
  _tpidentifica: Tpidentifica[] = [];
  private clienteOriginal: any = null;
  validar: boolean = false;
  validarporc: boolean = false;
  codidentifica: any;
  antcedula: String;
  swModifi = false;
  date: Date = new Date();

  /*====================================================== */
  formBuscar: FormGroup;
  formCredenciales: FormGroup;

  loadingBuscar = false;
  loadingGuardar = false;

  clienteSeleccionado: any | null = null;

  errorMsg = '';
  successMsg = '';

  ventana: string = 'modi-cliente';
  rolepermission: number;
  passwordMismatch: boolean = false;

  constructor(
    public fb: FormBuilder,
    private cliService: ClientesService,
    public nacionalidadS: NacionalidadService,
    private tpidentiService: TpidentificaService,
    private router: Router,
    public personeriajuridicaS: PersoneriaJuridicaService,
    private authService: AutorizaService,
    private coloresService: ColoresService
  ) {
    this.formBuscar = this.fb.group({
      cuenta: [''],
      identificacion: [''],
    });

    this.formCredenciales = this.fb.group(
      {
        username: ['', [Validators.required, Validators.minLength(4)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordsCoincidenValidator }
    );
  }

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
    this.parent = sessionStorage.getItem('padreModiCliente');

    let date: Date = new Date();
    this.formCliente = this.fb.group(
      {
        idcliente: '',
        idnacionalidad_nacionalidad: [null, Validators.required],
        idtpidentifica_tpidentifica: [null, Validators.required],
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
        idpjuridica_personeriajuridica: [null, Validators.required],
        usumodi: this.authService.idusuario,
        fecmodi: date,
        usucrea: this.authService.idusuario,
        feccrea: date,
      },
      { updateOn: 'blur' }
    );
    this.formCredenciales = this.fb.group(
      {
        username: ['', [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        activo: [true, Validators.required], // nuevo campo
      },
      { validators: this.passwordMatchValidator }
    );

    this.cargarCatalogosYCliente();
  }
  passwordMatchValidator(group: AbstractControl) {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    if (pass && confirm && pass !== confirm) {
      return { passwordMismatch: true };
    }
    return null;
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

  private cargarCatalogosYCliente() {
    const idcliente = Number(sessionStorage.getItem('idclienteToModi'));
    if (!idcliente) {
      console.error('No se encontró el id del cliente a modificar');
      return;
    }

    forkJoin({
      nacionalidades: this.nacionalidadS.getListaNacionalidades(),
      personerias: this.personeriajuridicaS.getListaPersoneriaJuridica(),
      tiposIdentificacion: this.tpidentiService.getListaTpIdentifica(),
      cliente: this.cliService.getListaById(idcliente),
    }).subscribe({
      next: ({ nacionalidades, personerias, tiposIdentificacion, cliente }: any) => {
        this.nacionalidad = nacionalidades ?? [];
        this.personeriajuridica = personerias ?? [];
        this._tpidentifica = tiposIdentificacion ?? [];
        this.aplicarClienteFormulario(cliente);
      },
      error: (err) => console.error(err?.error ?? err),
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      const change = changes[propName];
      if (change.firstChange) {
      } else {
      }
    }
  }

  add_nacionalidad() {
    this.router.navigate(['/nacionalidades']);
  }

  private aplicarClienteFormulario(datos: any) {
    this.clienteOriginal = datos;
    this.cliente = datos;
    this.codidentifica = datos?.idtpidentifica_tpidentifica?.codigo ?? '';
    this.antcedula = datos?.cedula;

    const nacionalidadSeleccionada = this.buscarPorId(
      this.nacionalidad,
      'idnacionalidad',
      datos?.idnacionalidad_nacionalidad
    );
    const tipoIdentificacionSeleccionado = this.buscarPorId(
      this._tpidentifica,
      'idtpidentifica',
      datos?.idtpidentifica_tpidentifica
    );
    const personeriaSeleccionada = this.buscarPorId(
      this.personeriajuridica,
      'idpjuridica',
      datos?.idpjuridica_personeriajuridica
    );

    this.formCliente.patchValue({
      idcliente: datos.idcliente,
      idnacionalidad_nacionalidad: nacionalidadSeleccionada,
      idtpidentifica_tpidentifica: tipoIdentificacionSeleccionado,
      cedula: datos.cedula,
      nombre: datos.nombre,
      direccion: datos.direccion,
      telefono: datos.telefono,
      fechanacimiento: this.normalizarFechaInput(datos.fechanacimiento),
      discapacitado: String(datos.discapacitado ?? ''),
      porcdiscapacidad: datos.porcdiscapacidad,
      porcexonera: String(datos.porcexonera ?? '0'),
      estado: datos.estado,
      email: datos.email,
      idpjuridica_personeriajuridica: personeriaSeleccionada,
      usucrea: datos.usucrea,
      feccrea: datos.feccrea,
      usumodi: this.authService.idusuario,
      fecmodi: this.date,
    });
    this.formCliente.markAsPristine();

    this.formCredenciales.patchValue({
      username: datos.username ?? '',
    });
  }

  private buscarPorId<T extends Record<string, any>>(
    lista: T[],
    campoId: string,
    valor: any
  ): T | null {
    const idBuscado = valor?.[campoId] ?? valor;
    if (!idBuscado) {
      return null;
    }
    return (
      lista.find(
        (item) => String(item?.[campoId] ?? '') === String(idBuscado)
      ) ?? null
    );
  }

  private normalizarFechaInput(valor: any): string {
    if (!valor) {
      return '';
    }
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) {
      return '';
    }
    return fecha.toISOString().split('T')[0];
  }

  changeNacion() {
    const idtpidentificaControl = this.formCliente.get(
      'idtpidentifica_tpidentifica'
    )!;
    idtpidentificaControl.setValue(null);
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
      this.formCliente.value.idtpidentifica_tpidentifica?.codigo ?? '';
  }

  private construirPayloadCliente() {
    const formVal = this.formCliente.getRawValue();

    return {
      ...formVal,
      idnacionalidad_nacionalidad: {
        idnacionalidad:
          formVal.idnacionalidad_nacionalidad?.idnacionalidad ??
          formVal.idnacionalidad_nacionalidad,
      },
      idtpidentifica_tpidentifica: {
        idtpidentifica:
          formVal.idtpidentifica_tpidentifica?.idtpidentifica ??
          formVal.idtpidentifica_tpidentifica,
      },
      idpjuridica_personeriajuridica: {
        idpjuridica:
          formVal.idpjuridica_personeriajuridica?.idpjuridica ??
          formVal.idpjuridica_personeriajuridica,
      },
      usumodi: this.authService.idusuario,
      fecmodi: new Date().toISOString().split('T')[0],
    };
  }

  private resumirCambios(): string[] {
    if (!this.clienteOriginal) {
      return [];
    }

    const actual = this.formCliente.getRawValue();
    const original = this.clienteOriginal;
    const cambios: string[] = [];

    const comparaciones = [
      ['Nacionalidad', original.idnacionalidad_nacionalidad?.descripcion, actual.idnacionalidad_nacionalidad?.descripcion],
      ['Tipo identificación', original.idtpidentifica_tpidentifica?.nombre, actual.idtpidentifica_tpidentifica?.nombre],
      ['Identificación', original.cedula, actual.cedula],
      ['Nombre', original.nombre, actual.nombre],
      ['Dirección', original.direccion, actual.direccion],
      ['Teléfono', original.telefono, actual.telefono],
      ['Fecha nacimiento', this.normalizarFechaInput(original.fechanacimiento), actual.fechanacimiento],
      ['Discapacidad', String(original.discapacitado ?? ''), String(actual.discapacitado ?? '')],
      ['% Discapacidad', String(original.porcdiscapacidad ?? ''), String(actual.porcdiscapacidad ?? '')],
      ['% Exoneración', String(original.porcexonera ?? ''), String(actual.porcexonera ?? '')],
      ['Email', original.email, actual.email],
      ['Personería jurídica', original.idpjuridica_personeriajuridica?.descripcion, actual.idpjuridica_personeriajuridica?.descripcion],
    ];

    for (const [etiqueta, anterior, nuevo] of comparaciones) {
      const valorAnterior = anterior ?? '';
      const valorNuevo = nuevo ?? '';
      if (String(valorAnterior) !== String(valorNuevo)) {
        cambios.push(
          `<li><strong>${etiqueta}:</strong> ${valorAnterior || 'Sin dato'} -> ${valorNuevo || 'Sin dato'}</li>`
        );
      }
    }

    return cambios;
  }

  retornar() {
    if (this.parent) this.router.navigate([this.parent]);
    else this.router.navigate(['/clientes']);
  }

  onSubmit() {
    if (this.formCliente.invalid) {
      this.formCliente.markAllAsTouched();
      return;
    }
    const cambios = this.resumirCambios();
    if (cambios.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin cambios',
        text: 'No hay cambios para actualizar en el cliente.',
      });
      return;
    }

    void Swal.fire({
      title: 'Confirmar actualización',
      html:
        `Cliente: <strong>${this.formCliente.value.nombre}</strong><br>` +
        `Identificación: <strong>${this.formCliente.value.cedula}</strong><hr>` +
        `<div class="text-left"><strong>Cambios detectados:</strong><ul>${cambios.join('')}</ul></div>`,
      icon: 'question',
      input: 'textarea',
      inputLabel: 'Observación del cambio',
      inputPlaceholder: 'Describa brevemente qué se modificó...',
      inputAttributes: { 'aria-label': 'Observación' },
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="bi bi-check-circle"></i> Guardar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) return;

      const clienteBody = this.construirPayloadCliente();

      this.cliService.updateClienteAuditoria(
        clienteBody,
        this.authService.idusuario,
        result.value || 'Sin observación',
        'MODIFICACION'
      ).subscribe({
        next: () => {
          this.clienteOriginal = {
            ...this.clienteOriginal,
            ...this.formCliente.getRawValue(),
          };
          this.formCliente.markAsPristine();
          Swal.fire({
            toast: true,
            icon: 'success',
            title: 'Cliente modificado correctamente',
            position: 'top',
            showConfirmButton: false,
            timer: 2000,
          });
          this.retornar();
        },
        error: (err) => {
          console.error(err.error);
          Swal.fire({
            icon: 'error',
            title: 'Error al guardar',
            text: err?.error?.message ?? 'Ocurrió un error inesperado.',
          });
        },
      });
    });
    return;

    Swal.fire({
      title: '¿Guardar cambios?',
      html: `Cliente: <strong>${this.formCliente.value.nombre}</strong><br>
             Identificación: <strong>${this.formCliente.value.cedula}</strong>`,
      icon: 'question',
      input: 'textarea',
      inputLabel: 'Observación del cambio',
      inputPlaceholder: 'Describa brevemente qué se modificó...',
      inputAttributes: { 'aria-label': 'Observación' },
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="bi bi-check-circle"></i> Guardar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) return;

      const formVal = this.formCliente.value;

      const clienteBody = {
        ...formVal,
        idnacionalidad_nacionalidad: {
          idnacionalidad: formVal.idnacionalidad_nacionalidad?.idnacionalidad
            ?? formVal.idnacionalidad_nacionalidad
        },
        idtpidentifica_tpidentifica: {
          idtpidentifica: formVal.idtpidentifica_tpidentifica?.idtpidentifica
            ?? formVal.idtpidentifica_tpidentifica
        },
        idpjuridica_personeriajuridica: {
          idpjuridica: formVal.idpjuridica_personeriajuridica?.idpjuridica
            ?? formVal.idpjuridica_personeriajuridica
        },
        usumodi: this.authService.idusuario,
        fecmodi: new Date().toISOString().split('T')[0],
      };

      this.cliService.updateClienteAuditoria(
        clienteBody,
        this.authService.idusuario,
        result.value || 'Sin observación',
        'MODIFICACION'
      ).subscribe({
        next: () => {
          Swal.fire({
            toast: true,
            icon: 'success',
            title: 'Cliente modificado correctamente',
            position: 'top',
            showConfirmButton: false,
            timer: 2000,
          });
          this.retornar();
        },
        error: (err) => {
          console.error(err.error);
          Swal.fire({
            icon: 'error',
            title: 'Error al guardar',
            text: err?.error?.message ?? 'Ocurrió un error inesperado.',
          });
        },
      });
    });
  }

  compararNacionalidad(o1: Nacionalidad, o2: Nacionalidad): boolean {
    const id1 = o1 && 'idnacionalidad' in o1 ? o1.idnacionalidad : (o1 as any);
    const id2 = o2 && 'idnacionalidad' in o2 ? o2.idnacionalidad : (o2 as any);
    if (id1 == null && id2 == null) {
      return true;
    }
    if (id1 == null || id2 == null) {
      return false;
    }
    return String(id1) === String(id2);
  }

  compararPersoneriaJuridica(
    o1: PersoneriaJuridica,
    o2: PersoneriaJuridica
  ): boolean {
    const id1 = o1 && 'idpjuridica' in o1 ? o1.idpjuridica : (o1 as any);
    const id2 = o2 && 'idpjuridica' in o2 ? o2.idpjuridica : (o2 as any);
    if (id1 == null && id2 == null) {
      return true;
    }
    if (id1 == null || id2 == null) {
      return false;
    }
    return String(id1) === String(id2);
  }

  compararTpIdentifica(o1: Tpidentifica, o2: Tpidentifica): boolean {
    const id1 = o1 && 'idtpidentifica' in o1 ? o1.idtpidentifica : (o1 as any);
    const id2 = o2 && 'idtpidentifica' in o2 ? o2.idtpidentifica : (o2 as any);
    if (id1 == null && id2 == null) {
      return true;
    }
    if (id1 == null || id2 == null) {
      return false;
    }
    return String(id1) === String(id2);
  }

  valIdentifica(control: AbstractControl) {
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
  /*====================================00 */
  // Validador para que password y confirmPassword coincidan
  passwordsCoincidenValidator(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('password')?.value;
    const conf = group.get('confirmPassword')?.value;
    if (!pass || !conf) return null;
    return pass === conf ? null : { passwordMismatch: true };
  }

  onBuscarCliente(): void {
    this.errorMsg = '';
    this.successMsg = '';
    this.clienteSeleccionado = null;

    const cuenta = this.formBuscar.value.cuenta?.trim();
    const identificacion = this.formBuscar.value.identificacion?.trim();

    /*     if (!cuenta && !identificacion) {
          this.errorMsg = 'Ingrese número de cuenta o identificación para buscar.';
          return;
        }
     */
    this.loadingBuscar = true;
    let cli: any = this.cliente;
    this.loadingBuscar = false;

    if (!cli) {
      this.errorMsg =
        'No se encontró ningún cliente con los datos proporcionados.';
      return;
    }

    this.clienteSeleccionado = cli;
  }

  onActualizarCredenciales(): void {
    if (!this.clienteSeleccionado) return;

    this.errorMsg = '';
    this.successMsg = '';

    if (this.formCredenciales.invalid) {
      this.formCredenciales.markAllAsTouched();
      return;
    }

    const { username, password } = this.formCredenciales.value;

    this.loadingGuardar = true;

    this.cliService
      .actualizarCredenciales(
        this.clienteSeleccionado.idcliente,
        username,
        password
      )
      .subscribe({
        next: () => {
          this.loadingGuardar = false;
          this.successMsg = 'Usuario y contraseña actualizados correctamente.';
          this.retornar();
        },
        error: (err) => {
          console.error(err);
          this.loadingGuardar = false;
          this.errorMsg = 'No se pudo actualizar las credenciales del cliente.';
        },
      });
  }

  limpiarTodo(): void {
    this.formBuscar.reset();
    this.formCredenciales.reset();
    this.clienteSeleccionado = null;
    this.errorMsg = '';
    this.successMsg = '';
  }
}
