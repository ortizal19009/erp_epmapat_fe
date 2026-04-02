import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-service-unavailable',
  imports: [CommonModule, RouterModule],
  templateUrl: './service-unavailable.html',
  styleUrls: ['./service-unavailable.css'],
})
export class ServiceUnavailableComponent {
  status = '';
  endpoint = '';

  constructor(private route: ActivatedRoute, private router: Router) {
    this.route.queryParamMap.subscribe((q) => {
      this.status = q.get('status') || 'N/A';
      this.endpoint = this.sanitizeEndpoint(q.get('endpoint') || '');
    });
  }

  backHome() {
    this.router.navigate(['/inicio']);
  }

  private sanitizeEndpoint(endpoint: string): string {
    if (!endpoint) return '';

    try {
      const url = new URL(endpoint);
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      const match = endpoint.match(/https?:\/\/[^/]+(.*)$/i);
      return match?.[1] || endpoint;
    }
  }
}
