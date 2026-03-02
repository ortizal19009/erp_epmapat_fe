import { Component, OnInit } from '@angular/core';
import { PersonalService } from 'src/app/servicios/rrhh/personal.service';
import { ThLeaveService } from 'src/app/servicios/rrhh/th-leave.service';

@Component({
  selector: 'app-th-leave',
  templateUrl: './th-leave.component.html',
  styleUrls: ['./th-leave.component.css']
})
export class ThLeaveComponent implements OnInit {
  idpersonal: number = 0;
  personalList: any[] = [];
  balances: any[] = [];
  requests: any[] = [];
  msg = '';
  error = '';

  balanceModel: any = { idpersonal_personal: { idpersonal: 0 }, anio: new Date().getFullYear(), dias_asignados: 15, dias_usados: 0, dias_disponibles: 15, usucrea: 1 };
  requestModel: any = { idpersonal_personal: { idpersonal: 0 }, tipolicencia: 'VACACION', fechainicio: '', fechafin: '', motivo: '', usucrea: 1 };

  constructor(private service: ThLeaveService, private personalService: PersonalService) {}

  ngOnInit(): void {
    this.personalService.getAllPersonal().subscribe({
      next: (d: any) => {
        this.personalList = d || [];
        if (this.personalList.length > 0) {
          this.idpersonal = this.personalList[0].idpersonal;
          this.cargar();
        }
      },
      error: (e) => console.error(e)
    });
  }

  cargar() {
    if (!this.idpersonal) return;
    this.service.getBalancesByPersonal(this.idpersonal).subscribe((d: any) => this.balances = d || []);
    this.service.getRequestsByPersonal(this.idpersonal).subscribe((d: any) => this.requests = d || []);
  }

  crearBalance() {
    this.msg = ''; this.error = '';
    this.balanceModel.idpersonal_personal = { idpersonal: this.idpersonal };
    this.service.createBalance(this.balanceModel).subscribe({
      next: () => { this.msg = 'Balance creado'; this.cargar(); },
      error: (e) => { this.error = e?.error?.message || 'Error al crear balance'; console.error(e); }
    });
  }

  crearRequest() {
    this.msg = ''; this.error = '';
    this.requestModel.idpersonal_personal = { idpersonal: this.idpersonal };
    this.service.createRequest(this.requestModel).subscribe({
      next: () => { this.msg = 'Solicitud creada'; this.cargar(); },
      error: (e) => { this.error = e?.error?.message || 'Error al crear solicitud'; console.error(e); }
    });
  }

  aprobar(idrequest: number) {
    this.service.aprobar(idrequest, { aprobadorId: 1, observacion: 'Aprobado FE' }).subscribe({
      next: () => { this.msg = 'Solicitud aprobada'; this.cargar(); },
      error: (e) => { this.error = e?.error?.message || 'Error al aprobar'; }
    });
  }

  rechazar(idrequest: number) {
    this.service.rechazar(idrequest, { aprobadorId: 1, observacion: 'Rechazado FE' }).subscribe({
      next: () => { this.msg = 'Solicitud rechazada'; this.cargar(); },
      error: (e) => { this.error = e?.error?.message || 'Error al rechazar'; }
    });
  }
}
