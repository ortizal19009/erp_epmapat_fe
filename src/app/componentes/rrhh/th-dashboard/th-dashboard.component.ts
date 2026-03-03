import { Component, OnInit } from '@angular/core';
import { ColoresService } from 'src/app/compartida/colores.service';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
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
  ventana = 'th-dashboard';

  totalSolicitudes = 0;
  solicitadas = 0;
  aprobadas = 0;
  rechazadas = 0;
  totalAcciones = 0;
  saldoDisponible = 0;

  constructor(
    private personalService: PersonalService,
    private actionsService: ThActionsService,
    private leaveService: ThLeaveService,
    private coloresService: ColoresService,
    public authService: AutorizaService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', `/${this.ventana}`);
    const coloresJSON = sessionStorage.getItem(`/${this.ventana}`);
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    this.personalService.getAllPersonal().subscribe((d: any) => {
      this.personalList = d || [];
      if (this.personalList.length) {
        this.idpersonal = this.personalList[0].idpersonal;
        this.cargar();
      }
    });
  }

  async buscaColor() {
    try {
      const idusuario = Number(this.authService?.idusuario || 1);
      const datos = await this.coloresService.setcolor(idusuario, this.ventana);
      sessionStorage.setItem(`/${this.ventana}`, JSON.stringify(datos));
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    document.querySelectorAll('.cabecera').forEach((el) => el.classList.add('nuevoBG1'));
    document.querySelectorAll('.detalle').forEach((el) => el.classList.add('nuevoBG2'));
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
