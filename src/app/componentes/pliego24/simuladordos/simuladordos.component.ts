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
  readonly CATEGORIA_OFICIAL = 4; // ✅ swMunicipio solo aquí

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

      // ✅ AM inicia bloqueado (lo controlas por categoría 9)
      swAdultoMayor: [{ value: false, disabled: true }],

      swAguapotable: false,

      // ✅ MUN inicia bloqueado (solo categoría 4)
      swMunicipio: [{ value: false, disabled: true }],
    });

    this.setcolor();
    this.getAllCategorias();

    this.controlarAdultoMayor();  // cat 9
    this.controlarMunicipio();    // cat 4
  }

  // ===============================
  // 🔒 CONTROL ADULTO MAYOR (cat 9)
  // ===============================
  controlarAdultoMayor(): void {
    const categoriaCtrl = this.formBuscar.get('categoria');
    const amCtrl = this.formBuscar.get('swAdultoMayor');

    const catInit = Number(categoriaCtrl?.value ?? 0);
    if (catInit === this.CATEGORIA_ESPECIAL) {
      amCtrl?.enable({ emitEvent: false });
    } else {
      amCtrl?.setValue(false, { emitEvent: false });
      amCtrl?.disable({ emitEvent: false });
    }

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
  // 🔒 CONTROL MUNICIPIO (cat 4)
  // ===============================
  controlarMunicipio(): void {
    const categoriaCtrl = this.formBuscar.get('categoria');
    const munCtrl = this.formBuscar.get('swMunicipio');

    const catInit = Number(categoriaCtrl?.value ?? 0);
    if (catInit === this.CATEGORIA_OFICIAL) {
      munCtrl?.enable({ emitEvent: false });
    } else {
      munCtrl?.setValue(false, { emitEvent: false });
      munCtrl?.disable({ emitEvent: false });
    }

    categoriaCtrl?.valueChanges.subscribe((idCategoria) => {
      const cat = Number(idCategoria ?? 0);

      if (cat === this.CATEGORIA_OFICIAL) {
        munCtrl?.enable({ emitEvent: false });
      } else {
        munCtrl?.setValue(false, { emitEvent: false });
        munCtrl?.disable({ emitEvent: false });
      }
    });
  }

  // ===============================
  // 📊 CÁLCULO POR RANGO (m3Desde..m3Hasta)
  // ===============================
  async calcular(): Promise<void> {
    const f = this.formBuscar.getRawValue(); // 👈 incluye disabled

    let desde = Number(f.m3Desde ?? 0);
    let hasta = Number(f.m3Hasta ?? 0);

    if (Number.isNaN(desde)) desde = 0;
    if (Number.isNaN(hasta)) hasta = 0;

    if (hasta < desde) {
      const tmp = desde;
      desde = hasta;
      hasta = tmp;
    }

    if (hasta - desde > 300) {
      return;
    }

    const categoria = Number(f.categoria ?? 1);
    const swAdultoMayor = !!f.swAdultoMayor;
    const swAguapotable = !!f.swAguapotable;
    const swMunicipio = !!f.swMunicipio; // ✅ ya controlado por categoría 4

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
          swMunicipio, // ✅ se envía al servicio
        };

        requests.push(
          firstValueFrom(this.lecturaService.getValoresSimulados(payload)).then((res: any) => ({
            ...res,
            m3,
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
  // 🎨 EXCEDENTES
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

  rowClass(row: any): any {
    return {
      'fila-cambio-cat': !!row?.swCambioCategoria,
    };
  }
}
