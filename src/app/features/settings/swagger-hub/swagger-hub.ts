import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface SwaggerServiceLink {
  nombre: string;
  gatewayPath: string;
  descripcion?: string;
}

@Component({
  selector: 'app-swagger-hub',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './swagger-hub.html',
  styleUrls: ['./swagger-hub.css']
})
export class SwaggerHubComponent {
  readonly gatewayBaseUrl = 'http://localhost:8080';

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

  getSwaggerUi(path: string): string {
    return `${this.gatewayBaseUrl}${path}/swagger-ui.html`;
  }

  getOpenApiJson(path: string): string {
    return `${this.gatewayBaseUrl}${path}/v3/api-docs`;
  }
}
