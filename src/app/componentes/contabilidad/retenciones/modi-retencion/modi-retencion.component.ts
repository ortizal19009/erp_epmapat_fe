import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { Airxrete } from 'src/app/modelos/contabilidad/airxrete.model';
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
import Swal from 'sweetalert2';

@Component({
   selector: 'app-modi-retencion',
   templateUrl: './modi-retencion.component.html',
   styleUrls: ['./modi-retencion.component.css']
})
export class ModiRetencionComponent implements OnInit {

   formRetencion: FormGroup;
   idrete: number;
   idasiento: number; //Id del Asiento que se registra la retención
   iAsiento = {} as asientoViewModel; //Interface para los datos del Asiento
   beneficiarios: Beneficiarios[] = [];
   idproveedor: number | null;      //Es el idbene del combo de la retencion
   documentos: Documentos[] = [];
   tabla01: Tabla01[] = []; //Sustento tributario
   tabla17: Tabla17[] = []; //Porcentaje IVA
   tabla15: Tabla15[] = []; //Forma de pago
   tabla5c_bie: Tabla5_concep[] = [];   //Conceptos retencion IVA Bienes
   tabla5c_ser: Tabla5_concep[] = [];   //Conceptos retencion IVA Servicios
   tabla5c_100: Tabla5_concep[] = [];   //Conceptos retencion IVA 100%
   tabla10: any;                       //Conceptos AIRs
   antsecretencion1: number;
   swmodiAIR: boolean = false             //AIRs modificado o nuevo

   asiento: Asientos = new Asientos();
   beneficiario: Beneficiarios = new Beneficiarios;

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

      //Recibe retencionToModifi
      const retencionToModifi = JSON.parse(sessionStorage.getItem("retencionToModifi")!);
      if (retencionToModifi) {
         this.idasiento = +retencionToModifi.idasiento;
         this.idrete = +retencionToModifi.idrete;
      }
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
         numautoriza_e: [],
         fecautoriza: [],
         idrete: [],
         fecharegistro: '',
         idbene: ['', [Validators.required], [this.valBenefi.bind(this)]],
         idtabla01: this.tabla01,

         iddocu: this.documentos,
         numdoc: ['', Validators.required],
         fechaemision: this.iAsiento.fecha,
         numserie: ['', [Validators.required, Validators.minLength(6)]],
         autorizacion: ['', [Validators.required, Validators.minLength(49)]],
         baseimponible: [0, [Validators.required, Validators.min(0)]],
         idtabla17: this.tabla17,
         baseimpgrav: [0, Validators.required],
         basenograiva: [0, Validators.required],
         idtabla15: this.tabla15,
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
         secretencion1: ['', [Validators.required, Validators.min(1), Validators.pattern(/^[0-9]+$/)], this.valSecretencion1()],
         fechaemiret1: ['', [Validators.required], this.valAño()],
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
         claveacceso: [],
         concepto: [],
         porcretair: 0,
         usucrea: this.authService.idusuario,
         feccrea: new Date(),
         usumodi: '',
         fecmodi: '',
         air: this.fb.array([])
      },
         { updateOn: "blur" });

      this.datosRetencion();
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
         next: (datos: Asientos) => {
            this.asiento = datos;
            this.iAsiento.asiento = datos.asiento;
            this.iAsiento.fecha = datos.fecha;
            this.iAsiento.comprobante = this.authService.comprobante(datos.tipcom, datos.compro);
            this.iAsiento.beneficiario = datos.idbene.nomben;
            if (datos.intdoc.intdoc == 1) this.iAsiento.documento = datos.numdoc;
            else this.iAsiento.documento = datos.intdoc.nomdoc + ' ' + datos.numdoc;
            this.iAsiento.glosa = datos.glosa;
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al recuperar el Asiento', err.error) }
      });
   }

   datosRetencion() {
      this.reteService.getById(this.idrete).subscribe({
         next: (retencion: Retenciones) => {
            this.idproveedor = retencion.idbene.idbene;
            this.antsecretencion1 = +retencion.secretencion1;
            if (retencion.baseimpgrav >= 1000) { this.formRetencion.get('idtabla15')?.enable(); }
            else { this.formRetencion.get('idtabla15')?.disable(); }
            this.formRetencion.patchValue({
               numautoriza_e: retencion.numautoriza_e,
               fecautoriza: retencion.fecautoriza,
               fecharegistro: retencion.fecharegistro,
               idbene: retencion.idbene.nomben,
               idtabla01: retencion.idtabla01.idtabla01,
               iddocu: retencion.iddocu.intdoc,
               numdoc: retencion.numdoc,
               fechaemision: retencion.fechaemision,
               numserie: retencion.numserie,
               autorizacion: retencion.autorizacion,
               baseimponible: retencion.baseimponible,
               idtabla17: retencion.idtabla17.idtabla17,
               baseimpgrav: retencion.baseimpgrav,
               basenograiva: retencion.basenograiva,
               montoiva: retencion.montoiva,
               montoice: retencion.montoice,
               // idtabla15: retencion.idtabla15.idtabla15,
               idtabla15: retencion.idtabla15?.idtabla15 ?? null,
               //IVA Bienes
               montoivabienes: retencion.montoivabienes,
               idtabla5c_bie: retencion.idtabla5c_bie,
               codretbienes: retencion.codretbienes,
               porretbienes: retencion.porretbienes,
               valorretbienes: retencion.valorretbienes,
               //IVA Servicios
               montoivaservicios: retencion.montoivaservicios,
               idtabla5c_ser: retencion.idtabla5c_ser,
               codretservicios: retencion.codretservicios,
               porretservicios: retencion.porretservicios,
               valorretservicios: retencion.valorretservicios,
               //IVA 100%
               montoivaserv100: retencion.montoivaserv100,
               idtabla5c_100: retencion.idtabla5c_100,
               codretserv100: retencion.codretserv100,
               porretserv100: retencion.porretserv100,
               valretserv100: retencion.valretserv100,

               secretencion1: retencion.secretencion1,
               fechaemiret1: retencion.fechaemiret1,
            });
            this.sumaValores();
            if (retencion.estado >= 1) this.formRetencion.disable();
            this.airxreteService.getByIdrete(this.idrete).subscribe({
               next: (airxrete: Airxrete[]) => {
                  airxrete.forEach(fila => { this.air.push(this.crearAirFormGroup(fila)); });   //Añade las filas a AIRs
               },
               error: err => { console.error(err.error); this.authService.mostrarError('Error al recuperar loa AIRs', err.error) }
            });
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al recuperar la Retención', err.error) }
      });

   }

   benefixNombre(e: any) {
      if (e.target.value != '') {
         this.beneService.findByNomben(e.target.value).subscribe({
            next: (beneficiarios: Beneficiarios[]) => this.beneficiarios = beneficiarios,
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
         next: (sustentos: Tabla01[]) => this.tabla01 = sustentos,
         error: err => { console.error(err.error); this.authService.mostrarError('Error al recuperar Tabla01', err.error) }
      });
   }

   // comparaTabla01Old(o1: Tabla01, o2: Tabla01): boolean {
   //    if (o1 === undefined && o2 === undefined) { return true; }
   //    else {
   //       return o1 === null || o2 === null || o1 === undefined || o2 === undefined ? false : o1.idtabla01 === o2.idtabla01;
   //    }
   // }

   listarDocumentos() {
      this.docuService.getListaDocumentos().subscribe({
         next: (documentos: Documentos[]) => this.documentos = documentos,
         error: err => console.error(err.error)
      });
   }

   //Porcentaje IVA
   listarTabla17() {
      this.tabla17Service.getTabla17().subscribe({
         next: (porcentajes: Tabla17[]) => this.tabla17 = porcentajes,
         error: err => { console.error(err.error); this.authService.mostrarError('Error al recuperar la Tabla17', err.error) }
      });
   }

   //Forma de pago   
   listarTabla15() {
      this.tabla15Service.getListaTabla15().subscribe({
         next: (datos: Tabla15[]) => this.tabla15 = datos,
         error: err => { console.error(err.error); this.authService.mostrarError('Error al recuperar la Tabla15', err.error) }
      });
   }

   //Conceptos del IVA (Bienes, servicios y 100%)
   listarTabla5c_bie() {
      this.tabla5cService.getTabla5c_bie().subscribe({
         next: datos => this.tabla5c_bie = datos,
         error: err => console.error(err.error)
      });
   }
   listarTabla5c_ser() {
      this.tabla5cService.getTabla5c_ser().subscribe({
         next: (servicios: Tabla5_concep[]) => this.tabla5c_ser = servicios,
         error: err => { console.error(err.error); this.authService.mostrarError('Error al recuperar la Tabla5c_ser', err.error) }
      });
   }
   listarTabla5c_100() {
      this.tabla5cService.getTabla5c_100().subscribe({
         next: datos => this.tabla5c_100 = datos,
         error: err => console.error(err.error)
      });
   }
   listarTabla10() {
      this.tabla10Service.getListaTabla10().subscribe({
         next: (datos: Tabla10[]) => this.tabla10 = datos,
         error: err => { console.error(err.error); this.authService.mostrarError('Error al recuperar la Tabla10', err.error) }
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



   //Impuesto a la renta
   get air(): FormArray {
      return this.formRetencion.get('air') as FormArray;
   }
   get airControls(): AbstractControl[] {
      return (this.formRetencion.get('air') as FormArray).controls;
   }

   f1(i: number) { return (this.air.at(i) as FormGroup).controls; }

   crearAirFormGroup(fila?: any): FormGroup {
      // console.log('fila: ', fila)
      const fg = this.fb.group({
         idairxrete: fila?.idairxrete ?? null,
         baseimpair: fila?.baseimpair ?? 0,
         idtabla10: fila?.idtabla10.idtabla10 ?? this.tabla10,
         codretair: [fila?.idtabla10.codretair ?? '', Validators.required],
         porcretair: [fila?.idtabla10.porcretair ?? '', Validators.required],
         valretair: fila?.valretair ?? 0,
         idrete: fila?.idrete?.idrete ?? this.idrete,
         // Siempre 0 (Revisar parece que no se usan)
         baseimpair0: 0,
         baseimpair12: 0,
         baseimpairno: 0,
      });
      // Suscripción para detectar cambios
      fg.valueChanges.subscribe(() => { this.swmodiAIR = true; });
      return fg;
   }

   agregarAir() {
      this.air.push(this.crearAirFormGroup());
      this.swmodiAIR = true;
      this.formRetencion?.markAsDirty();
   }

   quitarAIR(index: number) { this.air.removeAt(index); }

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
         const valretair = Math.round((baseimpair * (tabla10.porcretair / 100)) * 100) / 100
         formAir.get('valretair')?.setValue(valretair);
      }
   }

   onSubmit() {
      const tabla17 = this.tabla17.find((registro: { idtabla17: number; }) => registro.idtabla17 == this.formRetencion.value.idtabla17);

      let refTabla15: Tabla15 | null = null;
      const idSeleccionado = this.formRetencion.value.idtabla15;
      if (idSeleccionado) { refTabla15 = { idtabla15: idSeleccionado } as Tabla15; }

      const valorPorretbienes = (this.formRetencion.value.porretbienes === null || this.formRetencion.value.porretbienes === undefined || this.formRetencion.value.porretbienes === "") ? 0 : this.formRetencion.value.porretbienes;
      const valorPorretservicios = (this.formRetencion.value.porretservicios === null || this.formRetencion.value.porretservicios === undefined || this.formRetencion.value.porretservicios === "") ? 0 : this.formRetencion.value.porretservicios;
      const valorPorretserv100 = (this.formRetencion.value.porretserv100 === null || this.formRetencion.value.porretserv100 === undefined || this.formRetencion.value.porretserv100 === "") ? 0 : this.formRetencion.value.porretserv100;
      const actuRetencion: Partial<Retenciones> = {
         // Solo los campos modificables
         fecharegistro: this.formRetencion.value.fecharegistro,
         idbene: { idbene: this.idproveedor } as Beneficiarios,
         idtabla01: { idtabla01: this.formRetencion.value.idtabla01 } as Tabla01,
         autorizacion: this.formRetencion.value.autorizacion,
         iddocu: { intdoc: this.formRetencion.value.iddocu } as Documentos,
         numdoc: this.formRetencion.value.numdoc,
         fechaemision: this.formRetencion.value.fechaemision,
         numserie: this.formRetencion.value.numserie,
         baseimponible: this.formRetencion.value.baseimponible,
         idtabla17: { idtabla17: this.formRetencion.value.idtabla17 } as Tabla17,
         porciva: Math.round(tabla17!.porciva * 100) / 100,
         baseimpgrav: this.formRetencion.value.baseimpgrav,
         basenograiva: this.formRetencion.value.basenograiva,
         baseimpice: 0,
         montoiva: this.formRetencion.value.montoiva,
         porcentajeice: 0,
         montoice: this.formRetencion.value.montoice,
         //Forma de pago
         idtabla15: refTabla15!,
         //IVA Bienes
         montoivabienes: this.formRetencion.value.montoivabienes,
         idtabla5c_bie: this.formRetencion.value.idtabla5c_bie,
         codretbienes: this.formRetencion.value.codretbienes,
         porretbienes: valorPorretbienes,
         valorretbienes: this.formRetencion.value.valorretbienes,
         //IVA Servicios
         montoivaservicios: this.formRetencion.value.montoivaservicios,
         idtabla5c_ser: this.formRetencion.value.idtabla5c_ser,
         codretservicios: this.formRetencion.value.codretservicios,
         porretservicios: valorPorretservicios,
         valorretservicios: this.formRetencion.value.valorretservicios,
         //IVA 100%
         montoivaserv100: this.formRetencion.value.montoivaserv100,
         idtabla5c_100: this.formRetencion.value.idtabla5c_100,
         codretserv100: this.formRetencion.value.codretserv100,
         porretserv100: valorPorretserv100,
         valretserv100: this.formRetencion.value.valretserv100,

         baseimpair: 0,
         codretair: 'VRS',
         porcentajeair: 0,
         valretair: 0,

         secretencion1: this.formRetencion.value.secretencion1,
         fechaemiret1: this.formRetencion.value.fechaemiret1
      };
      this.actuRetencion(actuRetencion);
   }

   // Actualiza la Retencion y los AIRs en lote y paralelo
   actuRetencion(retencion: Partial<Retenciones>) {
      this.reteService.updateRetencion(this.idrete, retencion).subscribe({
         next: (resp: Retenciones) => {
            const nuevos = this.air.controls
               .filter(fg => fg.dirty && !fg.value.idairxrete)
               .map(fg => fg.value);

            const modificados = this.air.controls
               .filter(fg => fg.dirty && fg.value.idairxrete)
               .map(fg => fg.value);

            this.airxreteService.saveNewAndUpdateModified(nuevos, modificados).subscribe({
               next: () => {
                  this.authService.swal('success', `Retención ${resp.secretencion1} guardada con éxito`);
                  this.regresar();
               },
               error: err => { console.error(err); this.authService.mostrarError('Error al guardar los AIRs', err.error); }
            });
            this.authService.swal('success', `Retención ${resp.secretencion1} actualizada con éxito`);
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al actualizar la Retención', err.error); }
      });
   }

   eliminarAIR(fila: AbstractControl | null) {
      if (!fila) return;
      const valorFila = fila.value;           // TODOS los datos de la fila
      const idairxrete = fila.get('idairxrete')?.value;  // Solo el id
      const airs = this.formRetencion.get('air') as FormArray;
      const indice = airs.controls.indexOf(fila as any); // encuentra el índice real
      //Formato para los valores
      const formato = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      Swal.fire({
         width: '500px',
         title: 'Mensaje',
         text: `Eliminar el AIR de Base: ${formato.format(valorFila.baseimpair)} Valor retenido: ${formato.format(valorFila.valretair)}`,
         icon: 'warning',
         showCancelButton: true,
         confirmButtonText: '<i class="fa fa-check"></i> Aceptar',
         cancelButtonText: '<i class="fa fa-times"></i> Cancelar',
         customClass: {
            popup: 'eliminar',
            title: 'robotobig',
            confirmButton: 'btn btn-success',
            cancelButton: 'btn btn-success'
         },
      }).then((resultado) => {
         if (resultado.isConfirmed) {
            this.airxreteService.deleteAirxrete(idairxrete).subscribe({
               next: () => {
                  this.authService.swal('success', `AIR eliminado con éxito`);
                  airs.removeAt(indice);
               },
               error: err => { console.error(err.error); this.authService.mostrarError('Error al eliminarel AIR', err.error); }
            });
         };
      });
   }

   // Elimina la retencion (Los AIRs se eliminan en CASCADE)
   eliminar() {
      const numretencion = this.formRetencion.value.secretencion1;
      Swal.fire({
         width: '500px',
         title: 'Mensaje',
         text: `Eliminar la Retención Nro: ${numretencion}`,
         icon: 'warning',
         showCancelButton: true,
         confirmButtonText: '<i class="fa fa-check"></i> Aceptar',
         cancelButtonText: '<i class="fa fa-times"></i> Cancelar',
         customClass: {
            popup: 'eliminar',
            title: 'robotobig',
            confirmButton: 'btn btn-success',
            cancelButton: 'btn btn-success'
         },
      }).then((resultado) => {
         if (resultado.isConfirmed) {
            this.reteService.deleteRetencion(this.idrete).subscribe({
               next: () => {
                  this.authService.swal('success', `Retención ${numretencion} eliminado con éxito`);
                  this.regresar();
               },
               error: (err) => {
                  if (err.status === 404) {
                     this.authService.mensaje404(`La Retención ${numretencion} no existe o fue eliminada por otro Usuario`);
                     this.regresar();
                  } else {
                     this.authService.mostrarError('Error al eliminar la Retención', err.error);
                  }
               }
            });

         };
      });
   }

   autorizar() {
      const numretencion = this.formRetencion.value.secretencion1;
      let mensaje = ''; 
      let estado = ''; 
      let timestamp: number | null = null;
      this.reteService.verificar().subscribe({
         next: (resp: any) => {
            estado = resp.status;
            mensaje = resp.mensaje;
            timestamp = resp.timestamp;
            console.log('Respuesta del backend:', resp);
         },
         error: err => {
            console.error('Error llamando al backend:', err);
         }
      });
   }


regresar() { this.router.navigate(['/asientos']); }
cerrar() { this.router.navigate(['/inicio']); }

//Valida que se haya seleccionado un Beneficiario
valBenefi(control: AbstractControl) {
   if (this.idproveedor == null) return of({ 'invalido': true });
   else return of(null);
}

// Valida el período de las fechas
valAño(): AsyncValidatorFn {
   return (control: AbstractControl) => {
      const empresa = this.authService.getDatosEmpresa();
      const añoEmpresa = empresa!.fechap.toString().slice(0, 4);
      const añoControl = control.value?.toString().slice(0, 4);
      if (añoEmpresa !== añoControl) { return of({ añoinvalido: true }); }
      return of(null);
   };
}

// Valida el número de la retencion
valSecretencion1(): AsyncValidatorFn {
   return (control: AbstractControl) => {
      const valorActual = control.value;
      if (valorActual == this.antsecretencion1) { return of(null); }
      return this.reteService.valSecretencion1(valorActual).pipe(map(result => result ? { existe: true } : null));
   };
}

}

interface asientoViewModel {
   asiento: number;
   fecha: Date;
   comprobante: string;
   documento: String;
   beneficiario: String;
   glosa: String;
}
