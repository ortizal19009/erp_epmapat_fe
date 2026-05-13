import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Abonados } from 'src/app/modelos/abonados';
import { Clientes } from 'src/app/modelos/clientes';
import { Facturas } from 'src/app/modelos/facturas.model';
import { Ntacredito } from 'src/app/modelos/ntacredito';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { JasperReportService } from 'src/app/servicios/jasper-report.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { NtacreditoService } from 'src/app/servicios/ntacredito.service';
import { OutboxAttachment, OutboxEmailService } from 'src/app/servicios/outbox-email.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-add-ntacredito',
  templateUrl: './add-ntacredito.component.html',
  styleUrls: ['./add-ntacredito.component.css'],
})
export class AddNtacreditoComponent implements OnInit {
  f_ntacredito!: FormGroup;

  _factura: Facturas = new Facturas();
  cliente: Clientes = new Clientes();
  resppago: Clientes = new Clientes();
  _cuenta: Abonados = new Abonados();

  date: Date = new Date();
  valorFactura: number = 0;   // ✅ number
  _documentos: any[] = [];

  formError: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private coloresService: ColoresService,
    private s_factura: FacturaService,
    private authService: AutorizaService,
    private s_rubroxfac: RubroxfacService,
    private loading: LoadingService,
    private s_abonado: AbonadosService,
    private s_ntacredito: NtacreditoService,
    private s_documento: DocumentosService,
    private outboxEmailService: OutboxEmailService,
    private jasperReportService: JasperReportService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/add-ntacredito');
    const coloresJSON = sessionStorage.getItem('/add-ntacredito');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    this.f_ntacredito = this.fb.group({
      nrofactura: [''],
      planilla: [''],
      cliente: [{ value: '', disabled: true }],
      cuenta: [{ value: '', disabled: true }],

      idfactura: [''], // interno

      valor: ['', [Validators.required, Validators.min(0.01)]], // max dinámico luego
      iddocumento_documentos: [null, [Validators.required]],
      refdocumento: ['', [Validators.required, Validators.maxLength(30)]],
      observacion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(300)]],
    });

    this.getAllDocumentos();
    this.updateValorMaxValidator(0); // al inicio
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, 'add-ntacredito');
      sessionStorage.setItem('/add-ntacredito', JSON.stringify(datos));
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

  getAllDocumentos() {
    this.s_documento.getListaDocumentos().subscribe({
      next: (datos: any[]) => {
        this._documentos = datos ?? [];
        // selecciona el primero si existe
        this.f_ntacredito.patchValue({
          iddocumento_documentos: this._documentos.length ? this._documentos[0] : null,
        });
      },
      error: (e: any) => console.error(e),
    });
  }

  // ✅ ayuda para template
  isInvalid(ctrlName: string): boolean {
    const c = this.f_ntacredito.get(ctrlName);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  onCancel() {
    this.router.navigate(['/ntacredito']);
  }

  onSubmit() {
    this.formError = '';

    if (this.valorFactura <= 0) {
      this.formError = 'Debe cargar una factura antes de registrar la nota de crédito.';
      return;
    }

    if (this.f_ntacredito.invalid) {
      this.f_ntacredito.markAllAsTouched();
      this.formError = 'Revise los campos marcados en rojo.';
      return;
    }

    const f = this.f_ntacredito.getRawValue();

    const ntacredito: Ntacredito = new Ntacredito();
    ntacredito.valor = +f.valor;
    ntacredito.observacion = f.observacion;
    ntacredito.idcliente_clientes = this.resppago;
    ntacredito.feccrea = this.date;
    ntacredito.usucrea = this.authService.idusuario;
    ntacredito.devengado = 0;

    // ojo: tú estabas usando nrofactura = f.idfactura (raro). Te dejo lo correcto:
    ntacredito.nrofactura = f.idfactura; // si en tu backend “nrofactura” guarda idfactura, déjalo así.
    // si en realidad debería ser el número:
    // ntacredito.nrofactura = this._factura?.nrofactura;

    ntacredito.idabonado_abonados = this._cuenta;
    ntacredito.iddocumento_documentos = f.iddocumento_documentos;
    ntacredito.refdocumento = f.refdocumento;

    this.loading.showLoading();
    this.s_ntacredito.saveNtacredito(ntacredito).subscribe({
      next: async (notaGuardada: any) => {
        this.loading.hideLoading();
        await this.solicitarEnvioNotificacion(notaGuardada);
      },
      error: (e: any) => {
        this.loading.hideLoading();
        console.error(e);
        this.formError = 'No se pudo guardar la nota de crédito. Revise e intente nuevamente.';
      }
    });
  }

  clearInput(name: 'nrofactura' | 'planilla') {
    this.formError = '';
    this._factura = new Facturas();
    this.cliente = new Clientes();
    this.resppago = new Clientes();
    this._cuenta = new Abonados();

    this.valorFactura = 0;
    this.updateValorMaxValidator(0);

    this.f_ntacredito.patchValue({
      cliente: '',
      cuenta: '',
      idfactura: '',
      valor: '',
    });

    this.f_ntacredito.get(name)?.setValue('');
  }

  getPlanilla() {
    this.formError = '';
    const formulario = this.f_ntacredito.getRawValue();

    if (!formulario.nrofactura && !formulario.planilla) {
      this.formError = 'Ingrese Nro.Factura o Planilla para buscar.';
      return;
    }

    this.loading.showLoading();

    if (formulario.nrofactura) {
      this.s_factura.getByNrofactura(formulario.nrofactura).subscribe({
        next: (planilla: any) => {
          if (planilla?.length === 1) {
            this.setFactura(planilla[0]);
          } else {
            this.formError = 'No se encontró una factura única con ese número.';
            this.loading.hideLoading();
          }
        },
        error: (e: any) => {
          console.error(e);
          this.formError = 'Error consultando la factura por número.';
          this.loading.hideLoading();
        }
      });
      return;
    }

    if (formulario.planilla) {
      this.s_factura.getById(formulario.planilla).subscribe({
        next: (planilla: any) => {
          // tu regla: solo cobradas y activas
          if (planilla?.pagado === 1 && (planilla?.estado === 1 || planilla?.estado === 3)) {
            this.setFactura(planilla);
          } else {
            this.formError = 'Nota de crédito solo para facturas ya cobradas.';
            this.loading.hideLoading();
          }
        },
        error: (e: any) => {
          console.error(e);
          this.formError = 'Error consultando la factura por planilla.';
          this.loading.hideLoading();
        }
      });
    }
  }

  private setFactura(planilla: any) {
    this._factura = planilla;
    this.cliente = planilla.idcliente;
    this.resppago = planilla.idcliente;

    this.buscarAbonado(planilla.idabonado);

    this.f_ntacredito.patchValue({
      cliente: planilla.idcliente?.nombre ?? '',
      idfactura: planilla.idfactura,
      cuenta: planilla.idabonado,
      nrofactura: planilla.nrofactura ?? this.f_ntacredito.get('nrofactura')?.value,
    });

    this.getValorPlanilla(planilla.idfactura);
  }

  getValorPlanilla(idfactura: any) {
    this.s_rubroxfac.getSumaValoresUnitarios(idfactura).then((valor: any) => {
      const v = Number(valor ?? 0);
      this.valorFactura = v; // ✅ number

      this.updateValorMaxValidator(this.valorFactura);

      // si quieres autollenar el valor por defecto (máximo):
      this.f_ntacredito.patchValue({ valor: v.toFixed(2) });

      this.loading.hideLoading();
    }).catch((e: any) => {
      console.error(e);
      this.formError = 'No se pudo calcular el valor de la factura.';
      this.loading.hideLoading();
    });
  }

  private updateValorMaxValidator(maxValue: number) {
    const c = this.f_ntacredito.get('valor');
    if (!c) return;

    const validators = [Validators.required, Validators.min(0.01)];
    if (maxValue > 0) validators.push(Validators.max(maxValue));
    c.setValidators(validators);
    c.updateValueAndValidity({ emitEvent: false });
  }

  buscarAbonado(cuenta: number) {
    this.s_abonado.getById(cuenta).subscribe({
      next: (cuenta: any) => {
        this._cuenta = cuenta;
      },
      error: (e: any) => console.error(e),
    });
  }

  setCliente(dato: any) {
    this.resppago = dato;
    this.f_ntacredito.patchValue({ cliente: dato?.nombre ?? '' });
  }

  setAbonado(dato: any) {
    this.resppago = dato.idresponsable;
    this._cuenta = dato;

    this.f_ntacredito.patchValue({
      cuenta: dato.idabonado,
      cliente: dato.idresponsable?.nombre ?? '',
    });
  }

  private async solicitarEnvioNotificacion(notaGuardada: any): Promise<void> {
    const correoCliente = String(this.resppago?.email ?? '').trim();
    const modal = await Swal.fire({
      title: 'Notificar nota de crédito',
      html: `
        <p class="text-left mb-2">Confirma o agrega más correos separados por <strong>;</strong>.</p>
        <input id="swal-nota-credito-emails" class="swal2-input" placeholder="correo1@dominio.com; correo2@dominio.com" value="${this.escapeHtml(correoCliente)}">
      `,
      icon: 'question',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Guardar y enviar',
      denyButtonText: 'Guardar sin enviar',
      cancelButtonText: 'Cancelar envío',
      focusConfirm: false,
      preConfirm: () => {
        const input = document.getElementById('swal-nota-credito-emails') as HTMLInputElement | null;
        const raw = input?.value ?? '';
        const destinatarios = this.parseRecipients(raw);

        if (!destinatarios.length) {
          Swal.showValidationMessage('Ingresa al menos un correo válido para enviar la notificación.');
          return false;
        }

        const invalidos = destinatarios.filter((correo) => !this.isValidEmail(correo));
        if (invalidos.length) {
          Swal.showValidationMessage(`Corrige los correos inválidos: ${invalidos.join('; ')}`);
          return false;
        }

        return raw;
      },
    });

    if (modal.isConfirmed) {
      const destinatarios = this.parseRecipients(String(modal.value ?? ''));
      this.loading.showLoading();
      try {
        const attachment = await this.buildNotaCreditoAttachment(notaGuardada);
        const html = this.buildNotaCreditoEmailHtml(notaGuardada);

        await firstValueFrom(
          this.outboxEmailService.sendNotificationEmail({
            to: destinatarios,
            subject: `Nota de crédito disponible ${this.getNotaCreditoDisplay(notaGuardada)}`,
            html,
            text: this.stripHtml(html),
            correlationId: `NOTA-CREDITO-${notaGuardada?.idntacredito ?? 'NUEVA'}-${Date.now()}`,
            attachments: [attachment],
          })
        );

        this.loading.hideLoading();
        await Swal.fire({
          icon: 'success',
          title: 'Nota guardada',
          text: 'La notificación fue enviada a la cola de correos.',
        });
      } catch (error) {
        this.loading.hideLoading();
        console.error('Error enviando notificación de nota de crédito:', error);
        await Swal.fire({
          icon: 'warning',
          title: 'Nota guardada',
          text: this.extractEmailError(error),
        });
      }
    } else {
      await Swal.fire({
        icon: 'success',
        title: 'Nota guardada',
        text: 'La nota de crédito se registró correctamente.',
        timer: 1800,
        showConfirmButton: false,
      });
    }

    await this.router.navigate(['/ntacredito']);
  }

  private parseRecipients(raw: string): string[] {
    return String(raw ?? '')
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter((item) => !!item)
      .filter((item, index, arr) => arr.indexOf(item) === index);
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? '').trim());
  }

  private async buildNotaCreditoAttachment(notaGuardada: any): Promise<OutboxAttachment> {
    const body = {
      reportName: 'NtaCreditoIndividual',
      parameters: {
        idntacredito: notaGuardada?.idntacredito,
        idusuario: this.authService.idusuario,
      },
      extencion: '.pdf',
    };

    const reporte = await this.jasperReportService.getReporte(body);
    const blob = reporte instanceof Blob ? reporte : new Blob([reporte], { type: 'application/pdf' });
    return this.fileToAttachment(blob, `nota_credito_${this.getNotaCreditoDisplay(notaGuardada)}.pdf`);
  }

  private async fileToAttachment(file: Blob, name: string): Promise<OutboxAttachment> {
    const base64 = await this.blobToBase64(file);
    return {
      name,
      contentType: file.type || 'application/octet-stream',
      base64,
    };
  }

  private blobToBase64(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        resolve(result.includes(',') ? result.split(',')[1] : result);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private buildNotaCreditoEmailHtml(notaGuardada: any): string {
    const cliente = this.resppago?.nombre ?? 'cliente';
    const cuenta = this._cuenta?.idabonado ?? '';
    const valor = Number(notaGuardada?.valor ?? 0).toFixed(2);
    const nota = this.getNotaCreditoDisplay(notaGuardada);
    const usuario = this.authService.alias ?? 'sistema';

    return `
      <p>Estimado(a) ${cliente},</p>
      <p>Se ha registrado una nota de crédito a su favor.</p>
      <p><strong>Nota de crédito:</strong> ${nota}</p>
      <p><strong>Cuenta:</strong> ${cuenta}</p>
      <p><strong>Valor:</strong> ${valor}</p>
      <p>Adjuntamos el PDF con el detalle e historial de uso de la nota de crédito.</p>
      <p style="margin-top:16px;">Atentamente,<br>EPMAPA-T</p>
      <p style="margin-top:12px; font-size:12px; color:#777;">Notificación generada por ${usuario}.</p>
    `;
  }

  private stripHtml(html: string): string {
    return html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private getNotaCreditoDisplay(notaGuardada: any): string {
    return notaGuardada?.idntacredito != null ? String(notaGuardada.idntacredito) : 's_n';
  }

  private extractEmailError(error: any): string {
    if (typeof error?.error === 'string' && error.error.trim()) {
      return error.error.trim();
    }
    if (typeof error?.error?.message === 'string' && error.error.message.trim()) {
      return error.error.message.trim();
    }
    if (Array.isArray(error?.error?.errors) && error.error.errors.length) {
      return error.error.errors.join(' | ');
    }
    if (typeof error?.message === 'string' && error.message.trim()) {
      return error.message.trim();
    }
    return 'La nota se guardó, pero no se pudo enviar la notificación por correo.';
  }

  private escapeHtml(value: string): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
