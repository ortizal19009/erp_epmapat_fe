import { RutasService } from 'src/app/servicios/rutas.service';
import { Component, OnInit } from '@angular/core';
import { PageResponse } from 'src/app/interfaces/page-response';
import { Abonados } from 'src/app/modelos/abonados';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { EmisionService } from 'src/app/servicios/emision.service';
import { RecargosxcuentaService } from 'src/app/servicios/recargosxcuenta.service';

@Component({
  selector: 'app-recargosxcuenta',
  templateUrl: './recargosxcuenta.component.html',
  styleUrls: ['./recargosxcuenta.component.css']
})
export class RecargosxcuentaComponent implements OnInit {
  titulo = 'Recargos por cuenta';

  // tus arrays existentes
  _recargosxcuenta: any[] = []; // aquí no toco tu lógica actual
  _abonados: any[] = [];
  _rutas: any[] = [];

  // filtros UI
  filterTerm = '';
  filtroRuta: string | null = null;
  filtroResponsable: string | null = null;
  filtroCedula: string | null = null;
  filtroCuenta: number | null = null;
  activeFiltro: 'cuenta' | 'ruta' | 'responsable' | 'cedula' | null = null;

  // paginación
  page = 0;
  size = 10;
  totalElements = 0;
  totalPages = 0;

  // select emision (tu código existente)
  _emisiones: any[] = [];
  emisionSelected: any;

  constructor(private abonadosService: AbonadosService, private emisionService: EmisionService
    , private recargosxcuentaService: RecargosxcuentaService,
    private RutasService: RutasService
  ) { }

  ngOnInit(): void {
    this.cargarAbonados();
    this.cargarRutas();
  }

  get selectedCount(): number {
    return this._abonados?.filter(a => !!a.selected).length ?? 0;
  }

  cargarAbonados(): void {
    this.abonadosService.getAbonadosPage(
      this.page,
      this.size,
      'idabonado,desc',
      {
        ruta: this.filtroRuta,
        responsable: this.filtroResponsable,
        cedula: this.filtroCedula,
        cuenta: this.filtroCuenta
      }
    ).subscribe({
      next: (res: PageResponse<Abonados>) => {
        // conservar selección si vuelves a cargar
        const selectedIds = new Set(this._abonados.filter(x => x.selected).map(x => x.idabonado));

        this._abonados = res.content.map(x => ({ ...x, selected: selectedIds.has(x.idabonado) }));
        this.totalElements = res.totalElements;
        this.totalPages = res.totalPages;
        this.page = res.number;
        this.size = res.size;
      },
      error: (err: any) => console.error(err.error)
    });
  }
  cargarRutas(){
    this.RutasService.getListaRutas().subscribe((data: any) => {
      this._rutas = data;
    });
  }

  aplicarFiltrosServidor(): void {
    this.page = 0;
    this.cargarAbonados();
  }

  limpiarFiltrosServidor(): void {
    this.filtroRuta = null;
    this.filtroResponsable = '';
    this.filtroCedula = null;
    this.filtroCuenta = null;
    this.page = 0;
    this.cargarAbonados();
  }

  prevPage(): void {
    if (this.page > 0) {
      this.page--;
      this.cargarAbonados();
    }
  }

  nextPage(): void {
    if (this.page + 1 < this.totalPages) {
      this.page++;
      this.cargarAbonados();
    }
  }

  toggleSelectAll(checked: any): void {
    this._abonados.forEach(a => a.selected = checked);
  }

  procesarSeleccionados(): void {
    const seleccionados = this._abonados.filter(a => a.selected);
    console.log('Seleccionados:', seleccionados);

    // aquí mandas al backend o guardas para PDF, etc.
    // this.miServicio.guardarRecargos(seleccionados, this.emisionSelected)...
  }
  onFocusFiltro(campo: 'cuenta' | 'ruta' | 'responsable' | 'cedula'): void {
    // Si vuelvo a enfocar el mismo campo, no hago nada
    if (this.activeFiltro === campo) return;

    this.activeFiltro = campo;

    // 1) Limpiar otros filtros (dejar solo el activo)
    if (campo !== 'cuenta') this.filtroCuenta = null;
    if (campo !== 'ruta') this.filtroRuta = null;
    if (campo !== 'responsable') this.filtroResponsable = null;
    if (campo !== 'cedula') this.filtroCedula = null;

    // 2) Limpiar filtro local de pantalla (opcional)
    this.filterTerm = '';

    // 3) Borrar datos actuales y paginación (para que “se borre la tabla”)
    this.limpiarResultados();

  }

  onTypingFiltro(): void {
    // opcional: si quieres que al empezar a escribir también se limpien resultados
    // (ya se limpian al focus, con esto solo cubres casos raros)
  }

  limpiarResultados(): void {
    this._abonados = [];
    this.totalElements = 0;
    this.totalPages = 0;
    this.page = 0;
  }
}
