import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { Asientos } from 'src/app/modelos/contabilidad/asientos.model';
import { Beneficiarios } from 'src/app/modelos/contabilidad/beneficiarios.model';
import { Retenciones } from 'src/app/modelos/contabilidad/retenciones.model';
import { Tabla01 } from 'src/app/modelos/contabilidad/tabla01.model';
import { Tabla10 } from 'src/app/modelos/contabilidad/tabla10.model';
import { Tabla15 } from 'src/app/modelos/contabilidad/tabla15.model';
import { Tabla17 } from 'src/app/modelos/contabilidad/tabla17.model';
import { Tabla5_concep } from 'src/app/modelos/contabilidad/tabla5_concep.model';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { AirxreteService } from 'src/app/servicios/contabilidad/airxrete.service';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import { BeneficiariosService } from 'src/app/servicios/contabilidad/beneficiarios.service';
import { RetencionesService } from 'src/app/servicios/contabilidad/retenciones.service';
import { Tabla01Service } from 'src/app/servicios/contabilidad/tabla01.service';
import { Tabla10Service } from 'src/app/servicios/contabilidad/tabla10.service';
import { Tabla15Service } from 'src/app/servicios/contabilidad/tabla15.service';
import { Tabla17Service } from 'src/app/servicios/contabilidad/tabla17.service';
import { Tabla5_concepService } from 'src/app/servicios/contabilidad/tabla5_concep.service';

@Component({
   selector: 'app-add-retencion',
   templateUrl: './add-retencion.component.html',
   styleUrls: ['./add-retencion.component.css']
})
export class AddRetencionComponent implements OnInit {

   formRetencion: FormGroup;
   idasiento: number; //Id del Asiento que se registra la retención
   iAsiento = {} as interfaceAsiento; //Interface para los datos del Asiento
   date: Date = new Date();
   _beneficiarios: any[] = [];
   idbene: number | null;
   _documentos: any;
   _asientos: any;
   _tabla01: any; //Sustento tributario
   _tabla17: any; //Porcentaje IVA
   _tabla15: any; //Forma de pago
   _tabla5c_bie: any;   //Conceptos retencion IVA Bienes
   _tabla5c_ser: any;   //Conceptos retencion IVA Servicios
   _tabla5c_100: any;   //Conceptos retencion IVA 100%
   _tabla10: any;
   _autorizaxbene: any;

   asiento: Asientos = new Asientos();
   beneficiario: Beneficiarios = new Beneficiarios;
   documento: Documentos = new Documentos;
   tabla01: Tabla01 = new Tabla01();
   tabla17: Tabla17 = new Tabla17();
   tabla15: Tabla15 = new Tabla15();
   tabla10: Tabla10 = new Tabla10();

   constructor(private router: Router, private fb: FormBuilder, private asiService: AsientosService, private beneService: BeneficiariosService,
      private coloresService: ColoresService, private reteService: RetencionesService, private docuService: DocumentosService,
      private tabla01Service: Tabla01Service, private tabla10Service: Tabla10Service,
      private tabla15Service: Tabla15Service, private tabla5cService: Tabla5_concepService, private tabla17Service: Tabla17Service,
      public authService: AutorizaService, private airxreteService: AirxreteService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/retenciones');
      let coloresJSON = sessionStorage.getItem('/retenciones');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      this.idasiento = +sessionStorage.getItem("idasientoToRete")!;
      this.datosAsiento();

      this.listarTabla01();
      this.listarDocumentos();
      this.listarTabla17();
      this.listarTabla15();
      this.listarTabla5c_bie();
      this.listarTabla5c_ser();
      this.listarTabla5c_100();
      this.listarTabla10();

      let tabla5c: Tabla5_concep = new Tabla5_concep();

      this.formRetencion = this.fb.group({
         idrete: [],
         fecharegistro: '',
         idbene: ['', [Validators.required], [this.valBenefi.bind(this)]],
         idtabla01: this.tabla01,
         intdoc: this.documento,
         numdoc: ['', Validators.required],
         fechaemision: this.iAsiento.fecha,
         numserie: ['', [Validators.required, Validators.minLength(6)]],
         autorizacion: ['', [Validators.required, Validators.minLength(49)]],
         idtabla15: this.tabla15,
         baseimponible: [0, Validators.required],
         idtabla17: this.tabla17,
         baseimpgrav: [0, Validators.required],
         basenograiva: [0, Validators.required],
         porciva: 0,
         baseimpice: 0,
         montoiva: 0,
         porcentajeice: 0,
         montoice: 0,
         montoivabienes: 0,
         codretbienes: '',
         porretbienes: '',
         valorretbienes: 0,
         montoivaservicios: 0,
         codretservicios: '',
         porretservicios: '',
         valorretservicios: 0,
         montoivaserv100: 0,
         codretserv100: '',
         porretserv100: '',
         valretserv100: 0,
         secretencion1: ['', Validators.required, this.valSecretencion1.bind(this)],
         fechaemiret1: this.iAsiento.fecha,
         baseimpair: 0,
         codretair: [''],
         porcentajeair: 0,
         valretair: 0,
         numautoriza: [],
         sumbaseiva: 0,
         sumreteiva: 0,
         idtabla5c_bie: tabla5c,
         idtabla5c_ser: tabla5c,
         idtabla5c_100: tabla5c,
         fechacaduca: [],
         descripcion: [],
         idasiento: this.asiento,
         claveacceso: [],
         numautoriza_e: [],
         fecautoriza: [],
         estado: 0,
         ambiente: [],
         swelectro: false,
         concepto: [],
         porcretair: 0,
         usucrea: this.authService.idusuario,
         feccrea: this.date,
         usumodi: '',
         fecmodi: '',
         air: this.fb.array([])
      },
         { updateOn: "blur" });

      this.ultimo();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   async buscaColor() {
      try {
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'retenciones');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/retenciones', coloresJSON);
         this.colocaColor(datos);
      } catch (error) {
         console.error(error);
      }
   }

   get f() { return this.formRetencion.controls; }

   regresar() { this.router.navigate(['/asientos']); }

   //Impuesto a la renta
   get air(): FormArray {
      return this.formRetencion.get('air') as FormArray;
   }
   get airControls(): AbstractControl[] {
      return (this.formRetencion.get('air') as FormArray).controls;
   }

   agregarAir() { this.air.push(this.nuevoAir()); }

   nuevoAir(): FormGroup {
      return this.fb.group({
         codretair: ['', Validators.required],
         idtabla10: this.tabla10,
         baseimpair: [0, Validators.required],
         porcretair: '',
         valretair: 0
      });
   }

   eliminarAir(index: number) { this.air.removeAt(index); }

   datosAsiento() {
      this.asiService.unAsiento(this.idasiento).subscribe({
         next: datos => {
            this.asiento = datos;
            this.iAsiento.asiento = datos.asiento;
            this.iAsiento.fecha = datos.fecha;
            this.iAsiento.comprobante = codcomprobante(datos.tipcom) + datos.compro.toString();
            this.iAsiento.beneficiario = datos.idbene.nomben;
            if (datos.intdoc.intdoc == 1) this.iAsiento.documento = datos.numdoc;
            else this.iAsiento.documento = datos.intdoc.nomdoc + ' ' + datos.numdoc;
            this.iAsiento.glosa = datos.glosa;
            this.formRetencion.get('idtabla15')?.disable();

            this.formRetencion.patchValue({
               fecharegistro: datos.fecha,
               fechaemision: this.iAsiento.fecha,
               fechaemiret1: this.iAsiento.fecha
            });
         },
         error: err => console.error(err.error)
      });
   }

   benefixNombre(e: any) {
      if (e.target.value != '') {
         this.beneService.findByNomben(e.target.value).subscribe({
            next: datos => this._beneficiarios = datos,
            error: err => console.error(err.error),
         });
      }
   }
   onBeneficiarioSelected(e: any) {
      const selectedOption = this._beneficiarios.find((x: { nomben: any; }) => x.nomben === e.target.value);
      if (selectedOption) this.idbene = selectedOption.idbene;
      else this.idbene = null;
   }

   //Sustento tributario
   listarTabla01() {
      this.tabla01Service.getListaTabla01().subscribe({
         next: datos => {
            this._tabla01 = datos;
            const defaTabla01 = datos.find(registro => registro.codsustento == '01');
            this.f['idtabla01'].setValue(defaTabla01!.idtabla01);
         },
         error: err => console.error(err.error)
      });
   }

   listarDocumentos() {
      this.docuService.getListaDocumentos().subscribe({
         next: datos => {
            this._documentos = datos;
            const defaDocumento = datos.find(registro => registro.tipdoc == 5);  //tipdoc 5=Factura
            this.f['intdoc'].setValue(defaDocumento!.intdoc)
         },
         error: err => console.error(err.error)
      });
   }

   //Porcentaje IVA
   listarTabla17() {
      this.tabla17Service.getTabla17().subscribe({
         next: datos => {
            this._tabla17 = datos;
            const defaTabla17 = datos.find(registro => registro.codigo == 4);   //codigo 4 = 15%
            this.f['idtabla17'].setValue(defaTabla17!.idtabla17);
         },
         error: err => console.error(err.error)
      });
   }

   //Forma de pago   
   listarTabla15() {
      this.tabla15Service.getListaTabla15().subscribe({
         next: datos => this._tabla15 = datos,
         error: err => console.error(err.error)
      });
   }

   listarTabla5c_bie() {
      this.tabla5cService.getTabla5c_bie().subscribe({
         next: datos => this._tabla5c_bie = datos,
         error: err => console.error(err.error)
      });
   }
   listarTabla5c_ser() {
      this.tabla5cService.getTabla5c_ser().subscribe({
         next: datos => this._tabla5c_ser = datos,
         error: err => console.error(err.error)
      });
   }
   listarTabla5c_100() {
      this.tabla5cService.getTabla5c_100().subscribe({
         next: datos => this._tabla5c_100 = datos,
         error: err => console.error(err.error)
      });
   }
   listarTabla10() {
      this.tabla10Service.getListaTabla10().subscribe({
         next: resp => this._tabla10 = resp,
         error: err => console.error(err.error)
      });
   }

   ultimo() {
      this.reteService.ultimo().subscribe({
         next: resp => {
            const secretencion1 = +resp.secretencion1 + 1;
            this.f['secretencion1'].setValue(secretencion1);
         },
         error: err => console.error(err.error),
      });
   }

   calcMontoIVA() {
      //Habilita/deshabilita forma de pago
      let total = +this.formRetencion.value.baseimpgrav + +this.formRetencion.value.baseimponible + +this.formRetencion.value.basenograiva
      if (total >= 1000) {
         this.formRetencion.get('idtabla15')?.enable();
         const defaTabla15 = this._tabla15.find((registro: { codtabla15: string; }) => registro.codtabla15 == '01');   //codtabla15 01 = SIN UTILIZACION DEL SISTEMA FINANCIERO
         this.f['idtabla15'].setValue(defaTabla15!.idtabla15);
      } else {
         this.formRetencion.get('idtabla15')?.disable();
         this.f['idtabla15'].setValue(null);
      };

      //Busca el porciva seleccionado para calcular el monto del IVA
      const tabla17 = this._tabla17.find((registro: { idtabla17: any; }) => registro.idtabla17 == this.formRetencion.value.idtabla17);
      let montoiva = Math.round((this.formRetencion.value.baseimpgrav * tabla17.porciva) * 100) / 100;
      this.f['montoiva'].setValue(montoiva);
   }

   onIdtabla17Change(event: any) {
      const selectedId = event.target.value;
      //this.f['idtabla17'].setValue(idtabla17);  //Para que se actualice y poder recalcular el Monto del IVA
      const parts = selectedId.split(':');
      const indice = parseInt(parts[0], 10)
      if (indice >= 0) {
         const baseimpgrav = this.formRetencion.value.baseimpgrav;
         // if (baseimpgrav > 0) {
         const tabla17 = this._tabla17[indice];
         let montoiva = Math.round((this.formRetencion.value.baseimpgrav * tabla17.porciva) * 100) / 100;
         this.f['montoiva'].setValue(montoiva);
         // }
      }
   }

   // === Click de los Botones de Valores Base ===
   bienes() {
      this.f['montoivabienes'].setValue(this.formRetencion.value.montoiva);
      //Reinicializa servicios y 100%
      this.f['montoivaservicios'].setValue(0);
      this.f['idtabla5c_ser'].setValue('');
      this.f['codretservicios'].setValue('');
      this.f['porretservicios'].setValue('');
      this.f['valorretservicios'].setValue(0);

      this.f['montoivaserv100'].setValue(0);
      this.f['idtabla5c_100'].setValue('');
      this.f['codretserv100'].setValue('');
      this.f['porretserv100'].setValue('');
      this.f['valretserv100'].setValue(0);
      this.sumaValores();
   }
   servicios() {
      this.f['montoivaservicios'].setValue(this.formRetencion.value.montoiva);
      //Reinicializa bienes y 100%
      this.f['montoivabienes'].setValue(0);
      this.f['idtabla5c_bie'].setValue('');
      this.f['codretbienes'].setValue('');
      this.f['porretbienes'].setValue('');
      this.f['valorretbienes'].setValue(0);

      this.f['montoivaserv100'].setValue(0);
      this.f['idtabla5c_100'].setValue('');
      this.f['codretserv100'].setValue('');
      this.f['porretserv100'].setValue('');
      this.f['valretserv100'].setValue(0);
      this.sumaValores();
   }
   cien() {
      this.f['montoivaserv100'].setValue(this.formRetencion.value.montoiva);
      //Reinicializa bienes y servicios
      this.f['montoivabienes'].setValue(0);
      this.f['idtabla5c_bie'].setValue('');
      this.f['idtabla5c_bie'].setValue('');
      this.f['codretbienes'].setValue('');
      this.f['porretbienes'].setValue('');
      this.f['valorretbienes'].setValue(0);

      this.f['montoivaservicios'].setValue(0);
      this.f['idtabla5c_ser'].setValue('');
      this.f['codretservicios'].setValue('');
      this.f['porretservicios'].setValue('');
      this.f['valorretservicios'].setValue(0);
      this.sumaValores();
   }

   // === Digitacion Valores Base ===
   onInputBienes(event: any) {
      const montoivabienes = +event.target.value;
      this.f['montoivabienes'].setValue(montoivabienes);  //Para que se actualice y se pueda sumar
      const idtabla5c_bie = this.formRetencion.value.idtabla5c_bie;
      if (idtabla5c_bie > 0) {
         const tabla5c_bie = this._tabla5c_bie.find((registro: { idtabla5c: number; }) => registro.idtabla5c == idtabla5c_bie);
         const valorretbienes = Math.round((montoivabienes * (tabla5c_bie.idtabla5.porcentaje / 100)) * 100) / 100
         this.f['valorretbienes'].setValue(valorretbienes);
      }
      this.sumaValores();
   }
   onInputServicios(event: any) {
      const montoivaservicios = +event.target.value;
      this.f['montoivaservicios'].setValue(montoivaservicios);  //Para que se actualice y se pueda sumar
      const idtabla5c_ser = this.formRetencion.value.idtabla5c_ser;
      if (idtabla5c_ser > 0) {
         const tabla5c_ser = this._tabla5c_ser.find((registro: { idtabla5c: number; }) => registro.idtabla5c == idtabla5c_ser);
         const valorretservicios = Math.round((montoivaservicios * (tabla5c_ser.idtabla5.porcentaje / 100)) * 100) / 100
         this.f['valorretservicios'].setValue(valorretservicios);
      }
      this.sumaValores();
   }
   onInput100(event: any) {
      const montoivaserv100 = +event.target.value;
      this.f['montoivaserv100'].setValue(montoivaserv100);  //Para que se actualice y se pueda sumar
      const idtabla5c_100 = this.formRetencion.value.idtabla5c_100;
      if (idtabla5c_100 > 0) {
         const tabla5c_100 = this._tabla5c_100.find((registro: { idtabla5c: number; }) => registro.idtabla5c == idtabla5c_100);
         const valretserv100 = Math.round((montoivaserv100 * (tabla5c_100.idtabla5.porcentaje / 100)) * 100) / 100
         this.f['valretserv100'].setValue(valretserv100);
      }
      this.sumaValores();
   }

   // === Selección de Concepto del IVA ===
   onBienesChange(event: any) {
      //Convierte el valor devuelto (Por ejemplo 0: 8) en número (lo anterior a : es el indice y el siguiente es idtabla5c)
      const selectedId = event.target.value;
      const parts = selectedId.split(':');
      const indice = parseInt(parts[0], 10)
      if (indice < 0) {
         console.error('Opción no encontrada');
      } else {
         this.f['codretbienes'].setValue(this._tabla5c_bie[indice].casillero104);
         this.f['porretbienes'].setValue(this._tabla5c_bie[indice].idtabla5.codporcentaje);
         const valorround = Math.round(+this.formRetencion.value.montoivabienes * (+this._tabla5c_bie[indice].idtabla5.porcentaje / 100) * 100) / 100
         this.f['valorretbienes'].setValue(valorround);
         this.sumaValores();
      }
   }
   onServiciosChange(event: any) {
      const selectedId = event.target.value;
      const parts = selectedId.split(':');
      const indice = parseInt(parts[0], 10)
      if (indice < 0) {
         console.error('Opción no encontrada');
      } else {
         this.f['codretservicios'].setValue(this._tabla5c_ser[indice].casillero104);
         this.f['porretservicios'].setValue(this._tabla5c_ser[indice].idtabla5.codporcentaje);
         const valorround = Math.round(+this.formRetencion.value.montoivaservicios * (+this._tabla5c_ser[indice].idtabla5.porcentaje / 100) * 100) / 100
         this.f['valorretservicios'].setValue(valorround);
         this.sumaValores();
      }
   }
   on100Change(event: any) {
      const selectedId = event.target.value;
      const parts = selectedId.split(':');
      const indice = parseInt(parts[0], 10)
      if (indice < 0) {
         console.error('Opción no encontrada');
      } else {
         this.f['codretserv100'].setValue(this._tabla5c_100[indice].casillero104);
         this.f['porretserv100'].setValue(this._tabla5c_100[indice].idtabla5.codporcentaje);
         const valorround = Math.round(+this.formRetencion.value.montoivaserv100 * (+this._tabla5c_100[indice].idtabla5.porcentaje / 100) * 100) / 100
         this.f['valretserv100'].setValue(valorround);
         this.sumaValores();
      }
   }

   sumaValores() {
      let sumbaseiva = this.formRetencion.value.montoivabienes + this.formRetencion.value.montoivaservicios + this.formRetencion.value.montoivaserv100
      this.f['sumbaseiva'].setValue(sumbaseiva);
      let sumreteiva = this.formRetencion.value.valorretbienes + this.formRetencion.value.valorretservicios + this.formRetencion.value.valretserv100
      this.f['sumreteiva'].setValue(sumreteiva);
   }

   onConceptoAirChange(event: any, i: number) {
      const selectedIdTabla10 = event.target.value;
      const parts = selectedIdTabla10.split(':');
      const indice = parseInt(parts[0], 10)
      const formAir = this.airControls[i] as FormGroup;
      formAir.get('codretair')?.setValue(this._tabla10[indice].codretair);
      const porcretair = this._tabla10[indice].porcretair;
      formAir.get('porcretair')?.setValue(porcretair);
      //Si ya hay Base Imponible => recalcula
      const baseimpair = formAir.get('baseimpair')!.value;
      if (baseimpair > 0) {
         const valretair = Math.round((baseimpair * (porcretair / 100)) * 100) / 100
         formAir.get('valretair')?.setValue(valretair);
      }
   }

   passBaseimpair(indice: number) {
      const formAir = this.airControls[indice] as FormGroup;
      formAir.get('baseimpair')?.setValue(this.formRetencion.value.baseimpgrav);
   }

   onInputBaseimpair(event: any, i: number) {
      const baseimpair = +event.target.value;
      const formAir = this.airControls[i] as FormGroup;
      const idtabla10 = formAir.get('idtabla10')!.value;
      if (idtabla10 > 0) {
         const tabla10 = this._tabla10.find((registro: { idtabla10: number; }) => registro.idtabla10 == idtabla10);
         const valretair = Math.round((baseimpair * (tabla10.porcretair / 100)) * 100) / 100
         formAir.get('valretair')?.setValue(valretair);
      }
   }

   onSubmit() {
      const iRetencion = {} as interfaceRetencion; //Interface para guardar la Retención (se necesita porque usa FormArray para los AIR)
      iRetencion.fecharegistro = this.formRetencion.value.fecharegistro;
      iRetencion.fechaemision = this.formRetencion.value.fechaemision;
      iRetencion.numdoc = this.formRetencion.value.numdoc;
      iRetencion.autorizacion = this.formRetencion.value.autorizacion;

      this.tabla17.idtabla17 = this.formRetencion.value.idtabla17;
      iRetencion.idtabla17 = this.tabla17;
      const tabla17 = this._tabla17.find((registro: { idtabla17: number; }) => registro.idtabla17 == this.formRetencion.value.idtabla17);
      iRetencion.porciva = Math.round(tabla17.porciva * 100) / 100;;

      iRetencion.baseimponible = this.formRetencion.value.baseimponible;
      iRetencion.baseimpgrav = this.formRetencion.value.baseimpgrav;
      iRetencion.basenograiva = this.formRetencion.value.basenograiva;
      iRetencion.baseimpice = 0;
      iRetencion.montoiva = this.formRetencion.value.montoiva;
      iRetencion.porcentajeice = 0;
      iRetencion.montoice = this.formRetencion.value.montoice;
      //Forma de pago
      if (this.formRetencion.value.idtabla15 > 0) {
         this.tabla15.idtabla15 = this.formRetencion.value.idtabla15;
         iRetencion.idtabla15 = this.tabla15;
      }
      //IVA Bienes
      if (this.formRetencion.value.idtabla5c_bie > 0) {
         iRetencion.montoivabienes = this.formRetencion.value.montoivabienes;
         iRetencion.idtabla5c_bie = this.formRetencion.value.idtabla5c_bie;
         iRetencion.codretbienes = this.formRetencion.value.codretbienes;
         const valorPorretbienes = (this.formRetencion.value.porretbienes === null || this.formRetencion.value.porretbienes === undefined || this.formRetencion.value.porretbienes === "") ? 0 : this.formRetencion.value.porretbienes;
         iRetencion.porretbienes = valorPorretbienes;
         iRetencion.valorretbienes = this.formRetencion.value.valorretbienes;
      } else {
         iRetencion.montoivabienes = 0;
         iRetencion.porretbienes = 0;
         iRetencion.valorretbienes = 0;
      }
      //IVA Servicios
      if (this.formRetencion.value.idtabla5c_ser > 0) {
         iRetencion.montoivaservicios = this.formRetencion.value.montoivaservicios;
         iRetencion.idtabla5c_ser = this.formRetencion.value.idtabla5c_ser;
         iRetencion.codretservicios = this.formRetencion.value.codretservicios;
         const valorPorretservicios = (this.formRetencion.value.porretservicios === null || this.formRetencion.value.porretservicios === undefined || this.formRetencion.value.porretservicios === "") ? 0 : this.formRetencion.value.porretservicios;
         iRetencion.porretservicios = valorPorretservicios;
         iRetencion.valorretservicios = this.formRetencion.value.valorretservicios;
      } else {
         iRetencion.montoivaservicios = 0;
         iRetencion.porretservicios = 0;
         iRetencion.valorretservicios = 0;
      }
      //IVA 100%
      if (this.formRetencion.value.idtabla5c_100 > 0) {
         iRetencion.montoivaserv100 = this.formRetencion.value.montoivaserv100;
         iRetencion.idtabla5c_100 = this.formRetencion.value.idtabla5c_100;
         iRetencion.codretserv100 = this.formRetencion.value.codretserv100;
         const valorPorretserv100 = (this.formRetencion.value.porretserv100 === null || this.formRetencion.value.porretserv100 === undefined || this.formRetencion.value.porretserv100 === "") ? 0 : this.formRetencion.value.porretserv100;
         iRetencion.porretserv100 = valorPorretserv100;
         iRetencion.valretserv100 = this.formRetencion.value.valretserv100;
      } else {
         iRetencion.montoivaserv100 = 0;
         iRetencion.porretserv100 = 0;
         iRetencion.valretserv100 = 0;
      }

      iRetencion.baseimpair = 0;
      iRetencion.codretair = 'VRS';
      iRetencion.porcentajeair = 0;
      iRetencion.valretair = 0;

      iRetencion.numserie = this.formRetencion.value.numserie;
      let asiento = new Asientos();
      asiento.idasiento = this.idasiento;
      iRetencion.idasiento = asiento;
      this.beneficiario.idbene = this._beneficiarios[0].idbene;
      iRetencion.idbene = this.beneficiario;
      this.documento.intdoc = this.formRetencion.value.intdoc;
      iRetencion.intdoc = this.documento;
      this.tabla01.idtabla01 = this.formRetencion.value.idtabla01;
      iRetencion.idtabla01 = this.tabla01;
      iRetencion.estado = 0;
      iRetencion.ambiente = 1;   //OJO: Verificar que se actualice con el ambiente definido al generar el XML
      iRetencion.swelectro = 1;
      iRetencion.inttra = 0;
      iRetencion.swretencion = 1;
      iRetencion.secretencion1 = this.formRetencion.value.secretencion1;
      iRetencion.fechaemiret1 = this.formRetencion.value.fechaemiret1;

      this.saveRetencion(iRetencion);
   }

   saveRetencion(retencion: any) {
      this.reteService.saveRetencion(retencion).subscribe({
         next: resp => {
            const newrete: any = resp;
            if (newrete.idrete > 0) this.guardarDatosAir(newrete.idrete);
             else this.regresar();
         },
         error: err => console.error(err.error)
      });
   }

   guardarDatosAir(idrete: number) {
      const airArray = this.formRetencion.get('air') as FormArray;
      // const observables: any[] = [];
      const observables: Observable<any>[] = [];

      airArray.controls.forEach(control => {
         if (control instanceof FormGroup) {
            const formValues = control.value;
            // console.log('formValues.idtabla10: ', formValues.idtabla10)
            if (formValues.idtabla10 > 0) {
               const airxrete: interfaceAirxrete = {
                  baseimpair0: 0,
                  baseimpair12: 0,
                  baseimpairno: 0,
                  baseimpair: formValues.baseimpair || 0,
                  valretair: formValues.valretair || 0,
                  idrete: { idrete: idrete } as Retenciones,
                  idtabla10: { idtabla10: formValues.idtabla10 } as Tabla10
               };

               observables.push(this.airxreteService.saveAirxrete(airxrete).pipe(
                  catchError(error => {
                     // console.error("Error al guardar un dato AIR individual:", error);
                     return of(null); // Devuelve un observable que emite null en caso de error
                  }),
                  // finalize(() => console.log("Observable completado para:", airxrete))
               ));
            }
         }
      });

      if (observables.length === 0) {
         this.regresar();
         return;
      }

      forkJoin(observables).subscribe({
         next: responses => {
            this.asiento.swretencion = 1;
            this.asiService.updateAsiento(this.idasiento, this.asiento).subscribe({
               next: resp => this.regresar(),
               error: err => console.error('Al actualizar el asiento: ', err.error)
            });
         },
         error: (err) => {
            console.error("Error general al guardar datos AIR:", err);
            this.regresar();
         }
      });
   }

   valSecretencion1(control: AbstractControl) {
      return this.reteService.valSecretencion1(control.value)
         .pipe(map(result => result ? { existe: true } : null));
   }

   //Valida que se haya seleccionado un Beneficiario
   valBenefi(control: AbstractControl) {
      if (this.idbene == null) return of({ 'invalido': true });
      else return of(null);
   }

}

interface interfaceAsiento {
   asiento: number;
   fecha: Date;
   comprobante: string;
   documento: String;
   beneficiario: String;
   glosa: String;
}

//Código Tipo de Comprobante
function codcomprobante(tipcom: number): string {
   if (tipcom == 1) return 'I-';
   if (tipcom == 2) return 'E-';
   if (tipcom == 3) return 'DC-';
   if (tipcom == 4) return 'DI-';
   if (tipcom == 5) return 'DE-';
   return '';
}

interface interfaceRetencion {

   fecharegistro: Date;
   secretencion1: String | null;
   fechaemision: Date;
   fechaemiret1: Date | null;
   numdoc: String;
   porciva: number;
   baseimponible: number;
   baseimpgrav: number;
   basenograiva: number;
   baseimpice: number;
   montoiva: number;
   porcentajeice: number;
   montoice: number;
   montoivabienes: number;
   codretbienes: String;
   porretbienes: number;
   valorretbienes: number;
   montoivaservicios: number;
   codretservicios: String;
   porretservicios: number;
   valorretservicios: number;
   montoivaserv100: number;
   codretserv100: String;
   porretserv100: number;
   valretserv100: number;
   baseimpair: number;
   codretair: String;
   porcentajeair: number;
   valretair: number;
   autorizacion: String;
   numserie: String;
   // numautoriza //Ahora siempre es electrónica
   // fechacaduca //Ahora siempre es electrónica
   // idautoriza  //Ahora siempre es electrónica
   // descripcion //No se usa
   idasiento: Asientos;
   idbene: Beneficiarios;
   intdoc: Documentos;
   idtabla01: Tabla01;
   idtabla15: Tabla15;
   idtabla5c_bie: number;
   idtabla5c_ser: number;
   idtabla5c_100: number;
   estado: number;
   ambiente: number;
   swelectro: number;
   idtabla17: Tabla17;
   inttra: number;
   swretencion: number;
   // claveacceso
   // numautoriza_e
   // fecautoriza
   // k1
   // escoge
}

interface interfaceAirxrete {
   baseimpair0: number;
   baseimpair12: number;
   baseimpairno: number;
   baseimpair: number;
   valretair: number;
   idrete: Retenciones;
   idtabla10: Tabla10;
}