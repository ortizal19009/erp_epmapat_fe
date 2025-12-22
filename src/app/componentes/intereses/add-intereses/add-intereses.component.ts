import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { map } from 'rxjs';
import { InteresesService } from 'src/app/servicios/intereses.service';
import { ListarInteresesComponent } from '../intereses/intereses.component';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { TmpinteresxfacService } from 'src/app/servicios/tmpinteresxfac.service';

@Component({
   selector: 'app-add-intereses',
   templateUrl: './add-intereses.component.html',
   styleUrls: ['./add-intereses.component.css']
})

export class AddInteresesComponent implements OnInit {

   formInteres: FormGroup;

   constructor(private inteService: InteresesService, public fb: FormBuilder, private s_tmpinteresxfac: TmpinteresxfacService, private parent: ListarInteresesComponent, public authService: AutorizaService) { }

   ngOnInit(): void {
      this.creaForm();
      this.buscaUltimo();
   }

   creaForm() {
      this.formInteres = this.fb.group({
         anio: [0, [Validators.required, Validators.minLength(4), Validators.maxLength(4)], this.valAnio.bind(this)],
         mes: [1, Validators.required, this.valMes.bind(this)],
         porcentaje: [0, [Validators.required, Validators.min(0.01)]],
         usucrea: this.authService.idusuario,
         feccrea: (new Date().toISOString().substring(0, 10)),
      });
   }

   buscaUltimo() {
      var ultAnio: number = 0;
      var ultMes: number = 0;
      this.inteService.getUltimo().subscribe({
         next: resp => {
            ultAnio = resp[0].anio;
            ultMes = +resp[0].mes;
            if (ultMes == 12) {
               ultAnio++;
               ultMes = 1;
            } else { ultMes++ }
            this.formInteres.controls['mes'].setValue(ultMes);
            this.formInteres.controls['anio'].setValue(ultAnio);
         },
         error: err => console.error(err.error),
      });
   }

   get f() { return this.formInteres.controls; }

   onSubmit() {
      this.inteService.saveIntereses(this.formInteres.value).subscribe({
         next: async (datos: any) => {
            this.reset();
            this.parent.listarIntereses();
            let tempInteres = await this.inteService.recalcularBatchInteres();
            console.log(tempInteres);
         },
         error: err => console.error(err.error),
      });
   }

   reset() { this.parent.reset(); }

   valAnio(control: AbstractControl) {
      return this.inteService.getByAnioMes(control.value, this.formInteres?.value.mes)
         .pipe(
            map(result => result.length == 1 ? { existe: true } : null)
         );
   }

   valMes(control: AbstractControl) {
      return this.inteService.getByAnioMes(this.formInteres?.value.anio, control.value)
         .pipe(
            map(result1 => result1.length == 1 ? { existe1: true } : null)
         );
   }

}
