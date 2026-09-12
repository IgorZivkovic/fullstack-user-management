import {
  HTTP_INTERCEPTORS,
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AuthInterceptor } from './auth.interceptor';

describe('AuthInterceptor', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let authService: {
    clearCurrentUser: ReturnType<typeof vi.fn>;
  };
  let router: {
    url: string;
    navigate: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authService = {
      clearCurrentUser: vi.fn(),
    };
    router = {
      url: '/users',
      navigate: vi.fn().mockResolvedValue(true),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
      ],
    });

    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('sends API requests without a Bearer token', () => {
    client.get('/api/v1/users').subscribe();

    const request = http.expectOne('/api/v1/users');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({ data: [] });
  });

  it('clears local session state and redirects after an API 401', () => {
    let responseError: HttpErrorResponse | undefined;

    client.get('/api/v1/users').subscribe({
      error: (error: HttpErrorResponse) => {
        responseError = error;
      },
    });

    http
      .expectOne('/api/v1/users')
      .flush({ message: 'Unauthenticated' }, { status: 401, statusText: 'Unauthorized' });

    expect(responseError?.status).toBe(401);
    expect(authService.clearCurrentUser).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    http.expectNone('/api/v1/auth/refresh');
  });

  it('leaves login errors to the login page', () => {
    client.post('/api/v1/auth/login', {}).subscribe({ error: () => undefined });

    http
      .expectOne('/api/v1/auth/login')
      .flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

    expect(authService.clearCurrentUser).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
