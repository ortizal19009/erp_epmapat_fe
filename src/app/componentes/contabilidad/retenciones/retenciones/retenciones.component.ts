import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { CorreosEnviadosService } from 'src/app/servicios/administracion/correos-enviados.service';
import { DefinirService } from 'src/app/servicios/administracion/definir.service';
import { AirxreteService } from 'src/app/servicios/contabilidad/airxrete.service';
import { FecReteimpuService } from 'src/app/servicios/contabilidad/fec-reteimpu.service';
import { FecRetencionesService } from 'src/app/servicios/contabilidad/fec-retenciones.service';
import { RetencionesSriService } from 'src/app/servicios/contabilidad/retenciones-sri.service';
import { RetencionesService } from 'src/app/servicios/contabilidad/retenciones.service';
import { FecfacturaService } from 'src/app/servicios/fecfactura.service';

@Component({
   selector: 'app-retenciones',
   templateUrl: './retenciones.component.html',
   styleUrls: ['./retenciones.component.css']
})
export class RetencionesComponent implements OnInit, OnDestroy {

   empresa: any;
   _retenciones: any;
   buscaRetenciones: { desdeSecu: string, hastaSecu: string, desdeFecha: string, hastaFecha: string };
   formBuscar: FormGroup;
   today: number = Date.now();
   date: Date = new Date();
   swdesdehasta: boolean;
   filtro: string;
   filtroEstado: string = '';
   filtroDesdeAut: string = '';
   filtroHastaAut: string = '';
   sumtotal: number = 0;
   seleccionados: number;
   secretencion1: string;
   claveacceso: string;
   swbotones: boolean = true;
   swenviando: boolean;
   txtenviar: string = 'Aceptar';
   accionEnCursoId: number | null = null;
   estadosSri: any[] = [];
   estadosDisponibles = [
      { value: '', label: 'Todos' },
      { value: 'PENDIENTE', label: 'Pendiente' },
      { value: 'GENERADA', label: 'Generada' },
      { value: 'PENDIENTE_AUTORIZACION', label: 'Pendiente autorización' },
      { value: 'AUTORIZADA', label: 'Autorizada' },
      { value: 'ENVIADA', label: 'Enviada' },
      { value: 'ERROR_ENVIO', label: 'Error envío' },
   ];
   retencionCorreoModal: any = null;
   correoOriginalModal: string = '';
   correosModal: string = '';
   guardandoCorreo: boolean = false;
   private retencionesEventSource: EventSource | null = null;
   private streamReconnectTimer: number | null = null;

   constructor(
      private fb: FormBuilder,
      private router: Router,
      public authService: AutorizaService,
      private coloresService: ColoresService,
      private reteService: RetencionesService,
      private fecfacService: FecfacturaService,
      private defService: DefinirService,
      private fec_reteService: FecRetencionesService,
      private fec_reteimpuService: FecReteimpuService,
      private airxreteService: AirxreteService,
      private sriRetencionesService: RetencionesSriService,
      private correosEnviadosService: CorreosEnviadosService,
      private zone: NgZone
   ) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/retenciones');
      const coloresJSON = sessionStorage.getItem('/retenciones');
      if (coloresJSON) {
         this.colocaColor(JSON.parse(coloresJSON));
      } else {
         this.buscaColor();
      }

      const fecha = new Date();
      const anio = fecha.getFullYear();
      this.formBuscar = this.fb.group({
         desdeSecu: '',
         hastaSecu: '',
         desdeFecha: `${anio}-01-01`,
         hastaFecha: `${anio}-12-31`,
      });

      this.buscaRetenciones = JSON.parse(sessionStorage.getItem('buscaRetenciones') || 'null');
      if (this.buscaRetenciones == null) {
         this.ultimaRetencion();
      } else {
         this.formBuscar.patchValue({
            desdeSecu: this.buscaRetenciones.desdeSecu,
            hastaSecu: this.buscaRetenciones.hastaSecu,
            desdeFecha: this.buscaRetenciones.desdeFecha,
            hastaFecha: this.buscaRetenciones.hastaFecha
         });
         this.buscar();
      }

      this.iniciarStreamRetenciones();
   }

   ngOnDestroy(): void {
      this.cerrarStreamRetenciones();
      if (this.streamReconnectTimer !== null) {
         window.clearTimeout(this.streamReconnectTimer);
         this.streamReconnectTimer = null;
      }
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) {
         cabecera.classList.add('nuevoBG1');
      }
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) {
         detalle.classList.add('nuevoBG2');
      }
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

   ultimaRetencion() {
      this.reteService.ultimo().subscribe({
         next: resp => {
            let desde = +resp.secretencion1 - 16;
            if (desde <= 0) {
               desde = 1;
            }
            this.formBuscar.patchValue({
               desdeSecu: desde.toString(),
               hastaSecu: resp.secretencion1.toString(),
            });
            this.buscar();
         },
         error: err => console.error(err.error)
      });
   }

   buscar() {
      this.reteService.getDesdeHasta(
         this.formBuscar.value.desdeSecu,
         this.formBuscar.value.hastaSecu,
         this.formBuscar.value.desdeFecha,
         this.formBuscar.value.hastaFecha
      ).subscribe({
         next: datos => {
            this.buscaRetenciones = {
               desdeSecu: this.formBuscar.value.desdeSecu,
               hastaSecu: this.formBuscar.value.hastaSecu,
               desdeFecha: this.formBuscar.value.desdeFecha,
               hastaFecha: this.formBuscar.value.hastaFecha
            };
            sessionStorage.setItem('buscaRetenciones', JSON.stringify(this.buscaRetenciones));

            this._retenciones = datos;
            this.total();
            this.cargarEstadosSri();
         },
         error: err => console.error(err.error)
      });
   }

   total() {
      let suma: number = 0;
      this.seleccionados = 0;
      this._retenciones.forEach((rete: any) => {
         suma = suma + rete.valorretbienes + rete.valorretservicios + rete.valretserv100 + rete.valretair;
         if (rete.escoge == 1) {
            this.seleccionados = this.seleccionados + 1;
            this.secretencion1 = rete.secretencion1;
         }
      });
      this.sumtotal = suma;
   }

   listainicial() {
      sessionStorage.removeItem('buscaRetenciones');
      this.swdesdehasta = false;
      this.ultimaRetencion();
   }

   changeDesdeHasta() {
      this.swdesdehasta = true;
   }

   changeFiltroEstado() {
      this.cargarEstadosSri();
   }

   changeEscoge(i: number) {
      this.total();
   }

   async datosDefinirAsync() {
      try {
         const def = await this.defService.getByIddefinirAsync(1);
         this.empresa = def;
      } catch (error) {
         console.error('Al recuperar los datos de la Empresa', error);
      }
   }

   async enviar() {
      this.swenviando = true;
      this.txtenviar = 'Enviando';
      this.swbotones = false;
      await this.datosDefinirAsync();
      for (let i = 0; i < this._retenciones.length; i++) {
         if (this._retenciones[i].escoge == 1) {
            const fec_retencion = {} as Fec_retencion;
            fec_retencion.idretencion = this._retenciones[i].idrete;
            this.claveAcceso(i);
            fec_retencion.claveacceso = this.claveacceso;
            fec_retencion.secuencial = padStart(this._retenciones[i].secretencion1, 9);
            fec_retencion.estado = 'I';
            fec_retencion.establecimiento = '001';
            fec_retencion.puntoemision = '001';
            fec_retencion.direccionestablecimiento = this.empresa.direccion;
            fec_retencion.fechaemision = this._retenciones[i].fechaemiret1;
            fec_retencion.tipoidentificacionsujetoretenid = this._retenciones[i].idbene.tpidben;
            fec_retencion.razonsocialsujetoretenido = this._retenciones[i].idbene.nomben;
            fec_retencion.identificacionsujetoretenido = this._retenciones[i].idbene.rucben;
            fec_retencion.periodofiscal = `${this._retenciones[i].fechaemiret1.slice(5, 7)}/${this._retenciones[i].fechaemiret1.slice(0, 4)}`;
            fec_retencion.telefonosujetoretenido = this._retenciones[i].idbene.tlfben;
            fec_retencion.emailsujetoretenido = this._retenciones[i].idbene.mailben;
            this.fec_reteService.saveAsync(fec_retencion);
            await this.AIR(this._retenciones[i]);
            if (this._retenciones[i].valorretbienes != 0) {
               await this.IVA(this._retenciones[i], '1', this._retenciones[i].valorretbienes);
            }
            if (this._retenciones[i].valorretservicios != 0) {
               await this.IVA(this._retenciones[i], '2', this._retenciones[i].valorretservicios);
            }
            if (this._retenciones[i].valretserv100 != 0) {
               await this.IVA(this._retenciones[i], '3', this._retenciones[i].valretserv100);
            }
         }
      }
      this.swenviando = false;
      this.txtenviar = 'Continuar';
   }

   async AIR(retencion: any) {
      try {
         const air = await this.airxreteService.getByIdreteAsync(retencion.idrete);
         air.forEach(async (impuesto, index) => {
            const fec_reteimpu = {} as Fec_reteimpu;
            fec_reteimpu.idretencionesimpuestos = +(retencion.idrete.toString() + index.toString());
            fec_reteimpu.idretencion = retencion.idrete;
            fec_reteimpu.codigo = '1';
            fec_reteimpu.codigoporcentaje = impuesto.idtabla10.codretair;
            fec_reteimpu.baseimponible = impuesto.baseimpair;
            fec_reteimpu.codigodocumentosustento = '01';
            fec_reteimpu.numerodocumentosustento = retencion.numserie + padStart(retencion.numdoc, 9);
            fec_reteimpu.fechaemisiondocumentosustento = retencion.fechaemision;
            try {
               this.fec_reteimpuService.saveAsync(fec_reteimpu);
            } catch (error) {
               console.error('Al guardar AIR en fec_reteimpu: ', error);
            }
         });
      } catch (error) {
         console.error('Al recuperar los AIR', error);
      }
   }

   async IVA(retencion: any, codigoporcentaje: string, monto: number) {
      const fec_reteimpu = {} as Fec_reteimpu;
      fec_reteimpu.idretencionesimpuestos = +(retencion.idrete.toString() + '0' + codigoporcentaje);
      fec_reteimpu.idretencion = retencion.idrete;
      fec_reteimpu.codigo = '2';
      fec_reteimpu.codigoporcentaje = codigoporcentaje;
      fec_reteimpu.baseimponible = monto;
      fec_reteimpu.codigodocumentosustento = '01';
      fec_reteimpu.numerodocumentosustento = retencion.numserie + padStart(retencion.numdoc, 9);
      fec_reteimpu.fechaemisiondocumentosustento = retencion.fechaemision;
      try {
         this.fec_reteimpuService.saveAsync(fec_reteimpu);
      } catch (error) {
         console.error('Al guardar la retención del IVA en fec_reteimpu: ', error);
      }
   }

   continuar() {
      this.swbotones = true;
   }

   claveAcceso(i: number) {
      this.claveacceso = '';
      const retencion = this._retenciones[i];
      const fecha = formatearFecha(1, this._retenciones[i].fechaemiret1);
      const ruc = this.empresa.ruc;
      const ambiente = this.empresa.tipoambiente.toString();
      const serie = this.obtenerSerieRetencion(retencion);
      const secuencial = padStart(this._retenciones[i].secretencion1, 9);
      const codigonumerico = codigoNumerico(secuencial.slice(1, 9));
      const tipoemision = '1';
      this.claveacceso = this.claveacceso + fecha + '07' + ruc + ambiente + serie + secuencial + codigonumerico + tipoemision;
      const verificador = modulo11(this.claveacceso);
      this.claveacceso = this.claveacceso + verificador;
   }

   imprimir() {
      sessionStorage.setItem('retencionesToImpExp', JSON.stringify(this.buscaRetenciones));
      this.router.navigate(['/imp-retenciones']);
   }

   retencionesFiltradas() {
      const texto = (this.filtro || '').toLowerCase().trim();
      return (this._retenciones || []).filter((retencion: any) => {
         const coincideTexto = !texto
            || String(retencion.secretencion1 ?? '').toLowerCase().includes(texto)
            || String(retencion.idbene?.nomben ?? '').toLowerCase().includes(texto)
            || String(retencion.iddocu?.nomdoc ?? '').toLowerCase().includes(texto)
            || String(retencion.numautoriza_e ?? '').toLowerCase().includes(texto)
            || String(retencion.fecautoriza ?? '').toLowerCase().includes(texto)
            || String(this.estadoSri(retencion) ?? '').toLowerCase().includes(texto);
         const estado = this.estadoSri(retencion);
         const coincideEstado = !this.filtroEstado || estado === this.filtroEstado;
         const coincideFechaAut = this.coincideRangoFechaAut(retencion);
         return coincideTexto && coincideEstado && coincideFechaAut;
      });
   }

   async cargarEstadosSri() {
      try {
         this.estadosSri = await firstValueFrom(this.fec_reteService.getLista());
      } catch (error) {
         console.error('No se pudo cargar el estado SRI de retenciones', error);
         this.estadosSri = [];
      }
   }

   private getEstadoSriRegistro(retencion: any): any | null {
      const idretencion = this.getIdRetencion(retencion);
      return this.estadosSri.find((item: any) => Number(item.idretencion) === idretencion) ?? null;
   }

   estadoSri(retencion: any): string {
      const registro = this.getEstadoSriRegistro(retencion);
      if (registro?.estado) {
         return this.normalizarEstadoSri(registro.estado);
      }
      const estadoRetencion = this.normalizarEstadoSri(retencion?.estado);
      if (estadoRetencion) {
         return estadoRetencion;
      }
      if (String(retencion?.numautoriza_e ?? '').trim()) {
         return 'AUTORIZADA';
      }
      return 'PENDIENTE';
   }

   claseEstadoSri(retencion: any): string {
      switch (this.estadoSri(retencion)) {
         case 'GENERADA':
            return 'badge badge-info';
         case 'PENDIENTE_AUTORIZACION':
            return 'badge badge-warning';
         case 'SIN_AUTORIZACION_EN_SRI':
            return 'badge badge-warning';
         case 'YA_AUTORIZADA':
            return 'badge badge-success';
         case 'CLAVE_DUPLICADA':
            return 'badge badge-danger';
         case 'AUTORIZADA':
            return 'badge badge-warning';
         case 'ENVIADA':
            return 'badge badge-success';
         case 'ERROR_ENVIO':
            return 'badge badge-danger';
         default:
            return 'badge badge-secondary';
      }
   }

   estadoSriLabel(retencion: any): string {
      switch (this.estadoSri(retencion)) {
         case 'PENDIENTE_AUTORIZACION':
            return 'Pendiente de autorización';
         case 'SIN_AUTORIZACION_EN_SRI':
            return 'Sin autorización en SRI';
         case 'PENDIENTE':
            return 'Pendiente';
         case 'GENERADA':
            return 'Generada';
         case 'YA_AUTORIZADA':
            return 'Ya autorizada';
         case 'CLAVE_DUPLICADA':
            return 'Clave duplicada';
         case 'AUTORIZADA':
            return 'Autorizada';
         case 'ENVIADA':
            return 'Enviada';
         case 'ERROR_ENVIO':
            return 'Error de envío';
         default:
            return this.estadoSri(retencion) || 'Sin estado';
      }
   }

   puedeGenerarPdf(retencion: any): boolean {
      return this.tieneAutorizacion(retencion);
   }

   puedeReenviarCorreo(retencion: any): boolean {
      return this.tieneAutorizacion(retencion);
   }

   getCorreoRetencion(retencion: any): string {
      const registro = this.getEstadoSriRegistro(retencion);
      const correo = retencion?.idbene?.mailben ?? retencion?.emailsujetoretenido ?? registro?.emailsujetoretenido ?? '';
      return String(correo || '').trim();
   }

   getClaveAccesoRetencion(retencion: any): string {
      const registro = this.getEstadoSriRegistro(retencion);
      const clave = registro?.claveacceso ?? retencion?.claveacceso ?? this.calcularClaveAccesoLocal(retencion);
      return String(clave || '').trim();
   }

   private calcularClaveAccesoLocal(retencion: any): string {
      const fechaRaw = String(retencion?.fechaemiret1 ?? retencion?.fechaemision ?? '').trim();
      const secuencialRaw = String(retencion?.secretencion1 ?? retencion?.secuencial ?? '').trim();
      const ruc = String(this.empresa?.ruc ?? '').trim();
      const ambiente = String(this.empresa?.tipoambiente ?? '').trim();
      if (!fechaRaw || !secuencialRaw || !ruc || !ambiente) {
         return '';
      }

      const fecha = formatearFecha(1, fechaRaw);
      const serie = this.obtenerSerieRetencion(retencion);
      const secuencial = padStart(secuencialRaw, 9);
      const codigonumerico = codigoNumerico(secuencial.slice(1, 9));
      const tipoemision = '1';
      const base = `${fecha}07${ruc}${ambiente}${serie}${secuencial}${codigonumerico}${tipoemision}`;
      return base + modulo11(base);
   }

   private tieneAutorizacion(retencion: any): boolean {
      const numeroAutorizacion = String(retencion?.numautoriza_e ?? retencion?.numautoriza ?? '').trim();
      const fechaAutorizacion = String(retencion?.fecautoriza ?? '').trim();
      return Boolean(numeroAutorizacion && fechaAutorizacion);
   }

   async descargarPdf(retencion: any) {
      const claveAcceso = this.getClaveAccesoRetencion(retencion);
      if (!claveAcceso) {
         this.authService.swal('warning', 'No se pudo identificar la clave de acceso de la retención');
         return;
      }
      if (!this.puedeGenerarPdf(retencion)) {
         this.authService.swal('warning', 'La retención debe estar autorizada para generar el PDF');
         return;
      }
      this.accionEnCursoId = this.getIdRetencion(retencion);
      try {
         const blob = await firstValueFrom(this.sriRetencionesService.generarPdf(claveAcceso));
         const blobUrl = window.URL.createObjectURL(blob);
         const opened = window.open(blobUrl, '_blank');
         if (!opened) {
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `retencion_${this.getSecuencialArchivo(retencion)}.pdf`;
            link.click();
         }
         setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
         this.authService.swal('success', 'PDF generado correctamente');
         await this.cargarEstadosSri();
      } catch (error: any) {
         console.error(error);
         this.authService.swal('error', 'No se pudo generar el PDF');
      } finally {
         this.accionEnCursoId = null;
      }
   }

   async procesarSri(retencion: any) {
      const idretencion = this.getIdRetencion(retencion);
      this.accionEnCursoId = idretencion;
      try {
         const destinatario = this.getCorreoRetencion(retencion);
         const asunto = `Retención ${this.getSecuencialArchivo(retencion)} autorizada`;
         const mensaje = 'Adjuntamos su comprobante de retención autorizado en formato PDF.';
         const resultado = await firstValueFrom(
            this.sriRetencionesService.procesarPorId(idretencion, destinatario, asunto, mensaje)
         );
         const estadoResultado = this.normalizarEstadoSri(resultado?.estado);
         if (estadoResultado === 'PENDIENTE_AUTORIZACION' || estadoResultado === 'PENDIENTE' || estadoResultado === 'SIN_AUTORIZACION_EN_SRI') {
            this.authService.swal(
               'info',
               resultado?.detalle || 'La retención sigue pendiente de autorización. El SRI todavía no devuelve el XML autorizado.'
            );
         } else if (estadoResultado === 'LIMITE_INTENTOS_DIARIO') {
            this.authService.swal(
               'info',
               resultado?.detalle || 'El SRI ya alcanzó el límite diario de intentos para esta retención. Intente nuevamente mañana.'
            );
         } else if (estadoResultado === 'YA_AUTORIZADA' || estadoResultado === 'CLAVE_DUPLICADA') {
            this.authService.swal('info', resultado?.detalle || 'La retención ya fue enviada o la clave de acceso está duplicada.');
         } else {
            this.authService.swal('success', `Retención autorizada y enviada${resultado?.email ? ` a ${resultado.email}` : ''}`);
         }
         await this.cargarEstadosSri();
      } catch (error: any) {
         const estado = this.normalizarEstadoSri(error?.error?.estado);
         const detalle = error?.error?.detalle || error?.error?.error || error?.message || 'No se pudo procesar la retención';
         const correoNoDisponible = estado === 'CORREO_NO_DISPONIBLE' || error?.status === 503 || error?.error?.status === 503;
         if (correoNoDisponible) {
            console.warn(error);
            this.authService.swal('warning', detalle);
         } else {
            console.error(error);
            this.authService.swal('error', detalle);
         }
      } finally {
         this.accionEnCursoId = null;
      }
   }

   async descargarXmlSinFirmar(retencion: any) {
      const idretencion = this.getIdRetencion(retencion);
      if (!idretencion) {
         this.authService.swal('warning', 'No se pudo identificar la retención');
         return;
      }
      this.accionEnCursoId = idretencion;
      try {
         const xml = await firstValueFrom(this.sriRetencionesService.descargarXmlSinFirmarPorId(idretencion));
         const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
         const url = window.URL.createObjectURL(blob);
         const link = document.createElement('a');
         link.href = url;
         link.download = `retencion_${this.getSecuencialArchivo(retencion)}_sin_firmar.xml`;
         link.click();
         setTimeout(() => window.URL.revokeObjectURL(url), 1000);
         this.authService.swal('success', 'XML sin firmar descargado correctamente');
      } catch (error: any) {
         console.error(error);
         this.authService.swal('error', 'No se pudo descargar el XML sin firmar');
      } finally {
         this.accionEnCursoId = null;
      }
   }

   async descargarXml(retencion: any) {
      const claveAcceso = this.getClaveAccesoRetencion(retencion);
      if (!claveAcceso) {
         this.authService.swal('warning', 'No se pudo identificar la clave de acceso de la retención');
         return;
      }
      this.accionEnCursoId = this.getIdRetencion(retencion);
      try {
         const xml = await firstValueFrom(this.sriRetencionesService.descargarXml(claveAcceso));
         const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
         const url = window.URL.createObjectURL(blob);
         const link = document.createElement('a');
         link.href = url;
         link.download = `retencion_${this.getSecuencialArchivo(retencion)}.xml`;
         link.click();
         setTimeout(() => window.URL.revokeObjectURL(url), 1000);
         this.authService.swal('success', 'XML autorizado descargado correctamente');
         await this.cargarEstadosSri();
      } catch (error: any) {
         console.error(error);
         this.authService.swal('error', 'No se pudo descargar el XML autorizado');
      } finally {
         this.accionEnCursoId = null;
      }
   }

   reenviarCorreo(retencion: any) {
      if (!this.puedeReenviarCorreo(retencion)) {
         this.authService.swal('warning', 'La retención todavía no tiene número y fecha de autorización');
         return;
      }
      this.retencionCorreoModal = retencion;
      this.correoOriginalModal = this.normalizeEmailList(this.getCorreoRetencion(retencion)) || '';
      this.correosModal = this.correoOriginalModal;
   }

   normalizarCorreosModal() {
      this.correosModal = this.normalizeEmailList(this.correosModal);
   }

   async confirmarReenvioCorreo() {
      const retencion = this.retencionCorreoModal;
      const idretencion = this.getIdRetencion(retencion);
      const correo = this.normalizeEmailList(this.correosModal).replace(/;+\s*$/g, '');
      if (!correo.trim()) {
         this.authService.swal('warning', 'Debes indicar al menos un correo destino');
         return;
      }

      this.guardandoCorreo = true;
      this.accionEnCursoId = this.getIdRetencion(retencion);
      try {
         const asunto = `Retención ${this.getSecuencialArchivo(retencion)}`;
         const mensaje = 'Adjuntamos su comprobante de retención en formato PDF.';
         const resultado = await firstValueFrom(
            this.sriRetencionesService.reenviarCorreoPorId(idretencion, correo, asunto, mensaje)
         );
         const estadoResultado = this.normalizarEstadoSri(resultado?.estado);
         if (estadoResultado === 'PENDIENTE_AUTORIZACION' || estadoResultado === 'PENDIENTE' || estadoResultado === 'SIN_AUTORIZACION_EN_SRI') {
            this.authService.swal('info', resultado?.detalle || 'La autorización todavía no devuelve XML autorizado.');
            await this.cargarEstadosSri();
            return;
         }
         if (estadoResultado === 'LIMITE_INTENTOS_DIARIO') {
            this.authService.swal(
               'info',
               resultado?.detalle || 'El SRI ya alcanzó el límite diario de intentos para esta retención. Intente nuevamente mañana.'
            );
            await this.cargarEstadosSri();
            return;
         }
         if (estadoResultado === 'YA_AUTORIZADA' || estadoResultado === 'CLAVE_DUPLICADA') {
            this.authService.swal('info', resultado?.detalle || 'La retención ya fue enviada o la clave de acceso está duplicada.');
            await this.cargarEstadosSri();
            return;
         }
         this.authService.swal('success', `Correo enviado a ${correo}`);
         try {
            await firstValueFrom(this.correosEnviadosService.registrarEnvio({
               modulo: 'RETENCIONES',
               documentoid: this.getIdRetencion(retencion),
               documento: 'RETENCION',
               destinatarios: correo,
               asunto,
               remitente: 'msvc-sri',
               archivoadjunto: `retencion_${this.getSecuencialArchivo(retencion)}.pdf, retencion_${this.getSecuencialArchivo(retencion)}.xml`,
               estado: 'ENVIADO',
               detalle: `Reenvio de retencion registrado. emailQueueId=${resultado?.emailQueueId || ''}`
            }));
         } catch (registroError) {
            console.warn('No se pudo registrar el correo en el control de mails', registroError);
         }
         this.retencionCorreoModal = null;
         this.correosModal = '';
         await this.cargarEstadosSri();
      } catch (error: any) {
         const estado = this.normalizarEstadoSri(error?.error?.estado);
         const detalle = error?.error?.detalle || error?.message || 'No se pudo reenviar el correo';
         const correoNoDisponible = estado === 'CORREO_NO_DISPONIBLE' || error?.status === 503 || error?.error?.status === 503;
         if (correoNoDisponible) {
            console.warn(error);
            this.authService.swal('warning', detalle);
         } else {
            console.error(error);
            this.authService.swal('error', 'No se pudo reenviar el correo');
         }
      } finally {
         this.guardandoCorreo = false;
         this.accionEnCursoId = null;
      }
   }

   cerrarModalCorreo() {
      this.retencionCorreoModal = null;
      this.correoOriginalModal = '';
      this.correosModal = '';
   }

   private getIdRetencion(retencion: any): number {
      const valor = retencion?.idrete ?? retencion?.idretencion ?? retencion?.idRetencion ?? 0;
      const id = Number(valor);
      return Number.isFinite(id) ? id : 0;
   }

   private getSecuencialArchivo(retencion: any): string {
      const raw = retencion?.secretencion1 ?? retencion?.secuencial ?? this.getIdRetencion(retencion);
      const texto = String(raw ?? '').replace(/\D/g, '');
      return texto || String(this.getIdRetencion(retencion));
   }

   private obtenerSerieRetencion(retencion: any): string {
      const serieRaw = String(retencion?.numserie ?? retencion?.serie ?? '').replace(/\D/g, '');
      if (serieRaw.length >= 6) {
         return serieRaw.slice(0, 6);
      }
      if (serieRaw.length > 0) {
         return serieRaw.padStart(6, '0');
      }
      return '001001';
   }

   private normalizeEmailList(value: string): string {
      return String(value || '')
         .replace(/\s+/g, ';')
         .replace(/;+/g, ';')
         .replace(/;\s*;/g, ';')
         .replace(/^;|;$/g, '')
         .trim();
   }

   private coincideRangoFechaAut(retencion: any): boolean {
      const fechaAut = this.fechaComparable(retencion?.fecautoriza);
      if (!fechaAut) {
         return !this.filtroDesdeAut && !this.filtroHastaAut;
      }

      const desde = this.fechaComparable(this.filtroDesdeAut);
      const hasta = this.fechaComparable(this.filtroHastaAut);

      if (desde && fechaAut < desde) {
         return false;
      }
      if (hasta && fechaAut > hasta) {
         return false;
      }
      return true;
   }

   private fechaComparable(value: any): Date | null {
      if (!value) {
         return null;
      }
      const fecha = new Date(value);
      if (Number.isNaN(fecha.getTime())) {
         return null;
      }
      return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
   }

   private normalizarEstadoSri(estado: any): string {
      const texto = String(estado ?? '').trim().toUpperCase();
      if (!texto) {
         return '';
      }
      if (texto.includes('PENDIENTE_AUTORIZACION')) {
         return 'PENDIENTE_AUTORIZACION';
      }
      if (texto.includes('LIMITE_INTENTOS_DIARIO')) {
         return 'LIMITE_INTENTOS_DIARIO';
      }
      if (texto.includes('SIN_AUTORIZACION_EN_SRI')) {
         return 'SIN_AUTORIZACION_EN_SRI';
      }
      if (texto.includes('PENDIENTE')) {
         return 'PENDIENTE';
      }
      if (texto.includes('AUTORIZADA')) {
         return 'AUTORIZADA';
      }
      if (texto.includes('GENERADA')) {
         return 'GENERADA';
      }
      if (texto.includes('ENVIADA')) {
         return 'ENVIADA';
      }
      if (texto.includes('ERROR')) {
         return 'ERROR_ENVIO';
      }
      return texto;
   }

   private iniciarStreamRetenciones(): void {
      this.cerrarStreamRetenciones();
      try {
         this.retencionesEventSource = this.sriRetencionesService.streamRetenciones();
         this.retencionesEventSource.addEventListener('retencion.actualizada', (event: MessageEvent) => {
            this.zone.run(() => {
               try {
                  const payload = JSON.parse(event.data || '{}');
                  this.procesarActualizacionRetencion(payload);
               } catch (error) {
                  console.error('No se pudo procesar el evento SSE de retenciones', error);
               }
            });
         });
         this.retencionesEventSource.onerror = (error) => {
            console.warn('SSE retenciones desconectado, reintentando...', error);
            this.cerrarStreamRetenciones();
            if (this.streamReconnectTimer !== null) {
               window.clearTimeout(this.streamReconnectTimer);
            }
            this.streamReconnectTimer = window.setTimeout(() => {
               this.streamReconnectTimer = null;
               this.iniciarStreamRetenciones();
            }, 5000);
         };
      } catch (error) {
         console.error('No se pudo iniciar el SSE de retenciones', error);
      }
   }

   private cerrarStreamRetenciones(): void {
      if (this.retencionesEventSource) {
         this.retencionesEventSource.close();
         this.retencionesEventSource = null;
      }
   }

   private async procesarActualizacionRetencion(payload: any): Promise<void> {
      const idretencion = Number(payload?.idretencion ?? 0);
      if (!idretencion) {
         return;
      }

      const retencion = (this._retenciones || []).find((item: any) => this.getIdRetencion(item) === idretencion);
      if (retencion) {
         if (payload?.estado) {
            retencion.estado = payload.estado;
         }
         if (payload?.claveAcceso) {
            retencion.claveacceso = payload.claveAcceso;
         }
         if (payload?.numeroAutorizacion) {
            retencion.numautoriza = payload.numeroAutorizacion;
            retencion.numautoriza_e = payload.numeroAutorizacion;
         }
         if (payload?.fechaAutorizacion) {
            retencion.fecautoriza = payload.fechaAutorizacion;
         }
      }

      await this.cargarEstadosSri();
   }
}

interface Fec_retencion {
   idretencion: number;
   claveacceso: String;
   secuencial: String;
   xmlautorizado: String;
   errores: String;
   estado: String;
   establecimiento: String;
   puntoemision: String;
   direccionestablecimiento: String;
   fechaemision: Date;
   tipoidentificacionsujetoretenid: String;
   razonsocialsujetoretenido: String;
   identificacionsujetoretenido: String;
   periodofiscal: String;
   telefonosujetoretenido: String;
   emailsujetoretenido: String;
}

interface Fec_reteimpu {
   idretencionesimpuestos: number;
   idretencion: number;
   codigo: string;
   codigoporcentaje: string;
   baseimponible: number;
   codigodocumentosustento: string;
   numerodocumentosustento: string;
   fechaemisiondocumentosustento: Date;
}

function formatearFecha(opcion: number, fecha: string): string {
   const dia = fecha.slice(8, 10);
   const mes = fecha.slice(5, 7);
   const anio = fecha.slice(0, 4);
   if (opcion == 1) {
      return `${dia}${mes}${anio}`;
   }
   return `${dia}/${mes}/${anio}`;
}

function codigoNumerico(as_numero: string): string {
   let ls_rtn = '';
   for (let li_i = as_numero.length - 1; li_i >= 0; li_i--) {
      ls_rtn += as_numero.charAt(li_i);
   }
   return ls_rtn;
}

function modulo11(as_clave: string): string {
   let ls_evalc = '';
   for (let li_i = 47; li_i >= 0; li_i--) {
      ls_evalc += as_clave.charAt(li_i);
   }

   let ll_kont = 0;
   let ll_total = 0;
   const multiplicadores = [2, 3, 4, 5, 6, 7];
   for (let li_i = 0; li_i < ls_evalc.length; li_i++) {
      const ll_numero = parseInt(ls_evalc.charAt(li_i), 10);
      const ll_producto = ll_numero * multiplicadores[ll_kont];
      ll_total += ll_producto;
      ll_kont = (ll_kont + 1) % 6;
   }

   const ll_residuo = ll_total % 11;
   const ll_rtn = 11 - ll_residuo;
   switch (ll_rtn) {
      case 11:
         return '0';
      case 10:
         return '1';
      default:
         return ll_rtn.toString();
   }
}

function padStart(value: string, targetLength: number): string {
   const padding = '0'.repeat(targetLength - value.length);
   return padding + value;
}
