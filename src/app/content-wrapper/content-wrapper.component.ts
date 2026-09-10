import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from '../compartida/autoriza.service';
import { UsuarioService } from '../servicios/administracion/usuario.service';
import { PerfilAccesoService } from '../servicios/administracion/perfil-acceso.service';

@Component({
  selector: 'inicio',
  templateUrl: './content-wrapper.component.html',
  styleUrls: ['./content-wrapper.component.css'],
})
export class ContentWrapperComponent implements OnInit {
  formLogin: FormGroup;
  msg: boolean;
  bloqueado: boolean;
  kont: number = 0;
  moduTmp: number;
  showPassword = false;
  iniciandoSesion = false;
  errorLogin = '';

  constructor(
    public fb: FormBuilder,
    public authService: AutorizaService,
    private usuService: UsuarioService,
    private perfilAcceso: PerfilAccesoService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/inicio');

    this.formLogin = this.fb.group({
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(20),
        ],
      ],
      codusu: ['', [Validators.required, Validators.minLength(5)]],
    });
    // console.log('Va a this.authService.session()')
    this.authService.valsession();
  }

  get f() {
    return this.formLogin.controls;
  }

  login() {
    if (this.iniciandoSesion || this.formLogin.invalid) return;
    this.msg = false;
    this.errorLogin = '';
    this.iniciandoSesion = true;
    this.usuService.loginAuth({
      username: this.formLogin.value.username,
      password: this.formLogin.value.codusu,
      platform: 'WEB',
    }).subscribe({
      next: (resp) => {
        if (resp) {
          sessionStorage.clear();
          this.authService.sessionlog = true;
          this.authService.idusuario = resp.userId;
          this.authService.alias = resp.username;
          this.authService.modulo = 1;
          this.authService.moduActual = 1; //Poner el modulo por default del Usuario
          const abc = {
            object: {
              name: 'RcR',
              xyz: true,
              modulo: 1,
              moduloActual: 1,
              moduActual: 1,
            },
            idusuario: resp.userId,
            alias: resp.username,
            modules: [],
          };
          sessionStorage.setItem('abc', btoa(JSON.stringify(abc)));
          sessionStorage.setItem('webJwt', resp.token);
          localStorage.setItem('sessionlog', 'true');

          // El guard de /home recibe el perfil ya validado y no carga módulos bloqueados.
          this.perfilAcceso.loadForCurrentUser(true).subscribe({
            next: (loaded) => {
              this.iniciandoSesion = false;
              if (!loaded) {
                this.authService.logout();
                alert('No se pudo verificar los permisos del usuario. Intente iniciar sesión nuevamente.');
                return;
              }
              // Permanece en Inicio; enabModulos ya seleccionó el primer módulo habilitado.
            },
          });
        } else {
          this.iniciandoSesion = false;
          this.msg = true;
          this.errorLogin = 'No se recibio una respuesta valida del servidor.';
          this.kont++;
          if (this.kont > 3) this.bloqueado = true;
        }
      },
      error: (err) => {
        this.iniciandoSesion = false;
        this.msg = true;
        const message = err?.error?.message || err?.error || err?.message || 'No se pudo conectar al servidor.';
        const credencialesInvalidas = err?.status === 401;
        this.errorLogin = credencialesInvalidas
          ? 'Usuario y/o contrasena incorrectos.'
          : `No se pudo iniciar sesion: ${message}`;
        if (credencialesInvalidas) {
          this.kont++;
          if (this.kont > 3) this.bloqueado = true;
        }
        console.error('Error al iniciar sesión:', message, err);
      },
    });
  }
  reinicia() {
    this.msg = false;
    this.errorLogin = '';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
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
