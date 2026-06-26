import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Rutas } from 'src/app/modelos/rutas.model';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { RutasService } from 'src/app/servicios/rutas.service';

@Component({
  selector: 'app-buscarabonado',
  templateUrl: './buscarabonado.component.html',
  styleUrls: ['./buscarabonado.component.css']
})

export class BuscarabonadoComponent implements OnInit {

  filterTerm: string;
  abonado: any[] = [];
  abonadoSeleccionado: any;
  titulo: string = 'Buscar abonado';
  f_abonado: FormGroup;
  @Output() abonadoEvent = new EventEmitter<string>();
  @Output() abonadosEvent = new EventEmitter<any[]>();
  @Input() multiple: boolean = false;
  @Input() soloSuspendidos: boolean = false;
  @Input() estadosPermitidos: number[] | null = null;
  seleccionados: any[] = [];
  rutas: Rutas[] = [];

  constructor(
    private fb: FormBuilder,
    private s_abonados: AbonadosService,
    private rutasService: RutasService
  ) { }

  ngOnInit(): void {
    this.f_abonado = this.fb.group({
      catBusqueda: 1,
      buscarAbonado: ['']
    });
    this.cargarRutas();
    this.tipoBusqueda();
  }

  onSubmit() {
  }

  get totalSeleccionados(): number {
    return this.seleccionados.length;
  }

  get tituloVista(): string {
    return this.multiple ? 'Seleccionar abonados' : 'Buscar abonado';
  }

  get descripcionVista(): string {
    return this.multiple
      ? 'Marca una o varias cuentas y confirma la seleccion.'
      : 'Busca una cuenta y selecciona el registro correcto.';
  }

  get criterioSeleccionadoLabel(): string {
    switch (Number(this.f_abonado?.value?.catBusqueda)) {
      case 1:
        return 'cuenta';
      case 2:
        return 'cliente';
      case 3:
        return 'identificacion';
      case 4:
        return 'ruta';
      default:
        return 'criterio';
    }
  }

  get placeholderBusqueda(): string {
    switch (Number(this.f_abonado?.value?.catBusqueda)) {
      case 1:
        return 'Ej. 1254';
      case 2:
        return 'Nombre o apellido';
      case 3:
        return 'Cedula o RUC';
      case 4:
        return 'Nombre de la ruta';
      default:
        return 'Buscar';
    }
  }

  bAbonado() {
    let cat = (+this.f_abonado.value.catBusqueda!);
    const rawValor = this.f_abonado.value.buscarAbonado;
    const valor = `${rawValor ?? ''}`.trim();
    switch (cat) {
      case 1:
        this.s_abonados.getAbonadosPage(0, 100, 'idabonado,asc', { cuenta: valor ? +valor : undefined }).subscribe(datos => {
          this.abonado = this.postProcessResultados(datos.content ?? []);
        });
        break;
      case 2:
        this.s_abonados.getAbonadosPage(0, 100, 'idabonado,asc', { responsable: valor }).subscribe(datos => {
          this.abonado = this.postProcessResultados(datos.content ?? []);
        });
        break;
      case 3:
        this.s_abonados.getAbonadosPage(0, 100, 'idabonado,asc', { cedula: valor }).subscribe(datos => {
          this.abonado = this.postProcessResultados(datos.content ?? []);
        });
        break;
      case 4:
        const idruta = Number(rawValor);
        this.s_abonados.getAbonadosPage(0, 100, 'idabonado,asc', {
          idruta: Number.isFinite(idruta) && idruta > 0 ? idruta : undefined
        }).subscribe(datos => {
          this.abonado = this.postProcessResultados(datos.content ?? []);
        });
        break;
      default:
        break;
    }
  }

  postProcessResultados(resultados: any[]) {
    if (this.estadosPermitidos?.length) {
      const permitidos = this.estadosPermitidos.map((item) => Number(item));
      return resultados.filter((item) => permitidos.includes(Number(item?.estado)));
    }
    if (!this.soloSuspendidos) {
      return resultados;
    }
    return resultados.filter((item) => [2, 3].includes(Number(item?.estado)));
  }

  tipoBusqueda() {
    let i_catBusqueda = document.getElementById("selecTipoBusqueda") as HTMLInputElement;
    i_catBusqueda.addEventListener('change', () => {
      this.f_abonado.patchValue({ buscarAbonado: '' });
      this.abonado = [];
    })
  }

  cargarRutas() {
    this.rutasService.getListaRutas().subscribe({
      next: (datos) => {
        this.rutas = Array.isArray(datos) ? datos : [];
      },
      error: (e) => console.error(e),
    });
  }

  sAbonado(abonado: any) {
    if (this.multiple) {
      return;
    }
    this.abonadoEvent.emit(abonado)
  }

  toggleSeleccion(abonado: any, checked: boolean) {
    if (checked) {
      const existe = this.seleccionados.some((item) => item.idabonado === abonado.idabonado);
      if (!existe) {
        this.seleccionados.push(abonado);
      }
      return;
    }
    this.seleccionados = this.seleccionados.filter((item) => item.idabonado !== abonado.idabonado);
  }

  estaSeleccionado(abonado: any): boolean {
    return this.seleccionados.some((item) => item.idabonado === abonado.idabonado);
  }

  emitirSeleccionados() {
    this.abonadosEvent.emit(this.seleccionados);
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

}
