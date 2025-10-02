import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Workbook } from 'exceljs';
// import { FileSaverService } from 'ngx-filesaver';
import { ColoresService } from 'src/app/compartida/colores.service';
import { PresupueService } from 'src/app/servicios/contabilidad/presupue.service';
// import * as fd from 'file-saver';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';
import { rejects } from 'assert';
// import { Presupue } from 'src/app/modelos/contabilidad/presupue';
import { resolve } from 'dns';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucio.service';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';


@Component({
   selector: 'app-sinafip',
   templateUrl: './sinafip.component.html',
   styleUrls: ['./sinafip.component.css'],
})

export class SinafipComponent implements OnInit {

   formSinafip: FormGroup;
   dataToExport: any;
   _workbook: Workbook = new Workbook();
   presupuestos: any;
   _ejecuciones: any = [];
   pruebavalor: any;
   asignar: boolean = true;
   sw1: boolean = false;

   constructor(
      private fb: FormBuilder,
      private coloresService: ColoresService,
      private s_presupue: PresupueService,
      private s_transaci: TransaciService,
      private s_ejecucion: EjecucionService,
      // private fs: FileSaverService,
      private s_cuentas: CuentasService
   ) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/sinafip');
      let coloresJSON = sessionStorage.getItem('/sinafip');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      this.formSinafip = this.fb.group({
         archivo: 'option1',
         nombre: ['', [Validators.required, Validators.minLength(3)]],
         tipo: 'opt1',
         periodo: 1,
      });
      /*this.getCuentasBySigef(true).then((value: any) => {
               console.log(value);
        value.forEach((item: any) => {
          console.log(item);
        }); 
      }); */
   }

   async buscaColor() {
      try {
         const datos = await this.coloresService.setcolor(1, 'sinafip');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/sinafip', coloresJSON);
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

   get f() { return this.formSinafip.controls; }

   generar() {
      this.sw1 = true;
      console.log('this.formSinafip.value.archivo: ', this.formSinafip.value.archivo, this.formSinafip.value.tipo)
      switch (this.formSinafip.value.archivo) {
         case 'option1':
            switch (this.formSinafip.value.tipo) {
               case 'opt1':
                  console.log('Pasa por 1')
                  this.aperturaInicial.then((values) => {
                     console.log('Pasa por 2')
                     let content = this.formatAperturaInicial(values);
                     this.generarTxt([content], this.formSinafip.value.nombre);
                  });
                  break;
               case 'opt2':
                  this.aperturaInicial.then((value: any) => {
                     this.generarHojaElectronica(value, this.headerAperturaInicial);
                  });
                  break;
               default:
                  break;
            }
            break;
         case 'option2':
            console.log('detalle apertura inicial');
            switch (this.formSinafip.value.tipo) {
               case 'opt1':
                  this.getDetalleApertura.then((values) => {
                     let content = this.formatDetalleApertura(values);
                     this.generarTxt([content], this.formSinafip.value.nombre);
                  });
                  break;
               case 'opt2':
                  this.getDetalleApertura.then((value: any) => {
                     this.generarHojaElectronica(value, this.headerDetalleApertura);
                  });

                  break;
               default:
                  break;
            }
            break;
         case 'option3':
            console.log('balance de comprobación');
            switch (this.formSinafip.value.tipo) {
               case 'opt1':
                  this.getIniciales().then((values) => {
                     let content = this.formatBalanceCompro(values);
                     this.generarTxt([content], this.formSinafip.value.nombre);
                  });

                  break;
               case 'opt2':
                  this.getIniciales().then((values) => {
                     this.generarHojaElectronica(values, this.headerBalanceCompro);
                  });
                  break;
               default:
                  break;
            }
            break;
         case 'option4':
            console.log('transacciones recíprocas ');
            break;
         case 'option5':
            switch (this.formSinafip.value.tipo) {
               case 'opt1':
                  this.getPrespuestos.then((values) => {
                     let content = this.formatPresuInicial(values);
                     this.generarTxt([content], this.formSinafip.value.nombre);
                  });
                  break;
               case 'opt2':
                  this.getPrespuestos.then((value: any) => {
                     this.generarHojaElectronica(value, this.headerPresupue);
                  });

                  break;
               default:
                  break;
            }
            break;
         case 'option6':
            let periodo = this.formSinafip.value.periodo;
            if (periodo > 0 && periodo <= 12) {
               switch (this.formSinafip.value.tipo) {
                  case 'opt1':
                     this.getaddingData().then((value: any) => {
                        let content = this.formatCedInGa(value);
                        this.generarTxt([content], this.formSinafip.value.nombre);
                     });
                     break;
                  case 'opt2':
                     this.getaddingData().then((value: any) => {
                        this.generarHojaElectronica(value, this.headerCedInGa);
                     });
                     break;
                  default:
                     break;
               }
            } else {
               console.log('ERROR EN EL PERIODO');
            }

            break;
         default:
            break;
      }
   }
   generarTxt(datas: any, name: string) {
      let fileName = `${name}.txt`;
      // let fileType = this.fs.genType(fileName);
      // let txtBlob = new Blob([datas], { type: fileType });
      // this.fs.save(txtBlob, fileName);
   }

   generarHojaElectronica(
      presupue: any,
      headers: (presu: any, workbook: any) => any
   ) {
      this._workbook = new Workbook();
      this._workbook.creator = 'EpMapaT-User';
      this._workbook.created = new Date();
      this._workbook.modified = new Date();
      let hoja = this._workbook.addWorksheet('Hoja1');
      headers(presupue, hoja);
      // this._workbook.xlsx.writeBuffer().then((datos) => {
      //    const blob = new Blob([datos]);
      //    fd.saveAs(blob, `${this.formSinafip.value.nombre}.xlsx`);
      // });
   }

   /* PRESUPUESTO INICIAL */
   formatPresuInicial(data: any[]): string {
      const formattedData = data.map((item) => {
         let tp = '';
         let cp = item.codigo.split('.');
         if (item.tippar === 1) {
            tp = 'I';
            return `01|${tp}|${cp[0]}|${cp[1]}|${cp[2]}|${item.inicia.toFixed(2)}`;
         } else if (item.tippar === 2) {
            tp = 'G';
            return `01|${tp}|${cp[0]}|${cp[1]}|${cp[2]
               }|000|99999999|${item.inicia.toFixed(2)}`;
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
         if (pres.tippar === 1) {
            pres.tippar = 'I';
         } else {
            pres.tippar = 'G';
         }
         let codigo = pres.codigo.split('.');
         let datas = {
            indice: '01',
            tippar: pres.tippar,
            cod1: codigo[0],
            cod2: codigo[1],
            cod3: codigo[2],
            inicia: pres.inicia.toFixed(2),
         };

         hoja.addRow(datas);
      });
   }

   getPrespuestos: Promise<any> = new Promise((resolve, reject) => {
      this.s_presupue.getAllPresupue().subscribe({
         next: (datos: any) => {
            let lista: any = [];
            datos.forEach((item: any, index: any) => {
               item.codigo = item.codigo.slice(0, 8);
               let query = lista.find(
                  (element: any) => element.codigo === item.codigo
               );
               if (!query) {
                  lista.push(item);
               }
               if (query) {
                  let io = lista.indexOf(query);
                  lista[io].inicia += item.inicia;
               }
            });
            //console.log(lista);
            resolve(lista);
         },
         error: (e) => console.error(e),
      });
   });

   /* APERTURA INICIAL */
   formatAperturaInicial(data: any[]): string {
      const formattedData = data.map((item) => {
         return `${item.col1}|${item.col2}|${item.col3}|${item.col4
            }|${item.col5.toFixed(2)}|${item.col6.toFixed(2)}`;
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
      let i = 0;
      presupue.forEach(() => {
         hoja.addRow(presupue[i]);
         i++;
      });
   }

   getTransaciByTipAsi: Promise<any> = new Promise((resolve, reject) => {
      if (this.sw1) {
         this.s_transaci.getByTipAsi(1).subscribe({
            next: (datos) => {
               resolve(datos);
               console.log('datos: ', datos)
            },
            error: (e) => console.error(e),
         });
      }
   });

   aperturaInicial: Promise<any> = new Promise((resolve, rejects) => {
      console.log('En aperturaInicial this.sw1 = ', this.sw1);
      if (this.sw1) {
         console.log('Esta en aperturaInicial this.sw1');
         let initialValues: any[] = [];
         console.log('Llama a getTransaciByTipAsi');

         this.getTransaciByTipAsi.then((values) => {

            let lcodcue: any = [];
            console.log('values: ', values)
            values.forEach((value: any) => {
               let spltxt = value.codcue.split('.', 2);
               let addtxt = `${spltxt[0]}.${spltxt[1]}`;
               let query = lcodcue.find((element: any) => element === addtxt);
               if (query === undefined) {
                  lcodcue.push(addtxt);
               }
            });
            lcodcue.forEach((value: any) => {
               let apInicial: any = {
                  col1: '01',
                  col2: '',
                  col3: '',
                  col4: '',
                  col5: '',
                  col6: '',
               };
               this.s_transaci.getAperIni(value).subscribe({
                  next: (datos: any) => {
                     let spl = datos[0].codcue.split('.');
                     apInicial.col2 = spl[0];
                     apInicial.col3 = spl[1];
                     if (spl[2] === undefined) {
                        spl[2] = '00';
                     }
                     apInicial.col4 = spl[2];
                     let deb: number = 0;
                     let cre: number = 0;
                     datos.forEach((dato: any) => {
                        if (dato.debcre === 1) {
                           deb += dato.valor;
                        } else {
                           cre += dato.valor;
                        }
                     });
                     apInicial.col5 = deb;
                     apInicial.col6 = cre;
                     initialValues.push(apInicial);
                  },
                  error: (e) => console.error(e),
               });
            });
            resolve(initialValues);
         });
      }
   });

   /* DETALLE APERTURA INICIAL */
   formatDetalleApertura(data: any[]): string {
      console.log(data);
      const formattedData = data.map((item) => {
         console.log(item);
         let deb = 0;
         let cre = 0;
         let codcue = item.codcue.split('.');
         let ruc = '9999999999999';
         if (item.debcre === 1) {
            deb = item.valor;
         }
         if (item.debcre === 2) {
            cre = item.valor;
         }
         if (item.idbene.rucben != '') {
            ruc = item.idbene.rucben;
         }
         return `01|${codcue[0]}|${codcue[1]}|${codcue[2]}|${ruc}|${item.idbene.nomben
            }|${deb.toFixed(2)}|${cre.toFixed(2)}`;
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
         let codigo = transa.codcue.split('.');
         let deb = 0;
         let cre = 0;
         let ruc = '9999999999999';
         if (transa.debcre === 1) {
            deb = transa.valor;
         }
         if (transa.debcre === 2) {
            cre = transa.valor;
         }
         if (transa.idbene.rucben != '') {
            ruc = transa.idbene.rucben;
         }
         let datas = {
            indice: '01',
            cod1: codigo[0],
            cod2: codigo[1],
            cod3: codigo[2],
            ruc: ruc,
            nombre: transa.idbene.nomben,
            deb: deb.toFixed(2),
            cre: cre.toFixed(2),
         };

         hoja.addRow(datas);
      });
   }

   getDetalleApertura: Promise<any> = new Promise((resolve, rejects) => {
      // this.s_transaci.getDetalleAperturas().subscribe({
      //    next: (datos: any) => {
      //       let detallesApertura: any = [];
      //       datos.forEach((dato: any) => {
      //          let codcue = dato.codcue.split('.', 3);
      //          dato.codcue = `${codcue[0]}.${codcue[1]}.${codcue[2]}`;
      //          let query = detallesApertura.find(
      //             (element: { codcue: any }) => element.codcue === dato.codcue
      //          );
      //          if (!query) {
      //             detallesApertura.push(dato);
      //          }
      //          if (query) {
      //             let io = detallesApertura.indexOf(query);
      //             detallesApertura[io].valor += dato.valor;
      //          }
      //       });
      //       resolve(detallesApertura);
      //    },
      //    error: (e) => console.error(e),
      // });
   });

   /* CÉDULA DE INGRESOS Y GASTOS */
   formatCedInGa(data: any): string {
      let periodo: string = '';

      const formattedData = data.map((item: any) => {
         let spl = item.idejecucion.fecha_eje.split('-');
         periodo = spl[1];
         let tp = '';
         let cp = item.codigo.split('.');
         let codificado = item.inicia + item.idejecucion.modifi;
         let saldo = codificado - item.idejecucion.devengado;
         let saldo2 = codificado - item.idejecucion.prmiso;
         if (item.tippar === 1) {
            tp = 'I';
            return `${periodo}|${tp}|${cp[0]}|${cp[1]}|${cp[2]
               }|${item.inicia.toFixed(2)}|${item.idejecucion.modifi.toFixed(
                  2
               )}|${codificado.toFixed(2)}|${item.idejecucion.devengado.toFixed(
                  2
               )}|${item.idejecucion.cobpagado.toFixed(2)}|${saldo.toFixed(2)}`;
         } else if (item.tippar === 2) {
            tp = 'G';
            return `${periodo}|${tp}|${cp[0]}|${cp[1]}|${cp[2]
               }|000|99999999|${item.inicia.toFixed(
                  2
               )}|${item.idejecucion.modifi.toFixed(2)}|${codificado.toFixed(
                  2
               )}|${item.idejecucion.prmiso.toFixed(
                  2
               )}|${item.idejecucion.devengado.toFixed(
                  2
               )}|${item.idejecucion.cobpagado.toFixed(2)}|${saldo2.toFixed(
                  2
               )}|${saldo.toFixed(2)}`;
         } else {
            return 'error';
         }
      });
      return formattedData.join('\n');
   }

   headerCedInGa(datos: any, hoja: any): void {
      hoja.autoFilter = 'A1:V1';
      let periodo: string = '';

      hoja.columns = [
         { header: '', key: 'periodo' },
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
      datos.map((item: any) => {
         let spl = item.idejecucion.fecha_eje.split('-');
         periodo = spl[1];
         let tp = '';
         let cp = item.codigo.split('.');
         let codificado = item.inicia + item.idejecucion.modifi;
         let saldo = codificado - item.idejecucion.devengado;
         let saldo2 = codificado - item.idejecucion.prmiso;
         if (item.tippar === 1) {
            tp = 'I';
            let datas = {
               periodo: periodo,
               tp: tp,
               cod1: cp[0],
               cod2: cp[1],
               cod3: cp[2],
               inicia: item.inicia.toFixed(2),
               modifi: item.idejecucion.modifi.toFixed(2),
               codificado: codificado.toFixed(2),
               devengado: item.idejecucion.devengado.toFixed(2),
               cobpagado: item.idejecucion.cobpagado.toFixed(2),
               saldo: saldo.toFixed(2),
            };
            hoja.addRow(datas);
         }
         if (item.tippar === 2) {
            tp = 'G';
            let datas = {
               periodo: periodo,
               tp: tp,
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
            };
            hoja.addRow(datas);
         }
      });
   }

   getEjecuciones(codpart: any, periodo: any) {
      return new Promise((resolve, reject) => {
         this.s_ejecucion.getByCodPar(codpart, periodo).subscribe({
            next: (datos: any) => {
               let ejecuciones: any = [];
               if (datos.length != 0) {
                  datos.forEach((item: any) => {
                     let spl = item.codpar.split('.');
                     let cod = '';
                     if (item.idpresupue.tippar === 1) {
                        cod = spl.slice(0, 3);
                        item.codpar = `${cod[0]}.${cod[1]}.${cod[2]}`;
                     }

                     if (item.idpresupue.tippar === 2) {
                        cod = spl.slice(1, 4);
                        item.codpar = `${cod[0]}.${cod[1]}.${cod[2]}`;
                     }
                     let f_ejecucion = ejecuciones.find(
                        (ejecucion: { codpar: any }) => ejecucion.codpar === item.codpar
                     );

                     if (!f_ejecucion) {
                        ejecuciones.push(item);
                     }
                     if (f_ejecucion) {
                        let io = ejecuciones.indexOf(f_ejecucion);
                        ejecuciones[io].modifi += item.modifi;
                        ejecuciones[io].prmiso += item.prmiso;
                        ejecuciones[io].devengado += item.devengado;
                        ejecuciones[io].cobpagado += item.cobpagado;
                     }
                  });
               }
               if (ejecuciones.length != 0) {
                  resolve(ejecuciones[0]);
               }
            },
            error: (e) => console.error(e),
         });
      });
   }

   getaddingData() {
      return new Promise((resolve, rejects) => {
         this.getPrespuestos.then((presupuestos: any) => {
            let periodo = this.formSinafip.value.periodo;
            this.presupuestos = presupuestos;
            let ejec = presupuestos.map((item: any, index: any) => {
               this.getEjecuciones(item.codigo, periodo).then(
                  (_ejecuciones: any) => {
                     let f_ejecucion = this.presupuestos.find(
                        (ejecucion: { codigo: any }) =>
                           ejecucion.codigo === _ejecuciones.codpar
                     );
                     let news = {
                        ...f_ejecucion,
                        idejecucion: _ejecuciones,
                     };
                     this._ejecuciones.push(news);
                  }
               );
            });
            setTimeout(() => {
               resolve(this._ejecuciones);
            }, 500);
         });
      });
   }

   /* BALANCE DE COMPROBACION */
   formatBalanceCompro(data: any): string {
      const formattedData = data.map((item: any) => {
         let periodo = item.idasiento.fecha.split('-');
         let codcue = item.codcue.split('.');
         let ld_b1 = 0;
         let ld_b2 = 0;
         let ld_b3 = item.ld_b3;
         let ld_b4 = item.ld_b4;
         if (codcue.length === 2) {
            codcue[2] = '00';
         }
         if (item.ld_b < 0) {
            ld_b2 = item.ld_b * -1;
         } else {
            ld_b1 = item.ld_b;
         }
         let ld_b5 = ld_b1 + ld_b3;
         let ld_b6 = ld_b2 + ld_b4;
         let inicial = ld_b1 - ld_b2;
         let flujos = ld_b3 - ld_b4;
         let saldo1 = 0;
         let saldo2 = 0;
         if (inicial + flujos < 0) {
            saldo2 = (inicial + flujos) * -1;
         } else {
            saldo1 = inicial + flujos;
         }

         return `${periodo[1]}|${codcue[0]}|${codcue[1]}|${codcue[2]
            }|${ld_b1.toFixed(2)}|${ld_b2.toFixed(2)}|${ld_b3.toFixed(
               2
            )}|${ld_b4.toFixed(2)}|${ld_b5.toFixed(2)}|${ld_b6.toFixed(
               2
            )}|${saldo1.toFixed(2)}|${saldo2.toFixed(2)}`;
      });
      return formattedData.join('\n');
   }

   headerBalanceCompro(datos: any, hoja: any): void {
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
      datos.map((item: any) => {
         let periodo = item.idasiento.fecha.split('-');
         let codcue = item.codcue.split('.');
         let ld_b1 = 0;
         let ld_b2 = 0;
         let ld_b3 = item.ld_b3;
         let ld_b4 = item.ld_b4;
         if (codcue.length === 2) {
            codcue[2] = '00';
         }
         if (item.ld_b < 0) {
            ld_b2 = item.ld_b * -1;
         } else {
            ld_b1 = item.ld_b;
         }
         let ld_b5 = ld_b1 + ld_b3;
         let ld_b6 = ld_b2 + ld_b4;
         let inicial = ld_b1 - ld_b2;
         let flujos = ld_b3 - ld_b4;
         let saldo1 = 0;
         let saldo2 = 0;
         if (inicial + flujos < 0) {
            saldo2 = (inicial + flujos) * -1;
         } else {
            saldo1 = inicial + flujos;
         }

         let datas = {
            periodo: periodo[1],
            cod1: codcue[0],
            cod2: codcue[1],
            cod3: codcue[2],
            ld_b1: ld_b1,
            ld_b2: ld_b2,
            ld_b3: ld_b3,
            ld_b4: ld_b4,
            ld_b5: ld_b5,
            ld_b6: ld_b6,
            saldo: saldo1.toFixed(2),
            saldo2: saldo2.toFixed(2),
         };
         hoja.addRow(datas);
      });
   }

   public async getCuentasBySigef(sigef: boolean) {
      return new Promise((resolve, reject) => {
         this.s_cuentas.getBySigef(sigef).subscribe({
            next: (datos: any) => {
               resolve(datos);
            },
            error: (e) => console.error(e),
         });
      });
   }

   public async getBalanceCompro(periodo: any, codcue: string) {
      return new Promise((resolve, reject) => {
         this.s_transaci.getByAsientoFec(periodo, codcue).subscribe({
            next: (datos) => {
               resolve(datos);
            },
            error: (e) => console.error(e),
         });
      });
   }

   getIniciales() {
      return new Promise((resolve: any, reject: any) => {
         this.getCuentasBySigef(true).then((cuentas: any) => {
            let balance: any = [];
            //console.log(cuentas);
            cuentas.forEach((item: any) => {
               //console.log(item);
               this.getBalanceCompro(
                  this.formSinafip.value.periodo,
                  item.codcue
               ).then((transacciones: any) => {
                  if (transacciones.length != 0) {
                     let n_valor = 0;
                     let ld_b = 0;
                     let ld_b3 = 0;
                     let ld_b4 = 0;
                     //console.log(transacciones);
                     transacciones.forEach((transaccion: any) => {
                        transaccion.codcue = item.codcue;
                        /* if (transaccion.debcre === 1) {
                          n_valor += transaccion.valor;
                        } else if (transaccion.debcre === 2) {
                          n_valor -= transaccion.valor;
                        } else {
                        } */
                        if (
                           transaccion.idasiento.asiento === 1 &&
                           transaccion.debcre === 1
                        ) {
                           ld_b += transaccion.valor;
                        } else if (
                           transaccion.idasiento.asiento === 1 &&
                           transaccion.debcre === 2
                        ) {
                           ld_b -= transaccion.valor;
                        }
                        if (
                           transaccion.idasiento.asiento != 1 &&
                           transaccion.debcre === 1
                        ) {
                           ld_b3 += transaccion.valor;
                        } else if (
                           transaccion.idasiento.asiento != 1 &&
                           transaccion.debcre === 2
                        ) {
                           ld_b4 += transaccion.valor;
                        }
                     });
                     transacciones[0].valor = n_valor;
                     transacciones[0].ld_b = ld_b;
                     transacciones[0].ld_b3 = ld_b3;
                     transacciones[0].ld_b4 = ld_b4;
                     balance.push(transacciones[0]);
                  }
               });
            });
            setTimeout(() => {
               resolve(balance);
            }, 1000);
         });
      });
   }

   /*TRANSACCIONES RECIPROCAS  */
   actAssign(e: any) {
      if (e.target.checked === true) {
         this.asignar = false;
      }
   }

   desAssign(e: any) {
      if (e.target.checked === true) {
         this.asignar = true;
      }
   }

}
