import { Component } from '@angular/core';
import { ThLeaveService } from 'src/app/servicios/rrhh/th-leave.service';

@Component({
  selector: 'app-th-leave',
  templateUrl: './th-leave.component.html',
  styleUrls: ['./th-leave.component.css']
})
export class ThLeaveComponent {
  idpersonal: number = 2;
  balances: any[] = [];
  requests: any[] = [];

  balanceModel: any = { idpersonal_personal: { idpersonal: 2 }, anio: new Date().getFullYear(), dias_asignados: 15, dias_usados: 0, dias_disponibles: 15, usucrea: 1 };
  requestModel: any = { idpersonal_personal: { idpersonal: 2 }, tipolicencia: 'VACACION', fechainicio: '', fechafin: '', motivo: '', usucrea: 1 };

  constructor(private service: ThLeaveService) {}

  cargar() {
    this.service.getBalancesByPersonal(this.idpersonal).subscribe((d: any) => this.balances = d || []);
    this.service.getRequestsByPersonal(this.idpersonal).subscribe((d: any) => this.requests = d || []);
  }

  crearBalance() {
    this.balanceModel.idpersonal_personal = { idpersonal: this.idpersonal };
    this.service.createBalance(this.balanceModel).subscribe({ next: () => this.cargar(), error: (e) => console.error(e) });
  }

  crearRequest() {
    this.requestModel.idpersonal_personal = { idpersonal: this.idpersonal };
    this.service.createRequest(this.requestModel).subscribe({ next: () => this.cargar(), error: (e) => console.error(e) });
  }

  aprobar(idrequest: number) {
    this.service.aprobar(idrequest, { aprobadorId: 1, observacion: 'Aprobado FE' }).subscribe(() => this.cargar());
  }

  rechazar(idrequest: number) {
    this.service.rechazar(idrequest, { aprobadorId: 1, observacion: 'Rechazado FE' }).subscribe(() => this.cargar());
  }
}
