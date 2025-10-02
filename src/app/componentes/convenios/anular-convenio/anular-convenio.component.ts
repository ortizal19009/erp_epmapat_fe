import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Convenios } from 'src/app/modelos/convenios.model';
import { Cuotas } from 'src/app/modelos/cuotas.model';
import { ConvenioService } from 'src/app/servicios/convenio.service';
import { CuotasService } from 'src/app/servicios/cuotas.service';
import { FacxconvenioService } from 'src/app/servicios/facxconvenio.service';

@Component({
  selector: 'app-anular-convenio',
  templateUrl: './anular-convenio.component.html',
  styleUrls: ['./anular-convenio.component.css']
})
export class AnularConvenioComponent implements OnInit {
  _convenio: Convenios = new Convenios();
  _cuotas: any;
  _facxconvenio: any;
  constructor(private actRouter: ActivatedRoute, private s_convenio: ConvenioService, private s_cuota: CuotasService, private s_facxconvenios: FacxconvenioService
  ) { }

  ngOnInit(): void {
    let idconvenio = +this.actRouter.snapshot.paramMap.get('idconvenio')!;
    console.log(idconvenio);
    this.getDatosConvenio(idconvenio);
  }
  getDatosConvenio(idconvenio: number) {
    this.s_convenio.getById(idconvenio).subscribe({
      next: (convenio: any) => {
        console.log(convenio)
        this._convenio = convenio;
      },
      error: (e: any) => console.error(e)
    })
    this.s_cuota.getByIdconvenio(idconvenio).subscribe({
      next: (cuotas: any) => {
        console.log(cuotas)
        this._cuotas = cuotas;
      },
      error: (e: any) => console.error(e)
    })
    this.s_facxconvenios.getFacByConvenio(idconvenio).subscribe({
      next: (facxconvenio: any) => {
        console.log(facxconvenio)
        this._facxconvenio = facxconvenio;
      },
      error: (e: any) => console.error(e)
    })
  }

}
