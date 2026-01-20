import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CategoriaService } from 'src/app/servicios/categoria.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';

@Component({
  selector: 'app-simuladordos',
  templateUrl: './simuladordos.component.html',
  styleUrls: ['./simuladordos.component.css'],
})
export class SimuladordosComponent implements OnInit {
  formBuscar!: FormGroup;

  categorias: any[] = [];
  filasPliego: any[] = []; // cada fila corresponde a un m3

  // IDs de negocio
  readonly CATEGORIA_RESIDENCIAL = 1;
  readonly CATEGORIA_ESPECIAL = 9;

  cargando = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private categoriaService: CategoriaService,
    private lecturaService: LecturasService,
  ) {}

  ngOnInit(): void {
    this.formBuscar = this.fb.group({
      categoria: 1,
      m3Desde: 0,
      m3Hasta: 0,
      swAdultoMayor: false,
      swAguapotable: false,
    });

    this.setcolor();
    this.getAllCategorias();
    this.controlarAdultoMayor(); // 👈 se engancha al valueChanges
  }

  // ===============================
  // 🔒 CONTROL ADULTO MAYOR
  // ===============================
  controlarAdultoMayor(): void {
    const categoriaCtrl = this.formBuscar.get('categoria');
    const amCtrl = this.formBuscar.get('swAdultoMayor');

    // estado inicial correcto
    const catInit = Number(categoriaCtrl?.value ?? 0);
    if (catInit === this.CATEGORIA_ESPECIAL) {
      amCtrl?.enable({ emitEvent: false });
    } else {
      amCtrl?.setValue(false, { emitEvent: false });
      amCtrl?.disable({ emitEvent: false });
    }

    // cambios
    categoriaCtrl?.valueChanges.subscribe((idCategoria) => {
      const cat = Number(idCategoria ?? 0);

      if (cat === this.CATEGORIA_ESPECIAL) {
        amCtrl?.enable({ emitEvent: false });
      } else {
        amCtrl?.setValue(false, { emitEvent: false });
        amCtrl?.disable({ emitEvent: false });
      }
    });
  }

  // ===============================
  // 📊 CÁLCULO POR RANGO (m3Desde..m3Hasta)
  // ===============================
  async calcular(): Promise<void> {
    const f = this.formBuscar.getRawValue();

    let desde = Number(f.m3Desde ?? 0);
    let hasta = Number(f.m3Hasta ?? 0);

    if (Number.isNaN(desde)) desde = 0;
    if (Number.isNaN(hasta)) hasta = 0;

    // normalizar rango
    if (hasta < desde) {
      const tmp = desde;
      desde = hasta;
      hasta = tmp;
    }

    // límite de seguridad (ajusta si quieres)
    if (hasta - desde > 300) {
      return;
    }

    const categoria = Number(f.categoria ?? 1);
    const swAdultoMayor = !!f.swAdultoMayor;
    const swAguapotable = !!f.swAguapotable;

    this.cargando = true;
    this.filasPliego = [];

    try {
      const requests: Promise<any>[] = [];

      for (let m3 = desde; m3 <= hasta; m3++) {
        const payload = {
          m3,
          categoria,
          swAdultoMayor,
          swAguapotable,
        };

        requests.push(
          firstValueFrom(this.lecturaService.getValoresSimulados(payload)).then((res: any) => ({
            ...res,
            m3, // 👈 guardo el m3 para mostrarlo en la tabla
            // bandera para cambiar color si es residencial y pasa de 70
            swCambioCategoria: categoria === this.CATEGORIA_RESIDENCIAL && m3 >= 71,
          })),
        );
      }

      const rows = await Promise.all(requests);
      this.filasPliego = rows.sort((a, b) => a.m3 - b.m3);
    } catch (e) {
      console.error(e);
    } finally {
      this.cargando = false;
    }
  }

  // ===============================
  // 🎨 EXCEDENTES (si alguna fila tiene excedente)
  // ===============================
  get hayExcedentes(): boolean {
    return this.filasPliego.some((r) => Number(r?.['Excedente'] ?? 0) > 0);
  }

  // ===============================
  // 🚪 NAV
  // ===============================
  regresar(): void {
    this.router.navigate(['/inicio']);
  }

  // ===============================
  // 📥 DATA
  // ===============================
  getAllCategorias(): void {
    this.categoriaService.getListCategoria().subscribe({
      next: (data: any) => (this.categorias = data ?? []),
      error: (e: any) => console.error(e),
    });
  }

  // ===============================
  // 🎨 THEME
  // ===============================
  setcolor(): void {
    document.documentElement.style.setProperty('--bgcolor1', '#395f5f');
    document.documentElement.style.setProperty('--bgcolor2', '#cfded2');
  }

  // helper opcional para clase de fila (para el HTML)
  rowClass(row: any): any {
    return {
      'fila-cambio-cat': !!row?.swCambioCategoria,
    };
  }
}
