import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from '../autoriza.service';
import { UsuarioService } from 'src/app/servicios/administracion/usuario.service';

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
      private usuarioService: UsuarioService
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
            const idusuario = +resp?.idusuario || 0;
            this.authService.idusuario = idusuario;
            this.authService.moduActual = 0;
            this.authService.modulo = 0;
            this.authService.sessionlog = true;

            try {
               const tokenPayload = {
                  idusuario,
                  alias: resp?.username || username,
                  nomusu: resp?.username || username,
                  modules: resp?.modules || []
               };
               sessionStorage.setItem('abc', btoa(JSON.stringify(tokenPayload)));
               localStorage.setItem('sessionlog', 'true');
            } catch {}

            this.authService.enabModulos();
         },
         error: (e) => {
            console.error(e);
            alert('No se pudo iniciar sesión. Verifica credenciales o disponibilidad del servicio.');
         }
      });

 }

}
