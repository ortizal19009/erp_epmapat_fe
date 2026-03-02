import { Component, OnInit } from '@angular/core';
import { ThActionsService } from 'src/app/servicios/rrhh/th-actions.service';

@Component({
  selector: 'app-th-actions',
  templateUrl: './th-actions.component.html',
  styleUrls: ['./th-actions.component.css']
})
export class ThActionsComponent implements OnInit {
  idpersonal: number = 2;
  acciones: any[] = [];
  model: any = {
    idpersonal_personal: { idpersonal: 2 },
    tipoaccion: 'INGRESO',
    motivo: '',
    observacion: '',
    fecvigencia: '',
    usucrea: 1,
  };

  constructor(private service: ThActionsService) {}

  ngOnInit(): void {
    this.buscar();
  }

  buscar() {
    this.service.getByPersonal(this.idpersonal).subscribe({
      next: (data: any) => (this.acciones = data || []),
      error: (e) => console.error(e),
    });
  }

  guardar() {
    this.model.idpersonal_personal = { idpersonal: this.idpersonal };
    this.service.save(this.model).subscribe({
      next: () => {
        this.model.motivo = '';
        this.model.observacion = '';
        this.model.fecvigencia = '';
        this.buscar();
      },
      error: (e) => console.error(e),
    });
  }
}
