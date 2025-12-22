import { Component, OnInit } from '@angular/core';

import { Ubicacionm } from 'src/app/modelos/ubicacionm.model';
import { UbicacionmService } from 'src/app/servicios/ubicacionm.service';
import { UbicacionmComponent } from '../ubicacionm/ubicacionm.component';

@Component({
  selector: 'app-add-ubicacionm',
  templateUrl: './add-ubicacionm.component.html'
})

export class AddUbicacionmComponent implements OnInit {

  ubi: Ubicacionm = new Ubicacionm();

  constructor(private parent: UbicacionmComponent, private ubicaService: UbicacionmService) {}

  ngOnInit(): void {
  }

  guardar() {
    let date: Date = new Date();
    this.ubi.feccrea = date;

    this.ubicaService.nuevo(this.ubi).subscribe(datos => {
      this.parent.listarAll();
      this.ubi.descripcion=undefined;
    }, error => console.error(error))
  }

  onSubmit() { this.guardar();  }

}
