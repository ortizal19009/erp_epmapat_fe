import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

type EstadoSwagger = 'checking' | 'online' | 'offline' | 'unknown';

interface SwaggerServiceLink {
  nombre: string;
  gatewayPath: string;
  descripcion?: string;
}

interface EntornoGateway {
  key: string;
  label: string;
  baseUrl: string;
}

@Component({
  selector: 'app-swagger-hub',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './swagger-hub.html',
  styleUrls: ['./swagger-hub.css']
})
export class SwaggerHubComponent {
  statusMap: Record<string, { estado: EstadoSwagger; ms?: number }> = {};
  readonly entornos: EntornoGateway[] =
    (environment as any).SWAGGER_GATEWAYS ?? [
      { key: 'dev', label: 'Desarrollo', baseUrl: 'http://localhost:8080' }
    ];

  entornoSeleccionado = this.entornos[0]?.key ?? 'dev';

  readonly servicios: SwaggerServiceLink[] = [
    { nombre: 'Login', gatewayPath: '/login', descripcion: 'Autenticación y sesiones' },
    { nombre: 'Comercialización', gatewayPath: '/comercializacion', descripcion: 'Clientes, abonados, facturación base' },
    { nombre: 'RRHH', gatewayPath: '/rrhh', descripcion: 'Talento humano' },
    { nombre: 'Contabilidad', gatewayPath: '/contabilidad', descripcion: 'Procesos contables y tesorería' },
    { nombre: 'Recaudación', gatewayPath: '/recaudacion', descripcion: 'Cobros y recaudación' },
    { nombre: 'Gestión Documental', gatewayPath: '/gestiondocumental', descripcion: 'Documentos y expedientes' },
    { nombre: 'SRI', gatewayPath: '/sri', descripcion: 'Comprobantes y firma electrónica' },
    { nombre: 'Reportes JR', gatewayPath: '/reportes', descripcion: 'Reportería JasperReports' },
    { nombre: 'Pagos Online', gatewayPath: '/pagosonline', descripcion: 'Servicios de pagos web' },
    { nombre: 'EPMAPA API', gatewayPath: '/epmapaapi', descripcion: 'API general de integración' },
    { nombre: 'Emails', gatewayPath: '/emails', descripcion: 'Plantillas y envío de correos' }
  ];

  constructor() {
    this.refreshStatus();
  }

  get gatewayBaseUrl(): string {
    return (
      this.entornos.find((e) => e.key === this.entornoSeleccionado)?.baseUrl ||
      this.entornos[0].baseUrl
    );
  }

  getSwaggerUi(path: string): string {
    return `${this.gatewayBaseUrl}${path}/swagger-ui.html`;
  }

  getOpenApiJson(path: string): string {
    return `${this.gatewayBaseUrl}${path}/v3/api-docs`;
  }

  onEntornoChange(): void {
    this.statusMap = {};
    this.refreshStatus();
  }

  async refreshStatus(): Promise<void> {
    for (const servicio of this.servicios) {
      const key = servicio.gatewayPath;
      this.statusMap[key] = { estado: 'checking' };

      const start = performance.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const resp = await fetch(this.getOpenApiJson(servicio.gatewayPath), {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }

        this.statusMap[key] = {
          estado: 'online',
          ms: Math.round(performance.now() - start)
        };
      } catch {
        this.statusMap[key] = { estado: 'offline' };
      }
    }
  }

  getBadgeClass(path: string): string {
    const estado = this.statusMap[path]?.estado ?? 'unknown';
    if (estado === 'online') return 'badge badge-success';
    if (estado === 'offline') return 'badge badge-danger';
    if (estado === 'checking') return 'badge badge-warning';
    return 'badge badge-secondary';
  }

  getBadgeText(path: string): string {
    const status = this.statusMap[path];
    if (!status) return 'Sin validar';
    if (status.estado === 'checking') return 'Verificando...';
    if (status.estado === 'online') return `Online (${status.ms} ms)`;
    if (status.estado === 'offline') return 'Offline';
    return 'Sin validar';
  }
}
