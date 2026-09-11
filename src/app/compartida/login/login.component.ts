import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from '../autoriza.service';
import { UsuarioService } from 'src/app/servicios/administracion/usuario.service';
import { PerfilAccesoService } from 'src/app/servicios/administracion/perfil-acceso.service';

@Component({
   selector: 'app-login',
   templateUrl: './login.component_old.html',
   styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit{

   formLogin: FormGroup;
   // PDFOld: Boolean = false;

   constructor(
      private router: Router,
      public fb: FormBuilder,
      private authService: AutorizaService,
      private usuarioService: UsuarioService,
      private perfilAcceso: PerfilAccesoService,
   ) { }

   ngOnInit(): void {

      // this.PDFOld = Boolean(sessionStorage.getItem('PDFOld'))

      this.formLogin = this.fb.group({
         username: [null, [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
         password: [null, Validators.required ],
      });
   }

   login() {
      const username = (this.formLogin?.value?.username || '').trim();
      const password = (this.formLogin?.value?.password || '').trim();
      if (!username || !password) return;

      this.usuarioService.loginAuth({ username, password, platform: 'WEB' }).subscribe({
         next: (resp: any) => {
            const idusuario = Number(resp?.userId ?? resp?.idusuario ?? 0);
            const token = String(resp?.token || '').trim();
            if (!idusuario || !token) {
               this.authService.logout();
               alert('La respuesta de inicio de sesión no contiene una sesión WEB válida.');
               return;
            }

            sessionStorage.clear();
            this.authService.idusuario = idusuario;
            this.authService.moduActual = 0;
            this.authService.modulo = 0;
            this.authService.sessionlog = true;

            try {
               const tokenPayload = {
                  idusuario,
                  alias: resp?.username || username,
                  nomusu: resp?.username || username,
                  modules: []
               };
               sessionStorage.setItem('abc', btoa(JSON.stringify(tokenPayload)));
               sessionStorage.setItem('webJwt', token);
               localStorage.setItem('sessionlog', 'true');
            } catch {}

            // Do not expose the ERP modules until both module and window permissions are verified.
            this.perfilAcceso.loadForCurrentUser(true).subscribe({
               next: (loaded) => {
                  if (!loaded) {
                     this.authService.logout();
                     alert('No se pudo verificar los permisos del usuario. Intente iniciar sesión nuevamente.');
                  }
               }
            });
         },
         error: (e) => {
            console.error(e);
            alert('No se pudo iniciar sesión. Verifica credenciales o disponibilidad del servicio.');
         }
      });

 }

}
