import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { RutasService } from 'src/app/servicios/rutas.service';
// import { RutasService } from 'src/app/Service/rutas.service';
// import { Rutas } from 'src/app/modelos/rutas';

@Component({
   selector: 'app-buscar-ruta',
   templateUrl: './buscar-ruta.component.html',
   styleUrls: ['./buscar-ruta.component.css'],
})
export class BuscarRutaComponent implements OnInit {
   rutas: any;
   f_rutas: FormGroup;
   l_rutas: any;
   filterTerm: string;
   @Output() setRuta: EventEmitter<any> = new EventEmitter();
   //@Input() getRuta: string='100';

   constructor(private s_rutas: RutasService, private fb: FormBuilder) { }

   ngOnInit(): void {
      this.f_rutas = this.fb.group({
         nom_cod: '',
      });
      this.listarRutas();
   }

   listarRutas() {
      this.s_rutas.getListaRutas().subscribe({
         next: (datos) => {
            this.rutas = datos;
         },
         error: (e) => console.error(e),
      });
   }

   buscarRuta() {
      this.filterTerm = this.f_rutas.value.nom_cod;
      /*   this.s_rutas.getRutasByQuery(this.f_rutas.value.nom_cod).subscribe({
          next: (datos) => {
            this.l_rutas = datos;
          },
          error: (e) => console.error(e),
        }); */
   }

   seleccionarRuta(ruta: any) {
      this.setRuta.emit(ruta);
      //this.setRuta = ruta;
   }
}
