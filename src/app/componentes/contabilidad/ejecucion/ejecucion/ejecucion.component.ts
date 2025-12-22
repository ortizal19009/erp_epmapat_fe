import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Ejecucio } from 'src/app/modelos/contabilidad/ejecucio.model';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucio.service';
import { ReformasService } from 'src/app/servicios/contabilidad/reformas.service';

@Component({
  selector: 'app-ejecucion',
  templateUrl: './ejecucion.component.html',
  styleUrls: ['./ejecucion.component.css'],
})
export class EjecucionComponent {
  idrefo: number;
  ejecucio = {} as Ejecucio; //Interface para los datos de la Ejecucion
  reforma = {} as Reforma; //Interface para los datos de la Reforma
  _ejecucio: any;
  filtro: string;
  formBuscar: FormGroup;
  disabled = false;
  swvalido = 1;
  totalModfi: number = 0;
  idejecu = 0;
  codpar: string;
  elimdisabled = false;
  formBusPresupue: FormGroup;

  constructor(
    public fb: FormBuilder,
    private ejecuService: EjecucionService,
    private router: Router,
    private refoService: ReformasService
  ) {}

  ngOnInit(): void {
    this.idrefo = +sessionStorage.getItem('idrefoToEjecucion')!;
    this.refoService.getById(this.idrefo).subscribe({
      next: (resp) => {
        this.reforma.idrefo = resp.idrefo;
        this.reforma.numero = resp.numero;
        this.reforma.fecha = resp.fecha;
        this.reforma.tipo = 'Gasto';
        if (resp.tipo == 'I') this.reforma.tipo = 'Ingreso';
        this.reforma.documento = resp.intdoc.nomdoc + ' ' + resp.numdoc;
      },
      error: (err) => console.error(err.error),
    });
    this.listarPartidas();
  }

  listarPartidas() {
    this.ejecuService.getByIdrefo(this.idrefo).subscribe({
      next: (resp: any) => {
        console.log(resp);
        this._ejecucio = resp;
        this._ejecucio.forEach((ejecucio: { modifi: number }) => {
          this.totalModfi += ejecucio.modifi;
        });
      },
      error: (err) =>
        console.log('Al recuperar las partidas de la reforma: ', err.error),
    });
  }

  // onSubmit() {
  //    this.listarEjecucion();
  // }

  // public listarEjecucion() {
  //    if (this.formBuscar.value.idejecu != null && this.formBuscar.value.idejecu != '') {
  //       this.ejecuService.getByIdrefo(this.formBuscar.value.idejecu).subscribe({
  //          next: resp => this._ejecucion = resp,
  //          error: err => console.error(err.error)
  //       })
  //    }
  // }

  regresarReformas() {
    this.router.navigate(['/reformas']);
  }

  public infoEjecucion(ejecucio: Ejecucio) {
    sessionStorage.setItem('idejecuToInfo', ejecucio.inteje.toString());
    this.router.navigate(['info-ejecucion']);
  }

  modiEjecucion(ejecucio: Ejecucio) {
    sessionStorage.setItem('idejecuToModi', ejecucio.inteje.toString());
    this.router.navigate(['/modi-ejecucion']);
  }

  onCellClick1(ejecucio: Ejecucio) {
    this.idejecu = ejecucio.inteje;
    this.codpar = ejecucio.codpar;
  }

  eliminarEjecucion(idejecu: number) {
    if (idejecu != null) {
      this.ejecuService.deleteEjecucion(idejecu).subscribe({
        next: (resp) => {
          this.router.navigate(['/ejecucio']);
          location.reload(); // Agregar esta línea para refrescar la página
        },
        error: (err) => console.error(err.error),
      });
    }
  }
}

interface Reforma {
  idrefo: number;
  numero: number;
  tipo: string;
  fecha: Date;
  documento: String;
  concepto: String;
  valor: number;
}
