import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = sessionStorage.getItem('webJwt');
    const apiUrl = environment.API_URL.replace(/\/$/, '');
    const isLoginRequest = request.url.startsWith(`${apiUrl}/usuarios/login`);
    if (!token || isLoginRequest || !request.url.startsWith(apiUrl) || request.headers.has('Authorization')) {
      return next.handle(request);
    }
    return next.handle(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
}
