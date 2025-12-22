import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FacelectroService } from 'src/app/servicios/facelectro.service';

@Component({
  selector: 'app-facelectro',
  templateUrl: './facelectro.component.html'
})
export class FacelectroComponent implements OnInit {

  buscarForm: FormGroup;
  filtro: string;
  _facelectro: any;
  idfacelectro: number;
  fecha: Date;

  constructor( public fb: FormBuilder, private faceleService: FacelectroService) { }

  ngOnInit(): void {
    this.buscarForm = this.fb.group({
      selecTipoBusqueda: 1,
      buscarFacelectro: ['']
    });
  }

  onSubmit() {
    let s_tipobusqueda = document.getElementById("selecTipoBusqueda") as HTMLSelectElement;
    let i_buscaFacelectro = document.getElementById("buscarFacelectro") as HTMLInputElement;

    if ((+s_tipobusqueda.value!) == 1 && i_buscaFacelectro.value != '') {
      this.faceleService.getByNrofac(i_buscaFacelectro.value).subscribe(datos => {
        this._facelectro = datos;
        this.fecha = datos.feccrea ;
        this.idfacelectro = datos.idfacelectro;
      }, error => console.error(error));
    } else if ((+s_tipobusqueda.value!) == 2 && i_buscaFacelectro.value != '') {
      this.faceleService.getByNrofac(i_buscaFacelectro.value).subscribe(datos => {
        this._facelectro = datos;
      }, error => console.error(error));
    } else if ((+s_tipobusqueda.value!) == 3 && i_buscaFacelectro.value != '') {
      this.faceleService.getByNrofac(i_buscaFacelectro.value).subscribe(datos => {
        this._facelectro = datos;
      }, error => console.error(error));
    } else if (i_buscaFacelectro.value === '') {
      i_buscaFacelectro.style.border = "#F54500 1px solid";
    }
  }

}
