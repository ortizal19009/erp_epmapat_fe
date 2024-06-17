import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Suspensiones } from 'src/app/modelos/suspensiones';
import { FacturaService } from 'src/app/servicios/factura.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { SuspensionesService } from 'src/app/servicios/suspensiones.service';
// import { SuspensionesService } from 'src/app/Service/suspensiones.service';

@Component({
  selector: 'app-suspensiones',
  templateUrl: './suspensiones.component.html',
  styleUrls: ['./suspensiones.component.css'],
})
export class SuspensionesComponent implements OnInit {
  formSuspensiones: FormGroup;
  titulo: string = 'Suspensiones';
  filterTerm: string;
  suspensiones: any;
  today: number = Date.now();
  optImprimir: string = '0';
  _ruta: any;

  constructor(
    private router: Router,
    private suspeService: SuspensionesService,
    private coloresService: ColoresService,
    private fb: FormBuilder,
    private s_lecturas: LecturasService,
    private s_facturas: FacturaService,
    private s_rubroxfac: RubroxfacService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/suspensiones');
    let coloresJSON = sessionStorage.getItem('/suspensiones');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    this.formSuspensiones = this.fb.group({
      desde: [],
      hasta: [],
    });
    this.listarSuspensiones();
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, 'suspensiones');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/suspensiones', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  listarSuspensiones() {
    this.suspeService.getListaSuspensiones().subscribe({
      next: (datos) => {
        this.suspensiones = datos;
      },
      error: (e) => console.error(e),
    });
  }

  onSubmit() {}

  downloadPDF() {
    // this.s_pdf.suspensiones(this.titulo, this.suspensiones);
  }

  nuevaSuspension() {
    this.router.navigate(['add-suspension']);
  }

  info(suspension: any) {
    sessionStorage.setItem(
      'idsuspensionToInfo',
      suspension.idsuspension.toString()
    );
    this.router.navigate(['info-suspension']);
  }

  buscarxFecha() {
    if (
      this.formSuspensiones.value.desde !== null &&
      this.formSuspensiones.value.hasta !== null
    ) {
      this.suspeService
        .getByFecha(
          this.formSuspensiones.value.desde,
          this.formSuspensiones.value.hasta
        )
        .subscribe({
          next: (datos) => {
            this.suspensiones = datos;
          },
          error: (e) => console.error(e),
        });
    } else {
      let i_desde = document.getElementById('desde') as HTMLInputElement;
      let i_hasta = document.getElementById('hasta') as HTMLInputElement;
      i_desde.style.border = '#F54500 1px solid';
      i_hasta.style.border = '#F54500 1px solid';
      setTimeout(() => {
        i_desde.style.border = '';
        i_hasta.style.border = '';
      }, 2000);
    }
  }
  habilitarMedidor() {
    this.router.navigate(['habilitar-medidores']);
  }
  optSelect() {
    switch (this.optImprimir) {
      case '0':
        console.log('Imprimir Lista de suspenciones');
        break;
      case '1':
        console.log('Imprimir Lista de Mora consumo de agua x ruta');
        break;
    }
  }
  setRuta(e: any) {
    //console.log(e);
    let newDatos: any[] = [];

    this._ruta = e;
    this.s_lecturas.findDeudoresByRuta(this._ruta.idruta).subscribe({
      next: async (lecturas: any) => {
        await lecturas.forEach((item: any) => {
          let newPreFactura: any = [];
          this.s_rubroxfac
            .getByIdfacturaAsync(item.idfactura)
            .then((i: any) => {
              if (i.length > 0) {
                let doc = new jsPDF('p', 'pt', 'a4');
                //newPreFactura.idfactura = i.idfactura;
                //newDatos.push(newPreFactura);
                let findLectura = newPreFactura.find(
                  (lectura: { idlectura: number }) =>
                    lectura.idlectura === item.idlectura
                );
                if (findLectura === undefined) {
                  newPreFactura.push({ item, i });
                  console.log(newPreFactura);
                } else {
                  //newPreFactura.findLectura[]
                }

                console.log(findLectura);
                console.log(i);
              }
              console.log(newPreFactura);
            })
            .then(async () => {
              console.log('HOLA MUNDO SEGUNDO BLOQUE');
            })
            .catch((e) => console.error(e));
        });
        await console.log(newDatos);
      },
      error: (e) => console.error(e),
    });
  }
  /* IMPRIMIR */
  i_deudasxruta(datos: any) {
    let doc = new jsPDF('p', 'pt', 'a4');
  }
}
