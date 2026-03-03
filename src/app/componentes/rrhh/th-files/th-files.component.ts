import { Component, OnInit } from '@angular/core';
import { ColoresService } from 'src/app/compartida/colores.service';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { PersonalService } from 'src/app/servicios/rrhh/personal.service';
import { ThFilesService } from 'src/app/servicios/rrhh/th-files.service';

@Component({
  selector: 'app-th-files',
  templateUrl: './th-files.component.html',
  styleUrls: ['./th-files.component.css']
})
export class ThFilesComponent implements OnInit {
  idpersonal = 0;
  personalList: any[] = [];
  files: any[] = [];
  msg = '';
  error = '';
  ventana = 'th-files';

  model: any = {
    idpersonal_personal: { idpersonal: 0 },
    tipo_doc: 'CONTRATO',
    nombre_archivo: '',
    ruta_archivo: '',
    hash_archivo: '',
    version_doc: 1,
    usucrea: 1
  };

  constructor(
    private personalService: PersonalService,
    private filesService: ThFilesService,
    private coloresService: ColoresService,
    public authService: AutorizaService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', `/${this.ventana}`);
    const coloresJSON = sessionStorage.getItem(`/${this.ventana}`);
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    this.personalService.getAllPersonal().subscribe({
      next: (d: any) => {
        this.personalList = d || [];
        if (this.personalList.length) {
          this.idpersonal = this.personalList[0].idpersonal;
          this.cargar();
        }
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
    this.aplicarContrasteCabecera(colores[0]);
    document.querySelectorAll('.cabecera').forEach((el) => el.classList.add('nuevoBG1'));
    document.querySelectorAll('.detalle').forEach((el) => el.classList.add('nuevoBG2'));
  }

  cargar() {
    if (!this.idpersonal) return;
    this.filesService.byPersonal(this.idpersonal).subscribe({
      next: (d: any) => this.files = d || [],
      error: () => this.error = 'No se pudo cargar expediente'
    });
  }

  guardar() {
    this.msg = ''; this.error = '';
    if (!this.model.nombre_archivo || !this.model.ruta_archivo) {
      this.error = 'Nombre y ruta son obligatorios';
      return;
    }
    this.model.idpersonal_personal = { idpersonal: this.idpersonal };
    this.model.usucrea = Number(this.authService?.idusuario || 1);
    this.filesService.save(this.model).subscribe({
      next: () => {
        this.msg = 'Documento registrado';
        this.model.nombre_archivo = '';
        this.model.ruta_archivo = '';
        this.model.hash_archivo = '';
        this.cargar();
      },
      error: (e) => this.error = e?.error?.message || 'No se pudo registrar documento'
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

