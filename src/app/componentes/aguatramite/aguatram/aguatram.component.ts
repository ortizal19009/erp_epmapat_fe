import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Abonados } from 'src/app/modelos/abonados';
import { Aguatramite } from 'src/app/modelos/aguatramite.model';
import { Categoria } from 'src/app/modelos/categoria.model';
import { Clientes } from 'src/app/modelos/clientes';
import { Estadom } from 'src/app/modelos/estadom.model';
import { Facturamodificaciones } from 'src/app/modelos/facturamodificaciones.model';
import { Rutas } from 'src/app/modelos/rutas.model';
import { Tipotramite } from 'src/app/modelos/tipotramite.model';
import { TramiteNuevo } from 'src/app/modelos/tramite-nuevo';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { AboxsuspensionService } from 'src/app/servicios/aboxsuspension.service';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { AguatramiteService } from 'src/app/servicios/aguatramite.service';
import { CategoriaService } from 'src/app/servicios/categoria.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { FacturamodificacionesService } from 'src/app/servicios/facturamodificaciones.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { OutboxAttachment, OutboxEmailService } from 'src/app/servicios/outbox-email.service';
import { TramiteNuevoService } from 'src/app/servicios/tramite-nuevo.service';
import { TramitesAguaService } from 'src/app/servicios/tramites-agua.service';
import Swal from 'sweetalert2';

declare var bootstrap: any;

@Component({
   selector: 'app-aguatram',
   templateUrl: './aguatram.component.html',
   styleUrls: ['./aguatram.component.css'],
})
export class AguatramComponent implements OnInit {
   aguatamshow = true;
   retMedidor = false;
   suspMedidor = false;
   cambioCategoria = false;
   cambioMedidor = false;
   cambioPropietario = false;
   cambioResponsablePago = false;
   btnActivate = true;
   f_datos!: FormGroup;
   f_categoria!: FormGroup;
   f_nMedidor!: FormGroup;
   f_retiroMedidor!: FormGroup;
   f_camPropietario!: FormGroup;
   f_camMedidor!: FormGroup;
   filterTerm!: string;
   filterClient!: string;
   categorias: any;
   selectClient: Clientes = new Clientes();
   titulo = 'Formulario de tramites de Agua';
   abonados: any;
   abonado: Abonados = new Abonados();
   cliente: Clientes = new Clientes();
   estadom: Estadom = new Estadom();
   categoria: Categoria = new Categoria();
   tramitenuevo: TramiteNuevo = new TramiteNuevo();
   ruta: Rutas = new Rutas();
   date: Date = this.obtenerFechaActualLocal();
   tipoTramite: Tipotramite = new Tipotramite();
   observaciones = '';
   opciones = [
      { opcion: 'Cuenta', valor: 1 },
      { opcion: 'Nombre o apellido', valor: 2 },
      { opcion: 'Identificación', valor: 3 },
   ];
   _documentos: any;
   _facturas: any = [];
   aguatramite: Aguatramite = new Aguatramite();
   swActualizar = true;
   private modalConfirmacion: any | null = null;
   procesandoTramite = false;
   correosTramiteActual: string[] = [];

   constructor(
      private actRouter: ActivatedRoute,
      private fb: FormBuilder,
      private s_abonados: AbonadosService,
      private s_aboxdsuspension: AboxsuspensionService,
      private s_categorias: CategoriaService,
      private router: Router,
      private s_tramitenuevo: TramiteNuevoService,
      private s_tramiteagua: TramitesAguaService,
      private s_aguatramite: AguatramiteService,
      private authService: AutorizaService,
      private s_documentos: DocumentosService,
      private s_facturas: FacturaService,
      private s_facturasModi: FacturamodificacionesService,
      private s_loading: LoadingService,
      private s_lecturas: LecturasService,
      private outboxEmailService: OutboxEmailService
   ) { }

   private obtenerFechaActualLocal(): Date {
      const ahora = new Date();
      return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 12, 0, 0, 0);
   }

   private formatearFechaInput(fecha: Date): string {
      const anio = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const dia = String(fecha.getDate()).padStart(2, '0');
      return `${anio}-${mes}-${dia}`;
   }

   private normalizarFechaLocal(valor?: string | Date | null): Date {
      if (!valor) {
         return this.obtenerFechaActualLocal();
      }

      if (valor instanceof Date) {
         return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate(), 12, 0, 0, 0);
      }

      const [anio, mes, dia] = valor.split('-').map(Number);
      if (!anio || !mes || !dia) {
         return this.obtenerFechaActualLocal();
      }

      return new Date(anio, mes - 1, dia, 12, 0, 0, 0);
   }

   ngOnInit(): void {
      const modalEl = document.getElementById('modalConfirmacion');
      if (modalEl) {
         this.modalConfirmacion = new bootstrap.Modal(modalEl);
      }
      this.estadom.usucrea = this.authService.idusuario;
      this.tramitenuevo.usucrea = this.authService.idusuario;

      sessionStorage.setItem('ventana', '/aguatramite');
      const coloresJSON = sessionStorage.getItem('/aguatramite');
      if (coloresJSON) {
         this.colocaColor(JSON.parse(coloresJSON));
      }

      const id = this.actRouter.snapshot.paramMap.get('id');
      this.tipoTramite.idtipotramite = +id!;
      switch (+id!) {
         case 1:
            this.aguatamshow = false;
            break;
         case 2:
            this.titulo = 'Retiro de medidor - taponamiento';
            this.retMedidor = true;
            break;
         case 3:
            this.titulo = 'Suspender medidor';
            this.suspMedidor = true;
            break;
         case 4:
            this.titulo = 'Cambio de medidor';
            this.cambioMedidor = true;
            break;
         case 5:
            this.titulo = 'Cambio de propietario';
            this.cambioPropietario = true;
            break;
         case 10:
            this.titulo = 'Cambio de responsable de pago';
            this.cambioResponsablePago = true;
            break;
         case 6:
            this.titulo = 'Traspaso de medidor';
            break;
         case 7:
            this.titulo = 'Habilitación de cuenta';
            break;
         case 8:
            this.titulo = 'Nuevo medidor (sin derechos de agua)';
            break;
         case 9:
            this.titulo = 'Cambio de Categoría';
            this.cambioCategoria = true;
            break;
         default:
            this.aguatamshow = true;
            break;
      }

      this.f_datos = this.fb.group({ tipoBusqueda: 1, buscarAbonado: '' });
      this.f_categoria = this.fb.group({
         idcategoria_categorias: [1, Validators.required],
         adultomayor: false,
         municipio: false,
         observaciones: ['', Validators.required],
         iddocumento_documentos: [1, Validators.required],
         nrodocumento: ['', Validators.required]
      });
      this.f_nMedidor = this.fb.group({
         medidormarca: ['', Validators.required],
         medidornumero: ['', Validators.required],
         codmedidor: ['', Validators.required],
         medidordiametro: ['', Validators.required],
         medidornroesferas: ['', Validators.required],
         observaciones: ['', Validators.required],
         iddocumento_documentos: [1, Validators.required],
         nrodocumento: ['', Validators.required]
      });
      this.f_retiroMedidor = this.fb.group({
         ubimedidor: ['', Validators.required],
         fecmedidor: ['', Validators.required],
         iddocumento_documentos: 1,
         nrodocumento: ''
      });
      this.f_camPropietario = this.fb.group({
         cliente: '',
         observaciones: ['', Validators.required],
         iddocumento_documentos: [1, Validators.required],
         nrodocumento: ['', Validators.required],
      });
      this.f_retiroMedidor.patchValue({
         fecmedidor: this.formatearFechaInput(this.date)
      });
      this.listarCategorias();
      this.listDocumentos();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1');
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   listarCategorias() {
      this.s_categorias.getListCategoria().subscribe({
         next: (datos) => this.categorias = datos,
         error: (e) => console.error(e),
      });
   }

   listDocumentos() {
      this.s_documentos.getListaDocumentos().subscribe({
         next: (documentos: any) => this._documentos = documentos,
         error: (e: any) => console.error(e)
      });
   }

   async retiroMedidor() {
      const abonado: Abonados = this.abonado;
      if (abonado.estado === 1 || abonado.estado === 2) {
         const correos = await this.confirmarTramiteConCorreo(
            'Retiro de medidor',
            `Cuenta ${abonado.idabonado} - Medidor ${abonado.nromedidor || 'SN'}`,
            abonado.idcliente_clientes?.email
         );
         if (!correos) return;

         abonado.estado = 3;
         this.date = this.normalizarFechaLocal(this.f_retiroMedidor.value.fecmedidor);
         this.observaciones = this.f_retiroMedidor.value.ubimedidor;
         this.aguatramite.nrodocumento = this.f_retiroMedidor.value.nrodocumento;
         this.aguatramite.iddocumento_documentos = +this.f_retiroMedidor.value.iddocumento_documentos!;
         const tramite = await this.guardarAguaTramite(abonado, abonado.nromedidor);
         await this.enviarCorreoComprobante(tramite, correos);
         this.actualizarAbonado(abonado);
      } else if (abonado.estado === 3) {
         alert('CUENTA TAPONADA');
      } else if (abonado.estado === 0) {
         alert('CUENTA ELIMINADA');
      }
   }

   async suspenderMedidor() {
      const abonado: Abonados = this.abonado;
      if (abonado.estado === 3) {
         alert('ESTE MEDIDOR ESTA TAPONADO');
      } else {
         const correos = await this.confirmarTramiteConCorreo(
            'Suspender medidor',
            `Cuenta ${abonado.idabonado} - Cliente ${abonado.idcliente_clientes?.nombre || ''}`,
            abonado.idcliente_clientes?.email
         );
         if (!correos) return;

         abonado.estado = 2;
         this.actualizarAbonado(abonado);
         const tramite = await this.guardarAguaTramite(abonado, null);
         await this.enviarCorreoComprobante(tramite, correos);
      }
   }

   actualizarAbonado(abonado: Abonados) {
      abonado.usumodi = this.authService.idusuario;
      abonado.fecmodi = this.obtenerFechaActualLocal();
      const observacion = this.observaciones || 'Trámite de agua';
      this.s_abonados.updateAbonadoAuditoria(abonado, this.authService.idusuario, observacion, 'MODIFICACION').subscribe({
         next: () => this.regresar(),
         error: (e) => console.error(e),
      });
   }

   async actualizarCategoria() {
      if (this.f_categoria.invalid) {
         this.f_categoria.markAllAsTouched();
         this.swal('warning', 'Completa los datos del cambio de categoría');
         return;
      }
      const correos = await this.confirmarTramiteConCorreo(
         'Cambio de categoría',
         `Cuenta ${this.abonado.idabonado} - Nueva categoría ${this.f_categoria.value.idcategoria_categorias?.descripcion || ''}`,
         this.abonado.idcliente_clientes?.email
      );
      if (!correos) return;

      this.abonado.idcategoria_categorias = this.f_categoria.value.idcategoria_categorias;
      this.abonado.adultomayor = this.f_categoria.value.adultomayor;
      this.abonado.municipio = this.f_categoria.value.municipio;
      this.aguatramite.nrodocumento = this.f_categoria.value.nrodocumento;
      this.aguatramite.iddocumento_documentos = +this.f_categoria.value.iddocumento_documentos!;
      this.observaciones = this.f_categoria.value.observaciones;
      this.actualizarAbonado(this.abonado);
      const tramite = await this.guardarAguaTramite(this.abonado, null);
      await this.enviarCorreoComprobante(tramite, correos);
   }

   regresar() {
      this.router.navigate(['aguatramite']);
   }

   compareCategoria(o1: Categoria, o2: Categoria): boolean {
      if (o1 === undefined && o2 === undefined) return true;
      return o1 === null || o2 === null || o1 === undefined || o2 === undefined
         ? false
         : o1.idcategoria == o2.idcategoria;
   }

   async actualizarNuevoMedidor() {
      if (this.f_nMedidor.invalid) {
         this.f_nMedidor.markAllAsTouched();
         this.swal('warning', 'Completa los datos del nuevo medidor');
         return;
      }
      const correos = await this.confirmarTramiteConCorreo(
         'Cambio de medidor',
         `Cuenta ${this.abonado.idabonado} - Nuevo medidor ${this.f_nMedidor.value.medidornumero || ''}`,
         this.abonado.idcliente_clientes?.email
      );
      if (!correos) return;

      this.abonado.marca = this.f_nMedidor.value.medidormarca;
      this.abonado.nromedidor = this.f_nMedidor.value.medidornumero;
      this.abonado.lecturainicial = 0;
      this.observaciones = this.f_nMedidor.value.observaciones;
      this.aguatramite.nrodocumento = this.f_nMedidor.value.nrodocumento;
      this.aguatramite.iddocumento_documentos = +this.f_nMedidor.value.iddocumento_documentos!;
      this.actualizarAbonado(this.abonado);
      const tramite = await this.guardarAguaTramite(this.abonado, this.f_nMedidor.value.codmedidor);
      await this.enviarCorreoComprobante(tramite, correos);
      this.regresar();
   }

   get f() {
      return this.f_nMedidor.controls;
   }

   get fp() {
      return this.f_camPropietario.controls;
   }

   async guardarAguaTramite(abonado: Abonados, codmedidor: any): Promise<Aguatramite> {
      const fechaRegistro = this.normalizarFechaLocal(this.date);
      this.date = fechaRegistro;
      this.aguatramite.codmedidor = codmedidor;
      this.aguatramite.comentario = '';
      this.aguatramite.estado = 3;
      this.aguatramite.sistema = 0;
      this.aguatramite.fechaterminacion = fechaRegistro;
      this.aguatramite.observacion = this.observaciones;
      this.aguatramite.idtipotramite_tipotramite = this.tipoTramite;
      this.aguatramite.idcliente_clientes = abonado.idcliente_clientes;
      this.aguatramite.usucrea = this.authService.idusuario;
      this.aguatramite.feccrea = fechaRegistro;
      try {
         const datos = await firstValueFrom(this.s_aguatramite.saveAguaTramite(this.aguatramite)) as Aguatramite;
         await this.s_tramiteagua.genContratoTramite(datos, this.abonado, this.titulo);
         this.swal('success', 'Datos guardados con exito');
         return datos;
      } catch (e) {
         console.error(e);
         this.swal('error', 'Error al guardar tramite de agua');
         throw e;
      }
   }

   setClient(cliente: any) {
      this.selectClient = cliente;
   }

   confCambioPropietario() {
      if (this._facturas.length === 0) {
         this.procesandoTramite = true;
         this.actualizarPropietario();
      } else {
         this.modalConfirmacion?.show();
      }
   }

   confCambioResponsablePago() {
      if (this._facturas.length === 0) {
         this.procesandoTramite = true;
         this.actualizarResponsablePago();
      } else {
         this.modalConfirmacion?.show();
      }
   }

   async actualizarPropietario() {
      this.s_loading.showLoading();
      try {
         this.abonado.idcliente_clientes = this.selectClient;
         this.abonado.idresponsable = this.selectClient;
         this.observaciones = this.f_camPropietario.value.observaciones;
         this.aguatramite.nrodocumento = this.f_camPropietario.value.nrodocumento;
         this.aguatramite.iddocumento_documentos = +this.f_camPropietario.value.iddocumento_documentos!;
         if (this.swActualizar) await this.actualizarFacturas();

         this.actualizarAbonado(this.abonado);
         const tramite = await this.guardarAguaTramite(this.abonado, null);
         await this.enviarCorreoComprobante(tramite, this.correosTramiteActual);
         this.modalConfirmacion?.hide();
         this.swal('success', 'Datos guardados y actualizados');
      } finally {
         this.procesandoTramite = false;
         this.correosTramiteActual = [];
         this.s_loading.hideLoading();
      }
   }

   async actualizarResponsablePago() {
      this.s_loading.showLoading();
      try {
         this.abonado.idresponsable = this.selectClient;
         this.observaciones = this.f_camPropietario.value.observaciones;
         this.aguatramite.nrodocumento = this.f_camPropietario.value.nrodocumento;
         this.aguatramite.iddocumento_documentos = +this.f_camPropietario.value.iddocumento_documentos!;
         if (this.swActualizar) await this.actualizarFacturas();

         this.actualizarAbonado(this.abonado);
         const tramite = await this.guardarAguaTramite(this.abonado, null);
         await this.enviarCorreoComprobante(tramite, this.correosTramiteActual);
         this.modalConfirmacion?.hide();
         this.swal('success', 'Responsable de pago actualizado');
      } finally {
         this.procesandoTramite = false;
         this.correosTramiteActual = [];
         this.s_loading.hideLoading();
      }
   }

   async actualizarFacturas(): Promise<void> {
      const facturas: any[] = this._facturas;
      const actividadAuditoria = this.cambioResponsablePago
         ? `CAMBIO DE RESPONSABLE DE PAGO CUENTA ${this.abonado?.idabonado ?? ''}`
         : `CAMBIO DE PROPIETARIO CUENTA ${this.abonado?.idabonado ?? ''}`;
      const tipoCambio = this.cambioResponsablePago ? 'RESPONSABLE_PAGO' : 'PROPIETARIO';

      const promesas = facturas.map(async (item: any) => {
         const facturaModi = new Facturamodificaciones();
         const factura: any = await this.s_facturas.getByIdAsync(item.idfactura);

         facturaModi.idfactura = item.idfactura;
         facturaModi.datosfactura = JSON.stringify(item);
         facturaModi.detalle = JSON.stringify({
            tipoCambio,
            actividad: actividadAuditoria,
            cuenta: this.abonado?.idabonado ?? null,
            clienteAnterior: this.abonado?.idcliente_clientes?.idcliente ?? null,
            responsableAnterior: this.abonado?.idresponsable?.idcliente ?? null,
            clienteNuevo: this.cambioPropietario ? this.selectClient?.idcliente ?? null : null,
            responsableNuevo: this.selectClient?.idcliente ?? null,
            observacion: this.f_camPropietario.value.observacion,
            documento: this.f_camPropietario.value.nrodocumento
         });
         facturaModi.fechacrea = this.normalizarFechaLocal(this.date);

         await lastValueFrom(this.s_facturasModi.saveFacturacionModificaciones(facturaModi));

         factura.idcliente = this.selectClient;
         factura.usumodi = this.authService.idusuario;
         factura.fecmodi = this.normalizarFechaLocal(this.date);
         await this.s_facturas.saveFacturaAsync(factura);

         const lecturas = await this.s_lecturas.getByIdfacturaAsync(item.idfactura);
         if (Array.isArray(lecturas) && lecturas.length > 0) {
            await Promise.all(
               lecturas.map(async (lectura: any) => {
                  lectura.idresponsable = this.selectClient.idcliente;
                  lectura.usumodi = this.authService.idusuario;
                  lectura.fecmodi = this.normalizarFechaLocal(this.date);
                  if (this.cambioPropietario && lectura.idabonado_abonados) {
                     lectura.idabonado_abonados.idcliente_clientes = this.selectClient;
                  }
                  await this.s_lecturas.updateLecturaAsync(lectura.idlectura, lectura);
               })
            );
         }
      });

      await Promise.all(promesas);
   }

   async setAbonado(abonado: any) {
      this.abonado = abonado;
      this.cliente = abonado.idcliente_clientes;
      this.ruta = abonado.idruta_rutas;
      this.categoria = abonado.idcategoria_categorias;
      this.estadom = abonado.idestadom_estadom;

      this.f_categoria.patchValue({
         idcategoria_categorias: abonado.idcategoria_categorias,
         adultomayor: abonado.adultomayor,
         municipio: abonado.municipio,
      });
      if (this.cambioPropietario || this.cambioResponsablePago) {
         const facturas: any = await this.s_facturas.getAllFacturasByCuenta(abonado.idabonado);
         this.swal('warning', `Cuenta con ${facturas.length} facturas pendientes`);
         this._facturas = facturas;
      }
   }

   get etiquetaCambioTitular(): string {
      return this.cambioResponsablePago ? 'Datos del nuevo responsable de pago' : 'Datos del nuevo propietario';
   }

   get etiquetaSeleccionTitular(): string {
      return this.cambioResponsablePago ? 'Nuevo responsable de pago' : 'Nuevo propietario';
   }

   get mensajeConfirmacionFacturas(): string {
      return this.cambioResponsablePago
         ? 'Desea modificar el responsable de pago de las facturas?'
         : 'Desea modificar el propietario y responsable de pago de las facturas?';
   }

   get notaConfirmacionFacturas(): string {
      return this.cambioResponsablePago
         ? `*NOTA: A las ${this._facturas.length} planillas pendientes se les modificará el responsable de pago.`
         : `*NOTA: A las ${this._facturas.length} planillas pendientes se les modificará el propietario/responsable de pago.`;
   }

   async confirmarCambioTitularidad(): Promise<void> {
      if (this.f_camPropietario.invalid) {
         this.f_camPropietario.markAllAsTouched();
         this.swal('warning', 'Completa la información requerida');
         return;
      }
      const destino = this.selectClient?.email || this.abonado?.idcliente_clientes?.email;
      const correos = await this.confirmarTramiteConCorreo(
         this.cambioResponsablePago ? 'Cambio de responsable de pago' : 'Cambio de propietario',
         `Cuenta ${this.abonado.idabonado} - ${this.selectClient?.nombre || 'Cliente no seleccionado'}`,
         destino
      );
      if (!correos) return;

      this.correosTramiteActual = correos;
      if (this.cambioResponsablePago) {
         this.confCambioResponsablePago();
         return;
      }
      this.confCambioPropietario();
   }

   aceptarCambioTitularidad(): void {
      this.procesandoTramite = true;
      if (this.cambioResponsablePago) {
         this.actualizarResponsablePago();
         return;
      }
      this.actualizarPropietario();
   }

   cancelarConfirmacionTitularidad(): void {
      this.procesandoTramite = false;
      this.correosTramiteActual = [];
      this.modalConfirmacion?.hide();
   }

   private async confirmarTramiteConCorreo(
      titulo: string,
      detalle: string,
      correoPorDefecto?: String | null
   ): Promise<string[] | null> {
      const resultado = await Swal.fire({
         title: titulo,
         icon: 'question',
         html: `
            <div class="text-left">
               <p><strong>Detalle:</strong> ${detalle}</p>
               <p class="mb-2">Confirma el trámite y, si lo deseas, ajusta el correo del cliente.</p>
            </div>
         `,
         input: 'text',
         inputLabel: 'Correo(s) de notificación',
         inputValue: correoPorDefecto ? String(correoPorDefecto) : '',
         inputPlaceholder: 'cliente@correo.com; copia@correo.com',
         showCancelButton: true,
         confirmButtonText: 'Aceptar',
         cancelButtonText: 'Cancelar',
         preConfirm: (value) => {
            const correos = this.parseRecipients(value || '');
            if (!correos.length) {
               Swal.showValidationMessage('Ingresa al menos un correo');
               return null;
            }
            if (correos.some((correo) => !this.isValidEmail(correo))) {
               Swal.showValidationMessage('Revisa el formato de los correos');
               return null;
            }
            return correos;
         },
      });

      return resultado.isConfirmed ? (resultado.value as string[]) : null;
   }

   private async enviarCorreoComprobante(aguatramite: Aguatramite, correos: string[]): Promise<void> {
      if (!correos?.length) return;

      const comprobante = await this.s_tramiteagua.buildComprobanteTramiteBlob(aguatramite);
      const attachments: OutboxAttachment[] = [
         await this.fileToAttachment(
            comprobante,
            `comprobante-tramite-${aguatramite.idaguatramite || 'agua'}.pdf`
         ),
      ];

      await firstValueFrom(
         this.outboxEmailService.sendNotificationEmail({
            to: correos,
            subject: `Comprobante de trámite de agua #${aguatramite.idaguatramite}`,
            html: this.buildHtmlCorreoComprobante(aguatramite),
            text:
               `Adjuntamos el comprobante del trámite de agua #${aguatramite.idaguatramite}. ` +
               `Cliente: ${aguatramite?.idcliente_clientes?.nombre || ''}.`,
            attachments,
         })
      );

      this.swal('success', `Correo enviado a: ${correos.join(', ')}`);
   }

   private parseRecipients(value: string): string[] {
      return String(value || '')
         .split(/[;,]/)
         .map((item) => item.trim())
         .filter(Boolean);
   }

   private isValidEmail(value: string): boolean {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
   }

   private async fileToAttachment(file: Blob, fileName: string): Promise<OutboxAttachment> {
      const base64 = await this.blobToBase64(file);
      return {
         name: fileName,
         contentType: file.type || 'application/pdf',
         base64,
      };
   }

   private blobToBase64(blob: Blob): Promise<string> {
      return new Promise((resolve, reject) => {
         const reader = new FileReader();
         reader.onloadend = () => {
            const result = reader.result;
            if (typeof result !== 'string') {
               reject(new Error('No se pudo convertir el archivo adjunto'));
               return;
            }
            resolve(result.split(',')[1] || '');
         };
         reader.onerror = () => reject(reader.error);
         reader.readAsDataURL(blob);
      });
   }

   private buildHtmlCorreoComprobante(aguatramite: Aguatramite): string {
      return `
         <div style="font-family: Arial, Helvetica, sans-serif; background:#f4f7fb; padding:24px; color:#1f2937;">
            <div style="max-width:700px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #dbe4ee;">
               <div style="background:#1d4ed8; color:#ffffff; padding:20px 24px;">
                  <h2 style="margin:0; font-size:22px;">Comprobante de trámite de agua</h2>
                  <p style="margin:8px 0 0 0; font-size:14px;">EPMAPA-T</p>
               </div>
               <div style="padding:24px;">
                  <p style="margin-top:0;">Estimado/a <strong>${aguatramite?.idcliente_clientes?.nombre || 'cliente'}</strong>,</p>
                  <p>Se procesó correctamente su solicitud.</p>
                  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px; margin:16px 0;">
                     <p style="margin:0 0 8px 0;"><strong>Nro. de trámite:</strong> ${aguatramite?.idaguatramite || ''}</p>
                     <p style="margin:0 0 8px 0;"><strong>Tipo:</strong> ${this.titulo}</p>
                     <p style="margin:0 0 8px 0;"><strong>Cliente:</strong> ${aguatramite?.idcliente_clientes?.nombre || 'No registrado'}</p>
                     <p style="margin:0;"><strong>Observación:</strong> ${aguatramite?.observacion || 'Sin observaciones'}</p>
                  </div>
                  <p>Adjuntamos el comprobante del trámite para su respaldo.</p>
                  <p style="margin-bottom:0;">Gracias por utilizar nuestros servicios.</p>
               </div>
            </div>
         </div>
      `;
   }

   swal(icon: any, mensaje: any) {
      Swal.fire({
         toast: true,
         icon,
         title: mensaje,
         position: 'top-end',
         showConfirmButton: false,
         timer: 3500,
      });
   }
}
