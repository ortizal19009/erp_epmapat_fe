import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Aguatramite } from 'src/app/modelos/aguatramite.model';
import { Clientes } from 'src/app/modelos/clientes';
import { TramiteNuevo } from 'src/app/modelos/tramite-nuevo';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { OutboxAttachment, OutboxEmailService } from 'src/app/servicios/outbox-email.service';
import { TramiteNuevoService } from 'src/app/servicios/tramite-nuevo.service';
import { TramitesAguaService } from 'src/app/servicios/tramites-agua.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-info-aguatramite',
  templateUrl: './info-aguatramite.component.html',
  styleUrls: ['./info-aguatramite.component.css'],
})
export class InfoAguatramiteComponent implements OnInit {
  titulo = 'Detalles del Trámite';
  tramitenuevo: TramiteNuevo = new TramiteNuevo();
  cliente: Clientes = new Clientes();
  aguatramite: Aguatramite = new Aguatramite();
  estadoTramite: any;
  idtramite: number;

  constructor(
    private getRouter: ActivatedRoute,
    private traminuevoService: TramiteNuevoService,
    private tramiaguaService: TramitesAguaService,
    private clientesService: ClientesService,
    private outboxEmailService: OutboxEmailService
  ) {}

  ngOnInit(): void {
    const idtramitenuevo = this.getRouter.snapshot.paramMap.get('id');
    this.idtramite = +idtramitenuevo!;
    this.getTramNuevoById(+idtramitenuevo!);
    this.setcolor();
  }

  setcolor() {
    let colores: string[];
    const coloresJSON = sessionStorage.getItem('/aguatramite');
    if (!coloresJSON) {
      colores = ['rgb(144, 123, 5)', 'rgb(249, 249, 175)'];
      const coloresIniciales = JSON.stringify(colores);
      sessionStorage.setItem('/aguatramite', coloresIniciales);
    } else {
      colores = JSON.parse(coloresJSON);
    }

    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  getTramNuevoById(id: number) {
    this.traminuevoService.getListaById(id).subscribe({
      next: (datos) => {
        this.tramitenuevo = datos;
        this.aguatramite = datos?.idaguatramite_aguatramite || new Aguatramite();
        this.cliente = (this.obtenerClienteDesdeFuentes() || new Clientes()) as Clientes;
        this.cargarClienteCompleto();
        this.setEstado(Number(this.aguatramite?.estado || 0));
      },
      error: (e) => console.error(e),
    });
  }

  setEstado(estado: number) {
    const estadotram = [
      { valor: 0, estado: 'Eliminado' },
      { valor: 1, estado: 'Recien ingresado' },
      { valor: 2, estado: 'Inspeccionando' },
      { valor: 3, estado: 'Aprobado' },
      { valor: 4, estado: 'Notificado' },
      { valor: 5, estado: 'Contrato generado' },
      { valor: 6, estado: 'Negado' },
    ];

    const consulta = estadotram.find(
      (estadot: { valor: number }) => estadot.valor === estado
    );
    this.estadoTramite = consulta?.estado;
  }

  valEstado() {
    if (this.aguatramite.estado === 1) {
      return true;
    } else if (this.aguatramite.estado === 3) {
      return false;
    } else {
      return true;
    }
  }

  genContrato() {
    const datosContrato = {
      ...this.tramitenuevo,
      idaguatramite_aguatramite: {
        ...(this.tramitenuevo?.idaguatramite_aguatramite || {}),
        idcliente_clientes: {
          ...(this.tramitenuevo?.idaguatramite_aguatramite?.idcliente_clientes || {}),
          ...(this.cliente || {}),
        },
      },
    };

    this.tramiaguaService.genContrato(datosContrato);
  }

  async enviarContratoPorCorreo(): Promise<void> {
    const correos = await this.confirmarCorreoContrato(this.cliente?.email);
    if (!correos) {
      return;
    }

    const datosContrato = {
      ...this.tramitenuevo,
      idaguatramite_aguatramite: {
        ...(this.tramitenuevo?.idaguatramite_aguatramite || {}),
        idcliente_clientes: {
          ...(this.tramitenuevo?.idaguatramite_aguatramite?.idcliente_clientes || {}),
          ...(this.cliente || {}),
        },
      },
    };

    const contrato = await this.tramiaguaService.buildContratoBlob(datosContrato);
    const attachments: OutboxAttachment[] = [
      await this.fileToAttachment(
        contrato,
        `contrato-tramite-${this.tramitenuevo?.idtramitenuevo || this.aguatramite?.idaguatramite || 'agua'}.pdf`
      ),
    ];

    await firstValueFrom(
      this.outboxEmailService.sendNotificationEmail({
        to: correos,
        subject: `Contrato de trámite de agua #${this.aguatramite?.idaguatramite || this.tramitenuevo?.idtramitenuevo || ''}`,
        html: this.buildHtmlCorreoContrato(),
        text:
          `Adjuntamos el contrato del trámite de agua #${this.aguatramite?.idaguatramite || this.tramitenuevo?.idtramitenuevo || ''}. ` +
          `Cliente: ${this.getNombreCliente()}.`,
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

  genHojaInspeccion() {
    this.tramiaguaService.genHojaInspeccion(
      {
        ...this.tramitenuevo,
        idaguatramite: this.tramitenuevo?.idaguatramite_aguatramite?.idaguatramite,
        idcliente_clientes: {
          ...(this.tramitenuevo?.idaguatramite_aguatramite?.idcliente_clientes || {}),
          ...(this.cliente || {}),
        },
        feccrea: this.tramitenuevo?.idaguatramite_aguatramite?.feccrea,
        observacion: this.tramitenuevo?.idaguatramite_aguatramite?.observacion,
        usucrea: this.tramitenuevo?.idaguatramite_aguatramite?.usucrea,
      },
      'Concesión de servicios'
    );
  }

  getNombreCliente(): string {
    const cliente = this.obtenerClienteDesdeFuentes();

    return String(
      cliente?.nombre ||
        cliente?.['nombres'] ||
        cliente?.['razonsocial'] ||
        'Sin cliente'
    );
  }

  getCuenta(): string {
    return (
      `${this.aguatramite?.idaguatramite ?? ''}` ||
      `${this.tramitenuevo?.idaguatramite_aguatramite?.idaguatramite ?? ''}` ||
      `${this.aguatramite?.idfactura_facturas ?? ''}` ||
      ''
    );
  }

  private cargarClienteCompleto(): void {
    const idcliente = this.obtenerIdCliente();
    if (!idcliente || this.tieneNombreCliente(this.cliente)) {
      return;
    }

    this.clientesService.getListaById(idcliente).subscribe({
      next: (datos: any) => {
        const cliente = Array.isArray(datos) ? datos?.[0] : datos;
        if (cliente) {
          this.cliente = cliente;
        }
      },
      error: (e) => console.error('No se pudo cargar el cliente completo', e),
    });
  }

  private obtenerClienteDesdeFuentes(): any {
    const aguatramiteAny = this.aguatramite as any;
    const aguatramiteAnidado: any = this.tramitenuevo?.idaguatramite_aguatramite;

    const candidato =
      this.aguatramite?.idcliente_clientes ||
      aguatramiteAny?.idcliente ||
      aguatramiteAnidado?.idcliente_clientes ||
      aguatramiteAnidado?.cliente ||
      aguatramiteAnidado?.idcliente ||
      (this.tieneNombreCliente(this.cliente) ? this.cliente : null) ||
      null;

    return candidato && typeof candidato === 'object' ? candidato : null;
  }

  private obtenerIdCliente(): number | null {
    const aguatramiteAny = this.aguatramite as any;
    const aguatramiteAnidado: any = this.tramitenuevo?.idaguatramite_aguatramite;

    const candidato =
      this.cliente?.idcliente ??
      this.aguatramite?.idcliente_clientes?.idcliente ??
      this.aguatramite?.idcliente_clientes ??
      aguatramiteAny?.idcliente?.idcliente ??
      aguatramiteAny?.idcliente ??
      aguatramiteAnidado?.idcliente_clientes?.idcliente ??
      aguatramiteAnidado?.idcliente_clientes ??
      aguatramiteAnidado?.idcliente?.idcliente ??
      aguatramiteAnidado?.idcliente;

    const idcliente = Number(candidato);
    return Number.isFinite(idcliente) && idcliente > 0 ? idcliente : null;
  }

  private tieneNombreCliente(cliente: any): boolean {
    return Boolean(cliente?.nombre || cliente?.nombres || cliente?.razonsocial);
  }

  private async confirmarCorreoContrato(correoPorDefecto?: string | String | null): Promise<string[] | null> {
    const correoInicial = correoPorDefecto ? String(correoPorDefecto).trim() : '';
    const alertaCorreo = correoInicial
      ? `<div style="margin-top:12px; padding:10px 12px; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px; color:#065f46;">
          <strong>Correo registrado:</strong> ${correoInicial}
        </div>`
      : `<div style="margin-top:12px; padding:10px 12px; background:#fff7ed; border:1px solid #fdba74; border-radius:8px; color:#9a3412;">
          <strong>Cliente sin correo registrado.</strong><br>
          Puedes escribir un correo ahora para enviar la notificación o actualizarlo luego en clientes.
        </div>`;

    const resultado = await Swal.fire({
      title: 'Enviar contrato por correo',
      icon: 'question',
      html: `
        <div class="text-left">
          <p><strong>Cliente:</strong> ${this.getNombreCliente()}</p>
          <p class="mb-0">Puedes confirmar o modificar el correo antes de enviar la notificación.</p>
          ${alertaCorreo}
        </div>
      `,
      input: 'text',
      inputLabel: 'Correo(s) de notificación',
      inputValue: correoInicial,
      inputPlaceholder: 'cliente@correo.com; copia@correo.com',
      showCancelButton: true,
      confirmButtonText: 'Enviar',
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

  private buildHtmlCorreoContrato(): string {
    return `
      <div style="font-family: Arial, Helvetica, sans-serif; background:#f4f7fb; padding:24px; color:#1f2937;">
        <div style="max-width:700px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #dbe4ee;">
          <div style="background:#0f766e; color:#ffffff; padding:20px 24px;">
            <h2 style="margin:0; font-size:22px;">Contrato de trámite de agua</h2>
            <p style="margin:8px 0 0 0; font-size:14px;">EPMAPA-T</p>
          </div>
          <div style="padding:24px;">
            <p style="margin-top:0;">Estimado/a <strong>${this.getNombreCliente()}</strong>,</p>
            <p>Adjuntamos el contrato correspondiente a su trámite de agua.</p>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px; margin:16px 0;">
              <p style="margin:0 0 8px 0;"><strong>Nro. de trámite:</strong> ${this.aguatramite?.idaguatramite || ''}</p>
              <p style="margin:0 0 8px 0;"><strong>Cliente:</strong> ${this.getNombreCliente()}</p>
              <p style="margin:0;"><strong>Identificación:</strong> ${this.cliente?.cedula || 'Sin identificación'}</p>
            </div>
            <p>Si requieres una actualización de datos o soporte adicional, comunícate con EPMAPA-T.</p>
            <p style="margin-bottom:0;">Gracias por utilizar nuestros servicios.</p>
          </div>
        </div>
      </div>
    `;
  }
}
