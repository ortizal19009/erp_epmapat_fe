import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ServiceErrorInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        const status = error?.status;
        const critical = status === 0 || status === 502 || status === 503 || status === 504;
        const onErrorPage = this.router.url?.includes('service-unavailable');

        if (critical && !onErrorPage) {
          this.router.navigate(['/service-unavailable'], {
            queryParams: { status: String(status), endpoint: req.url }
          });
        }

        return throwError(() => error);
      })
    );
  }
}
