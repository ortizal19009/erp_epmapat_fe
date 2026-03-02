import { Component, OnInit } from '@angular/core';
import { PersonalService } from 'src/app/servicios/rrhh/personal.service';
import { ThActionsService } from 'src/app/servicios/rrhh/th-actions.service';
import { ThLeaveService } from 'src/app/servicios/rrhh/th-leave.service';

@Component({
  selector: 'app-th-dashboard',
  templateUrl: './th-dashboard.component.html',
  styleUrls: ['./th-dashboard.component.css']
})
export class ThDashboardComponent implements OnInit {
  idpersonal = 0;
  personalList: any[] = [];

  totalSolicitudes = 0;
  solicitadas = 0;
  aprobadas = 0;
  rechazadas = 0;
  totalAcciones = 0;
  saldoDisponible = 0;

  constructor(
    private personalService: PersonalService,
    private actionsService: ThActionsService,
    private leaveService: ThLeaveService
  ) {}

  ngOnInit(): void {
    this.personalService.getAllPersonal().subscribe((d: any) => {
      this.personalList = d || [];
      if (this.personalList.length) {
        this.idpersonal = this.personalList[0].idpersonal;
        this.cargar();
      }
    });
  }

  cargar() {
    if (!this.idpersonal) return;

    this.actionsService.getByPersonal(this.idpersonal).subscribe((d: any) => {
      this.totalAcciones = (d || []).length;
    });

    this.leaveService.getRequestsByPersonal(this.idpersonal).subscribe((d: any) => {
      const list = d || [];
      this.totalSolicitudes = list.length;
      this.solicitadas = list.filter((x: any) => x.estado === 'SOLICITADA').length;
      this.aprobadas = list.filter((x: any) => x.estado === 'APROBADA').length;
      this.rechazadas = list.filter((x: any) => x.estado === 'RECHAZADA').length;
    });

    this.leaveService.getBalancesByPersonal(this.idpersonal).subscribe((d: any) => {
      const balances = d || [];
      this.saldoDisponible = balances.reduce((acc: number, b: any) => acc + Number(b.dias_disponibles || 0), 0);
    });
  }
}
