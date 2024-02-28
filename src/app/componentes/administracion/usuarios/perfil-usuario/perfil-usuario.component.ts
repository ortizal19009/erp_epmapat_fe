import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Usuarios } from 'src/app/modelos/administracion/usuarios.model';
import { AccesoService } from 'src/app/servicios/administracion/acceso.service';
import { UsuarioService } from 'src/app/servicios/administracion/usuario.service';

@Component({
   selector: 'app-perfil-usuario',
   templateUrl: './perfil-usuario.component.html',
   styleUrls: ['./perfil-usuario.component.css']
})
export class PerfilUsuarioComponent implements OnInit {

   idusuario: number;
   formUsuario: FormGroup;
   usuario: Usuarios;
   _acceso: any;
   filtro: string;

   constructor(private router: Router, private usuService: UsuarioService, private fb: FormBuilder,
      private accService: AccesoService
   ) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/usuarios');
      let coloresJSON = sessionStorage.getItem('/usuarios');
      this.colocaColor(JSON.parse(coloresJSON!));

      this.idusuario = +sessionStorage.getItem('idusuarioToPerfil')!;
      sessionStorage.removeItem('idusuarioToPerfil')

      this.formUsuario = this.fb.group({
         identificausu: '',
         nomusu: '',
      });
      this.buscaUsuario();
      
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   buscaUsuario() {
      this.usuService.getByIdusuario(this.idusuario).subscribe({
         next: datos => {
            this.usuario = datos;
            this.formUsuario.patchValue({
               identificausu: this.usuario.identificausu,
               nomusu: this.usuario.nomusu,
            });
            if( this.usuario != null) this.buscaAcceso();
         },
         error: err => console.error(err.error)
      });
   }

   //Recupera los registros de la Tabla Acceso
   buscaAcceso() {
      let regacc: number;
      this.accService.getAcceso().subscribe({
         next: resp => {
            this._acceso = resp;
            if (this._acceso != null) {
               let i = 0;
               this._acceso.forEach(() => {
                  this._acceso[i].indice = i;
                  this._acceso[i].largo = +this._acceso[i].codacc.length
                  this._acceso[i].espacios = this._acceso[i].codacc.slice(2, 10)
                  this._acceso[i].selec = false;
                  regacc = +this._acceso[i].regacc
                  if (this.usuario.priusu != null) {
                     if (+this.usuario.priusu.slice(regacc, regacc + 1) >= 5) this._acceso[i].selec = true;
                     else this._acceso[i].selec = false;
                  };
                  i++;
               });
            }
         },
         error: err => console.error(err.error)
      });
   }

   guardar() {
      let priusu = '';
      for (let i = 0; i < 300; i++) {
         const posi = this._acceso.find((opcion: any) => opcion.regacc == i);
         let j = -1;
         if (posi) j = posi.indice;
         if (j >= 0) {
            if (this._acceso[j].selec != null && this._acceso[j].selec != undefined) {
               if (this._acceso[j].selec) {
                  const pi = Math.floor(Math.random() * (9 - 5 + 1)) + 5;
                  priusu = priusu + pi.toString()
               }
               else {
                  const pi = Math.floor(Math.random() * (4 - 0 + 1)) + 0;
                  priusu = priusu + pi.toString();
               }
            }
         } else {
            const pi = Math.floor(Math.random() * (4 - 0 + 1)) + 0;
            priusu = priusu + pi.toString();
         }
      }
      this.usuario.priusu = priusu
      this.usuService.updateUsuario(this.idusuario, this.usuario).subscribe({
         next: nex => this.regresar(),
         error: err => console.error('Al actualizar el Usuario; ', err.error)
      });
   }

   regresar() { this.router.navigate(['/usuarios']); }

}
