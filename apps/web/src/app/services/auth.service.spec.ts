import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

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

  it('stores the access token after login', () => {
    const accessToken = createJwt({ exp: Math.floor(Date.now() / 1000) + 60 });

    service.login({ email: 'admin@example.com', password: 'admin12345' }).subscribe((result) => {
      expect(result).toBeUndefined();
    });

    const request = http.expectOne(`${environment.apiBaseUrl}/auth/login`);
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);

    request.flush({ accessToken });

    expect(service.getAccessToken()).toBe(accessToken);
    expect(service.hasValidAccessToken()).toBe(true);
  });
});

function createJwt(payload: object) {
  return ['header', toBase64Url(JSON.stringify(payload)), 'signature'].join('.');
}

function toBase64Url(value: string) {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
