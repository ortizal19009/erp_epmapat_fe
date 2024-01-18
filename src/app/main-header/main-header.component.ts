import { Component, HostListener, OnInit } from '@angular/core';
import { MainFooterComponent } from '../main-footer/main-footer.component';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AutorizaService } from '../compartida/autoriza.service';
import { UsuarioService } from '../servicios/administracion/usuario.service';
import { Router } from '@angular/router';

@Component({
   selector: 'app-main-header',
   templateUrl: './main-header.component.html',
   styleUrls: ['./main-header.component.css']
})

export class MainHeaderComponent implements OnInit {

   fondo1: number;
   modulos: String[];
   enabled: boolean[];
   formDefinir: FormGroup;
   tmpmodu: number;

   constructor(private footer: MainFooterComponent, public fb: FormBuilder,
      public authService: AutorizaService, private usuService: UsuarioService, private router: Router) { }

   ngOnInit(): void {
      // const reloadButton = document.querySelector(".reload-button");
      // // Agregar un evento a la recarga
      // if (reloadButton != null) {
      //    reloadButton.addEventListener('click', () => {
      //       // Hacer algo antes de recargar la página
      //       console.log('Aqui')
      //       // Recargar la página
      //       location.reload();
      //    });
      // }



      //Fondo
      let fondoActual = sessionStorage.getItem("fondoActual")?.toString();
      this.fondo1 = +fondoActual!
      //Módulos
      this.modulos = ["Comercialización", "Contabilidad gubernamental", "Inventario",
         "Propiedad, planta y equipo", "Recursos humanos", "Administración central"];

      // console.log('Esta en ngOnInit() de header')
      this.authService.valsession();

      // this.tmpmodu = +sessionStorage.getItem('tmpmodu')!
      // if(this.tmpmodu) {
      //    // this.authService.log = true;
      //    this.authService.idusuario = +sessionStorage.getItem('tmpusu')!
      //    this.authService.moduActual = this.tmpmodu;
      //    this.authService.alias = sessionStorage.getItem('tmpalias')!
      //    sessionStorage.removeItem('tmpusu');
      //    sessionStorage.removeItem('tmpmodu');
      //    sessionStorage.removeItem('tmpalias');
      // }
      // ========== Quitar para Build ============
      // else{
      //    this.authService.log = true;
      //    this.authService.idusuario = 1;

      //    this.authService.alias = 'Administrador' 
      // }
      // ========== Hasta aqui ============

      this.authService.nomodulo = this.modulos[this.authService.moduActual - 1];

      //No hay modulos
      if (this.authService.sessionlog) this.authService.enabModulos();
      else this.enabled = [false, false, false, false, false, false];

      this.formDefinir = this.fb.group({
         fdesde: '',
         fhasta: '',
         otrapestania: ''
      });
   }

   // @HostListener('window:beforeunload', ['$event'])
   // unloadHandler(event: Event): void {
   //    event.preventDefault();
   // }

   // @HostListener('window:beforeunload', ['$event'])
   // beforeUnloadHandler(event: Event) {
   //    event.preventDefault();
   // }

   // @HostListener('window:unload', ['$event'])
   // unloadHandler(event: Event): void {
   //    event.preventDefault();
   // }

   // onNavigationEnd() {
   //    this.router.navigate(['/app-rutas']);
   // }

   fondo() {
      if (!this.fondo1) { this.fondo1 = 1; }
      else { this.fondo1 = this.fondo1 * -1; }
      sessionStorage.setItem("fondoActual", this.fondo1.toString())
      this.footer.fondo(this.fondo1);
   }

   definir() {
      this.formDefinir.controls['fdesde'].setValue(sessionStorage.getItem("fdesde"));
      this.formDefinir.controls['fhasta'].setValue(sessionStorage.getItem("fhasta"));
      if (sessionStorage.getItem("otrapestania") == 'true') this.formDefinir.controls['otrapestania'].setValue(true);
      else this.formDefinir.controls['otrapestania'].setValue(false);
   }

   guardarDefinir() {
      this.usuService.getByIdusuario(1).subscribe({
         next: resp => {
            resp.fdesde = this.formDefinir.value.fdesde;
            resp.fhasta = this.formDefinir.value.fhasta;
            resp.otrapestania = this.formDefinir.value.otrapestania;
            this.usuService.updateUsuario(1, resp).subscribe({
               next: resp => {
                  sessionStorage.setItem("fdesde", this.formDefinir.value.fdesde.toString());
                  sessionStorage.setItem("fhasta", this.formDefinir.value.fhasta.toString());
                  sessionStorage.setItem("otrapestania", this.formDefinir.value.otrapestania.toString())
               },
               error: err => console.log(err.error)
            });
         },
         error: err => console.log(err.error)
      });
   }

}
