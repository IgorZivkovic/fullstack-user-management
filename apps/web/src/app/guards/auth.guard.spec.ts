import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { AuthService, AuthUser } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let authService: {
    isAuthenticated: ReturnType<typeof vi.fn>;
    loadCurrentUser: ReturnType<typeof vi.fn>;
  };
  let router: {
    createUrlTree: ReturnType<typeof vi.fn>;
  };
  let loginUrlTree: UrlTree;

  beforeEach(() => {
    loginUrlTree = {} as UrlTree;
    authService = {
      isAuthenticated: vi.fn(),
      loadCurrentUser: vi.fn(),
    };
    router = {
      createUrlTree: vi.fn(() => loginUrlTree),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('allows navigation when the session user is already loaded', () => {
    authService.isAuthenticated.mockReturnValue(true);

    expect(runGuard()).toBe(true);
    expect(authService.loadCurrentUser).not.toHaveBeenCalled();
  });

  it('restores an existing server session before allowing navigation', async () => {
    const viewer: AuthUser = {
      id: 2,
      email: 'viewer@example.com',
      role: 'user',
    };
    authService.isAuthenticated.mockReturnValue(false);
    authService.loadCurrentUser.mockReturnValue(of(viewer));

    const result = runGuard() as Observable<boolean | UrlTree>;

    await expect(firstValueFrom(result)).resolves.toBe(true);
    expect(authService.loadCurrentUser).toHaveBeenCalledOnce();
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects to login when there is no server session', async () => {
    authService.isAuthenticated.mockReturnValue(false);
    authService.loadCurrentUser.mockReturnValue(of(null));

    const result = runGuard() as Observable<boolean | UrlTree>;

    await expect(firstValueFrom(result)).resolves.toBe(loginUrlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});

function runGuard() {
  return TestBed.runInInjectionContext(() =>
    authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  );
}
