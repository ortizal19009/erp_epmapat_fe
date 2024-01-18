import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClasificadorService } from 'src/app/servicios/clasificador.service';

@Component({
  selector: 'app-info-clasificador',
  templateUrl: './info-clasificador.component.html',
  styleUrls: ['./info-clasificador.component.css']
})

export class InfoClasificadorComponent implements OnInit  {

  clasificador = {} as Clasificador; //Interface para los datos del Clasificador
  elimdisabled = true;
  noPartidas: true;
  _movimientos: any;

  constructor(private router: Router, private clasificadorService: ClasificadorService) { }

  ngOnInit(): void {
     this.datosClasificador();
  }

  datosClasificador() {
   let intcla = sessionStorage.getItem('intclaToInfo');
   this.clasificadorService.getById(+intcla!).subscribe({
      next: resp => { 
         this.clasificador.intcla = resp.intcla;
         this.clasificador.codpar = resp.codpar;
         this.clasificador.nivpar = resp.nivpar;
         this.clasificador.grupar = resp.grupar;
         this.clasificador.nompar = resp.nompar;
         this.clasificador.despar = resp.despar;
      },
      error: err => console.log(err.error),
   })
  }

  regresar() { this.router.navigate(['/clasificador']); }

  modiClasificador() {
     localStorage.setItem("intclaToModi", this.clasificador.intcla.toString());
     this.router.navigate(['/modi-clasificador']);
  }

  eliminarClasificador() {
     if (this.clasificador.intcla != null) {
        this.clasificadorService.deleteClasificador(this.clasificador.intcla).subscribe(datos => {
           this.router.navigate(['/clasificador']);
        }, error => console.log(error));
     }
  }

}

interface Clasificador {
  intcla: number;
  codpar: String;
  nivpar: number;
  grupar: String;
  nompar: String;
  despar: String;
}