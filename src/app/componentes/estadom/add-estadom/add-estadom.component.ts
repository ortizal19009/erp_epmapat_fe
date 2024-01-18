import { Component, OnInit } from '@angular/core';
import { Estadom } from 'src/app/modelos/estadom.model';
import { EstadomService } from 'src/app/servicios/estadom.service';
import { ListarEstadomComponent } from '../listar-estadom/listar-estadom.component';

@Component({
  selector: 'app-add-estadom',
  templateUrl: './add-estadom.component.html'
})

export class AddEstadomComponent implements OnInit {

  ems: Estadom = new Estadom();

  constructor(private parent: ListarEstadomComponent, private estadomservice: EstadomService) { }

  ngOnInit(): void { }

  guardarEstadom() {
    this.estadomservice.saveEstadom(this.ems).subscribe(datos => {
      this.parent.listarEstadom();
    }, error => console.log(error))
  }

  onSubmit() {
    this.guardarEstadom();
  }

}
