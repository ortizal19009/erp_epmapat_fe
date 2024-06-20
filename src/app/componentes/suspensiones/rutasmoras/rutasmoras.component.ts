import { Component, ContentChild, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Rubros } from 'src/app/modelos/rubros.model';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { PdfService } from 'src/app/servicios/pdf.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { RutasService } from 'src/app/servicios/rutas.service';

@Component({
  selector: 'app-rutasmoras',
  templateUrl: './rutasmoras.component.html',
  styleUrls: ['./rutasmoras.component.css'],
})
export class RutasmorasComponent implements OnInit {
  _ruta: any;
  filterTerm: string;
  today: number = Date.now();
  formSuspensiones: FormGroup;
  titulo: string = 'Abonados en mora';
  abonados: any;
  _lecturas: any;
  _abonados: any = [];
  _facSinCobro: any;
  datosImprimir: any = [];

  constructor(
    private rutaDato: ActivatedRoute,
    private s_lecturas: LecturasService,
    private s_rubroxfac: RubroxfacService,
    private fb: FormBuilder,
    private s_ruta: RutasService,
    private s_abonado: AbonadosService,
    private s_facturas: FacturaService,
    private s_pdf: PdfService,
    private s_rubxfacturas: RubroxfacService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/mora-abonados');
    let coloresJSON = sessionStorage.getItem('/mora-abonados');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    let idruta = this.rutaDato.snapshot.paramMap.get('idruta');
    this.formSuspensiones = this.fb.group({ desde: [], hasta: [] });
    this.getRuta(+idruta!);
    this.getAbonadosByRuta(+idruta!);
  }
  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }
  getRuta(idruta: number) {
    this.s_ruta.getByIdruta(idruta).subscribe({
      next: (rutaDatos: any) => {
        this._ruta = rutaDatos;
      },
      error: (e) => console.error(e),
    });
  }
  getLecturas(idruta: number) {
    let newDatos: any[] = [];
    this.s_lecturas.findDeudoresByRuta(idruta).subscribe({
      next: async (lecturas: any) => {
        console.log(lecturas);
        this._lecturas = lecturas;
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
                  newPreFactura.push({ ...i });
                }
              }
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
  getAbonadosByRuta(idruta: any) {
    this.s_abonado.getByIdrutaAsync(idruta).then((abonados: any) => {
      //console.log(abonados);
      //this._abonados = abonados;
      abonados.forEach((abonado: any) => {
        this.contSinCobrar(abonado.idabonado).then((number: any) => {
          abonado.numeroDeuda = number;
          this._abonados.push(abonado);
        });
      });
      //this.getSinCobrar(abonados[0].idabonado);
      /* abonados.forEach((abonado: any) => {
        this.s_facturas.getSinCobrarAboMod(abonado.idabonado).subscribe({
          next: (factura: any) => {
            console.log(factura);
          },
          error: (e) => console.error(e),
        });
      }); */
      this.contSinCobrar(abonados[0].idabonado);
    });
  }
  getSinCobrar(idabonado: number) {}
  setDatosImprimir(abonado: any) {
    console.log(abonado);
    //this.getSinCobrar(abonado.idabonado);
    this.s_facturas.getSinCobrarAboMod(abonado.idabonado).subscribe({
      next: (facSincobro: any) => {
        console.log(facSincobro);
        abonado.facturas = facSincobro;
        this.datosImprimir = abonado;
      },
      error: (e) => {
        console.error(e);
      },
    });
  }
  async impNotificacion() {
    let doc = new jsPDF('p', 'pt', 'a4');
    this.s_pdf.header(
      `Deudas de la cuenta: ${this.datosImprimir.idabonado.toString()}`,
      doc
    );
    console.log(this.datosImprimir);
    doc.setFontSize(8);
    autoTable(doc, {
      head: [
        [
          {
            colSpan: 2,
            content: 'DATOS PERSONALES',
            styles: { halign: 'center' },
          },
        ],
      ],
      body: [
        [
          `CLIENTE: ${this.datosImprimir.idcliente_clientes.nombre}`,
          `IDENTIFICACIÓN: ${this.datosImprimir.idcliente_clientes.cedula}`,
        ],
        [
          `EMAIL: ${this.datosImprimir.idcliente_clientes.email}`,
          `TELEFONO: ${this.datosImprimir.idcliente_clientes.telefono}`,
        ],
        [
          `DIRECCIÓN: ${this.datosImprimir.direccionubicacion}`,
          `RUTA: ${this.datosImprimir.idruta_rutas.descripcion}`,
        ],
        [
          `CATEGORÍA: ${this.datosImprimir.idcategoria_categorias.descripcion}`,
          `AL.: ${this.datosImprimir.swalcantarillado} A.M.: ${this.datosImprimir.adultomayor} M: ${this.datosImprimir.municipio}`,
        ],
      ],
    });
    let facturas: any = this.datosImprimir.facturas;
    facturas.forEach((factura: any) => {
      console.log(factura);
      this.getRubrosxFactura(factura.idfactura).then((rub: any) => {
        console.log(rub);
      });
      console.log(this.getRubrosxFactura(factura.idfactura));
      autoTable(doc, {
        head: [[`Planilla: ${factura.idfactura.toString()}`]],
        body: [[`Módulo: ${factura.idmodulo.descripcion}`]],
      });
    });

    const addPageNumbers = function () {
      const pageCount = doc.internal.pages.length;
      for (let i = 1; i <= pageCount - 1; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
          'Página ' + i + ' de ' + (pageCount - 1),
          16,
          doc.internal.pageSize.height - 10
        );
      }
    };
    //let data = doc.output('dataurlnew');
    doc.output('pdfobjectnewwindow');
  }
  async getRubrosxFactura(idfactura: number){
    /* this.s_rubxfacturas.getByIdfacturaAsync(idfactura).then((item: any) => {
      console.log(item);
    }) */
    //  return item;
      (await
      /* this.s_rubxfacturas.getByIdfacturaAsync(idfactura).then((item: any) => {
        console.log(item);
      }) */
      //  return item;
      this.s_rubroxfac.getSumaValoresUnitarios(idfactura)).subscribe({
        next: (datos: any) => {
          console.log(datos);
        },
        error: (e) => console.error(e),
      });
  }
  async contSinCobrar(idabonado: number) {
    let dato = await this.s_facturas.countSinCobrarAbo(idabonado);
    /* .then((number: any) => {
      console.log(number);
      return number; */
    //});
    return dato;
  }
}
