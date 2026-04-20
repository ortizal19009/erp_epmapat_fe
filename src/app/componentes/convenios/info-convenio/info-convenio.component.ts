import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ConvenioService } from 'src/app/servicios/convenio.service';
import { CuotasService } from 'src/app/servicios/cuotas.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { FacxconvenioService } from 'src/app/servicios/facxconvenio.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { ConveniosReportsService } from '../convenios-reports.service';
import { InteresesService } from 'src/app/servicios/intereses.service';

type CuotaSortColumn = 'cuota' | 'planilla' | 'fecha' | 'factura' | 'fcobro' | 'valor' | 'interes';
type ConvenioSortColumn = 'nro' | 'fecha' | 'modulo' | 'valor';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-info-convenio',
  template: `
<div class="content mt-1 pt-1 pl-0">
   <div class="container-fluid">
      <div class="row m-0 px-0 py-1 border cabecera sombra">
         <div class="col-sm-5">
            <h4 class="m-0 font-weight-bold"><i class="fa fa-american-sign-language-interpreting"></i> Convenio de Pago
            </h4>
         </div>
         <div class="btn-group ml-auto mx-0">
            <button type="button" class="bg-transparent border-0 dropdown-toggle text-white" data-toggle="dropdown"
               aria-expanded="false"> <i class="bi-menu-button-wide text-white"></i>
            </button>
            <div class="dropdown-menu dropdown-menu-right bg-dark roboto">
               <button class="dropdown-item" type="button" data-toggle="modal" data-target="#imprimir">
                  <i class="bi bi-printer"></i>&nbsp; Imprimir</button>
               <button class="dropdown-item" type="button" [routerLink]="['/anular-convenio', idconvenio]" [class.disabled]="!hasFacturasCobradas"
                  [attr.aria-disabled]="!hasFacturasCobradas">
                  <i class="fa fa-exchange" aria-hidden="true"></i>
                  <span>&nbsp;Anular</span></button>
               <button class="dropdown-item" type="button" [routerLink]="['/anular-convenio', idconvenio]"
                  [queryParams]="{modo: 'eliminar'}" [class.disabled]="hasFacturasCobradas" [attr.aria-disabled]="hasFacturasCobradas">
                  <i class="fa fa-minus-square-o" aria-hidden="true"></i>
                  <span>&nbsp;Eliminar</span></button>
            </div>
            <div class="col-sm-1">
               <button class="bg-transparent border-0" type="submit" (click)="regresar()">
                  <i class="bi-arrow-left-circle text-white icoRegresar"></i>
               </button>
            </div>
         </div>
      </div>
   </div>
</div>

<div class="container-fluid">
   <div class="row mb-0">
      <div class="col-sm-3">
         <div class="card card-info detalle sombra">
            <div class="card-body box-profile">
               <h3 class="profile-username text-center">Nro: {{ convenio.nroconvenio }}</h3>
               <p class="text-muted text-center">{{ convenio.nomcli }}<br>Cuenta: {{ convenio.cuenta}} </p>
               <ul class="list-group list-group-unbordered mb-3">
                  <li class="list-group-item detalle">
                     <b>Total</b> <a class="float-right">{{ convenio.totalconvenio | number: '1.2-2'}}</a>
                  </li>
                  <li class="list-group-item detalle">
                     <b>Cuota inicial</b> <a class="float-right">{{ convenio.cuotainicial | number: '1.2-2'}}</a>
                  </li>
                  <li class="list-group-item detalle">
                     <b>Cuota final</b> <a class="float-right">{{ convenio.cuotafinal | number: '1.2-2'}}</a>
                  </li>
               </ul>
            </div>
         </div>
      </div>

      <div class="col-sm-9">
         <div class="card">
            <div class="card-header cabecera">
               <ul class="nav nav-tabs card-header-tabs cabecera">
                  <li class="nav-item"><a class="nav-link active cabecera" href="#cuotas" data-toggle="tab">Cuotas</a>
                  </li>
                  <li class="nav-item"><a class="nav-link cabecera" href="#prefacturas" data-toggle="tab"
                        (click)="facxConvenio()">Planillas</a></li>
               </ul>
            </div>

            <div class="card-body py-1">
               <div class="tab-content">
                  <div class="tab-pane active" id="cuotas">
                     <div class="post">
                        <div class="user-block">
                           <table class="table table-hover table-sm table-bordered sombra">
                              <thead class="cabecera">
                                 <tr class="text-center">
                                    <th class="sortable" style="cursor:pointer; user-select:none;"
                                       (click)="toggleCuotaSort('cuota')">Cuota {{ getCuotaSortIndicator('cuota') }}</th>
                                    <th class="sortable" style="cursor:pointer; user-select:none;"
                                       (click)="toggleCuotaSort('planilla')">Planilla {{ getCuotaSortIndicator('planilla') }}</th>
                                    <th class="sortable" style="cursor:pointer; user-select:none;"
                                       (click)="toggleCuotaSort('fecha')">Fecha {{ getCuotaSortIndicator('fecha') }}</th>
                                    <th class="sortable" style="cursor:pointer; user-select:none;"
                                       (click)="toggleCuotaSort('factura')">Factura {{ getCuotaSortIndicator('factura') }}</th>
                                    <th class="sortable" style="cursor:pointer; user-select:none;"
                                       (click)="toggleCuotaSort('fcobro')">F.Cobro {{ getCuotaSortIndicator('fcobro') }}</th>
                                    <th class="sortable" style="cursor:pointer; user-select:none;"
                                       (click)="toggleCuotaSort('valor')">Valor {{ getCuotaSortIndicator('valor') }}</th>
                                    <th class="sortable" style="cursor:pointer; user-select:none;"
                                       (click)="toggleCuotaSort('interes')">Interes {{ getCuotaSortIndicator('interes') }}</th>
                                    <th></th>
                                 </tr>
                              </thead>
                              <tbody class="detalle">
                                 <tr *ngFor="let cuota of cuotasOrdenadas" class="text-center">
                                    <td>{{ cuota.nrocuota }}</td>
                                    <td>{{ cuota.idfactura.idfactura }}</td>
                                    <td>{{ cuota.idfactura.feccrea }}</td>
                                    <td>{{ cuota.idfactura.nrofactura }}</td>
                                    <td>{{ cuota.idfactura.fechacobro }}</td>
                                    <td class="text-right">{{cuota.idfactura.totaltarifa | number: '1.2-2'}}</td>
                                    <td class="text-right">{{cuota.interesacobrar | number: '1.2-2'}}
                                    </td>
                                    <td>
                                       <button class="btn btn-outline-info btn-xs" data-toggle="modal"
                                          data-target="#facturaDetallesModal"
                                          (click)="getRubroxfac( cuota.idfactura.idfactura )">
                                          <i class="fa fa-info-circle"></i> Info
                                       </button>
                                    </td>
                                 </tr>
                                 <tr>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td class="text-right font-weight-bold">Total </td>
                                    <td class="text-right font-weight-bold">{{ total1 | number: '1.2-2'}}</td>
                                    <td class="text-right font-weight-bold">{{ totalInteres | number: '1.2-2'}}</td>
                                    <td *ngIf="dif1" class="text-center"><span class="badge badge-danger"
                                          data-toggle="tooltip" title="Diferencia">{{ convenio.totalconvenio - total1 |
                                          number:
                                          '1.2-2' }}</span>
                                    </td>
                                    <td></td>
                                 </tr>
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>

                  <div class="tab-pane" id="prefacturas">
                     <div class="post">
                        <div class="user-block">
                           <table class="table table-hover table-sm table-bordered col-sm-8 sombra centro">
                              <thead class="cabecera">
                                 <tr class="text-center">
                                    <th></th>
                                    <th class="sortable" style="cursor:pointer; user-select:none;"
                                       (click)="toggleConvenioSort('nro')">Nro. {{ getConvenioSortIndicator('nro') }}</th>
                                    <th class="sortable" style="cursor:pointer; user-select:none;"
                                       (click)="toggleConvenioSort('fecha')">Fecha {{ getConvenioSortIndicator('fecha') }}</th>
                                    <th class="sortable" style="cursor:pointer; user-select:none;"
                                       (click)="toggleConvenioSort('modulo')">Modulo {{ getConvenioSortIndicator('modulo') }}</th>
                                    <th class="sortable" style="cursor:pointer; user-select:none;"
                                       (click)="toggleConvenioSort('valor')">Valor {{ getConvenioSortIndicator('valor') }}</th>
                                    <th></th>
                                 </tr>
                              </thead>
                              <tbody class="detalle">
                                 <tr *ngFor="let facxconv of facxConvenioOrdenadas; let i=index" class="text-center">
                                    <td class="text-center font-weight-bold small">{{i+1}}</td>
                                    <td>{{ facxconv.idfactura_facturas.idfactura }}</td>
                                    <td>{{ facxconv.idfactura_facturas.feccrea | date: 'dd-MM-y' }}</td>
                                    <td class="text-left">{{ facxconv.idfactura_facturas.idmodulo.descripcion}}</td>
                                    <td class="text-right">{{ facxconv.idfactura_facturas.totaltarifa | number:
                                       '1.2-2'}}</td>
                                    <td>
                                       <button class="btn btn-outline-info btn-xs" data-toggle="modal"
                                          data-target="#facturaDetallesModal"
                                          (click)="getRubroxfac( facxconv.idfactura_facturas.idfactura )">
                                          <i class="fa fa-info-circle"></i> Info
                                       </button>
                                    </td>
                                 </tr>
                                 <tr>
                                    <td colspan="4" class="text-right font-weight-bold">Total </td>
                                    <td class="text-right font-weight-bold">{{ total2 | number: '1.2-2'}} </td>
                                    <td *ngIf="dif2" class="text-center"><span class="badge badge-danger"
                                          data-toggle="tooltip" title="Diferencia">{{ convenio.totalconvenio - total2 |
                                          number:
                                          '1.2-2' }}</span>
                                    </td>
                                    <td *ngIf="!dif2"></td>
                                 </tr>
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   </div>

   <div class="modal fade" id="facturaDetallesModal" tabindex="-1" aria-labelledby="facturaDetallesModalLabel"
      aria-hidden="true">
      <div class="modal-dialog">
         <div class="modal-content">
            <div class="modal-header">
               <h5 class="modal-title" id="facturaDetallesModalLabel">Pre Factura: {{ v_idfactura }}</h5>
            </div>
            <div class="modal-body">
               <table class="table table-hover table-sm table-bordered">
                  <thead class="bg-primary">
                     <tr class="text-center">
                        <th></th>
                        <th class="col-md-6">Rubro</th>
                        <th>Cant</th>
                        <th>Valor</th>
                        <th>Subtotal</th>
                     </tr>
                  </thead>
                  <tbody>
                     <tr *ngFor="let rubroxfac of _rubroxfac; let i=index">
                        <td class="text-center font-weight-bold small">{{i+1}}</td>
                        <td>{{ rubroxfac.idrubro_rubros.descripcion}}</td>
                        <td class="text-center">{{ rubroxfac.cantidad}}</td>
                        <td class="text-right">{{ rubroxfac.valorunitario | number:'1.2-2'}}</td>
                        <td class="text-right">{{ rubroxfac.cantidad * rubroxfac.valorunitario | number:'1.2-2'}}</td>
                     </tr>
                     <tr>
                        <td></td>
                        <td class="font-weight-bold">Total</td>
                        <td></td>
                        <td></td>
                        <td class="font-weight-bold text-right">{{ totfac | number:'1.2-2'}}</td>
                     </tr>
                  </tbody>
               </table>
            </div>
            <div class="modal-footer">
               <button type="button" class="btn btn-outline-success btn-sm" data-dismiss="modal">
                  <i class="fa fa-times-circle"></i> Cerrar</button>
            </div>
         </div>
      </div>
   </div>

   <div class='modal fade' id='imprimir' tabindex='-1' aria-labelledby='imprimir' aria-hidden='true'>
      <div class='modal-dialog modal-sm'>
         <div class='modal-content'>
            <div class='modal-header'>
               <h5 class='modal-title font-weight-bold' id='ModalLabel'>Seleccione Opcion</h5>
            </div>
            <div class='modal-body'>
               <div class="container-fluid">
                  <div class="row">
                     <div class="col-sm">
                        <select name="" id="" class="form-control">
                           <option value="0">Convenio</option>
                        </select>
                     </div>
                  </div>
               </div>
            </div>
            <div class='modal-footer' id='idButtons'>
               <button type='button' class='btn btn-success btn-sm' data-dismiss='modal' (click)="imprimirPdf(convenio)"
                  id='btnSi'>
                  <i class="fa fa-check-circle" style="font-size:24pxi"></i>&nbsp;&nbsp;&nbsp;Si&nbsp;&nbsp;&nbsp;
               </button>
               <button type='button' class='btn btn-outline-success btn-sm' data-dismiss='modal'>
                  <i class="fa fa-times-circle" style="font-size:24pxi"></i>&nbsp;&nbsp;No&nbsp;&nbsp;</button>
            </div>
         </div>
      </div>
   </div>
   <div class='modal fade' id='modalEliminar' tabindex='-1' aria-labelledby='modalEliminar' aria-hidden='true'>
      <div class='modal-dialog modal-sm'>
         <div class='modal-content'>
            <div class='modal-header'>
               <h5 class='modal-title font-weight-bold' id='ModalLabel'>Mensaje</h5>
            </div>
            <div class='modal-body'>
               <div class="alert alert-info" role="alert">
                  Eliminar el Convenio de Pago {{ convenio.nroconvenio }} ?
               </div>
            </div>
            <div class='modal-footer' id='idButtons'>
               <button type='button' class='btn btn-success btn-sm' data-dismiss='modal'
                  (click)="confirmaEliminarConvenio()" id='btnSi'>
                  <i class="fa fa-check-circle" style="font-size:24pxi"></i>&nbsp;&nbsp;&nbsp;Si&nbsp;&nbsp;&nbsp;
               </button>
               <button type='button' class='btn btn-outline-success btn-sm' data-dismiss='modal'>
                  <i class="fa fa-times-circle" style="font-size:24pxi"></i>&nbsp;&nbsp;No&nbsp;&nbsp;</button>
            </div>
         </div>
      </div>
   </div>
</div>
  `,
  styleUrls: ['./info-convenio.component.css'],
})
export class InfoConvenioComponent implements OnInit {
  convenio = {} as Convenio; //Interface para los datos del Convenio
  total1: number; //Total de las Facturas de las Cuotas
  total2: number; //Total de las Facturas del convenio
  dif1: boolean;
  dif2: boolean;
  elimdisabled: boolean = true;
  v_idfactura: number;
  totfac: number;
  _convenios: any;
  _facxconvenio: any;
  _cuotas: any;
  _rubroxfac: any;
  idconvenio: number;
  sweliminar: boolean = true;
  hasFacturasCobradas: boolean = false;
  totalInteres: number;
  cuotaSortColumn: CuotaSortColumn = 'cuota';
  cuotaSortDirection: SortDirection = 'asc';
  convenioSortColumn: ConvenioSortColumn = 'nro';
  convenioSortDirection: SortDirection = 'asc';
  constructor(
    private convService: ConvenioService,
    private fxconvService: FacxconvenioService,
    private cuotaService: CuotasService,
    private facService: FacturaService,
    private rxfService: RubroxfacService,
    private router: Router,
    private s_report: ConveniosReportsService,
    private s_intereses: InteresesService
  ) { }

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/info-convenios');
    let coloresJSON = sessionStorage.getItem('/info-convenios');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

    this.idconvenio = +sessionStorage.getItem('idconvenioToInfo')!;
    sessionStorage.removeItem('idconvenioToInfo');
    if (this.idconvenio === 0) {
      this.regresar();
    } else {
      this.datosConvenio();
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

  datosConvenio() {
    this.convService.getById(this.idconvenio).subscribe({
      next: (datos: any) => {
        this._convenios = datos;
        this.convenio.idconvenio = datos.idconvenio;
        this.convenio.nroconvenio = datos.nroconvenio;
        this.convenio.nomcli = datos.idabonado.idcliente_clientes.nombre;
        this.convenio.referencia = datos.referencia;
        this.convenio.totalconvenio = datos.totalconvenio;
        this.convenio.cuotainicial = datos.cuotainicial;
        this.convenio.cuotafinal = datos.cuotafinal;
        this.convenio.cuenta = datos.idabonado.idabonado;
        this.convenio.feccrea = datos.feccrea;
        this.cuotasxConvenio(this.idconvenio);
      },
      error: (err) => console.error(err.error),
    });
    this.convService.findDatosConvenio(this.idconvenio).subscribe({
      next: (datos: any) => {
        this.sweliminar = true;
      },
      error: (e: any) => console.error(e)
    })
  }

  async calcularInteres(idfactura: number) {
    let interes = await this.s_intereses.getInteresFacturaAsync(idfactura)
    return interes;
  }

  cuotasxConvenio(idconvenio: number) {
    this.cuotaService.getByIdconvenio(idconvenio).subscribe({
      next: (datos: any) => {
        this.totalInteres = 0;

        this._cuotas = datos;
        datos.forEach(async (item: any, index: number) => {
          if (item.idfactura.pagado === 0) {
            this._cuotas[index].interesacobrar = await this.s_intereses.getInteresFacturaAsync(item.idfactura.idfactura)
          } else {
            this._cuotas[index].interesacobrar = item.idfactura.interescobrado
          }
          this.totalInteres += this._cuotas[index].interesacobrar;
        })

        this.totalCuotas();
      },
      error: (err) => console.error(err.error),
    });
  }

  get cuotasOrdenadas(): any[] {
    return [...(this._cuotas ?? [])].sort((a: any, b: any) =>
      this.compareCuotas(a, b),
    );
  }

  get facxConvenioOrdenadas(): any[] {
    return [...(this._facxconvenio ?? [])].sort((a: any, b: any) =>
      this.compareFacxConvenio(a, b),
    );
  }

  toggleCuotaSort(column: CuotaSortColumn): void {
    if (this.cuotaSortColumn === column) {
      this.cuotaSortDirection = this.cuotaSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.cuotaSortColumn = column;
      this.cuotaSortDirection = 'asc';
    }
  }

  toggleConvenioSort(column: ConvenioSortColumn): void {
    if (this.convenioSortColumn === column) {
      this.convenioSortDirection = this.convenioSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.convenioSortColumn = column;
      this.convenioSortDirection = 'asc';
    }
  }

  getCuotaSortIndicator(column: CuotaSortColumn): string {
    if (this.cuotaSortColumn !== column) {
      return '';
    }
    return this.cuotaSortDirection === 'asc' ? '▲' : '▼';
  }

  getConvenioSortIndicator(column: ConvenioSortColumn): string {
    if (this.convenioSortColumn !== column) {
      return '';
    }
    return this.convenioSortDirection === 'asc' ? '▲' : '▼';
  }

  private compareCuotas(a: any, b: any): number {
    const va = this.getCuotaSortValue(a, this.cuotaSortColumn);
    const vb = this.getCuotaSortValue(b, this.cuotaSortColumn);
    const result = this.compareValues(va, vb);
    return this.cuotaSortDirection === 'asc' ? result : -result;
  }

  private compareFacxConvenio(a: any, b: any): number {
    const va = this.getConvenioSortValue(a, this.convenioSortColumn);
    const vb = this.getConvenioSortValue(b, this.convenioSortColumn);
    const result = this.compareValues(va, vb);
    return this.convenioSortDirection === 'asc' ? result : -result;
  }

  private compareValues(a: any, b: any): number {
    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;

    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }

    return String(a).localeCompare(String(b), 'es', { sensitivity: 'base' });
  }

  private getCuotaSortValue(item: any, column: CuotaSortColumn): string | number {
    switch (column) {
      case 'cuota':
        return Number(item?.nrocuota ?? 0);
      case 'planilla':
        return Number(item?.idfactura?.idfactura ?? 0);
      case 'fecha':
        return String(item?.idfactura?.feccrea ?? '');
      case 'factura':
        return String(item?.idfactura?.nrofactura ?? '');
      case 'fcobro':
        return String(item?.idfactura?.fechacobro ?? '');
      case 'valor':
        return Number(item?.idfactura?.totaltarifa ?? 0);
      case 'interes':
        return Number(item?.interesacobrar ?? 0);
      default:
        return '';
    }
  }

  private getConvenioSortValue(item: any, column: ConvenioSortColumn): string | number {
    switch (column) {
      case 'nro':
        return Number(item?.idfactura_facturas?.idfactura ?? 0);
      case 'fecha':
        return String(item?.idfactura_facturas?.feccrea ?? '');
      case 'modulo':
        return String(item?.idfactura_facturas?.idmodulo?.descripcion ?? '');
      case 'valor':
        return Number(item?.idfactura_facturas?.totaltarifa ?? 0);
      default:
        return '';
    }
  }

  totalCuotas() {
    this.total1 = 0;
    let i = 0;
    this._cuotas.forEach(() => {
      this.total1 += this._cuotas[i].idfactura.totaltarifa;
      i++;
    });
    this.total1 = Number(this.total1.toFixed(2));
    if (Number(this.convenio.totalconvenio.toFixed(2)) - this.total1 != 0) {
      this.dif1 = true;
    }
  }

  nombreClienteOld(idfactura: number) {
    this.facService.getById(idfactura).subscribe({
      next: (datos) => (this.convenio.nomcli = datos.idcliente.nombre),
      error: (err) => console.error(err.error),
    });
  }

  facxConvenio() {
    this.fxconvService.getFacByConvenio(this.idconvenio).subscribe({
      next: (datos: any[]) => {
        this._facxconvenio = datos;
        this.totalFacturas();
        this.hasFacturasCobradas = Array.isArray(datos)
          ? datos.some((fx: any) =>
              fx?.idfactura_facturas?.pagado === 1 ||
              fx?.idfactura_facturas?.pagado === '1' ||
              fx?.idfactura_facturas?.pagado === true
            )
          : false;
      },
      error: (err) => console.error(err.error),
    });
  }

  totalFacturas() {
    this.total2 = 0;
    let i = 0;
    this._facxconvenio.forEach(() => {
      this.total2 += this._facxconvenio[i].idfactura_facturas.totaltarifa;
      i++;
    });
    this.total2 = Number(this.total2.toFixed(2));
    if (Number(this.convenio.totalconvenio.toFixed(2)) - this.total2 != 0) {
      this.dif2 = true;
    }
  }

  regresar() {
    this.router.navigate(['/convenios']);
  }

  public modiConvenio(idconvenio: number) {
    this.router.navigate(['modiconvenio', idconvenio]);
  }

  confirmaEliminarConvenio() {
    let idc = localStorage.getItem('idconvenioToDelete');
    if (idc != null) {
      this.convService.deleteConvenio(+idc!).subscribe({
        next: (datos) => { },
        error: (err) => console.error(err.error),
      });
    }
  }

  getRubroxfac(idfactura: number) {
    this.v_idfactura = idfactura;
    this.rxfService.getByIdfactura(+idfactura!).subscribe({
      next: (detalle) => {
        this._rubroxfac = detalle;
        this.subtotal();
      },
      error: (err) => console.error(err.error),
    });
  }

  subtotal() {
    let suma12: number = 0;
    let suma0: number = 0;
    //this.valoriva = 0;
    let i = 0;
    this._rubroxfac.forEach(() => {
      if (this._rubroxfac[i].idrubro_rubros.swiva == 1) {
        suma12 +=
          this._rubroxfac[i].cantidad * this._rubroxfac[i].valorunitario;
      } else {
        if (this._rubroxfac[i].idrubro_rubros.esiva == 0) {
          suma0 +=
            this._rubroxfac[i].cantidad * this._rubroxfac[i].valorunitario;
        } else {
          //this.valoriva = this.rubroxfac[i].valorunitario;
        }
      }
      i++;
    });
    this.totfac = suma12 + suma0;
    //this.suma12 = suma12;
    //this.suma0 = suma0;
  }
  imprimirPdf(convenio: any) {
    this.s_report.impContratoConvenio(convenio, this._cuotas);
  }
}

interface Convenio {
  idconvenio: number;
  nroconvenio: number;
  referencia: String;
  nomcli: String;
  totalconvenio: number;
  cuotainicial: number;
  cuotafinal: number;
  cuenta: number;
  feccrea: Date;
}
