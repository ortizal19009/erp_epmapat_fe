import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';

@Component({
  selector: 'app-cli-duplicados',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './cli-duplicados.component.html',
  styleUrls: ['./cli-duplicados.component.css'], // Change to styleUrls
})
export class CliDuplicadosComponent implements OnInit {
  disabled = false;
  formBuscar!: FormGroup;

  _clientes: any[] = []; // listado agrupado
  detalleClientes: any[] = []; // clientes duplicados por cédula
  cedulaSeleccionada: string | null = null;
  detalleVisible = false;

  masterId: number | null = null;
  rolepermission = 1;

  page = 0;
  size = 20;

  totalPages = 0;
  totalElements = 0;
  pages: number[] = [];

  Math = Math; // si aún lo quieres en template

  datosMasters: any;
  datosDuplicados: any;

  previewData: PreviewCliente[] = [];
  previewLoading = false;
  previewError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private s_clientes: ClientesService,
    private s_abonados: AbonadosService,
    private s_facturas: FacturaService,
    private s_lecturas: LecturasService,
    private authoriza: AutorizaService
  ) {}

  ngOnInit(): void {
    this.formBuscar = this.fb.group({
      nombreIdentifi: [''],
      filtro: [''],
    });

    this.cargarDuplicados();
  }
  imprimir() {}

  cargarDuplicados(): void {
    this.disabled = true;
    // si en backend aún no filtras por nombreIdentifi, igual lo dejamos listo
    const nombreIdentifi: any = (
      this.formBuscar.value?.nombreIdentifi || ''
    ).trim();

    this.s_clientes
      .obtenerDuplicadosAgrupados(this.page, this.size, nombreIdentifi)
      .subscribe({
        next: (res: any) => this.onResponse(res),
        error: (err) => {
          console.error(err);
          this.disabled = false;
        },
      });
  }

  onSubmit(): void {
    this.page = 0;
    this.cargarDuplicados();
  }

  private onResponse(res: any): void {
    this._clientes = res.content || [];
    this.totalPages = res.totalPages || 0;
    this.totalElements = res.totalElements || 0;

    this.buildPages();
    this.disabled = false;
  }

  private buildPages(): void {
    const maxButtons = 5; // ⬅️ pon 11 si quieres más
    const half = Math.floor(maxButtons / 2);

    let start = Math.max(0, this.page - half);
    let end = Math.min(this.totalPages - 1, start + maxButtons - 1);
    start = Math.max(0, end - (maxButtons - 1));

    this.pages = [];
    for (let i = start; i <= end; i++) this.pages.push(i);
  }

  goTo(p: number): void {
    if (p < 0 || p >= this.totalPages || p === this.page) return;
    this.page = p;
    this.cargarDuplicados();
  }

  onChangeSize(newSize: any): void {
    this.size = Number(newSize);
    this.page = 0;
    this.cargarDuplicados();
  }

  get desde(): number {
    if (this.totalElements === 0) return 0;
    return this.page * this.size + 1;
  }

  get hasta(): number {
    return Math.min((this.page + 1) * this.size, this.totalElements);
  }
  getByIdentificacion(identificacion: string) {
    this.cedulaSeleccionada = identificacion;
    this.detalleVisible = true;
    this.masterId = null;
    this.s_clientes.getByIdentificacion(identificacion).subscribe({
      next: (resp: any) => {
        this.detalleClientes = resp;
      },
    });
  }

  get duplicateIds(): number[] {
    return this.detalleClientes
      .filter((c) => c.idcliente !== this.masterId)
      .map((c) => c.idcliente);
  }
 previewMerge() {
  if (!this.masterId) return;

  this.previewLoading = true;
  this.previewError = null;
  this.previewData = [];

  const ids: number[] = [this.masterId, ...this.duplicateIds];

  const calls = ids.map((idcliente) => {
    return forkJoin({
      abonados: this.s_abonados
        .getByIdcliente(idcliente)
        .pipe(catchError(() => of([]))),

      facturas: this.s_facturas
        .getFacSincobro(idcliente)
        .pipe(catchError(() => of([]))),

      lecturas: this.s_lecturas
        .getPendientesByCliente(idcliente)
        .pipe(catchError(() => of([]))),
    }).pipe(
      map(
        (res) =>
          ({
            idcliente,
            esMaster: idcliente === this.masterId,
            abonados: res.abonados ?? [],
            facturas: res.facturas ?? [],
            lecturas: res.lecturas ?? [],
          } as PreviewCliente)
      )
    );
  });

  forkJoin(calls).subscribe({
    next: (data: PreviewCliente[]) => {
      // master primero
      this.previewData = data.sort(
        (a, b) => Number(b.esMaster) - Number(a.esMaster)
      );

      this.previewLoading = false;
      ($('#previewModal') as any).modal('show');
    },
    error: () => {
      this.previewLoading = false;
      this.previewError = 'No se pudo cargar el preview.';
    },
  });
}


  merge() {
    if (!this.masterId) {
      alert('Seleccione un cliente master');
      return;
    }

    const duplicateIds = this.detalleClientes
      .filter((c) => c.idcliente !== this.masterId)
      .map((c) => c.idcliente);

    const payload = {
      masterId: this.masterId,
      duplicateIds,
      usuario: this.authoriza.idusuario
    };

    this.s_clientes.mergeClientes(payload).subscribe({
      next: () => {
        alert('Merge realizado correctamente');
        this.detalleVisible = false;
        this.cargarDuplicados(); // refresca la lista
      },
      error: (err) => {
        console.error(err);
        alert('Error al realizar el merge');
      },
    });
  }
  collapseAll(collapse: boolean) {
  if (!this.previewData?.length) return;

  this.previewData.forEach((_, i) => {
    const el = document.getElementById('pv_' + i);
    if (!el) return;

    // Bootstrap 4 collapse: show/hide por clase
    if (collapse) {
      // cerrar
      el.classList.remove('show');
    } else {
      // abrir
      el.classList.add('show');
    }
  });
}

}

export interface PreviewCliente {
  idcliente: number;
  esMaster: boolean;
  abonados: any[];
  facturas: any[];
  lecturas: any[];
}
