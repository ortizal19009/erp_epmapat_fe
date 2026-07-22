import { Injectable, OnDestroy } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { CanActivate, Router } from '@angular/router';
import { Definir } from '../modelos/administracion/definir.model';
import { DefinirService } from '../servicios/administracion/definir.service';
import { Observable, of } from 'rxjs';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';
const backend = environment.BACK;

@Injectable({
  providedIn: 'root',
})
export class AutorizaService implements OnDestroy, CanActivate {
  private readonly STORAGE_EMPRESA = 'datosEmpresa';

  enabled = [false, false, false, false, false, false, false];
  colorenabled = false;
  modulos: String[];
  modulo: number;
  nomodulo: String;
  moduActual: number;
  sessionlog: boolean;
  idusuario: number;
  alias: string;
  priusu: string;
  perfil: string;
  msgval: boolean = true;
  modules: any;
  anio = 2026;
  private intervalId: any;

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  constructor(private router: Router, private defService: DefinirService) { }

  private restoreSessionFromStorage(): boolean {
    const retrievedEncodedValues = sessionStorage.getItem('abc');
    const sessionlog = localStorage.getItem('sessionlog');

    if (!retrievedEncodedValues || sessionlog !== 'true') {
      return false;
    }

    try {
      const retrievedValues = JSON.parse(atob(retrievedEncodedValues));
      this.sessionlog = true;
      this.idusuario = +retrievedValues.idusuario || 0;
      this.alias = retrievedValues.alias;
      this.modulo =
        retrievedValues?.object?.modulo ??
        retrievedValues?.object?.moduloActual ??
        retrievedValues?.modulo ??
        1;
      this.moduActual =
        retrievedValues?.object?.moduActual ??
        retrievedValues?.object?.moduloActual ??
        retrievedValues?.moduActual ??
        this.modulo;
      this.priusu = retrievedValues.priusu;
      this.modules =
        retrievedValues.modules ??
        JSON.parse(sessionStorage.getItem('modulos') || '[]');
      return true;
    } catch {
      this.clearSession();
      return false;
    }
  }

  private clearSession(): void {
    this.sessionlog = false;
    localStorage.removeItem('sessionlog');
    sessionStorage.removeItem('abc');
    sessionStorage.removeItem('modulos');
  }

  public enabModulos(): void {
    if (!this.sessionlog) {
      this.router.navigate(['/inicio']);
    }

    if (this.idusuario == 1) this.enabled = [true, true, false, false, true, true, true];
    else this.enabled = [true, false, false, false, false, false, true];

    this.colorenabled = true;

    if (this.moduActual == null) this.modulo = 1;
    else this.modulo = this.moduActual;

    this.modulos = [
      'Comercialización',
      'Contabilidad gubernamental',
      'Inventario',
      'Propiedad, planta y equipo',
      'Recursos humanos',
      'Administración central',
    ];

    this.nomodulo = this.modulos[this.moduActual - 1];
  }

  public selecModulo(opcion: number) {
    this.modulo = opcion;
    this.moduActual = opcion;
    const values = JSON.parse(atob(sessionStorage.getItem('abc')!));
    values.object.modulo = opcion;
    values.object.moduActual = opcion;

    sessionStorage.setItem('abc', btoa(JSON.stringify(values)));
  }

  logout(): void {
    this.clearSession();
    this.enabled = [false, false, false, false, false, false, false];
    this.colorenabled = false;
    this.modulos = [];
    this.modulo = 0;
    this.nomodulo = '';
    this.moduActual = 0;
    this.idusuario = 0;
    this.alias = '';
    this.priusu = '';
    this.modules = null;
    this.router.navigate(['/inicio']);
  }

  valsession() {
    if (this.restoreSessionFromStorage()) {
      this.enabModulos();
      return;
    }

    this.router.navigate(['/inicio']);
  }

  canActivate(): boolean {
    if (this.sessionlog || this.restoreSessionFromStorage()) {
      return true;
    }

    this.router.navigate(['/inicio']);
    return false;
  }
  formatearFecha(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  mostrarError(titulo: string, excepcion: any): void {
    const excep = `<div class="text-left" style="text-align: left;">
                        <strong>Path:</strong> ${excepcion.path}<br>
                        <strong>Mensaje:</strong> ${excepcion.message}
                        </div>`;
    Swal.fire({
      width: '800px',
      title: titulo,
      html: excep,
      showConfirmButton: false,
      footer: '<div class="terminal-footer">Terminal IBM</div>',
      customClass: { popup: 'retro' },
    });
  }

  swal(icon: any, mensaje: string) {
    let anchocalculado = calcularAnchoTexto(mensaje.toString()) + 120
    const anchoString = anchocalculado.toString() + 'px';
    Swal.fire({
      width: anchoString,
      toast: true,
      icon: icon,
      title: mensaje,
      position: 'top',
      showConfirmButton: false,
      timer: 2000
    });
  }

  mensaje404(text: string) {
    Swal.fire({
      icon: 'warning',
      title: 'Mensaje',
      text,
      allowOutsideClick: true, allowEscapeKey: true, showConfirmButton: false
    });
  }

  //Obtiene el nombre de la Empresa
  public getEmpresa() {
    this.defService.getByIddefinir(1).subscribe({
      next: (definir: Definir) => {
        // OJO: Falta validar la Empresa con la licencia
        this.setDatosEmpresa({
          empresa: definir.empresa,
          ruc: definir.ruc ?? '',
          fechap: definir.fechap as Date,
          f_i: definir.f_i ?? '',
          f_g: definir.f_g ?? '',
          longparing: definir.longparing ?? 0,
          longpargas: definir.longpargas ?? 0,
        });
      },
      error: err => {
        console.error(err.error); this.mostrarError('Error al buscar Empresa', err);
      }
    });
  }

  setDatosEmpresa(datos: DatosEmpresa): void {
    sessionStorage.setItem(this.STORAGE_EMPRESA, JSON.stringify(datos));
  }

  getDatosEmpresa(): DatosEmpresa | null {
    const raw = sessionStorage.getItem(this.STORAGE_EMPRESA);
    return raw ? JSON.parse(raw) : null;
  }

  // Comprobante
  comprobante(tipcom: number, compro: number): string {
    if (tipcom == 1) return 'I-' + compro.toString();
    if (tipcom == 2) return 'E-' + compro.toString();
    if (tipcom == 3) return 'DC-' + compro.toString();
    if (tipcom == 4) return 'DI-' + compro.toString();
    if (tipcom == 5) return 'DE-' + compro.toString();
    return '';
  }

  valAñoValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      // Si el control está vacío → no validar (o puedes decidir validarlo)
      if (!control.value) { return of(null); }
      const empresa = this.getDatosEmpresa();
      // Manejo seguro si empresa o fechap no existen
      if (!empresa?.fechap) { return of({ añoinvalido: true }); }
      const añoEmpresa = empresa.fechap.toString().slice(0, 4);
      const añoControl = control.value.toString().slice(0, 4);
      return of(añoEmpresa !== añoControl ? { añoinvalido: true } : null);
    };
  }

  formatearTiempo(ms: number): string {
    const totalSeg = Math.floor(ms / 1000);
    const min = Math.floor(totalSeg / 60);
    const seg = totalSeg % 60;
    return `${min}m ${seg}s`;
  }

}

export interface DatosEmpresa {
  empresa?: String;
  ruc: string;
  fechap: Date;
  f_i: String;
  f_g: String;
  longparing: number;
  longpargas: number;
}

function calcularAnchoTexto(texto: string, font = "18px Arial"): number {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx!.font = font;
  const ancho = ctx!.measureText(texto).width;
  return Math.round(ancho); // retorna entero sin decimales
}
