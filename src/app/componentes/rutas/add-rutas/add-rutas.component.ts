import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Rutas } from 'src/app/modelos/rutas.model';
import { RutasService } from 'src/app/servicios/rutas.service';
import { RutasComponent } from '../rutas/rutas.component';

@Component({
   selector: 'app-add-rutas',
   templateUrl: './add-rutas.component.html',
   styleUrls: ['./add-rutas.component.css']
})

export class AddRutasComponent implements OnInit {

   formRuta: FormGroup;
   rutas: Rutas = new Rutas();

   constructor(public fb: FormBuilder, public router: Router, public rutaService: RutasService,
      private authService: AutorizaService, private parent: RutasComponent) { }

   ngOnInit(): void {
      this.crearForm();
   }

   crearForm() {
      const fechaHora = new Date();
      this.formRuta = this.fb.group({
         orden: ['', Validators.required],
         descripcion: ['', [Validators.required, Validators.minLength(5)]],
         codigo: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(8)], this.valCodigo.bind(this)],
         usucrea: this.authService.idusuario,
         feccrea: fechaHora
      }, { updateOn: "blur" });
   }

   get f() { return this.formRuta.controls; }

   guardarRuta() {
      this.rutaService.saveRuta(this.formRuta.value).subscribe({
         next: resp => {
            this.reset()
            this.parent.listaRutas()
         },
         error: err => console.error(err.error)
      });
   }

   reset() { this.crearForm() }

   valCodigo(control: AbstractControl) {
      return this.rutaService.valCodigo(control.value)
         .pipe(
            map(result => result ? { existe: true } : null)
         );
   }

}
