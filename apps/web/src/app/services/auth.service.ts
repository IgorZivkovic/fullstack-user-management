import { computed, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import type { AuthRole } from '@shared';
import { environment } from '../../environments/environment';

export type AuthUser = {
  id: number;
  email: string;
  role: AuthRole;
};

type AuthUserResponse = {
  data: AuthUser;
};

type LoginPayload = {
  email: string;
  password: string;
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiBaseUrl = environment.apiBaseUrl;
  private readonly csrfUrl = '/sanctum/csrf-cookie';
  private readonly _currentUser = signal<AuthUser | null>(null);

  readonly currentUser = this._currentUser.asReadonly();
  readonly currentRole = computed(() => this._currentUser()?.role ?? null);
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly canManageUsers = computed(() => this.currentRole() === 'admin');

  constructor(private readonly http: HttpClient) {}

  login(payload: LoginPayload): Observable<void> {
    return this.http.get<void>(this.csrfUrl, { withCredentials: true }).pipe(
      switchMap(() =>
        this.http.post<AuthUserResponse>(`${this.apiBaseUrl}/auth/login`, payload, {
          withCredentials: true,
        }),
      ),
      switchMap(() => this.fetchCurrentUser()),
      map(() => undefined),
      catchError((error) => {
        this.clearCurrentUser();
        return throwError(() => error);
      }),
    );
  }

  loadCurrentUser(): Observable<AuthUser | null> {
    return this.fetchCurrentUser().pipe(
      catchError(() => {
        this.clearCurrentUser();
        return of(null);
      }),
    );
  }

  logout(): Observable<void> {
    return this.http.post(`${this.apiBaseUrl}/auth/logout`, {}, { withCredentials: true }).pipe(
      map(() => undefined),
      catchError(() => of(undefined)),
      finalize(() => this.clearCurrentUser()),
    );
  }

  clearCurrentUser(): void {
    this._currentUser.set(null);
  }

  /**
   * Temporary compatibility methods until the guard and interceptor switch to session semantics.
   */
  hasValidAccessToken(): boolean {
    return this.isAuthenticated();
  }

  getAccessToken(): string | null {
    return null;
  }

  clearAccessToken(): void {
    this.clearCurrentUser();
  }

  refreshAccessToken(): Observable<string | null> {
    return this.loadCurrentUser().pipe(map((user) => (user ? 'session' : null)));
  }

  private fetchCurrentUser(): Observable<AuthUser> {
    return this.http
      .get<AuthUserResponse>(`${this.apiBaseUrl}/auth/me`, { withCredentials: true })
      .pipe(
        map((response) => response.data),
        tap((user) => this._currentUser.set(user)),
      );
  }
}
