import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { FacturaService } from 'src/app/servicios/factura.service';

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

  constructor(
    private fb: FormBuilder,
    private s_clientes: ClientesService,
    private s_abonados: AbonadosService,
    private s_facturas: FacturaService
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
    console.log(res.content);
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
    console.log('MASTER:', this.masterId);
    console.log('DUPLICADOS:', this.duplicateIds);
  }
  merge() {
    if (!this.masterId) return;

    const payload = {
      masterId: this.masterId,
      duplicateIds: this.duplicateIds,
    };

    // luego llamas al backend
  }
}
