import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, of, switchMap } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Usuarios } from 'src/app/modelos/administracion/usuarios.model';
import { Cajas } from 'src/app/modelos/cajas.model';
import { Ptoemision } from 'src/app/modelos/ptoemision';
import { Recaudaxcaja } from 'src/app/modelos/recaudaxcaja.model';
import { CajaService } from 'src/app/servicios/caja.service';
import { UsuarioService } from 'src/app/servicios/administracion/usuario.service';
import { PtoemisionService } from 'src/app/servicios/ptoemision.service';
import { RecaudaxcajaService } from 'src/app/servicios/recaudaxcaja.service';

@Component({
  selector: 'app-add-caja',
  templateUrl: './add-caja.component.html',
  styleUrls: ['./add-caja.component.css'],
})
export class AddCajaComponent implements OnInit {
  _ptoemision: Ptoemision[] = [];
  _usuariosDisponibles: Usuarios[] = [];
  formCaja: FormGroup;
  rtn1: number = 0;
  rtn2: number = 0;
  codigos: string = '';
  descripcion: string = '';
  usuarioInvalido: boolean = false;
  guardando: boolean = false;

  constructor(
    public fb: FormBuilder,
    private cajaService: CajaService,
    public ptoemiService: PtoemisionService,
    private authService: AutorizaService,
    private usuarioService: UsuarioService,
    private recaudaxcajaService: RecaudaxcajaService
  ) {}

  ngOnInit(): void {
    const date = new Date();

    this.formCaja = this.fb.group({
      descripcion: ['', [Validators.required, Validators.minLength(3)]],
      codigo: [
        '',
        [Validators.required, Validators.pattern(/^[0-9]{3}$/)],
      ],
      estado: [1, Validators.required],
      idptoemision_ptoemision: [null, Validators.required],
      usucrea: [this.authService.idusuario],
      feccrea: [date],
      idusuario_usuarios: [null, Validators.required],
      usuarioBusqueda: ['', Validators.required],
    });

    this.listarPtoEmision();
    this.cargarUsuariosDisponibles();
  }

  get disabled(): boolean {
    return (
      this.guardando ||
      this.formCaja.invalid ||
      this.usuarioInvalido ||
      !this.formCaja.value.idusuario_usuarios
    );
  }

  onUsuarioInput(valor: string): void {
    const texto = (valor ?? '').trim();
    const usuarioSeleccionado =
      this._usuariosDisponibles.find((usuario) => usuario.nomusu === texto) ??
      this._usuariosDisponibles.find((usuario) => usuario.alias === texto) ??
      null;

    this.formCaja.patchValue(
      { idusuario_usuarios: usuarioSeleccionado },
      { emitEvent: false }
    );
    this.usuarioInvalido = !!texto && !usuarioSeleccionado;
  }

  onSubmit(): void {
    this.rtn1 = 0;
    this.rtn2 = 0;
    this.formCaja.markAllAsTouched();

    if (this.disabled) {
      return;
    }

    const descripcion = this.formCaja.value.descripcion.trim();
    const codigo = this.formCaja.value.codigo.trim();
    forkJoin({
      cajas: this.cajaService.getListaCaja(),
      cajasPorDescripcion: this.cajaService.getByDescri(descripcion),
    })
      .pipe(
        switchMap(({ cajas, cajasPorDescripcion }) => {
          const cajaConCodigo = (cajas ?? []).find(
            (caja: any) => String(caja.codigo).trim() === codigo
          );

          if (cajaConCodigo) {
            this.rtn1 = 1;
            this.codigos = `${cajaConCodigo.idptoemision_ptoemision?.establecimiento ?? ''}.${codigo}`;
          }

          if (cajasPorDescripcion.length > 0) {
            this.rtn2 = 1;
            this.descripcion = descripcion;
          }

          if (this.rtn1 === 1 || this.rtn2 === 1) {
            return of(null);
          }

          this.guardando = true;
          return this.guardarCaja();
        })
      )
      .subscribe({
        next: (respuesta) => {
          if (!respuesta) {
            return;
          }
          window.location.reload();
        },
        error: (error) => {
          this.guardando = false;
          console.error(error);
        },
      });
  }

  private guardarCaja() {
    const caja = this.construirCaja();

    return this.cajaService.saveCaja(caja).pipe(
      switchMap((cajaCreada: any) => {
        const idcaja = this.obtenerIdCaja(cajaCreada);
        if (!idcaja) {
          return of(cajaCreada);
        }

        return this.cajaService.getById(idcaja).pipe(
          switchMap((cajaGuardada: Cajas) => {
            const recaudaxcaja = this.construirRecaudaxcaja(cajaGuardada);
            return this.recaudaxcajaService.saveRecaudaxcaja(recaudaxcaja);
          })
        );
      })
    );
  }

  private construirCaja(): Cajas {
    const fecha = new Date();
    const descripcion = this.formCaja.value.descripcion.trim();
    const codigo = this.formCaja.value.codigo.trim();
    const ptoEmision = this.formCaja.value.idptoemision_ptoemision as Ptoemision;
    const usuario = this.formCaja.value.idusuario_usuarios as Usuarios;
    const caja = new Cajas();

    caja.descripcion = descripcion;
    caja.codigo = codigo;
    caja.estado = 1;
    caja.idptoemision_ptoemision = {
      idptoemision: ptoEmision.idptoemision,
    } as Ptoemision;
    caja.usucrea = this.authService.idusuario;
    caja.feccrea = fecha;
    caja.idusuario_usuarios = { idusuario: usuario.idusuario } as Usuarios;
    caja.ultimafact = '1';

    return caja;
  }

  private construirRecaudaxcaja(caja: Cajas): Recaudaxcaja {
    const fecha = new Date();
    const usuario = this.formCaja.value.idusuario_usuarios as Usuarios;

    return {
      estado: 1,
      facinicio: 1,
      facfin: 1,
      fechainiciolabor: fecha,
      horainicio: fecha,
      idcaja_cajas: caja,
      idusuario_usuarios: caja.idusuario_usuarios ?? usuario,
    } as Recaudaxcaja;
  }

  private obtenerIdCaja(cajaCreada: any): number | null {
    if (typeof cajaCreada === 'number') {
      return cajaCreada;
    }

    if (typeof cajaCreada === 'string') {
      const id = Number(cajaCreada);
      return Number.isNaN(id) ? null : id;
    }

    return cajaCreada?.idcaja ?? null;
  }

  listarPtoEmision(): void {
    this.ptoemiService.getListaPtoEmision().subscribe({
      next: (datos: Ptoemision[]) => {
        this._ptoemision = datos ?? [];
        if (this._ptoemision.length > 0) {
          this.formCaja.patchValue({
            idptoemision_ptoemision: this._ptoemision[0],
          });
        }
      },
      error: (err) => console.error(err.error),
    });
  }

  cargarUsuariosDisponibles(): void {
    forkJoin({
      usuarios: this.usuarioService.getUsuarios(),
      cajas: this.cajaService.getListaCaja(),
    }).subscribe({
      next: ({ usuarios, cajas }) => {
        const usuariosOcupados = new Set(
          (cajas ?? [])
            .map((caja) => caja?.idusuario_usuarios?.idusuario)
            .filter((idusuario) => !!idusuario)
        );

        this._usuariosDisponibles = (usuarios ?? []).filter(
          (usuario) => usuario.estado !== false && !usuariosOcupados.has(usuario.idusuario)
        );
      },
      error: (err) => console.error(err.error ?? err),
    });
  }
}
