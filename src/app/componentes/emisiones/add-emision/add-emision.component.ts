import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Emisiones } from 'src/app/modelos/emisiones.model';
import { EmisionService } from 'src/app/servicios/emision.service';
import { EmisionesComponent } from '../emisiones/emisiones.component';

@Component({
  selector: 'app-add-emision',
  templateUrl: './add-emision.component.html',
})
export class AddEmisionComponent implements OnInit {
  emi: Emisiones = new Emisiones();
  emiForm: FormGroup;
  newdisabled = true;

  constructor(
    private parent: EmisionesComponent,
    private emisionservice: EmisionService
  ) {}

  ngOnInit(): void {}

  guardar() {
    this.emi.feccrea = new Date();
    this.emisionservice.saveEmision(this.emi).subscribe(
      (datos) => {
        // this.parent.listarEmisiones ();
      },
      (error) => console.error(error)
    );
  }

  onSubmit() {
    this.guardar();
  }
}
