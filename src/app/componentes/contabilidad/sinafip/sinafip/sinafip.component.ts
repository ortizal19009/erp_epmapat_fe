import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { firstValueFrom } from 'rxjs';

import { ColoresService } from 'src/app/compartida/colores.service';
import { PresupueService } from 'src/app/servicios/contabilidad/presupue.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucio.service';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';
import { AutorizaService } from 'src/app/compartida/autoriza.service';

@Component({
  selector: 'app-sinafip',
  templateUrl: './sinafip.component.html',
  styleUrls: ['./sinafip.component.css'],
})
export class SinafipComponent implements OnInit {

  formSinafip!: FormGroup;

  dataToExport: any;
  _workbook: Workbook = new Workbook();
  presupuestos: any;
  _ejecuciones: any[] = [];
  pruebavalor: any;
  asignar: boolean = true;
  sw1: boolean = false;

  constructor(
    private fb: FormBuilder,
    private coloresService: ColoresService,
    private s_presupue: PresupueService,
    private s_transaci: TransaciService,
    private s_ejecucion: EjecucionService,
    private s_cuentas: CuentasService,
     public authService: AutorizaService,
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/sinafip');
    const coloresJSON = sessionStorage.getItem('/sinafip');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    this.formSinafip = this.fb.group({
      archivo: ['option1'],
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      tipo: ['opt1'],
      periodo: [1],
    });
  }
   async buscaColor() {
      try {
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'asientos');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/asientos', coloresJSON);
         this.colocaColor(datos);
      } catch (error) { console.error(error); }
   }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');

    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  get f() { return this.formSinafip.controls; }

  // ==========================
  // GENERAR (CONTROL PRINCIPAL)
  // ==========================
  generar() {
    console.log('Generando...');
    this.sw1 = true;

    const { archivo, tipo, nombre, periodo } = this.formSinafip.value;

    switch (archivo) {

      // APERTURA INICIAL
      case 'option1':
        if (tipo === 'opt1') {
          this.getAperturaInicial().then(values => {
            const content = this.formatAperturaInicial(values);
            this.generarTxt(content, nombre);
          });
        } else if (tipo === 'opt2') {
          this.getAperturaInicial().then(values => {
            this.generarHojaElectronica(values, this.headerAperturaInicial.bind(this), nombre);
          });
        }
        break;

      // DETALLE APERTURA
      case 'option2':
        if (tipo === 'opt1') {
          this.getDetalleApertura().then(values => {
            const content = this.formatDetalleApertura(values);
            this.generarTxt(content, nombre);
          });
        } else if (tipo === 'opt2') {
          this.getDetalleApertura().then(values => {
            this.generarHojaElectronica(values, this.headerDetalleApertura.bind(this), nombre);
          });
        }
        break;

      // BALANCE COMPROBACIÓN
      case 'option3':
        if (tipo === 'opt1') {
          this.getIniciales().then((values:any) => {
            const content = this.formatBalanceCompro(values);
            this.generarTxt(content, nombre);
          });
        } else if (tipo === 'opt2') {
          this.getIniciales().then(values => {
            this.generarHojaElectronica(values, this.headerBalanceCompro.bind(this), nombre);
          });
        }
        break;

      case 'option4':
        break;

      // PRESUPUESTO INICIAL
      case 'option5':
        if (tipo === 'opt1') {
          this.getPrespuestos().then(values => {
            const content = this.formatPresuInicial(values);
            this.generarTxt(content, nombre);
          });
        } else if (tipo === 'opt2') {
          this.getPrespuestos().then(values => {
            this.generarHojaElectronica(values, this.headerPresupue.bind(this), nombre);
          });
        }
        break;

      // CÉDULA INGRESOS/GASTOS
      case 'option6':
        if (periodo > 0 && periodo <= 12) {
          if (tipo === 'opt1') {
            this.getaddingData().then((values:any) => {
              const content = this.formatCedInGa(values);
              this.generarTxt(content, nombre);
            });
          } else if (tipo === 'opt2') {
            this.getaddingData().then(values => {
              this.generarHojaElectronica(values, this.headerCedInGa.bind(this), nombre);
            });
          }
        }
        break;

      default:
        break;
    }
  }

  // ==========================
  // DESCARGA TXT (file-saver)
  // ==========================
  generarTxt(content: string, name: string) {
    const fileName = `${name}.txt`;
    const txtBlob = new Blob([content ?? ''], { type: 'text/plain;charset=utf-8' });
    saveAs(txtBlob, fileName);
  }

  // ==========================
  // DESCARGA EXCEL (exceljs + file-saver)
  // ==========================
  generarHojaElectronica(
    data: any,
    headers: (data: any, hoja: any) => any,
    nombreArchivo: string
  ) {
    this._workbook = new Workbook();
    this._workbook.creator = 'EpMapaT-User';
    this._workbook.created = new Date();
    this._workbook.modified = new Date();

    const hoja = this._workbook.addWorksheet('Hoja1');
    headers(data, hoja);

    this._workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      saveAs(blob, `${nombreArchivo}.xlsx`);
    });
  }

  // ==========================
  // PRESUPUESTO INICIAL
  // ==========================
  formatPresuInicial(data: any[]): string {
    const formattedData = data.map((item) => {
      let tp = '';
      const cp = item.codigo.split('.');
      if (item.tippar === 1) {
        tp = 'I';
        return `01|${tp}|${cp[0]}|${cp[1]}|${cp[2]}|${item.inicia.toFixed(2)}`;
      } else if (item.tippar === 2) {
        tp = 'G';
        return `01|${tp}|${cp[0]}|${cp[1]}|${cp[2]}|000|99999999|${item.inicia.toFixed(2)}`;
      } else {
        return 'error';
      }
    });
    return formattedData.join('\n');
  }

  headerPresupue(presupue: any, hoja: any): void {
    hoja.autoFilter = 'A1:V1';
    hoja.columns = [
      { header: '', key: 'indice' },
      { header: '', key: 'tippar' },
      { header: '', key: 'cod1' },
      { header: '', key: 'cod2' },
      { header: '', key: 'cod3' },
      { header: '', key: 'inicia' },
    ];

    presupue.forEach((pres: any) => {
      pres.tippar = (pres.tippar === 1) ? 'I' : 'G';
      const codigo = pres.codigo.split('.');
      hoja.addRow({
        indice: '01',
        tippar: pres.tippar,
        cod1: codigo[0],
        cod2: codigo[1],
        cod3: codigo[2],
        inicia: pres.inicia.toFixed(2),
      });
    });
  }

  async getPrespuestos(): Promise<any[]> {
    const datos: any[] = await firstValueFrom(this.s_presupue.getAllPresupue());
    const lista: any[] = [];

    datos.forEach((item: any) => {
      item.codigo = item.codigo.slice(0, 8);
      const query = lista.find((e: any) => e.codigo === item.codigo);

      if (!query) lista.push(item);
      else query.inicia += item.inicia;
    });

    return lista;
  }

  // ==========================
  // APERTURA INICIAL
  // ==========================
  formatAperturaInicial(data: any[]): string {
    const formattedData = data.map((item) => {
      return `${item.col1}|${item.col2}|${item.col3}|${item.col4}|${item.col5.toFixed(2)}|${item.col6.toFixed(2)}`;
    });
    return formattedData.join('\n');
  }

  headerAperturaInicial(presupue: any, hoja: any): void {
    hoja.autoFilter = 'A1:V1';
    hoja.columns = [
      { header: 'Col1', key: 'col1' },
      { header: 'Col2', key: 'col2' },
      { header: 'Col3', key: 'col3' },
      { header: 'Col4', key: 'col4' },
      { header: 'Col5', key: 'col5' },
      { header: 'Col6', key: 'col6' },
    ];
    presupue.forEach((row: any) => hoja.addRow(row));
  }

  private async getTransaciByTipAsi(): Promise<any[]> {
    // Si necesitas que solo corra cuando sw1 true:
    if (!this.sw1) return [];
    return await firstValueFrom(this.s_transaci.getByTipAsi(1));
  }

  async getAperturaInicial(): Promise<any[]> {
    if (!this.sw1) return [];

    const values = await this.getTransaciByTipAsi();
    const initialValues: any[] = [];

    const lcodcue: string[] = [];
    values.forEach((value: any) => {
      const spltxt = value.codcue.split('.', 2);
      const addtxt = `${spltxt[0]}.${spltxt[1]}`;
      if (!lcodcue.includes(addtxt)) lcodcue.push(addtxt);
    });

    // Ejecuta en serie para asegurar que se complete antes de devolver
    for (const cod of lcodcue) {
      const datos: any[] = await firstValueFrom(this.s_transaci.getAperIni(cod));

      if (!datos || datos.length === 0) continue;

      const apInicial: any = {
        col1: '01',
        col2: '',
        col3: '',
        col4: '',
        col5: 0,
        col6: 0,
      };

      const spl = datos[0].codcue.split('.');
      apInicial.col2 = spl[0];
      apInicial.col3 = spl[1];
      apInicial.col4 = (spl[2] ?? '00');

      let deb = 0;
      let cre = 0;
      datos.forEach((d: any) => {
        if (d.debcre === 1) deb += d.valor;
        else cre += d.valor;
      });

      apInicial.col5 = deb;
      apInicial.col6 = cre;

      initialValues.push(apInicial);
    }

    return initialValues;
  }

  // ==========================
  // DETALLE APERTURA INICIAL
  // ==========================
  formatDetalleApertura(data: any[]): string {
    const formattedData = data.map((item) => {
      let deb = 0;
      let cre = 0;
      const codcue = item.codcue.split('.');
      let ruc = '9999999999999';

      if (item.debcre === 1) deb = item.valor;
      if (item.debcre === 2) cre = item.valor;

      if (item.idbene?.rucben && item.idbene.rucben !== '') ruc = item.idbene.rucben;

      return `01|${codcue[0]}|${codcue[1]}|${codcue[2]}|${ruc}|${item.idbene?.nomben ?? ''}|${deb.toFixed(2)}|${cre.toFixed(2)}`;
    });

    return formattedData.join('\n');
  }

  headerDetalleApertura(presupue: any, hoja: any): void {
    hoja.autoFilter = 'A1:V1';
    hoja.columns = [
      { header: '', key: 'indice' },
      { header: '', key: 'cod1' },
      { header: '', key: 'cod2' },
      { header: '', key: 'cod3' },
      { header: '', key: 'ruc' },
      { header: '', key: 'nombre' },
      { header: '', key: 'deb' },
      { header: '', key: 'cre' },
    ];

    presupue.forEach((transa: any) => {
      const codigo = transa.codcue.split('.');
      let deb = 0;
      let cre = 0;
      let ruc = '9999999999999';

      if (transa.debcre === 1) deb = transa.valor;
      if (transa.debcre === 2) cre = transa.valor;
      if (transa.idbene?.rucben && transa.idbene.rucben !== '') ruc = transa.idbene.rucben;

      hoja.addRow({
        indice: '01',
        cod1: codigo[0],
        cod2: codigo[1],
        cod3: codigo[2],
        ruc,
        nombre: transa.idbene?.nomben ?? '',
        deb: deb.toFixed(2),
        cre: cre.toFixed(2),
      });
    });
  }

  async getDetalleApertura(): Promise<any[]> {
    // Tu código original estaba comentado.
    // Aquí devuelvo lista vacía para que compile.
    return [];
  }

  // ==========================
  // CÉDULA INGRESOS/GASTOS
  // ==========================
  formatCedInGa(data: any[]): string {
    let periodo = '';

    const formattedData = data.map((item: any) => {
      const spl = item.idejecucion.fecha_eje.split('-');
      periodo = spl[1];

      const cp = item.codigo.split('.');
      const codificado = item.inicia + item.idejecucion.modifi;
      const saldo = codificado - item.idejecucion.devengado;
      const saldo2 = codificado - item.idejecucion.prmiso;

      if (item.tippar === 1) {
        return `${periodo}|I|${cp[0]}|${cp[1]}|${cp[2]}|${item.inicia.toFixed(2)}|${item.idejecucion.modifi.toFixed(2)}|${codificado.toFixed(2)}|${item.idejecucion.devengado.toFixed(2)}|${item.idejecucion.cobpagado.toFixed(2)}|${saldo.toFixed(2)}`;
      }

      if (item.tippar === 2) {
        return `${periodo}|G|${cp[0]}|${cp[1]}|${cp[2]}|000|99999999|${item.inicia.toFixed(2)}|${item.idejecucion.modifi.toFixed(2)}|${codificado.toFixed(2)}|${item.idejecucion.prmiso.toFixed(2)}|${item.idejecucion.devengado.toFixed(2)}|${item.idejecucion.cobpagado.toFixed(2)}|${saldo2.toFixed(2)}|${saldo.toFixed(2)}`;
      }

      return 'error';
    });

    return formattedData.join('\n');
  }

  headerCedInGa(datos: any[], hoja: any): void {
    hoja.autoFilter = 'A1:V1';

    hoja.columns = [
      { header: '', key: 'periodo' },
      { header: '', key: 'tp' },
      { header: '', key: 'cod1' },
      { header: '', key: 'cod2' },
      { header: '', key: 'cod3' },
      { header: '', key: 'cod4' },
      { header: '', key: 'cod5' },
      { header: '', key: 'inicia' },
      { header: '', key: 'modifi' },
      { header: '', key: 'prmiso' },
      { header: '', key: 'codificado' },
      { header: '', key: 'devengado' },
      { header: '', key: 'cobpagado' },
      { header: '', key: 'saldo2' },
      { header: '', key: 'saldo' },
    ];

    datos.forEach((item: any) => {
      const spl = item.idejecucion.fecha_eje.split('-');
      const periodo = spl[1];

      const cp = item.codigo.split('.');
      const codificado = item.inicia + item.idejecucion.modifi;
      const saldo = codificado - item.idejecucion.devengado;
      const saldo2 = codificado - item.idejecucion.prmiso;

      if (item.tippar === 1) {
        hoja.addRow({
          periodo,
          tp: 'I',
          cod1: cp[0],
          cod2: cp[1],
          cod3: cp[2],
          inicia: item.inicia.toFixed(2),
          modifi: item.idejecucion.modifi.toFixed(2),
          codificado: codificado.toFixed(2),
          devengado: item.idejecucion.devengado.toFixed(2),
          cobpagado: item.idejecucion.cobpagado.toFixed(2),
          saldo: saldo.toFixed(2),
        });
      }

      if (item.tippar === 2) {
        hoja.addRow({
          periodo,
          tp: 'G',
          cod1: cp[0],
          cod2: cp[1],
          cod3: cp[2],
          cod4: '000',
          cod5: '99999999',
          inicia: item.inicia.toFixed(2),
          modifi: item.idejecucion.modifi.toFixed(2),
          prmiso: item.idejecucion.prmiso.toFixed(2),
          codificado: codificado.toFixed(2),
          devengado: item.idejecucion.devengado.toFixed(2),
          cobpagado: item.idejecucion.cobpagado.toFixed(2),
          saldo2: saldo2.toFixed(2),
          saldo: saldo.toFixed(2),
        });
      }
    });
  }

  getEjecuciones(codpart: any, periodo: any) {
    return new Promise((resolve, reject) => {
      this.s_ejecucion.getByCodPar(codpart, periodo).subscribe({
        next: (datos: any) => {
          const ejecuciones: any[] = [];

          if (datos.length !== 0) {
            datos.forEach((item: any) => {
              const spl = item.codpar.split('.');
              let cod: any;

              if (item.idpresupue.tippar === 1) {
                cod = spl.slice(0, 3);
                item.codpar = `${cod[0]}.${cod[1]}.${cod[2]}`;
              }

              if (item.idpresupue.tippar === 2) {
                cod = spl.slice(1, 4);
                item.codpar = `${cod[0]}.${cod[1]}.${cod[2]}`;
              }

              const f = ejecuciones.find((e: any) => e.codpar === item.codpar);
              if (!f) ejecuciones.push(item);
              else {
                const io = ejecuciones.indexOf(f);
                ejecuciones[io].modifi += item.modifi;
                ejecuciones[io].prmiso += item.prmiso;
                ejecuciones[io].devengado += item.devengado;
                ejecuciones[io].cobpagado += item.cobpagado;
              }
            });
          }

          if (ejecuciones.length !== 0) resolve(ejecuciones[0]);
          else resolve(null);
        },
        error: (e) => {
          console.error(e);
          reject(e);
        },
      });
    });
  }

  getaddingData() {
    return new Promise((resolve) => {
      this.getPrespuestos().then((presupuestos: any) => {
        const periodo = this.formSinafip.value.periodo;
        this.presupuestos = presupuestos;
        this._ejecuciones = [];

        presupuestos.forEach((item: any) => {
          this.getEjecuciones(item.codigo, periodo).then((_ej: any) => {
            if (!_ej) return;
            const f = this.presupuestos.find((p: any) => p.codigo === _ej.codpar);
            const news = { ...f, idejecucion: _ej };
            this._ejecuciones.push(news);
          });
        });

        setTimeout(() => resolve(this._ejecuciones), 500);
      });
    });
  }

  // ==========================
  // BALANCE COMPROBACION
  // ==========================
  formatBalanceCompro(data: any[]): string {
    const formattedData = data.map((item: any) => {
      const periodo = item.idasiento.fecha.split('-');
      const codcue = item.codcue.split('.');

      let ld_b1 = 0;
      let ld_b2 = 0;
      const ld_b3 = item.ld_b3;
      const ld_b4 = item.ld_b4;

      if (codcue.length === 2) codcue[2] = '00';

      if (item.ld_b < 0) ld_b2 = item.ld_b * -1;
      else ld_b1 = item.ld_b;

      const ld_b5 = ld_b1 + ld_b3;
      const ld_b6 = ld_b2 + ld_b4;

      const inicial = ld_b1 - ld_b2;
      const flujos = ld_b3 - ld_b4;

      let saldo1 = 0;
      let saldo2 = 0;
      if (inicial + flujos < 0) saldo2 = (inicial + flujos) * -1;
      else saldo1 = inicial + flujos;

      return `${periodo[1]}|${codcue[0]}|${codcue[1]}|${codcue[2]}|${ld_b1.toFixed(2)}|${ld_b2.toFixed(2)}|${ld_b3.toFixed(2)}|${ld_b4.toFixed(2)}|${ld_b5.toFixed(2)}|${ld_b6.toFixed(2)}|${saldo1.toFixed(2)}|${saldo2.toFixed(2)}`;
    });

    return formattedData.join('\n');
  }

  headerBalanceCompro(datos: any[], hoja: any): void {
    hoja.autoFilter = 'A1:V1';
    hoja.columns = [
      { header: '', key: 'periodo' },
      { header: '', key: 'cod1' },
      { header: '', key: 'cod2' },
      { header: '', key: 'cod3' },
      { header: '', key: 'ld_b1' },
      { header: '', key: 'ld_b2' },
      { header: '', key: 'ld_b3' },
      { header: '', key: 'ld_b4' },
      { header: '', key: 'ld_b5' },
      { header: '', key: 'ld_b6' },
      { header: '', key: 'saldo' },
      { header: '', key: 'saldo2' },
    ];

    datos.forEach((item: any) => {
      const periodo = item.idasiento.fecha.split('-');
      const codcue = item.codcue.split('.');

      let ld_b1 = 0;
      let ld_b2 = 0;
      const ld_b3 = item.ld_b3;
      const ld_b4 = item.ld_b4;

      if (codcue.length === 2) codcue[2] = '00';

      if (item.ld_b < 0) ld_b2 = item.ld_b * -1;
      else ld_b1 = item.ld_b;

      const ld_b5 = ld_b1 + ld_b3;
      const ld_b6 = ld_b2 + ld_b4;

      const inicial = ld_b1 - ld_b2;
      const flujos = ld_b3 - ld_b4;

      let saldo1 = 0;
      let saldo2 = 0;
      if (inicial + flujos < 0) saldo2 = (inicial + flujos) * -1;
      else saldo1 = inicial + flujos;

      hoja.addRow({
        periodo: periodo[1],
        cod1: codcue[0],
        cod2: codcue[1],
        cod3: codcue[2],
        ld_b1,
        ld_b2,
        ld_b3,
        ld_b4,
        ld_b5,
        ld_b6,
        saldo: saldo1.toFixed(2),
        saldo2: saldo2.toFixed(2),
      });
    });
  }

  public async getCuentasBySigef(sigef: boolean) {
    return await firstValueFrom(this.s_cuentas.getBySigef(sigef));
  }

  public async getBalanceCompro(periodo: any, codcue: string) {
    return await firstValueFrom(this.s_transaci.getByAsientoFec(periodo, codcue));
  }

  getIniciales() {
    return new Promise((resolve: any) => {
      this.getCuentasBySigef(true).then((cuentas: any) => {
        const balance: any[] = [];

        cuentas.forEach((item: any) => {
          this.getBalanceCompro(this.formSinafip.value.periodo, item.codcue)
            .then((transacciones: any) => {
              if (transacciones.length !== 0) {
                let ld_b = 0;
                let ld_b3 = 0;
                let ld_b4 = 0;

                transacciones.forEach((t: any) => {
                  t.codcue = item.codcue;

                  if (t.idasiento.asiento === 1 && t.debcre === 1) ld_b += t.valor;
                  else if (t.idasiento.asiento === 1 && t.debcre === 2) ld_b -= t.valor;

                  if (t.idasiento.asiento !== 1 && t.debcre === 1) ld_b3 += t.valor;
                  else if (t.idasiento.asiento !== 1 && t.debcre === 2) ld_b4 += t.valor;
                });

                transacciones[0].ld_b = ld_b;
                transacciones[0].ld_b3 = ld_b3;
                transacciones[0].ld_b4 = ld_b4;
                balance.push(transacciones[0]);
              }
            });
        });

        setTimeout(() => resolve(balance), 1000);
      });
    });
  }

  // ==========================
  // TRANSACCIONES RECIPROCAS
  // ==========================
  actAssign(e: any) {
    if (e.target.checked === true) this.asignar = false;
  }

  desAssign(e: any) {
    if (e.target.checked === true) this.asignar = true;
  }
}
