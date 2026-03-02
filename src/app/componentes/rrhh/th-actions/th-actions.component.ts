import { Component, OnInit } from '@angular/core';
import { PersonalService } from 'src/app/servicios/rrhh/personal.service';
import { ThActionsService } from 'src/app/servicios/rrhh/th-actions.service';

@Component({
  selector: 'app-th-actions',
  templateUrl: './th-actions.component.html',
  styleUrls: ['./th-actions.component.css']
})
export class ThActionsComponent implements OnInit {
  idpersonal: number = 0;
  personalList: any[] = [];
  acciones: any[] = [];
  loading = false;
  msg = '';
  error = '';

  model: any = {
    idpersonal_personal: { idpersonal: 0 },
    tipoaccion: 'INGRESO',
    motivo: '',
    observacion: '',
    fecvigencia: '',
    usucrea: 1,
  };

  constructor(
    private service: ThActionsService,
    private personalService: PersonalService
  ) {}

  ngOnInit(): void {
    this.cargarPersonal();
  }

  cargarPersonal() {
    this.personalService.getAllPersonal().subscribe({
      next: (data: any) => {
        this.personalList = data || [];
        if (this.personalList.length > 0 && !this.idpersonal) {
          this.idpersonal = this.personalList[0].idpersonal;
          this.buscar();
        }
      },
      error: (e) => {
        this.error = 'No se pudo cargar personal';
        console.error(e);
      },
    });
  }

  buscar() {
    if (!this.idpersonal) return;
    this.loading = true;
    this.error = '';
    this.service.getByPersonal(this.idpersonal).subscribe({
      next: (data: any) => {
        this.acciones = data || [];
        this.loading = false;
      },
      error: (e) => {
        this.error = 'No se pudo consultar acciones';
        this.loading = false;
        console.error(e);
      },
    });
  }

  guardar() {
    this.msg = '';
    this.error = '';
    if (!this.idpersonal) {
      this.error = 'Seleccione un personal';
      return;
    }
    if (!this.model.fecvigencia) {
      this.error = 'La fecha de vigencia es obligatoria';
      return;
    }

    this.model.idpersonal_personal = { idpersonal: this.idpersonal };
    this.service.save(this.model).subscribe({
      next: () => {
        this.msg = 'Acción guardada correctamente';
        this.model.motivo = '';
        this.model.observacion = '';
        this.model.fecvigencia = '';
        this.buscar();
      },
      error: (e) => {
        this.error = e?.error?.message || 'No se pudo guardar la acción';
        console.error(e);
      },
    });
  }
}
