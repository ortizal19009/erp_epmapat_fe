import { Component, OnInit } from '@angular/core';

import { Tpidentifica } from 'src/app/modelos/tpidentifica.model';
import { TpidentificaService } from 'src/app/servicios/tpidentifica.service';
import { TpidentificasComponent } from '../tpidentificas/tpidentificas.component';

@Component({
  selector: 'app-add-tpidentifica',
  templateUrl: './add-tpidentifica.component.html',
  styleUrls: ['./add-tpidentifica.component.css']
})
export class AddTpidentificaComponent implements OnInit {
  tpi: Tpidentifica = new Tpidentifica();

  constructor(private parent: TpidentificasComponent, private tpidentificaservice: TpidentificaService) {}

  ngOnInit(): void { }

  guardar() {
    this.tpidentificaservice.nuevo(this.tpi).subscribe(datos => {
      this.parent.listarAll();
      this.reset()
    }, error => console.error(error))
  }

  reset(){
    this.tpi.codigo=undefined;
    this.tpi.nombre=undefined;
  }

  onSubmit() {
    this.guardar();
  }

}
