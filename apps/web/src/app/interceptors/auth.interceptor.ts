import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getAccessToken();
    const authRequest =
      token && !this.isAuthEndpoint(request.url)
        ? request.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
          })
        : request;

    return next.handle(authRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status !== 401 || this.isAuthEndpoint(request.url)) {
          return throwError(() => error);
        }
        return this.authService.refreshAccessToken().pipe(
          switchMap((newToken) => {
            if (!newToken) {
              this.redirectToLogin();
              return throwError(() => error);
            }
            return next.handle(
              request.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` },
              }),
            );
          }),
          catchError((refreshError) => {
            this.redirectToLogin();
            return throwError(() => refreshError);
          }),
        );
      }),
    );
  }

  private isAuthEndpoint(url: string) {
    return (
      url.includes('/auth/login') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/logout') ||
      url.includes('/auth/me')
    );
  }

  private redirectToLogin() {
    this.authService.clearAccessToken();
    if (this.router.url !== '/login') {
      this.router.navigate(['/login']);
    }
  }
}
