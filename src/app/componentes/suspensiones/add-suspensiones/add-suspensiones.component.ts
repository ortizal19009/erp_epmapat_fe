import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Abonados } from 'src/app/modelos/abonados';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { Aboxsuspension } from 'src/app/modelos/aboxsuspension';
import { BuscarabonadoComponent } from '../../abonados/buscarabonado/buscarabonado.component';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { AboxsuspensionService } from 'src/app/servicios/aboxsuspension.service';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { SuspensionesService } from 'src/app/servicios/suspensiones.service';

@Component({
  selector: 'app-add-suspensiones',
  templateUrl: './add-suspensiones.component.html',
  styleUrls: ['./add-suspensiones.component.css'],
})
export class AddSuspensionesComponent implements OnInit {
  @ViewChild('buscadorAbonados') buscadorAbonados?: BuscarabonadoComponent;
  titulo: string = 'Nueva Suspension';
  f_dsuspension: FormGroup;
  filterTerm: string;
  v_documentos: any;
  l_abonados: any[] = [];
  documentos: Documentos = new Documentos();
  total = 0;
  date: Date = new Date();
  today: string = this.formatDateForInput(new Date());
  tiposSuspension = [
    { valor: 2, descripcion: 'Suspension' },
    { valor: 3, descripcion: 'Suspension y retiro' },
  ];
  estadosSuspension = this.tiposSuspension;

  constructor(
    private router: Router,
    private s_documentos: DocumentosService,
    private s_suspensiones: SuspensionesService,
    private s_aboxsuspension: AboxsuspensionService,
    private fb: FormBuilder,
    private s_abonado: AbonadosService,
    private authService: AutorizaService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/suspensiones');
    const coloresJSON = sessionStorage.getItem('/suspensiones');
    if (coloresJSON) {
      this.colocaColor(JSON.parse(coloresJSON));
    }

    this.f_dsuspension = this.fb.group({
      tipo: 2,
      fecha: this.today,
      numero: '',
      iddocumento_documentos: [1],
      observa: [''],
      numdoc: [''],
      total: [0],
      usucrea: this.authService.idusuario,
      feccrea: this.date,
    });

    this.listarDocumentos();
    this.getUltimo();
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  onSubmit() {
    this.guardarSuspension();
  }

  get puedeGuardar(): boolean {
    return this.l_abonados.length > 0;
  }

  get tipoSeleccionado(): number {
    return Number(this.f_dsuspension?.value?.tipo || 2);
  }

  get tipoSeleccionadoLabel(): string {
    return this.tipoSeleccionado === 3 ? 'Suspension y retiro' : 'Suspension';
  }

  getTipoClase(tipo: number): string {
    return Number(tipo) === 3 ? 'badge-retiro' : 'badge-suspension';
  }

  getEstadoLabel(estado: number): string {
    switch (Number(estado)) {
      case 1:
        return 'Activo';
      case 2:
        return 'Suspendido';
      case 3:
        return 'Suspendido y retirado';
      default:
        return `${estado ?? ''}`;
    }
  }

  getEstadoClase(estado: number): string {
    switch (Number(estado)) {
      case 1:
        return 'status-active';
      case 2:
        return 'status-suspended';
      case 3:
        return 'status-retired';
      default:
        return 'status-neutral';
    }
  }

  listarDocumentos() {
    this.s_documentos.getListaDocumentos().subscribe((datos) => {
      this.v_documentos = datos;
    });
  }

  guardarSuspension() {
    if (!this.l_abonados.length) {
      return;
    }
    this.f_dsuspension.value.iddocumento_documentos = {
      iddocumento: +this.f_dsuspension.value.iddocumento_documentos!,
    };
    if (
      this.f_dsuspension.value.tipo !== '' &&
      this.f_dsuspension.value.fecha !== ''
    ) {
      this.s_suspensiones.saveSuspension(this.f_dsuspension.value).subscribe({
        next: (datos) => this.guardarAboxSuspension(datos),
        error: (e) => console.error(e),
      });
    }
  }

  guardarAboxSuspension(suspensionS: any) {
    const estadoAbonado = Number(this.f_dsuspension.value.tipo || 2);
    this.l_abonados.forEach((abonado: Abonados) => {
      const relacion = new Aboxsuspension();
      relacion.idsuspension_suspensiones = suspensionS;
      relacion.idabonado_abonados = abonado;
      this.s_aboxsuspension.saveAboxSuspension(relacion).subscribe({
        next: () => undefined,
        error: (e) => console.error(e),
      });
      abonado.estado = estadoAbonado;
      this.actualizarAbonado(abonado);
    });
    this.listarSuspensiones();
  }

  listarSuspensiones() {
    this.router.navigate(['suspensiones']);
  }

  getUltimo() {
    this.s_suspensiones.getUltimo().subscribe({
      next: (datos: any) => {
        this.f_dsuspension.patchValue({
          numero: datos?.numero ? datos.numero + 1 : 1,
        });
      },
      error: () => {
        this.f_dsuspension.patchValue({ numero: 1 });
      },
    });
  }

  actualizarAbonado(abonado: Abonados) {
    this.s_abonado
      .updateAbonadoAuditoria(
        abonado,
        this.authService.idusuario,
        this.f_dsuspension.value.observa || 'Suspension de medidor',
        Number(this.f_dsuspension.value.tipo) === 3 ? 'RETIRO_MEDIDOR' : 'SUSPENSION'
      )
      .subscribe({
        next: () => undefined,
        error: (e) => console.error(e),
      });
  }

  setAbonadosSeleccionados(abonados: any[]) {
    const mapa = new Map<number, any>();
    [...this.l_abonados, ...abonados].forEach((item) => {
      mapa.set(item.idabonado, item);
    });
    this.l_abonados = Array.from(mapa.values());
    this.actualizarTotal();
  }

  quitarAbonado(idabonado: number) {
    this.l_abonados = this.l_abonados.filter((item) => item.idabonado !== idabonado);
    this.actualizarTotal();
  }

  actualizarTotal() {
    this.total = this.l_abonados.length;
    this.f_dsuspension.patchValue({ total: this.total });
  }

  confirmarSeleccionAbonados() {
    const abonados = this.buscadorAbonados?.seleccionados ?? [];
    this.setAbonadosSeleccionados(abonados);
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
