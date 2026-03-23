import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormArray, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
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
   idasiento: number; //Id del Asiento en el que se registra la retención
   iAsiento = {} as interfaceAsiento; //Interface para los datos del Asiento
   beneficiarios: Beneficiarios[] = [];
   idproveedor: number | null;      //Es el idbene del combo de la retencion
   documentos: Documentos[] = [];
   tabla01: Tabla01[] = []; //Sustento tributario
   tabla17: Tabla17[] = []; //Porcentaje IVA
   tabla15: Tabla15[] = []; //Forma de pago
   tabla5c_bie: Tabla5_concep[] = [];   //Conceptos retencion IVA Bienes
   tabla5c_ser: Tabla5_concep[] = [];   //Conceptos retencion IVA Servicios
   tabla5c_100: Tabla5_concep[] = [];   //Conceptos retencion IVA 100%
   tabla10: Tabla10[] = [];
   ambiente: number;    //Falta recuperar del definir

   asiento: Asientos = new Asientos();

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
         fecharegistro: ['', Validators.required, this.authService.valAñoValidator()],
         idbene: ['', [Validators.required], [this.valBenefi.bind(this)]],
         idtabla01: this.tabla01,
         autorizacion: ['', [Validators.required, Validators.pattern('^[0-9]{49}$')]],
         iddocu: this.documentos,
         numdoc: ['', Validators.required],
         fechaemision: ['', Validators.required],
         numserie: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],
         idtabla15: this.tabla15,
         baseimponible: [0, [Validators.required, Validators.min(0)]],
         idtabla17: this.tabla17,
         baseimpgrav: [0, [Validators.required, Validators.min(0)]],
         basenograiva: [0, [Validators.required, Validators.min(0)]],
         porciva: 0,
         baseimpice: 0,
         montoiva: [0, [Validators.required, Validators.min(0)]],
         porcentajeice: 0,
         montoice: [0, [Validators.required, Validators.min(0)]],
         montoivabienes: [0, [Validators.required, Validators.min(0)]],
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
         secretencion1: ['', Validators.required, [this.valSecretencion1()]],
         fechaemiret1: ['', Validators.required, this.authService.valAñoValidator()],
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
         feccrea: new Date(),
         usumodi: '',
         fecmodi: '',
         air: this.fb.array([])
      },
         { updateOn: "blur" }
      );

      this.ultimo();
      this.suscribirAutorizacion();
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

   datosAsiento() {
      this.asiService.unAsiento(this.idasiento).subscribe({
         next: (asiento: Asientos) => {
            this.asiento = asiento;
            this.iAsiento.asiento = asiento.asiento;
            this.iAsiento.fecha = asiento.fecha;
            this.iAsiento.comprobante = this.authService.comprobante(asiento.tipcom, asiento.compro);
            this.iAsiento.beneficiario = asiento.idbene.nomben;
            if (asiento.intdoc.intdoc == 1) this.iAsiento.documento = asiento.numdoc;
            else this.iAsiento.documento = asiento.intdoc.nomdoc + ' ' + asiento.numdoc;
            this.iAsiento.glosa = asiento.glosa;
            this.formRetencion.get('idtabla15')?.disable();
            let nomben = ''
            if (asiento.idbene.idbene == 1) {
               this.idproveedor = null;
               nomben = '';
            }
            else {
               this.idproveedor = asiento.idbene.idbene;
               nomben = asiento.idbene.nomben;
            }
            this.formRetencion.patchValue({
               fecharegistro: asiento.fecha,
               idbene: nomben,
               fechaemiret1: this.iAsiento.fecha
            });
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar el Asiento', err.error) }
      });
   }

   benefixNombre(e: any) {
      if (e.target.value != '') {
         this.beneService.findByNomben(e.target.value).subscribe({
            next: datos => this.beneficiarios = datos,
            error: err => console.error(err.error),
         });
      }
   }
   onBeneficiarioSelected(e: any) {
      const selectedOption = this.beneficiarios.find((x: { nomben: any; }) => x.nomben === e.target.value);
      if (selectedOption) this.idproveedor = selectedOption.idbene;
      else this.idproveedor = null;
   }

   //Sustento tributario
   listarTabla01() {
      this.tabla01Service.getListaTabla01().subscribe({
         next: (datos: Tabla01[]) => {
            this.tabla01 = datos;
            const defaTabla01 = datos.find(registro => registro.codsustento == '01');
            this.f['idtabla01'].setValue(defaTabla01!.idtabla01);
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al recuperar Tabla01', err.error) }
      });
   }

   listarDocumentos() {
      this.docuService.getListaDocumentos().subscribe({
         next: (documentos: Documentos[]) => {
            this.documentos = documentos;
            const defaDocumento = documentos.find(registro => registro.tipdoc == 5);  //tipdoc 5=Factura
            this.f['iddocu'].setValue(defaDocumento!.intdoc)
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al recuperar los Documentos', err.error) }
      });
   }

   //Porcentaje IVA
   listarTabla17() {
      this.tabla17Service.getTabla17().subscribe({
         next: (datos: Tabla17[]) => {
            this.tabla17 = datos;
            const defaTabla17 = datos.find(registro => registro.codigo == 4);   //codigo 4 = 15%
            this.f['idtabla17'].setValue(defaTabla17!.idtabla17);
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al recuperar Porcentaje IVA', err.error) }
      });
   }

   //Forma de pago   
   listarTabla15() {
      this.tabla15Service.getListaTabla15().subscribe({
         next: (datos: Tabla15[]) => this.tabla15 = datos,
         error: err => { console.error(err.error); this.authService.mostrarError('Error al recuperar Forma de Pago', err.error) }
      });
   }

   listarTabla5c_bie() {
      this.tabla5cService.getTabla5c_bie().subscribe({
         next: (datos: Tabla5_concep[]) => this.tabla5c_bie = datos,
         error: err => { console.error(err.error); this.authService.mostrarError('Error al recuperar Conceptos del IVA Bienes', err.error) }
      });
   }
   listarTabla5c_ser() {
      this.tabla5cService.getTabla5c_ser().subscribe({
         next: (datos: Tabla5_concep[]) => this.tabla5c_ser = datos,
         error: err => { console.error(err.error); this.authService.mostrarError('Error al recuperar Conceptos del IVA Servicios', err.error) }
      });
   }
   listarTabla5c_100() {
      this.tabla5cService.getTabla5c_100().subscribe({
         next: (datos: Tabla5_concep[]) => this.tabla5c_100 = datos,
         error: err => { console.error(err.error); this.authService.mostrarError('Error al recuperar Conceptos del IVA 100%', err.error) }
      });
   }
   listarTabla10() {
      this.tabla10Service.getListaTabla10().subscribe({
         next: (datos: Tabla10[]) => this.tabla10 = datos,
         error: err => { console.error(err.error); this.authService.mostrarError('Error al recuperar Conceptos del AIR', err.error) }
      });
   }

   //Busca la Última retencion
   ultimo() {
      this.reteService.ultimo().subscribe({
         next: resp => {
            const secretencion1 = +resp.secretencion1 + 1;  //Es string
            this.f['secretencion1'].setValue(secretencion1);
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar la última Retención', err.error) }
      });
   }

   private suscribirAutorizacion(): void {
      this.formRetencion.get('autorizacion')!.valueChanges
         .subscribe(valor => {
            const factura = this.parsearAutorizacion(valor);
            this.formRetencion.patchValue({
               numdoc: factura.numdoc,
               numserie: factura.numserie,
               fechaemision: extraerFechaDDMMAAAA(valor),
            }, { emitEvent: false });
         });
   }

   seleccionarTexto(event: FocusEvent): void {
      const input = event.target as HTMLInputElement;
      input.select();
   }

   calcMontoIVA() {
      //Habilita/deshabilita forma de pago
      let total = +this.formRetencion.value.baseimpgrav + +this.formRetencion.value.baseimponible + +this.formRetencion.value.basenograiva
      if (total >= 1000) {
         this.formRetencion.get('idtabla15')?.enable();
         const defaTabla15 = this.tabla15.find((registro: { codtabla15: String; }) => registro.codtabla15 == '01');   //codtabla15 01 = SIN UTILIZACION DEL SISTEMA FINANCIERO
         this.f['idtabla15'].setValue(defaTabla15!.idtabla15);
      } else {
         this.formRetencion.get('idtabla15')?.disable();
         this.f['idtabla15'].setValue(null);
      };

      //Busca el porciva seleccionado para calcular el monto del IVA
      const tabla17 = this.tabla17.find((registro: { idtabla17: any; }) => registro.idtabla17 == this.formRetencion.value.idtabla17);
      let montoiva = Math.round((this.formRetencion.value.baseimpgrav * tabla17!.porciva) * 100) / 100;
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
         const tabla17 = this.tabla17[indice];
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
         const tabla5c_bie = this.tabla5c_bie.find((registro: { idtabla5c: number; }) => registro.idtabla5c == idtabla5c_bie);
         const valorretbienes = Math.round((montoivabienes * (tabla5c_bie!.idtabla5.porcentaje / 100)) * 100) / 100
         this.f['valorretbienes'].setValue(valorretbienes);
      }
      this.sumaValores();
   }
   onInputServicios(event: any) {
      const montoivaservicios = +event.target.value;
      this.f['montoivaservicios'].setValue(montoivaservicios);  //Para que se actualice y se pueda sumar
      const idtabla5c_ser = this.formRetencion.value.idtabla5c_ser;
      if (idtabla5c_ser > 0) {
         const tabla5c_ser = this.tabla5c_ser.find((registro: { idtabla5c: number; }) => registro.idtabla5c == idtabla5c_ser);
         const valorretservicios = Math.round((montoivaservicios * (tabla5c_ser!.idtabla5.porcentaje / 100)) * 100) / 100
         this.f['valorretservicios'].setValue(valorretservicios);
      }
      this.sumaValores();
   }
   onInput100(event: any) {
      const montoivaserv100 = +event.target.value;
      this.f['montoivaserv100'].setValue(montoivaserv100);  //Para que se actualice y se pueda sumar
      const idtabla5c_100 = this.formRetencion.value.idtabla5c_100;
      if (idtabla5c_100 > 0) {
         const tabla5c_100 = this.tabla5c_100.find((registro: { idtabla5c: number; }) => registro.idtabla5c == idtabla5c_100);
         const valretserv100 = Math.round((montoivaserv100 * (tabla5c_100!.idtabla5.porcentaje / 100)) * 100) / 100
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
         this.f['codretbienes'].setValue(this.tabla5c_bie[indice].casillero104);
         this.f['porretbienes'].setValue(this.tabla5c_bie[indice].idtabla5.codporcentaje);
         const valorround = Math.round(+this.formRetencion.value.montoivabienes * (+this.tabla5c_bie[indice].idtabla5.porcentaje / 100) * 100) / 100
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
         this.f['codretservicios'].setValue(this.tabla5c_ser[indice].casillero104);
         this.f['porretservicios'].setValue(this.tabla5c_ser[indice].idtabla5.codporcentaje);
         const valorround = Math.round(+this.formRetencion.value.montoivaservicios * (+this.tabla5c_ser[indice].idtabla5.porcentaje / 100) * 100) / 100
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
         this.f['codretserv100'].setValue(this.tabla5c_100[indice].casillero104);
         this.f['porretserv100'].setValue(this.tabla5c_100[indice].idtabla5.codporcentaje);
         const valorround = Math.round(+this.formRetencion.value.montoivaserv100 * (+this.tabla5c_100[indice].idtabla5.porcentaje / 100) * 100) / 100
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
      formAir.get('codretair')?.setValue(this.tabla10[indice].codretair);
      const porcretair = this.tabla10[indice].porcretair;
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
         const tabla10 = this.tabla10.find((registro: { idtabla10: number; }) => registro.idtabla10 == idtabla10);
         const valretair = Math.round((baseimpair * (tabla10!.porcretair / 100)) * 100) / 100
         formAir.get('valretair')?.setValue(valretair);
      }
   }

   //Impuesto a la renta
   get air(): FormArray {
      return this.formRetencion.get('air') as FormArray;
   }
   get airControls(): AbstractControl[] {
      return (this.formRetencion.get('air') as FormArray).controls;
   }

   f1(i: number) { return (this.air.at(i) as FormGroup).controls; }

   agregarAir() { this.air.push(this.nuevoAir()); }

   nuevoAir(): FormGroup {
      return this.fb.group({
         baseimpair: [0, [Validators.required, Validators.min(0)]],
         codretair: ['', Validators.required],
         idtabla10: null,
         porcretair: '',
         valretair: 0
      });
   }

   quitarAIR(index: number) { this.air.removeAt(index); }

   onSubmit() {
      const payloadRetencionCreate: RetencionCreateDTO = {
         fecharegistro: this.formRetencion.value.fecharegistro,
         secretencion1: this.formRetencion.value.secretencion1,
         fechaemision: this.formRetencion.value.fechaemision,
         fechaemiret1: this.formRetencion.value.fechaemiret1,
         numdoc: this.formRetencion.value.numdoc,
         numserie: this.formRetencion.value.numserie,
         porciva: this.formRetencion.value.porciva,
         baseimponible: this.formRetencion.value.baseimponible,
         baseimpgrav: this.formRetencion.value.baseimpgrav,
         basenograiva: this.formRetencion.value.basenograiva,
         baseimpice: this.formRetencion.value.baseimpice,
         montoiva: this.formRetencion.value.montoiva,
         porcentajeice: this.formRetencion.value.porcentajeice,
         montoice: this.formRetencion.value.montoice,
         montoivabienes: this.formRetencion.value.montoivabienes,
         codretbienes: this.formRetencion.value.codretbienes,
         porretbienes: Number(this.formRetencion.value.porretbienes) || 0,
         valorretbienes: this.formRetencion.value.valorretbienes,
         montoivaservicios: this.formRetencion.value.montoivaservicios,
         codretservicios: this.formRetencion.value.codretservicios,
         porretservicios: Number(this.formRetencion.value.porretservicios) || 0,
         valorretservicios: this.formRetencion.value.valorretservicios,
         montoivaserv100: this.formRetencion.value.montoivaserv100,
         codretserv100: this.formRetencion.value.codretserv100,
         porretserv100: Number(this.formRetencion.value.porretserv100) || 0,
         valretserv100: this.formRetencion.value.valretserv100,

         // Verificar estos 4 campos (no se deberían usar pero están como obligatorios)
         baseimpair: 0,
         codretair: ' ',
         porcentajeair: 0,
         valretair: 0,

         idasiento: { idasiento: this.idasiento },
         idbene: { idbene: this.idproveedor },
         iddocu: { intdoc: this.formRetencion.value.iddocu },
         idtabla01: { idtabla01: this.formRetencion.value.idtabla01 },
         idtabla15: { idtabla15: this.formRetencion.value.idtabla15 },
         // idtabla5c_100: this.formRetencion.value.idtabla5c_100,
         idtabla5c_100: this.formRetencion.value.idtabla5c_100 ? Number(this.formRetencion.value.idtabla5c_100) : null,
         idtabla5c_bie: this.formRetencion.value.idtabla5c_bie,
         idtabla5c_ser: this.formRetencion.value.idtabla5c_ser,
         // claveacceso: Se actualiza solo al generar el XML autorizar
         // numautoriza_e: Se actualiza al autorizar
         // fecautoriza: Se actualiza al autorizar
         estado: 0,
         ambiente: 1,   //Falta Obtener desde definir.ambiente
         autorizacion: this.formRetencion.value.autorizacion,
         idtabla17: { idtabla17: this.formRetencion.value.idtabla17 },
         swretencion: 1,
         swelectro: 1,

      };
      this.saveRetencion(payloadRetencionCreate);
   }

   saveRetencion(retencion: RetencionCreateDTO) {
      this.reteService.saveRetencion(retencion).subscribe({
         next: (newRetencion: Retenciones) => {
            const airs = this.formRetencion.get('air') as FormArray;
            if (newRetencion?.idrete && airs.length > 0) {
               this.loteAIR(newRetencion.idrete, newRetencion.secretencion1);
            }
            else {
               this.authService.swal('success', `Retención ${newRetencion.secretencion1} guardada con éxito`);
               this.regresar()
            };
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al guardar la Retención', err.error); }
      });
   }

   loteAIR(idrete: number, secretencion1: String) {
      const airs = this.formRetencion.get('air') as FormArray;
      this.airxreteService.saveAirxreteLoteBatch(airs, idrete).subscribe({
         next: () => {
            this.authService.swal('success', `Retención ${secretencion1} guardada con éxito`);
            this.regresar();
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al guardar los AIRs por lote', err.error); }
      });
   }

   regresar() { this.router.navigate(['/asientos']); }

   // Valida el número de retención
   valSecretencion1(): AsyncValidatorFn {
      return (control: AbstractControl): Observable<ValidationErrors | null> => {
         const valor = control.value;
         if (valor == null || valor === '' || isNaN(valor)) { return of(null); }
         return this.reteService.valSecretencion1(Number(valor)).pipe(
            map(existe => (existe ? { existe: true } : null)),
            catchError(() => of(null)) // No romper el formulario si el backend falla
         );
      };
   }

   //Valida que se haya seleccionado un Beneficiario
   valBenefi(control: AbstractControl) {
      if (this.idproveedor == null) return of({ 'invalido': true });
      else return of(null);
   }

   private parsearAutorizacion(valor: string): {
      numdoc: string;
      numserie: string;
      fecha: Date;
   } {
      const rawFecha = valor.substring(0, 8); // "26012025"
      const dia = Number(rawFecha.substring(0, 2));      // "26" → 26
      const mes = Number(rawFecha.substring(2, 4)) - 1;  // "01" → 0 (enero)
      const anio = Number(rawFecha.substring(4, 8));     // "2025" → 2025
      const fecha = new Date(anio, mes, dia);

      const raw = valor.substring(30, 39); // "00000123" por ejemplo
      const numero = Number(raw);          // 123
      const numdoc = String(numero);       // "123"

      return {
         numserie: valor.substring(24, 30),
         numdoc: numdoc,
         fecha: fecha
      };
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

export interface RetencionCreateDTO {

   fecharegistro: Date;
   secretencion1: String;
   fechaemision: Date;
   fechaemiret1: Date;
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
   // Verificar estos 4 campos (no se deberían usar)
   baseimpair: number;
   codretair: String;
   porcentajeair: number;
   valretair: number;

   numserie: String;
   // numautoriza: Ya no se usa Ahora todas son electrónicas 
   // fechacaduca: Ya no se usa Ahora todas son electrónicas 
   // descripcion: Ya no se usa
   // idautoriza: Ahora todas son electrónicas 
   // idasiento: Asientos; Esto envia todo el registro de Asiento se debe enviar solo el ID
   // idasiento: number;
   idasiento: { idasiento: number };
   idbene: { idbene: number | null };
   iddocu: { intdoc: number };
   idtabla01: { idtabla01: number };
   idtabla15: { idtabla15: number | null };
   idtabla5c_100: number | null;
   idtabla5c_bie: number;
   idtabla5c_ser: number;
   // claveacceso: Se actualiza solo al generar el XML autorizar
   // numautoriza_e: Se actualiza al autorizar
   // fecautoriza: Se actualiza al autorizar
   estado: number;
   ambiente: number;
   autorizacion: String;
   idtabla17: { idtabla17: number };
   // k1: Solo en Powerbuilder
   // escoge: Solo en Powerbuilder
   // inttra: Ya no se usa
   swretencion: number,
   swelectro: number,
   // numautoriza //Ahora siempre es electrónica
   // fechacaduca //Ahora siempre es electrónica
   // idautoriza  //Ahora siempre es electrónica
   // descripcion //No se usa
}

function extraerFechaDDMMAAAA(cadena: string): string {
   const segmento = cadena.substring(0, 8);
   const dia = Number(segmento.substring(0, 2));
   const mes = Number(segmento.substring(2, 4)) - 1;
   const anio = Number(segmento.substring(4, 8));
   const fecha = new Date(anio, mes, dia);
   // Convertir a yyyy-MM-dd para el input
   return fecha.toISOString().substring(0, 10);
}

export interface AirxreteLoteDTO {
   baseimpair0: number;
   baseimpair12: number;
   baseimpairno: number;
   baseimpair: number;
   valretair: number;
   idrete: { idrete: number };
   idtabla10: { idtabla10: number };
}
