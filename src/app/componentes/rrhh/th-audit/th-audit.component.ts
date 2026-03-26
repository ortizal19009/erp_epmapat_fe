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
    this.aplicarContrasteCabecera(colores[0]);
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
  private aplicarContrasteCabecera(color: string) {
    const rgb = this.toRgb(color);
    if (!rgb) return;
    const [r, g, b] = rgb;
    const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const textColor = luminancia > 0.6 ? '#212529' : '#ffffff';
    document.documentElement.style.setProperty('--header-text-color', textColor);
  }

  private toRgb(color: string): [number, number, number] | null {
    if (!color) return null;
    const c = color.trim();
    if (c.startsWith('#')) {
      const hex = c.slice(1);
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        return [r, g, b];
      }
      if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return [r, g, b];
      }
    }
    const m = c.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
    return null;
  }
}

