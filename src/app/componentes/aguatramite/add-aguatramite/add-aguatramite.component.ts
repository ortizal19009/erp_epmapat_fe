import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Aguatramite } from 'src/app/modelos/aguatramite.model';
import { Categoria } from 'src/app/modelos/categoria.model';
import { Clientes } from 'src/app/modelos/clientes';
import { TramiteNuevo } from 'src/app/modelos/tramite-nuevo';
import { AguatramiteService } from 'src/app/servicios/aguatramite.service';
import { OutboxAttachment, OutboxEmailService } from 'src/app/servicios/outbox-email.service';
import { TramiteNuevoService } from 'src/app/servicios/tramite-nuevo.service';
import { TramitesAguaService } from 'src/app/servicios/tramites-agua.service';

@Component({
   selector: 'app-add-aguatramite',
   templateUrl: './add-aguatramite.component.html',
   styleUrls: ['./add-aguatramite.component.css'],
})
export class AddAguatramiteComponent implements OnInit {
   formAguatram1!: FormGroup;
   f_clientes!: FormGroup;
   f_facturas!: FormGroup;
   v_aguatramite: any;
   v_facturas: any;
   v_especificatramite: any;
   v_factura: any;
   aguatramite: Aguatramite = new Aguatramite();
   tramitenuevo: TramiteNuevo = new TramiteNuevo();
   idtipotramite!: number;
   slect_disabled = true;
   direccion = '';
   guardando = false;

   private obtenerFechaActualLocal(): Date {
      const ahora = new Date();
      return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 12, 0, 0, 0);
   }

   constructor(
      private router: Router,
      private aguatramiService: AguatramiteService,
      private fb: FormBuilder,
      private authService: AutorizaService,
      private traminuevoService: TramiteNuevoService,
      private tramiteaguaService: TramitesAguaService,
      private outboxEmailService: OutboxEmailService
   ) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/aguatramite');
      const coloresJSON = sessionStorage.getItem('/aguatramite');
      if (coloresJSON) {
         this.colocaColor(JSON.parse(coloresJSON));
      }

      const date = this.obtenerFechaActualLocal();

      this.formAguatram1 = this.fb.group(
         {
            estado: 1,
            sistema: 'Instalación de agua y alcantarillado',
            fechaterminacion: date,
            observacion: 'Instalacion Nueva-Agua Potable',
            idtipotramite: { idtipotramite: 1 },
            idcliente_clientes: [null, Validators.required],
            idfactura_facturas: null,
            presentacedula: this.tramitenuevo.presentacedula,
            presentaescritura: this.tramitenuevo.presentaescritura,
            medidorempresa: this.tramitenuevo.medidorempresa,
            referencia: '',
            direccion: ['', Validators.required],
            barrio: 'SN',
            departamento: 'SN',
            nrocasa: 'SN',
            agua: this.tramitenuevo.solicitaagua,
            alcantarillado: this.tramitenuevo.solicitaalcantarillado,
            correosNotificacion: ['', [Validators.required, this.emailListValidator]],
            usucrea: this.authService.idusuario,
            feccrea: date,
         },
         { validators: this.alMenosUnServicioValidator }
      );

      this.f_facturas = this.fb.group({
         buscarFactura: ['', Validators.required],
      });

      this.f_clientes = this.fb.group({
         buscarCliente: ['', Validators.required],
      });
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

   get f() { return this.formAguatram1.controls; }

   get serviciosSeleccionados(): string[] {
      const seleccionados: string[] = [];
      if (+this.formAguatram1?.value?.agua === 1) {
         seleccionados.push('Agua potable');
      }
      if (+this.formAguatram1?.value?.alcantarillado === 1) {
         seleccionados.push('Alcantarillado');
      }
      return seleccionados;
   }

   async onSubmit() {
      if (this.formAguatram1.invalid || this.guardando) {
         this.formAguatram1.markAllAsTouched();
         this.swalToast('warning', 'Completa la información requerida antes de continuar');
         return;
      }

      const correos = this.parseRecipients(this.formAguatram1.value.correosNotificacion);
      const cliente = this.formAguatram1.value.idcliente_clientes as Clientes;
      const detalleServicios = this.serviciosSeleccionados.join(', ');

      const confirmacion = await Swal.fire({
         title: 'Confirmar nuevo trámite',
         icon: 'question',
         html: `
            <div class="text-left">
               <p><strong>Cliente:</strong> ${cliente?.nombre || 'No seleccionado'}</p>
               <p><strong>Dirección:</strong> ${this.formAguatram1.value.direccion || 'No registrada'}</p>
               <p><strong>Servicios:</strong> ${detalleServicios || 'No seleccionado'}</p>
               <p><strong>Correos:</strong> ${correos.join(', ')}</p>
            </div>
         `,
         showCancelButton: true,
         confirmButtonText: 'Sí, registrar',
         cancelButtonText: 'Cancelar',
         focusCancel: true,
      });

      if (!confirmacion.isConfirmed) {
         return;
      }

      this.guardando = true;
      try {
         const aguatramite = await this.guardarAguatramite();
         const tramiteNuevo = await this.guardarTramiteNuevo(aguatramite);
         await this.enviarCorreoTramiteNuevo(aguatramite, tramiteNuevo, correos);
         await this.tramiteaguaService.genHojaInspeccion(this.formAguatram1.value, 'Concesión de servicios');
         this.swalToast('success', `Trámite registrado y correo enviado a: ${correos.join(', ')}`);
         this.retornarListaAguaTramites();
      } catch (error) {
         console.error(error);
         this.swalToast('error', 'No fue posible completar el trámite');
      } finally {
         this.guardando = false;
      }
   }

   retornarListaAguaTramites() {
      this.router.navigate(['/aguatramite']);
   }

   async guardarAguatramite(): Promise<Aguatramite> {
      const fechaRegistro = this.obtenerFechaActualLocal();
      this.aguatramite.idcliente_clientes = this.formAguatram1.value.idcliente_clientes;
      this.aguatramite.estado = this.formAguatram1.value.estado;
      this.aguatramite.sistema = this.formAguatram1.value.sistema;
      this.aguatramite.comentario = '';
      this.aguatramite.fechaterminacion = this.formAguatram1.value.fechaterminacion ?? fechaRegistro;
      this.aguatramite.observacion = this.formAguatram1.value.observacion;
      this.aguatramite.idtipotramite_tipotramite = this.formAguatram1.value.idtipotramite;
      this.aguatramite.idfactura_facturas = this.formAguatram1.value.idfactura_facturas;
      this.aguatramite.usucrea = this.formAguatram1.value.usucrea;
      this.aguatramite.feccrea = this.formAguatram1.value.feccrea ?? fechaRegistro;

      return await firstValueFrom(this.aguatramiService.saveAguaTramite(this.aguatramite)) as Aguatramite;
   }

   async guardarTramiteNuevo(aguatramite: Aguatramite): Promise<TramiteNuevo> {
      const categoria: Categoria = new Categoria();
      categoria.idcategoria = 1;
      this.tramitenuevo.idaguatramite_aguatramite = aguatramite;
      this.tramitenuevo.direccion = this.formAguatram1.value.direccion;
      this.tramitenuevo.nrocasa = this.formAguatram1.value.nrocasa;
      this.tramitenuevo.nrodepar = this.formAguatram1.value.departamento;
      this.tramitenuevo.barrio = this.formAguatram1.value.barrio;
      this.tramitenuevo.usucrea = this.formAguatram1.value.usucrea;
      this.tramitenuevo.referencia = this.formAguatram1.value.referencia;
      this.tramitenuevo.aprobadoagua = 0;
      this.tramitenuevo.aprobadoalcantarillado = 0;
      this.tramitenuevo.fechainspeccion = this.formAguatram1.value.feccrea;
      this.tramitenuevo.estado = 1;
      this.tramitenuevo.codmedidorvecino = 0;
      this.tramitenuevo.idcategoria_categorias = categoria;
      this.tramitenuevo.feccrea = this.formAguatram1.value.feccrea;

      return await firstValueFrom(this.traminuevoService.saveTramiteNuevo(this.tramitenuevo)) as TramiteNuevo;
   }

   async enviarCorreoTramiteNuevo(
      aguatramite: Aguatramite,
      tramiteNuevo: TramiteNuevo,
      correos: string[]
   ): Promise<void> {
      const cliente = this.formAguatram1.value.idcliente_clientes as Clientes;
      const hojaInspeccion = await this.tramiteaguaService.buildHojaInspeccionBlob(
         this.formAguatram1.value,
         'Concesión de servicios'
      );
      const contrato = await this.tramiteaguaService.buildContratoBlob(tramiteNuevo);
      const attachments: OutboxAttachment[] = await Promise.all([
         this.fileToAttachment(hojaInspeccion, `hoja-inspeccion-tramite-${aguatramite.idaguatramite}.pdf`),
         this.fileToAttachment(contrato, `contrato-tramite-${aguatramite.idaguatramite}.pdf`),
      ]);

      await firstValueFrom(
         this.outboxEmailService.sendNotificationEmail({
            to: correos,
            subject: `Documentos de trámite de agua #${aguatramite.idaguatramite}`,
            html: this.buildHtmlCorreoNuevoTramite(aguatramite, cliente),
            text:
               `Estimado/a ${cliente?.nombre || 'cliente'}, adjuntamos el contrato y la hoja de inspección ` +
               `del trámite de agua #${aguatramite.idaguatramite}.`,
            attachments,
         })
      );
   }

   setCliente(cliente: any) {
      this.formAguatram1.patchValue({
         idcliente_clientes: cliente,
         correosNotificacion: cliente?.email ? String(cliente.email) : '',
      });
      this.formAguatram1.get('idcliente_clientes')?.markAsTouched();
   }

   setAguaValue(e: any) {
      const value = e.target.checked ? 1 : 0;
      this.tramitenuevo.solicitaagua = value;
      this.formAguatram1.patchValue({ agua: value });
      this.formAguatram1.updateValueAndValidity();
   }

   setAlcantarilladoValue(e: any) {
      const value = e.target.checked ? 1 : 0;
      this.tramitenuevo.solicitaalcantarillado = value;
      this.formAguatram1.patchValue({ alcantarillado: value });
      this.formAguatram1.updateValueAndValidity();
   }

   setMedidorEmpresaValue(e: any) {
      const value = e.target.checked ? 1 : 0;
      this.tramitenuevo.medidorempresa = value;
      this.formAguatram1.patchValue({ medidorempresa: value });
   }

   setCedulaValue(e: any) {
      const value = e.target.checked ? 1 : 0;
      this.tramitenuevo.presentacedula = value;
      this.formAguatram1.patchValue({ presentacedula: value });
   }

   setEscriturasValue(e: any) {
      const value = e.target.checked ? 1 : 0;
      this.tramitenuevo.presentaescritura = value;
      this.formAguatram1.patchValue({ presentaescritura: value });
   }

   private alMenosUnServicioValidator(control: AbstractControl): ValidationErrors | null {
      const agua = +control.get('agua')?.value === 1;
      const alcantarillado = +control.get('alcantarillado')?.value === 1;
      return agua || alcantarillado ? null : { servicioRequerido: true };
   }

   private emailListValidator(control: AbstractControl): ValidationErrors | null {
      const emails = String(control.value || '')
         .split(/[;,]/)
         .map((item) => item.trim())
         .filter(Boolean);

      if (!emails.length) {
         return { emailRequerido: true };
      }

      const emailInvalido = emails.some((email) => !this.isValidEmail(email));
      return emailInvalido ? { emailInvalido: true } : null;
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
               reject(new Error('No se pudo convertir el archivo a base64'));
               return;
            }
            resolve(result.split(',')[1] || '');
         };
         reader.onerror = () => reject(reader.error);
         reader.readAsDataURL(blob);
      });
   }

   private buildHtmlCorreoNuevoTramite(aguatramite: Aguatramite, cliente: Clientes): string {
      return `
         <div style="font-family: Arial, Helvetica, sans-serif; background:#f4f7fb; padding:24px; color:#1f2937;">
            <div style="max-width:700px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #dbe4ee;">
               <div style="background:#0f766e; color:#ffffff; padding:20px 24px;">
                  <h2 style="margin:0; font-size:22px;">Documentos de trámite de agua</h2>
                  <p style="margin:8px 0 0 0; font-size:14px;">EPMAPA-T</p>
               </div>
               <div style="padding:24px;">
                  <p style="margin-top:0;">Estimado/a <strong>${cliente?.nombre || 'cliente'}</strong>,</p>
                  <p>Se registró correctamente su trámite de agua y alcantarillado.</p>
                  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px; margin:16px 0;">
                     <p style="margin:0 0 8px 0;"><strong>Nro. de trámite:</strong> ${aguatramite.idaguatramite}</p>
                     <p style="margin:0 0 8px 0;"><strong>Cliente:</strong> ${cliente?.nombre || 'No registrado'}</p>
                     <p style="margin:0 0 8px 0;"><strong>Dirección:</strong> ${this.formAguatram1.value.direccion || 'No registrada'}</p>
                     <p style="margin:0;"><strong>Servicios solicitados:</strong> ${this.serviciosSeleccionados.join(', ')}</p>
                  </div>
                  <p>Adjuntamos los siguientes documentos:</p>
                  <ul style="padding-left:20px;">
                     <li>Contrato del trámite</li>
                     <li>Hoja de inspección</li>
                  </ul>
                  <p style="margin-bottom:0;">Gracias por utilizar nuestros servicios.</p>
               </div>
            </div>
         </div>
      `;
   }

   private swalToast(icon: 'success' | 'error' | 'warning', title: string): void {
      void Swal.fire({
         toast: true,
         position: 'top-end',
         icon,
         title,
         showConfirmButton: false,
         timer: 4000,
      });
   }
}
