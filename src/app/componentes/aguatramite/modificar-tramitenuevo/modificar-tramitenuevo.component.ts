import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Abonados } from 'src/app/modelos/abonados';
import { Aguatramite } from 'src/app/modelos/aguatramite.model';
import { Categoria } from 'src/app/modelos/categoria.model';
import { Estadom } from 'src/app/modelos/estadom.model';
import { Tipopago } from 'src/app/modelos/tipopago.model';
import { Ubicacionm } from 'src/app/modelos/ubicacionm.model';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { AguatramiteService } from 'src/app/servicios/aguatramite.service';
import { CategoriaService } from 'src/app/servicios/categoria.service';
import { OutboxAttachment, OutboxEmailService } from 'src/app/servicios/outbox-email.service';
import { TramiteNuevoService } from 'src/app/servicios/tramite-nuevo.service';
import { TramitesAguaService } from 'src/app/servicios/tramites-agua.service';
import Swal from 'sweetalert2';

@Component({
   selector: 'app-modificar-tramitenuevo',
   templateUrl: './modificar-tramitenuevo.component.html',
   styleUrls: ['./modificar-tramitenuevo.component.css'],
})

export class ModificarTramitenuevoComponent implements OnInit {

   @Input() idTramite: number;

   formTramitenuevo: FormGroup;
   v_aguatramite: any;
   v_categorias: any;
   estadoVia = [
      { valor: 1, estado: 'Tierra' },
      { valor: 2, estado: 'Adoquin' },
      { valor: 3, estado: 'Asfalto' },
      { valor: 4, estado: 'Cemento' },
      { valor: 5, estado: 'Otro' },
   ];
   factibilidad: boolean = true;
   medidor: boolean = true;
   notificado: boolean = true;
   aprobado: boolean = true;
   secuenciaAfectada: number;
   ruta: any;
   date: Date = this.obtenerFechaActualLocal();
   aguatramite: Aguatramite = new Aguatramite();
   abonado: any;
   v_adultomayor: boolean = false;
   v_municipio: boolean = false;
   _abonado: Abonados = new Abonados();



   constructor(private traminuevoService: TramiteNuevoService, private router: Router,
      private aguatramService: AguatramiteService, private cateService: CategoriaService, private fb: FormBuilder,
      private aboService: AbonadosService, private authService: AutorizaService,
      private tramiteAguaService: TramitesAguaService,
      private outboxEmailService: OutboxEmailService) { }

   private obtenerFechaActualLocal(): Date {
      const ahora = new Date();
      return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 12, 0, 0, 0);
   }

   private formatearFechaInput(valor?: string | Date | null): string | null {
      if (!valor) {
         return null;
      }

      const fecha = valor instanceof Date ? valor : new Date(`${valor}T12:00:00`);
      if (Number.isNaN(fecha.getTime())) {
         return null;
      }

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
      sessionStorage.setItem('ventana', '/aguatramite');
      let coloresJSON = sessionStorage.getItem('/aguatramite');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.formTramitenuevo = this.fb.group({
         idtramitenuevo: [''],
         direccion: ['', Validators.required],
         nrocasa: [{ value: '', disabled: false }, Validators.required],
         nrodepar: [{ value: '', disabled: false }, Validators.required],
         barrio: [{ value: '', disabled: false }, Validators.required],
         referencia: [{ value: '', disabled: false }, Validators.required],
         tuberiaprincipal: ['', Validators.required],
         idcategoria_categorias: ['', Validators.required],
         tipovia: 1,
         inspector: ['', Validators.required],
         areaconstruccion: ['', Validators.required],
         observaciones: ['', Validators.required],
         medidormarca: [{ value: '', disabled: false }, Validators.required],
         medidornumero: [{ value: '', disabled: false }, Validators.required],
         codmedidor: [{ value: '', disabled: false }, Validators.required],
         medidordiametro: [{ value: '', disabled: false }, Validators.required],
         medidornroesferas: [{ value: '', disabled: false }, Validators.required],
         codmedidorvecino: ['', Validators.required],
         secuencia: [{ value: '', disabled: false }, Validators.required],
         fechafinalizacion: [{ value: '', disabled: false }, Validators.required],
         tipopredio: 0,
         presentacedula: 0,
         presentaescritura: 0,
         solicitaagua: '',
         solicitaalcantarillado: '',
         aprobadoagua: [{ value: 0, disabled: false }],
         aprobadoalcantarillado: [{ value: 0, disabled: false }],
         fechainspeccion: '',
         medidorempresa: '',
         notificado: [{ value: '', disabled: false }],
         fechanotificacion: [{ value: '', disabled: false }],
         estado: '',
         /*          adultomayor: false,
                  municipio: false, */
         idaguatramite_aguatramite: ['', Validators.required],
         usucrea: this.authService.idusuario,
         feccrea: this.date,
         usumodi: this.authService.idusuario,
         fecmodi: '',
      });

      this.listarCategorias();
      this.obtenerDatosTramite();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   get f() { return this.formTramitenuevo.controls; }

   retornarListaTramites() { this.router.navigate(['/aguatramite']); }

   listarCategorias() {
      this.cateService.getListCategoria().subscribe({
         next: (datos) => this.v_categorias = datos,
         error: err => console.error(err.error)
      });
   }

   setAbonado(abonado: any) {
      this.ruta = abonado.idruta_rutas;
      this.formTramitenuevo.patchValue({
         codmedidorvecino: abonado.idabonado,
         secuencia: abonado.secuencia + 1,
      });
      this.secuenciaAfectada = abonado.secuencia;
   }

   obtenerDatosTramite() {
      let idtramitenuevo = this.idTramite;
      this.traminuevoService.getListaById(+idtramitenuevo!).subscribe({
         next: (datos: any) => {
            this.formTramitenuevo.setValue({
               idtramitenuevo: datos.idtramitenuevo,
               direccion: datos.direccion,
               nrocasa: datos.nrocasa,
               nrodepar: datos.nrodepar,
               referencia: datos.referencia,
               barrio: datos.barrio,
               tipopredio: datos.tipopredio,
               presentacedula: datos.presentacedula,
               presentaescritura: datos.presentaescritura,
               solicitaagua: datos.solicitaagua,
               solicitaalcantarillado: datos.solicitaalcantarillado,
               aprobadoagua: datos.aprobadoagua,
               aprobadoalcantarillado: datos.aprobadoagua,
               fechainspeccion: this.formatearFechaInput(datos.fechainspeccion),
               medidorempresa: datos.medidorempresa,
               medidormarca: datos.medidormarca,
               medidornumero: datos.medidornumero,
               medidornroesferas: datos.medidornroesferas,
               tuberiaprincipal: datos.tuberiaprincipal,
               tipovia: datos.tipovia,
               codmedidor: datos.codmedidor,
               codmedidorvecino: datos.codmedidorvecino,
               secuencia: datos.secuencia,
               inspector: datos.inspector,
               areaconstruccion: datos.areaconstruccion,
               notificado: datos.notificado,
               fechanotificacion: this.formatearFechaInput(datos.fechanotificacion),
               observaciones: datos.observaciones,
               estado: datos.estado,
               fechafinalizacion: this.formatearFechaInput(datos.fechafinalizacion),
               medidordiametro: datos.medidordiametro,
               idcategoria_categorias: datos.idcategoria_categorias,
               idaguatramite_aguatramite: datos.idaguatramite_aguatramite,
               /*                adultomayor: datos.adultomayor,
                              municipio: datos.municipio, */
               usucrea: datos.usucrea,
               feccrea: datos.feccrea,
               usumodi: datos.usumodi,
               fecmodi: datos.fecmodi,
            });
            this.aguatramite = datos.idaguatramite_aguatramite;
            this.formTramitenuevo.updateValueAndValidity();
         },
         error: (e) => console.error(e),
      });
   }

   async onSubmit() {
      await this.guardarTramite();
   }

   async guardarTramite() {
      if (this.formTramitenuevo.invalid) {
         this.formTramitenuevo.markAllAsTouched();
         return;
      }

      const correos = await this.confirmarEnvioContrato(
         this.formTramitenuevo.getRawValue().idaguatramite_aguatramite?.idcliente_clientes?.email
      );
      if (!correos) {
         return;
      }

      const payload = {
         ...this.formTramitenuevo.getRawValue(),
         fechainspeccion: this.normalizarFechaLocal(this.formTramitenuevo.getRawValue().fechainspeccion),
         fechanotificacion: this.formTramitenuevo.getRawValue().fechanotificacion
            ? this.normalizarFechaLocal(this.formTramitenuevo.getRawValue().fechanotificacion)
            : null,
         fechafinalizacion: this.normalizarFechaLocal(this.formTramitenuevo.getRawValue().fechafinalizacion),
         feccrea: this.normalizarFechaLocal(this.formTramitenuevo.getRawValue().feccrea),
         fecmodi: this.obtenerFechaActualLocal(),
         usumodi: this.authService.idusuario,
      };

      try {
         const datos: any = await firstValueFrom(this.traminuevoService.saveTramiteNuevo(payload));
         const abonadoCreado = await this.guardarAbonadoAsync();
         await this.actualizarAguaTramiteAsync(3);
         await this.enviarContratoPorCorreo(
            {
               ...datos,
               direccion: datos?.direccion || payload.direccion,
               fechafinalizacion: datos?.fechafinalizacion || payload.fechafinalizacion,
               idaguatramite_aguatramite: {
                  ...(datos?.idaguatramite_aguatramite || payload.idaguatramite_aguatramite || {}),
                  idcliente_clientes: {
                     ...(datos?.idaguatramite_aguatramite?.idcliente_clientes ||
                        payload?.idaguatramite_aguatramite?.idcliente_clientes ||
                        {}),
                  },
               },
            },
            abonadoCreado,
            correos
         );
         this.retornarListaTramites();
      } catch (e) {
         console.error('Al guardar en TramiteNuevo: ', e);
         Swal.fire({
            icon: 'error',
            title: 'No se pudo completar el trámite',
            text: 'Revisa la información e intenta nuevamente.',
         });
      }
   }

   guardarAbonado() {
      this.guardarAbonadoAsync().catch((e) => console.error('Al crear el Abonado: ', e));
   }

   async guardarAbonadoAsync(): Promise<Abonados> {
      let abonado: Abonados = new Abonados();
      let estadom: Estadom = new Estadom();
      let tipopago: Tipopago = new Tipopago();
      let ubicacionm: Ubicacionm = new Ubicacionm();
      ubicacionm.idubicacionm = 1;
      tipopago.idtipopago = 1;
      estadom.idestadom = 1;
      abonado.nromedidor = this.formTramitenuevo.value.medidornumero;
      abonado.lecturainicial = 0;
      abonado.estado = 1;
      abonado.fechainstalacion = this.normalizarFechaLocal(this.formTramitenuevo.value.fechafinalizacion);
      abonado.marca = this.formTramitenuevo.value.medidormarca;
      abonado.secuencia = this.formTramitenuevo.value.secuencia;
      abonado.direccionubicacion = this.formTramitenuevo.value.direccion;
      abonado.localizacion = '';
      abonado.observacion = this.formTramitenuevo.value.observaciones;
      abonado.departamento = this.formTramitenuevo.value.nrodepar;
      abonado.piso = this.formTramitenuevo.value.piso;
      abonado.idresponsable = this.formTramitenuevo.value.idaguatramite_aguatramite.idcliente_clientes;
      abonado.idcategoria_categorias = this.formTramitenuevo.value.idcategoria_categorias;
      abonado.idruta_rutas = this.ruta;
      abonado.idcliente_clientes = this.formTramitenuevo.value.idaguatramite_aguatramite.idcliente_clientes;
      abonado.idubicacionm_ubicacionm = ubicacionm;
      abonado.idtipopago_tipopago = tipopago;
      abonado.idestadom_estadom = estadom;
      abonado.usucrea = this.authService.idusuario;
      abonado.feccrea = this.obtenerFechaActualLocal();
      abonado.medidorprincipal = 0;
      abonado.adultomayor = this.v_adultomayor;
      abonado.municipio = this.v_municipio;

      const datos: any = await firstValueFrom(this.aboService.saveAbonado(abonado));
      this._abonado = datos;
      return datos;
   }

   compararCategoria(o1: Categoria, o2: Categoria): boolean {
      if (o1 === undefined && o2 === undefined) {
         return true;
      } else {
         return o1 === null || o2 === null || o1 === undefined || o2 === undefined
            ? false
            : o1.idcategoria == o2.idcategoria;
      }
   }

   compararAguaTramite(o1: Aguatramite, o2: Aguatramite): boolean {
      if (o1 === undefined && o2 === undefined) {
         return true;
      } else {
         return o1 === null || o2 === null || o1 === undefined || o2 === undefined
            ? false
            : o1.idaguatramite == o2.idaguatramite;
      }
   }

   aprobadoAgua(e: any) {
      if (e.target.checked === true) {
         this.formTramitenuevo.patchValue({
            aprobadoagua: 1,
         });
      } else if (e.target.checked === false) {
         this.formTramitenuevo.patchValue({
            aprobadoagua: 0,
         });
      }
   }

   aprobadoAlcantarillado(e: any) {
      if (e.target.checked === true) {
         this.formTramitenuevo.patchValue({
            aprobadoalcantarillado: 1,
         });
      } else if (e.target.checked === false) {
         this.formTramitenuevo.patchValue({
            aprobadoalcantarillado: 0,
         });
      }
   }
   adultomayor(e: any) {
      /* if (e.target.checked === true) {
         this.formTramitenuevo.patchValue({
            adultomayor: true,
         });
      } else if (e.target.checked === false) {
         this.formTramitenuevo.patchValue({
            adultomayor: false,
         });
      } */
      this.v_adultomayor = e.target.checked
   }
   municipio(e: any) {
      /* if (e.target.checked === true) {
         this.formTramitenuevo.patchValue({
            municipio: true,
         });
      } else if (e.target.checked === false) {
         this.formTramitenuevo.patchValue({
            municipio: false,
         });
      } */
      this.v_municipio = e.target.checked
   }

   actualizarAguaTramite(estado: number) {
      this.actualizarAguaTramiteAsync(estado).catch((e) => console.error(e));
   }

   async actualizarAguaTramiteAsync(estado: number): Promise<any> {
      this.aguatramite.estado = estado;
      return firstValueFrom(this.aguatramService.updateAguatramite(this.aguatramite));
   }

   private async confirmarEnvioContrato(correoPorDefecto?: string | null): Promise<string[] | null> {
      const correoInicial = correoPorDefecto ? String(correoPorDefecto).trim() : '';
      const alertaCorreo = correoInicial
         ? `<div style="margin-top:12px; padding:10px 12px; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px; color:#065f46;">
               <strong>Correo registrado:</strong> ${correoInicial}
            </div>`
         : `<div style="margin-top:12px; padding:10px 12px; background:#fff7ed; border:1px solid #fdba74; border-radius:8px; color:#9a3412;">
               <strong>Cliente sin correo registrado.</strong><br>
               Puedes escribir un correo en este momento para enviar la notificación o actualizarlo luego en clientes.
            </div>`;

      const resultado = await Swal.fire({
         title: 'Completar trámite y enviar contrato',
         icon: 'question',
         html: `
            <div class="text-left">
               <p class="mb-2">Verifica el correo del cliente antes de enviar la notificación.</p>
               <p class="mb-0"><strong>Cuenta:</strong> ${this.aguatramite?.idaguatramite || this.idTramite}</p>
               ${alertaCorreo}
            </div>
         `,
         input: 'text',
         inputLabel: 'Correo(s) de notificación',
         inputValue: correoInicial,
         inputPlaceholder: 'cliente@correo.com; copia@correo.com',
         showCancelButton: true,
         confirmButtonText: 'Completar y enviar',
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

   private async enviarContratoPorCorreo(
      tramite: any,
      abonado: Abonados | null,
      correos: string[]
   ): Promise<void> {
      if (!correos.length) {
         return;
      }

      const contrato = await this.tramiteAguaService.buildContratoBlob(tramite);
      const attachments: OutboxAttachment[] = [
         await this.fileToAttachment(
            contrato,
            `contrato-tramite-${tramite?.idaguatramite_aguatramite?.idaguatramite || this.idTramite}.pdf`
         ),
      ];

      const cliente = tramite?.idaguatramite_aguatramite?.idcliente_clientes || {};

      await firstValueFrom(
         this.outboxEmailService.sendNotificationEmail({
            to: correos,
            subject: `Contrato de trámite de agua #${tramite?.idaguatramite_aguatramite?.idaguatramite || this.idTramite}`,
            html: this.buildHtmlCorreoContrato(tramite, abonado),
            text:
               `Adjuntamos el contrato del trámite de agua #${tramite?.idaguatramite_aguatramite?.idaguatramite || this.idTramite}. ` +
               `Cliente: ${cliente?.nombre || 'No registrado'}.`,
            attachments,
         })
      );

      Swal.fire({
         toast: true,
         icon: 'success',
         title: `Contrato enviado a: ${correos.join(', ')}`,
         position: 'top-end',
         showConfirmButton: false,
         timer: 3500,
      });
   }

   private buildHtmlCorreoContrato(tramite: any, abonado: Abonados | null): string {
      const cliente = tramite?.idaguatramite_aguatramite?.idcliente_clientes || {};
      return `
         <div style="font-family: Arial, Helvetica, sans-serif; background:#f4f7fb; padding:24px; color:#1f2937;">
            <div style="max-width:700px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #dbe4ee;">
               <div style="background:#0f766e; color:#ffffff; padding:20px 24px;">
                  <h2 style="margin:0; font-size:22px;">Contrato de trámite de agua</h2>
                  <p style="margin:8px 0 0 0; font-size:14px;">EPMAPA-T</p>
               </div>
               <div style="padding:24px;">
                  <p style="margin-top:0;">Estimado/a <strong>${cliente?.nombre || 'cliente'}</strong>,</p>
                  <p>Su trámite ha sido completado correctamente. Adjuntamos el contrato para su respaldo.</p>
                  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px; margin:16px 0;">
                     <p style="margin:0 0 8px 0;"><strong>Nro. de trámite:</strong> ${tramite?.idaguatramite_aguatramite?.idaguatramite || ''}</p>
                     <p style="margin:0 0 8px 0;"><strong>Cliente:</strong> ${cliente?.nombre || 'No registrado'}</p>
                     <p style="margin:0 0 8px 0;"><strong>Identificación:</strong> ${cliente?.cedula || 'Sin identificación'}</p>
                     <p style="margin:0;"><strong>Cuenta generada:</strong> ${abonado?.idabonado || 'En proceso'}</p>
                  </div>
                  <p>Si necesitas actualizar tus datos de contacto o realizar una consulta, comunícate con EPMAPA-T.</p>
                  <p style="margin-bottom:0;">Gracias por utilizar nuestros servicios.</p>
               </div>
            </div>
         </div>
      `;
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

}
