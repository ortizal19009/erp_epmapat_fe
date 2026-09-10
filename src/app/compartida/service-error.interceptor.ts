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
        const isLoginRequest = /\/usuarios\/login(?:[/?]|$)/i.test(req.url);
        const isOptionalModuleCatalog = /\/erpmodulos\/platform\//i.test(req.url);
        const onErrorPage = this.router.url?.includes('service-unavailable');

        // Login and the header's module catalog must not interrupt an otherwise valid session.
        if (critical && !onErrorPage && !isLoginRequest && !isOptionalModuleCatalog) {
          this.router.navigate(['/service-unavailable'], {
            queryParams: { status: String(status), endpoint: req.url }
          });
        }

        return throwError(() => error);
      })
    );
  }
}
