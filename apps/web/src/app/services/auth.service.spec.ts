import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { AuthService, AuthUser } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('starts a Sanctum session and loads the authenticated admin', () => {
    const admin: AuthUser = {
      id: 1,
      email: 'admin@example.com',
      role: 'admin',
    };

    service.login({ email: admin.email, password: 'admin12345' }).subscribe((result) => {
      expect(result).toBeUndefined();
    });

    const csrfRequest = http.expectOne('/sanctum/csrf-cookie');
    expect(csrfRequest.request.method).toBe('GET');
    expect(csrfRequest.request.withCredentials).toBe(true);
    csrfRequest.flush(null, { status: 204, statusText: 'No Content' });

    const loginRequest = http.expectOne(`${environment.apiBaseUrl}/auth/login`);
    expect(loginRequest.request.method).toBe('POST');
    expect(loginRequest.request.withCredentials).toBe(true);
    expect(loginRequest.request.body).toEqual({
      email: admin.email,
      password: 'admin12345',
    });
    loginRequest.flush({ data: admin });

    const meRequest = http.expectOne(`${environment.apiBaseUrl}/auth/me`);
    expect(meRequest.request.method).toBe('GET');
    expect(meRequest.request.withCredentials).toBe(true);
    meRequest.flush({ data: admin });

    expect(service.currentUser()).toEqual(admin);
    expect(service.currentRole()).toBe('admin');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.canManageUsers()).toBe(true);
  });

  it('loads a viewer session with read-only permissions', () => {
    const viewer: AuthUser = {
      id: 2,
      email: 'viewer@example.com',
      role: 'user',
    };

    service.loadCurrentUser().subscribe((user) => {
      expect(user).toEqual(viewer);
    });

    const meRequest = http.expectOne(`${environment.apiBaseUrl}/auth/me`);
    expect(meRequest.request.method).toBe('GET');
    expect(meRequest.request.withCredentials).toBe(true);
    meRequest.flush({ data: viewer });

    expect(service.currentUser()).toEqual(viewer);
    expect(service.currentRole()).toBe('user');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.canManageUsers()).toBe(false);
  });

  it('clears the current user after logout', () => {
    const admin: AuthUser = {
      id: 1,
      email: 'admin@example.com',
      role: 'admin',
    };

    service.loadCurrentUser().subscribe();
    http.expectOne(`${environment.apiBaseUrl}/auth/me`).flush({ data: admin });

    service.logout().subscribe((result) => {
      expect(result).toBeUndefined();
    });

    const logoutRequest = http.expectOne(`${environment.apiBaseUrl}/auth/logout`);
    expect(logoutRequest.request.method).toBe('POST');
    expect(logoutRequest.request.withCredentials).toBe(true);
    logoutRequest.flush({ loggedOut: true });

    expect(service.currentUser()).toBeNull();
    expect(service.currentRole()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
