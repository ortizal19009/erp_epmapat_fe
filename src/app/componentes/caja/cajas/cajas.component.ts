import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { format } from '@formkit/tempo';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Usuarios } from 'src/app/modelos/administracion/usuarios.model';

import { CajaService } from 'src/app/servicios/caja.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { PdfService } from 'src/app/servicios/pdf.service';
import { RecaudacionService } from 'src/app/servicios/recaudacion.service';
import { RubrosService } from 'src/app/servicios/rubros.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';

@Component({
  selector: 'app-cajas',
  templateUrl: './cajas.component.html',
  styleUrls: ['./cajas.component.css'],
})
export class ListarCajaComponent implements OnInit {
  _cajas: any;
  filtro: string;
  otraPagina: boolean = false;
  usuario: Usuarios = new Usuarios();
  caja = {} as Caja;
  today: Date = new Date();
  desde: any;
  hasta: any;
  opt: any = '0';
  constructor(
    private cajaService: CajaService,
    private router: Router,
    public authService: AutorizaService,
    private coloresService: ColoresService,
    private _pdf: PdfService,
    private s_facturas: FacturaService,
    private s_rubroxfac: RubroxfacService,
    private s_recaudacion: RecaudacionService,
    private s_rubro: RubrosService
  ) {}

  ngOnInit(): void {
    let fechaActual: Date = new Date();
    sessionStorage.setItem('ventana', '/cajas');
    let coloresJSON = sessionStorage.getItem('/cajas');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();
    this.listarCajas();
    let fDate = format(fechaActual, 'YYYY-MM-DD');
    this.desde = fDate;
    this.hasta = fDate;
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(
        +this.authService.idusuario!,
        'cajas'
      );
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/cajas', coloresJSON);
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

  public listarCajas() {
    this.cajaService.getListaCaja().subscribe((datos) => {
      this._cajas = datos;
    });
  }

  public info(idcaja: number) {
    sessionStorage.setItem('idcajaToInfo', idcaja.toString());
    this.router.navigate(['info-caja']);
  }

  onCellClick(event: any, idcaja: number) {
    const tagName = event.target.tagName;
    if (tagName === 'TD') {
      sessionStorage.setItem('idcajaToInfo', idcaja.toString());
      this.router.navigate(['info-caja']);
    }
  }
  pdf(opt: any) {
    console.log(opt);
    switch (opt) {
      case '0':
        this.s_rubroxfac.getByFechacobro(this.desde, this.hasta).subscribe({
          next: (datos: any) => {
            console.log(datos);
            let i_factura = {} as Factura;
            let n_fxr: any[] = [];
            datos.forEach((item: any) => {
              console.log(item);
              let query = n_fxr.find(
                (factura: { idfactura: number }) =>
                  factura.idfactura === item.idfactura_facturas.idfactura
              );
              let fac = item.idfactura_facturas;
              if (!query) {
                //console.log(query);
                //console.log(item.idfactura_facturas);
                fac.rubros = [item.idrubro_rubros];
                n_fxr.push(item.idfactura_facturas);
              } else {
                n_fxr.forEach((_item: any) => {
                  console.log(_item);
                  let query;
                  _item.rubros.push(item.idrubro_rubros);
                });
              }
            });
            console.log(n_fxr);
          },
          error: (e) => console.error(e),
        });
        /*         this.s_rubroxfac.getSumaRubros(this.desde, this.hasta).subscribe({
          next: (datos) => {
            let rubros: any[] = [];
            datos.forEach((item: any) => {
              console.log(item);
              this.s_rubro.getRubroById(item.idrubro_rubros).subscribe({
                next: (rubro) => {
                  rubros.push({
                    idrubro: rubro.idrubro,
                    descripcion: rubro.descripcion,
                    valor: item.sum,
                  });
                },
              });
            });
          },
          error: (e) => console.error(e),
        }); */
        break;
      case '1':
        this.s_recaudacion.getRecaudadores(this.desde, this.hasta).subscribe({
          next: (datos) => {
            console.log(datos);
          },
        });
        break;
      default:
        break;
    }
    //const facs = await this.getFacturas();
    /*     let fac = this.s_facturas.findByfechacobro(this.today).toPromise();
    return fac; */
    /*     this.s_facturas.findByfechacobro(this.today).subscribe({
      next: (d_facturas: any) => {
        console.log(d_facturas);

        d_facturas.forEach(async (item: any, index: number) => {
          const rxf = await this.getRubrosxfac(item.idfactura);
          console.log((item = { ...rxf }));
        }); */
    /*         this.s_rubroxfac.getByFechacobro(this.today).subscribe({
          next: (d_rubrosxfac) => {
            console.log(d_rubrosxfac);
          },
          error: (e) => console.error(e),
        }); */
    /*     },
      error: (e) => console.error(e), */
    /*     }); */
    /*this.cajaService.getCajasxestado().subscribe({
      next: (datosCajas: any) => {
        console.log(datosCajas);
        var datosBody: any = [];
        datosCajas.forEach((item: any) => {
          this.s_facturas
            .findByUsucobro(
              item.idusuario_usuarios.idusuario,
              this.desde,
              this.hasta
            )
            .subscribe({
              next: (datos: any) => {
                var i = 0;
                console.log(datos);
                if (datos != null || datos != undefined) {
                  datos.forEach(() => {
                    console.log(datos[i]);

                    datosBody.push([
                      datos[i].nrofactura,
                      datos[i].idcliente.nombre,
                      datos[i].idmodulo.descripcion,
                      datos[i].idfactura,
                      datos[i].fechacobro,
                      datos[i].horacobro,
                      datos[i].usuariocobro,
                      //this.usuario.nomusu,
                    ]);
                    i++;
                  });
                  this.pdf2(datosBody);
                }
                /* setTimeout(() => {
                }, 3000); 
              },
              error: (e) => console.error(e),
            });
        });
      },
      error: (e) => console.error(e),
    });
    /* console.log(this.usuario);
    console.log(this.caja); */
  }
  async getFacturas(): Promise<any> {
    let fac = this.s_facturas.findByfechacobro(this.today).toPromise();
    return fac;

    /* subscribe({
      next: (d_facturas: any) => {
        console.log(d_facturas);
        let f_facturas = d_facturas.map(async (item: any) => {
          this.s_rubroxfac.getByIdfactura(item.idfactura).subscribe({
            next: (datos) => {
              console.log(datos);
              //console.log((item = { ...datos }));
              return (item = { ...datos });
            },
          });
        });
        console.log(f_facturas);
        this.s_rubroxfac.getByFechacobro(this.today).subscribe({
          next: (d_rubrosxfac) => {
            console.log(d_rubrosxfac);
          },
          error: (e) => console.error(e),
        });
      },
      error: (e) => console.error(e),
    }); */
  }
  async getRubrosxfac(idfactura: number): Promise<any> {
    let rubxfa = this.s_rubroxfac.getByIdfactura(idfactura).toPromise();
    return rubxfa;
  }

  pdf2(datosBody: any) {
    console.log(datosBody);
    let suma = 0;
    datosBody.forEach(async (item: any) => {
      console.log(item);
      (await this.s_rubroxfac.getSumaValoresUnitarios(item[3])).subscribe({
        next: (val: any) => {
          console.log(datosBody[3]);
          suma = val.toFixed(2);
          console.log(suma);
        },
      });
    });
    //const nombreEmision = new NombreEmisionPipe(); // Crea una instancia del pipe
    let doc = new jsPDF('p', 'pt', 'a4');
    this._pdf.header('REPORTE DEL DIA', doc);
    let m_izquierda = 10;

    /*             this._facturacion.forEach(() => {
                       let fecha = this._facturacion[i].feccrea.slice(8, 10).concat('-', this._facturacion[i].feccrea.slice(5, 7), '-', this._facturacion[i].feccrea.slice(0, 4))
                       datos.push([this._facturacion[i].idfacturacion, fecha,
                       this._facturacion[i].idcliente_clientes.nombre,
                       this._facturacion[i].descripcion, this._facturacion[i].total, this._facturacion[i].cuotas]);
                       i++;
                    }); */

    //datos.push(['', 'TOTAL', '', '', this.sumtotal]);

    const addPageNumbers = function () {
      const pageCount = doc.internal.pages.length;
      for (let i = 1; i <= pageCount - 1; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
          'Página ' + i + ' de ' + (pageCount - 1),
          m_izquierda,
          doc.internal.pageSize.height - 10
        );
      }
    };
    autoTable(doc, {
      head: [
        [
          'Nro Factura',
          'Nombre y Apellido',
          'Módulo',
          'Valor',
          'Fecha cobro',
          'Hora cobro',
          'Usuario',
        ],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [68, 103, 114],
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 1,
        halign: 'center',
      },
      /*       columnStyles: {
                0: { halign: 'center', cellWidth: 10 },
                1: { halign: 'center', cellWidth: 18 },
                2: { halign: 'left', cellWidth: 60 },
                3: { halign: 'left', cellWidth: 80 },
                4: { halign: 'right', cellWidth: 15 },
                5: { halign: 'center', cellWidth: 14 },
              },
              margin: { left: m_izquierda - 1, top: 19, right: 4, bottom: 13 }, */
      body: datosBody,

      didParseCell: function (data) {
        var fila = data.row.index;
        var columna = data.column.index;
        //if (columna === 4 && data.cell.section === 'body') { data.cell.text[0] = formatNumber(+data.cell.raw!); }
        /*     if (fila === datosBody.length - 1) {
                data.cell.styles.fontStyle = 'bold';
              }  */ // Total Bold
      },
    });
    addPageNumbers();

    var opciones = {
      filename: 'lecturas.pdf',
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    };

    if (this.otraPagina) doc.output('dataurlnewwindow', opciones);
    else {
      const pdfDataUri = doc.output('datauristring');
      //Si ya existe el <embed> primero lo remueve
      const elementoExistente = document.getElementById('idembed');
      if (elementoExistente) {
        elementoExistente.remove();
      }
      //Crea el <embed>
      var embed = document.createElement('embed');
      embed.setAttribute('src', pdfDataUri);
      embed.setAttribute('type', 'application/pdf');
      embed.setAttribute('width', '50%');
      embed.setAttribute('height', '75%');
      embed.setAttribute('id', 'idembed');
      //Agrega el <embed> al contenedor del Modal
      var container: any;
      container = document.getElementById('pdf');
      container.appendChild(embed);
    }
  }
}
interface Caja {
  idcaja: number;
  codigo: String;
  descripcion: String;
  ptoemi: String;
  estado: String;
}

interface Rubro {
  nombre: string;
  precio: number;
}

interface Factura {
  numero: string;
  fecha: Date;
  rubros: Rubro[]; // Array of Rubro objects
}
