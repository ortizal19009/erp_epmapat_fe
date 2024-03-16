import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Convenios } from 'src/app/modelos/convenios.model';
import { ConvenioService } from 'src/app/servicios/convenio.service';

@Component({
  selector: 'app-modi-convenio',
  templateUrl: './modi-convenio.component.html', 
  styleUrls: ['./modi-convenio.component.css']
})

export class ModiConvenioComponent implements OnInit {

  idconvenio: number;
  convenio: Convenios;
  formConvenio: FormGroup;

  constructor(public fb: FormBuilder, private convService: ConvenioService, private router: Router,
     public authService: AutorizaService) { }

  ngOnInit(): void {
     sessionStorage.setItem('ventana', '/convenios');
     let coloresJSON = sessionStorage.getItem('/convenios');
     if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

     this.idconvenio = +sessionStorage.getItem('idconvenioToModi')!;
     sessionStorage.removeItem('idconvenioToModi');

     this.formConvenio = this.fb.group({
        nroconvenio: ['', Validators.required],
        referencia: ['', Validators.required],
        nroautorizacion: ['', Validators.required],
        totalconvenio: ['', Validators.required],
        cuotainicial: ['', Validators.required],
        cuotafinal: ['', Validators.required],
        observaciones: '',
        // usumodi:'' ,
        // fecmodi: '',
     },
        { updateOn: "blur" });

     this.datosConvenio();
  }

  colocaColor(colores: any) {
     document.documentElement.style.setProperty('--bgcolor1', colores[0]);
     const cabecera = document.querySelector('.cabecera');
     if (cabecera) cabecera.classList.add('nuevoBG1')
     document.documentElement.style.setProperty('--bgcolor2', colores[1]);
     const detalle = document.querySelector('.detalle');
     if (detalle) detalle.classList.add('nuevoBG2');
  }

  datosConvenio() {
     this.convService.getById(this.idconvenio).subscribe({
        next: datos => {
           this.convenio = datos;
           // console.log('this.convenio: ', this.convenio)
           // let fecmodi: Date = new Date();
           this.formConvenio.setValue({
              nroconvenio: datos.nroconvenio,
              referencia: datos.referencia,
              nroautorizacion: datos.nroautorizacion,
              totalconvenio: datos.totalconvenio,
              cuotainicial: datos.cuotainicial,
              cuotafinal: datos.cuotafinal,
              observaciones: datos.observaciones,
              // usumodi: this.authService.idusuario,
              // fecmodi: fecmodi
           });
        },
        error: err => console.error(err.error)
     });
  }

  get f() { return this.formConvenio.controls; }

  actualizar() {
     let fecmodi: Date = new Date();
     this.convenio.referencia = this.formConvenio.value.referencia;
     this.convenio.nroautorizacion = this.formConvenio.value.nroautorizacion;
     this.convenio.observaciones = this.formConvenio.value.observaciones;
     this.convenio.usumodi = this.authService.idusuario;
     this.convenio.fecmodi = fecmodi;
     this.convService.update(this.idconvenio, this.convenio ).subscribe({
        next: data => {
           console.log('Actualización Ok!')
           this.regresar()
        },
        error: err => console.error( err.error )
     });
  }

  regresar() {
     this.router.navigate(['convenios']);
  }

}
