import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Usuarios } from 'src/app/modelos/administracion/usuarios.model';
import { Cajas } from 'src/app/modelos/cajas.model';
import { Ptoemision } from 'src/app/modelos/ptoemision';
import { CajaService } from 'src/app/servicios/caja.service';
import { UsuarioService } from 'src/app/servicios/administracion/usuario.service';
import { PtoemisionService } from 'src/app/servicios/ptoemision.service';

@Component({
  selector: 'app-modificar-caja',
  templateUrl: './modificar-caja.component.html',
})
export class ModificarCajaComponent implements OnInit, OnChanges {
  cajaForm: FormGroup;
  ptoemision: Ptoemision[] = [];
  _usuariosDisponibles: Usuarios[] = [];
  usuarioInvalido: boolean = false;
  guardando: boolean = false;
  @Input() idcaja: any;

  constructor(
    public fb: FormBuilder,
    private cajaService: CajaService,
    private router: Router,
    private ptoemiService: PtoemisionService,
    private authService: AutorizaService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit() {
    this.inicializarFormulario();
    this.listarPtoEmision();
    this.cargarUsuariosDisponibles();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!changes['idcaja']?.currentValue) {
      return;
    }

    this.idcaja = +changes['idcaja'].currentValue;
    this.iniciar();
  }

  get disabled(): boolean {
    return this.guardando || this.cajaForm.invalid || this.usuarioInvalido;
  }

  onUsuarioInput(valor: string): void {
    const texto = (valor ?? '').trim();

    if (!texto) {
      this.cajaForm.patchValue(
        { idusuario_usuarios: null, usuario: '' },
        { emitEvent: false }
      );
      this.usuarioInvalido = false;
      return;
    }

    const usuarioSeleccionado =
      this._usuariosDisponibles.find((usuario) => usuario.nomusu === texto) ??
      this._usuariosDisponibles.find((usuario) => usuario.alias === texto) ??
      null;

    this.cajaForm.patchValue(
      {
        idusuario_usuarios: usuarioSeleccionado,
        usuario: usuarioSeleccionado?.nomusu ?? texto,
      },
      { emitEvent: false }
    );

    this.usuarioInvalido = !usuarioSeleccionado;
  }

  onSubmit() {
    if (this.disabled) {
      this.cajaForm.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.cajaService.updateCaja(this.construirCajaActualizada()).subscribe({
      next: () => window.location.reload(),
      error: (error) => {
        this.guardando = false;
        console.error(error);
      },
    });
  }

  iniciar() {
    const fecha = new Date();
    const idcaja: number = this.idcaja;

    this.cajaService.getById(+idcaja!).subscribe((datos) => {
      this.cajaForm.patchValue({
        idcaja: datos.idcaja,
        codigo: datos.codigo,
        descripcion: datos.descripcion,
        idptoemision_ptoemision: datos.idptoemision_ptoemision,
        usuario: datos.idusuario_usuarios?.nomusu ?? '',
        usuarioBusqueda: datos.idusuario_usuarios?.nomusu ?? '',
        idusuario_usuarios: datos.idusuario_usuarios ?? null,
        estado: datos.estado,
        usucrea: datos.usucrea ?? this.authService.idusuario,
        feccrea: datos.feccrea,
        usumodi: this.authService.idusuario,
        fecmodi: fecha,
      });

      this.cargarUsuariosDisponibles(datos.idusuario_usuarios?.idusuario ?? null);
    });
  }

  listarPtoEmision() {
    this.ptoemiService.getListaPtoEmision().subscribe({
      next: (datos) => {
        this.ptoemision = datos;
      },
      error: (error) => console.error(error),
    });
  }

  retornar() {
    this.router.navigate(['cajas']);
  }

  compararPtoEmision(o1: Ptoemision, o2: Ptoemision): boolean {
    if (o1 === undefined && o2 === undefined) {
      return true;
    }
    return o1 === null || o2 === null || o1 === undefined || o2 === undefined
      ? false
      : o1.idptoemision == o2.idptoemision;
  }

  private inicializarFormulario(): void {
    const fecha = new Date();

    this.cajaForm = this.fb.group({
      idcaja: [''],
      codigo: ['', [Validators.required, Validators.pattern(/^[0-9]{3}$/)]],
      descripcion: ['', [Validators.required, Validators.minLength(3)]],
      idptoemision_ptoemision: ['', Validators.required],
      estado: [1, Validators.required],
      idusuario_usuarios: [null],
      usucrea: [this.authService.idusuario],
      feccrea: [fecha],
      usuario: [''],
      usuarioBusqueda: [''],
      usumodi: [this.authService.idusuario],
      fecmodi: [fecha],
    });
  }

  private cargarUsuariosDisponibles(idUsuarioActual: number | null = null): void {
    forkJoin({
      usuarios: this.usuarioService.getUsuarios(),
      cajas: this.cajaService.getListaCaja(),
    }).subscribe({
      next: ({ usuarios, cajas }) => {
        const usuariosOcupados = new Set(
          (cajas ?? [])
            .filter((caja) => caja?.idusuario_usuarios?.idusuario !== idUsuarioActual)
            .map((caja) => caja?.idusuario_usuarios?.idusuario)
            .filter((idusuario) => !!idusuario)
        );

        this._usuariosDisponibles = (usuarios ?? []).filter(
          (usuario) =>
            usuario.estado !== false && !usuariosOcupados.has(usuario.idusuario)
        );
      },
      error: (err) => console.error(err.error ?? err),
    });
  }

  private construirCajaActualizada(): Cajas {
    const formValue = this.cajaForm.value;
    const caja = new Cajas();

    caja.idcaja = formValue.idcaja;
    caja.codigo = formValue.codigo.trim();
    caja.descripcion = formValue.descripcion.trim();
    caja.idptoemision_ptoemision = formValue.idptoemision_ptoemision;
    caja.estado = +formValue.estado;
    caja.idusuario_usuarios = formValue.idusuario_usuarios;
    caja.usucrea = formValue.usucrea;
    caja.feccrea = formValue.feccrea;
    caja.usumodi = this.authService.idusuario;
    caja.fecmodi = new Date();

    return caja;
  }
}
