import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
  readonly entornos: EntornoGateway[] = [
    { key: 'dev', label: 'Desarrollo', baseUrl: 'http://localhost:8080' },
    { key: 'qa', label: 'QA', baseUrl: 'http://localhost:8081' },
    { key: 'prod', label: 'Producción', baseUrl: 'https://api.tu-dominio.com' }
  ];

  entornoSeleccionado = this.entornos[0].key;

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
}
