import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ClasificadorService } from 'src/app/servicios/clasificador.service';

@Component({
   selector: 'app-clasificador',
   templateUrl: './clasificador.component.html',
   styleUrls: ['./clasificador.component.css']
})
export class ClasificadorComponent implements OnInit {

   _clasificador: any;
   filtro: string;
   formBuscar: FormGroup;
   disabled = false;
   swvalido = 1;

   constructor(public fb: FormBuilder, private clasiService: ClasificadorService, private router: Router) { }

   ngOnInit(): void {
      localStorage.removeItem("intclaToInfo");
      this.formBuscar = this.fb.group({
         codpar: '',
         nompar: '',
         filtro: '',
      });

      let codpar = document.getElementById("codpar") as HTMLInputElement;
      codpar.addEventListener('keyup', () => {
         this.swvalido = 1;
         this.formBuscar.controls['nompar'].setValue('');
      });
      let nompar = document.getElementById("nompar") as HTMLInputElement;
      nompar.addEventListener('keyup', () => {
         this.swvalido = 1;
         this.formBuscar.controls['codpar'].setValue('');
      });

   }

   onSubmit() {

      if (this.formBuscar.value.codpar != null && this.formBuscar.value.codpar != '') {
         this.clasiService.getByCodigo(this.formBuscar.value.codpar).subscribe({
            next: resp => this._clasificador = resp,
            error: err => console.log(err.error)
         })
      }

      if (this.formBuscar.value.nompar != null && this.formBuscar.value.nompar != '') {
         this.clasiService.getByNombre(this.formBuscar.value.nompar).subscribe({
            next: resp => this._clasificador = resp,
            error: err => console.log(err.error)
         })
      }
   }

   public info(intcla: number) {
      sessionStorage.setItem('intclaToInfo', intcla.toString());
      this.router.navigate(['info-clasificador']);
   }

   addClasificador() { this.router.navigate(['/add-clasificador']); }
 
}