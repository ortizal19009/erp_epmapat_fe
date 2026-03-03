import { Component, OnInit } from '@angular/core';
import { ColoresService } from 'src/app/compartida/colores.service';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ThAuditService } from 'src/app/servicios/rrhh/th-audit.service';

@Component({
  selector: 'app-th-audit',
  templateUrl: './th-audit.component.html',
  styleUrls: ['./th-audit.component.css']
})
export class ThAuditComponent implements OnInit {
  entidad = 'TH_LEAVE_REQUEST';
  idregistro: number | null = null;
  logs: any[] = [];
  error = '';
  ventana = 'th-audit';

  entidades = ['TH_LEAVE_REQUEST', 'TH_ACTION', 'TH_EMPLOYEE_FILE'];

  constructor(
    private service: ThAuditService,
    private coloresService: ColoresService,
    public authService: AutorizaService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', `/${this.ventana}`);
    const coloresJSON = sessionStorage.getItem(`/${this.ventana}`);
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();
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

  buscar() {
    this.error = '';
    const obs = this.idregistro
      ? this.service.byEntidadRegistro(this.entidad, this.idregistro)
      : this.service.byEntidad(this.entidad);

    obs.subscribe({
      next: (d: any) => this.logs = d || [],
      error: (e) => {
        this.error = e?.error?.message || 'No se pudo consultar auditoría';
        this.logs = [];
      }
    });
  }
}
