import { Component, OnInit } from '@angular/core';

import { Tpreclamo } from 'src/app/modelos/tpreclamo.model';
import { TpreclamoService } from 'src/app/servicios/tpreclamo.service';
import { TpreclamosComponent } from '../tpreclamos/tpreclamos.component';

@Component({
  selector: 'app-add-tpreclamo',
  templateUrl: './add-tpreclamo.component.html'
})
export class AddTpreclamoComponent implements OnInit {

  tpr: Tpreclamo = new Tpreclamo();

  constructor(private parent: TpreclamosComponent, private tpreclamoService: TpreclamoService) {}

  ngOnInit(): void { }

  guardar() {
    let date: Date = new Date();
    this.tpr.feccrea = date;

    this.tpreclamoService.nuevo(this.tpr).subscribe(datos => {
      this.parent.listarAll();
      this.reset()
    }, error => console.log(error))
  }

  reset(){
    this.tpr.descripcion=undefined;
  }

  onSubmit() { this.guardar();  }

}
