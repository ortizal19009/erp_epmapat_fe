import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Tipopago } from 'src/app/modelos/tipopago.model';
import { TipopagoService } from 'src/app/servicios/tipopago.service';

@Component({
  selector: 'app-add-tipopago',
  templateUrl: './add-tipopago.component.html'
})
export class AddTipopagoComponent implements OnInit {
  tp: Tipopago = new Tipopago();

  constructor(private tipopago: TipopagoService, private router: Router) { }

  ngOnInit(): void {
  }

  guardarTipopago() {
    this.tipopago.saveTipopago(this.tp).subscribe(datos => {
      this.retornarListaTipopago();
    }, error => console.error(error))
  }
  retornarListaTipopago() {
    this.router.navigate(['lis-tipopago']);
  }
  onSubmit() {
    this.guardarTipopago();
  }

}
