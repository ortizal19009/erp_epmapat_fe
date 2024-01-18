import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AutorizaService } from '../compartida/autoriza.service';
import { UsuarioService } from '../servicios/administracion/usuario.service';

@Component({
   selector: 'inicio',
   templateUrl: './content-wrapper.component.html',
   styleUrls: ['./content-wrapper.component.css']
})

export class ContentWrapperComponent implements OnInit {


   formLogin: FormGroup;
   msg: boolean;
   bloqueado: boolean;
   kont: number = 0;
   moduTmp: number;

   constructor(public fb: FormBuilder, public authService: AutorizaService, private usuService: UsuarioService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/inicio');

      this.formLogin = this.fb.group({
         username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
         codusu: ['', [Validators.required, Validators.minLength(5)]]
      });
      console.log('Va a this.authService.session()') 
      this.authService.valsession();
   }

   get f() { return this.formLogin.controls; }

   login() {

      let b = myFun(this.formLogin.value.codusu)

      this.msg = false
      this.usuService.getUsuario(this.formLogin.value.username, b).subscribe({
         next: resp => {
            if (resp) {
               sessionStorage.clear();
               this.authService.sessionlog = true;
               this.authService.idusuario = resp.idusuario;
               this.authService.alias = resp.alias;
               this.authService.modulo = 1;
               this.authService.moduActual = 1;          //Poner el modulo por default del Usuario

               const abc = {
                  object: {
                     name: 'RcR',
                     xyz: true,
                     modulo: 1,
                     moduloActual: 1,
                  },
                  idusuario: resp.idusuario,
                  alias: resp.alias
               };
               sessionStorage.setItem('abc', btoa(JSON.stringify(abc)));

               this.authService.enabModulos();

               // if (resp.fdesde != null) sessionStorage.setItem("fdesde", resp.fdesde.toString().substring(0, 10));
               // if (resp.fhasta != null) sessionStorage.setItem("fhasta", resp.fhasta.toString().substring(0, 10));
               // sessionStorage.setItem("otrapestania", resp.otrapestania.toString())
            }
            else {
               this.msg = true;
               this.kont++
               if (this.kont > 3) this.bloqueado = true
            }
         },
         error: err => console.error(err.error)
      });
   }

   reinicia() { this.msg = false; }

}

function myFun(x: string): string {
   let y = "";
   for (let i = 0; i < x.length; i++) {
      y += String(x.charCodeAt(i));
   }
   let rtn = "";
   for (let i = 0; i < y.length; i += 2) {
      rtn += y[i];
   }
   rtn += String(x.trim().length);
   for (let i = y.length - 1; i >= 0; i -= 2) {
      rtn += y[i];
   }
   return rtn;
}
