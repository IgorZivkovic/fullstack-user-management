import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, Observable, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !this.isAuthEndpoint(request.url)) {
          this.redirectToLogin();
        }

        return throwError(() => error);
      }),
    );
  }

  private isAuthEndpoint(url: string) {
    return url.includes('/auth/login') || url.includes('/auth/logout') || url.includes('/auth/me');
  }

  private redirectToLogin() {
    this.authService.clearCurrentUser();
    if (this.router.url !== '/login') {
      void this.router.navigate(['/login']);
    }
  }
}
