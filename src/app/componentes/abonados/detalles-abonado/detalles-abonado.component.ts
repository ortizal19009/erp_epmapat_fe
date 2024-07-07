import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Lecturas } from 'src/app/modelos/lecturas.model';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { Chart, registerables } from 'chart.js';
import { FecfacturaComponent } from '../../facelectro/fecfactura/fecfactura.component';
import { FecfacturaService } from 'src/app/servicios/fecfactura.service';
import { InteresesService } from 'src/app/servicios/intereses.service';
import { Facturas } from 'src/app/modelos/facturas.model';
import { RecaudacionReportsService } from '../../recaudacion/recaudacion-reports.service';

@Component({
  selector: 'app-detalles-abonado',
  templateUrl: './detalles-abonado.component.html',
  styleUrls: ['./detalles-abonado.component.css'],
})
export class DetallesAbonadoComponent implements OnInit {
  abonado = {} as datAbonado; //Interface para los datos del Abonado

  n_factura: String;
  _abonado: any;
  _facturas: any; //Planillas del Abonado
  _lecturas: any; //Historial de consumo
  elimdisabled = true;
  _rubrosxfac: any;
  totfac: number;
  idfactura: number;
  grafic: Boolean = false;

  rango: number = 15;
  estadoFE: string;
  factura: Facturas = new Facturas();

  constructor(
    private aboService: AbonadosService,
    private facService: FacturaService,
    private rubxfacService: RubroxfacService,
    private lecService: LecturasService,
    private router: Router,
    public _fecFacturaService: FecfacturaService,
    public s_interes: InteresesService,
    public s_pdfRecaudacion: RecaudacionReportsService
  ) {}

  ngOnInit(): void {
    this.obtenerDatosAbonado();
  }

  getFactura() {
    console.log(this.rango);
    console.log(this.abonado);
    this.facturasxAbonado(this.abonado.idabonado);
  }
  obtenerDatosAbonado() {
    let idabonado = sessionStorage.getItem('idabonadoToFactura');
    this.aboService.getByIdabonado(+idabonado!).subscribe({
      next: (datos) => {
        this._abonado = datos;
        this.abonado.idabonado = this._abonado[0].idabonado;
        this.abonado.nombre = this._abonado[0].idcliente_clientes.nombre;
        this.abonado.nromedidor = this._abonado[0].nromedidor;
        this.abonado.marca = this._abonado[0].marca;
        this.abonado.fechainstalacion = this._abonado[0].fechainstalacion;
        this.abonado.direccionubicacion = this._abonado[0].direccionubicacion;
        this.abonado.ruta = this._abonado[0].idruta_rutas.descripcion;
        this.abonado.categoria =
          this._abonado[0].idcategoria_categorias.descripcion;
        this.abonado.estado = this._abonado[0].estado;
        this.abonado.textestado = getEstadoText(this._abonado[0].estado);
        this.abonado.municipio = this._abonado[0].municipio;
        this.abonado.adultomayor = this._abonado[0].adultomayor;
        this.abonado.promedio = this._abonado[0].promedio;
        this.abonado.responsablepago = this._abonado[0].idresponsable.nombre;
      },
      error: (err) => console.error(err.error),
    });

    this.facturasxAbonado(+idabonado!);
  }

  facturasxAbonado(idabonado: number) {
    this.facService.getByIdabonadorango(idabonado, this.rango).subscribe({
      next: (datos: any) => {
        datos.forEach((item: any) => {
          //console.log(item);
          //console.log(this.s_interes.cInteres(item));
        });
        this._facturas = datos;
      },
      error: (err) => console.log(err.error),
    });
  }
  valorPagado(idmodulo: number, valor: number) {
    if (idmodulo === 3 && valor > 0) {
      return valor + 1;
    } else {
      return valor;
    }
  }
  lecturasxAbonado(idabonado: number) {
    this.lecService.getLecturasxIdabonado(idabonado).subscribe({
      next: (datos) => {
        console.log(datos);
        this._lecturas = datos;
      },
      error: (err) => console.log(err.error),
    });
  }

  getRubroxfac(idfactura: number) {
    this.idfactura = idfactura;
    this.rubxfacService.getByIdfactura(+idfactura!).subscribe({
      next: (detalle: any) => {
        this._rubrosxfac = detalle;
        this.factura = detalle[0].idfactura_facturas;
        if (detalle[0].idfactura_facturas.pagado === 1) {
          this._fecFacturaService.getByIdFactura(+idfactura!).subscribe({
            next: (fecfactura: any) => {
              if (fecfactura != null) {
                this.estadoFE = fecfactura.estado;
              } else {
                this.estadoFE = 'P';
              }
            },
            error: (e) => console.error(e),
          });
        }
        this.subtotal();
      },
      error: (err) => console.log(err.error),
    });
  }

  detallesHistorial(lectura: Lecturas) {}

  regresar() {
    let padre = sessionStorage.getItem('padreDetalleAbonado');
    if (padre == '1') {
      this.router.navigate(['/abonados']);
    }
    if (padre == '2') {
      this.router.navigate(['/detalles-cliente']);
    }
  }

  modiAbonado(idabonado: number) {
    sessionStorage.setItem('idabonadoToModi', idabonado.toString());
    this.router.navigate(['/modificar-abonado']);
  }

  subtotal() {
    let suma12: number = 0;
    let suma0: number = 0;
    let i = 0;
    this._rubrosxfac.forEach(() => {
      if (this._rubrosxfac[i].idrubro_rubros.swiva == 1) {
        suma12 +=
          this._rubrosxfac[i].cantidad * this._rubrosxfac[i].valorunitario;
      } else {
        if (this._rubrosxfac[i].idrubro_rubros.esiva == 0) {
          suma0 +=
            this._rubrosxfac[i].cantidad * this._rubrosxfac[i].valorunitario;
        } else {
        }
      }
      i++;
    });
    this.totfac = suma12 + suma0;
  }

  grafico(idabonado: number): void {
    this.grafic = true;
    Chart.register(...registerables);

    var y = [];
    var emision: string;
    for (let i = 0; i <= this._lecturas.length - 1; i++) {
      emision =
        this._lecturas[i].idrutaxemision_rutasxemision.idemision_emisiones
          .emision;
      emision = '20' + emision.substring(0, 2) + '-' + emision.substring(2, 4);
      y.push({
        mes: emision,
        consumo:
          this._lecturas[i].lecturaactual - this._lecturas[i].lecturaanterior,
      });
    }
    // Si ya existía, primero lo destruye
    var oldChart = Chart.getChart('myChart');
    if (oldChart) {
      oldChart.destroy();
    }

    // Crea el nuevo gráfico
    var ctx: any;
    ctx = document.getElementById('myChart') as HTMLCanvasElement;
    // if (ctx == null) {
    //    const divAlerta = document.getElementById("divHistorial");
    //    const canvas = document.createElement("canvas") as HTMLElement
    //    divAlerta?.appendChild(canvas);
    //    // newElement.id = "newParagraph";

    //    // Get the div element by ID
    //    let divHistorial: any;
    //    divHistorial = document.getElementById("historialconsumo");

    //    // Create a new element
    //    let newElement = document.createElement("canvas");

    //    // Assign an ID to the new element
    //    newElement.id = "myChart";

    //    // Add some text to the new element
    //    // newElement.textContent = "Hello, World!";

    //    // Append the new element to the div element
    //    divHistorial.appendChild(newElement);
    //    ctx = document.getElementById('myChart') as HTMLCanvasElement;
    // };
    // console.log("ctx= " + ctx)
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: y.map((row: { mes: any }) => row.mes),
        datasets: [
          {
            label: 'Consumo',
            data: y.map((row: { consumo: any }) => row.consumo),
          },
        ],
      },
    });
  }
  expFacElectronica(idfactura: number) {
    this.facService.getById(idfactura).subscribe({
      next: (d_factura: any) => {
        this._fecFacturaService.expDesdeAbonados(d_factura);
      },
      error: (e: any) => console.error(e),
    });
  }

  cerrarGrafico() {
    this.grafic = false;
  }
  impComprobante(datos: any) {
    let lectura: any;
    this.facService.getById(datos.idfactura).subscribe({
      next: (d_factura: any) => {
        let modulo: number = d_factura.idmodulo.idmodulo;
        if (modulo === 3 || modulo === 4) {
          this.lecService.getOnefactura(d_factura.idfactura).subscribe({
            next: (datos: any) => {
              lectura = datos;
              if (datos != null) {
                this.s_pdfRecaudacion.comprobantePago(lectura, d_factura);
              } else {
                this.s_pdfRecaudacion.comprobantePago(null, d_factura);
              }
            },
            error: (e) => console.error(e),
          });
        } else {
          this.s_pdfRecaudacion.comprobantePago(null, d_factura);
        }
      },
      error: (e) => console.error(e),
    });
  }
}

interface datAbonado {
  idabonado: number;
  nombre: String;
  fechainstalacion: Date;
  nromedidor: String;
  categoria: String;
  marca: String;
  ruta: String;
  direccionubicacion: String;
  estado: number;
  textestado: String;
  municipio: boolean;
  promedio: string;
  adultomayor: boolean;
  responsablepago: string;
}

function getEstadoText(estado: number): string {
  switch (estado) {
    case 1:
      return 'Activo';
    case 0:
      return 'Eliminado';
    case 2:
      return 'Suspendido';
    case 3:
      return 'Suspendido y retirado';
    default:
      return '';
  }
}
