import { authGuard } from './guards/auth.guard';
import { AppShellComponent } from './layout/app-shell/app-shell.component';
import { routes } from './app.routes';

describe('application routes', () => {
  it('protects all job tracker and user pages with the existing auth guard', () => {
    const shellRoute = routes.find((route) => route.component === AppShellComponent);

    expect(shellRoute).toBeDefined();
    expect(shellRoute?.canActivate).toContain(authGuard);
    expect(shellRoute?.children?.map((route) => route.path)).toEqual([
      'dashboard',
      'applications',
      'applications/:id',
      'companies',
      'users',
    ]);
  });

  it('keeps the public landing and login routes outside the authenticated shell', () => {
    expect(routes.find((route) => route.path === '' && route.pathMatch === 'full')).toBeDefined();
    expect(routes.find((route) => route.path === 'login')).toBeDefined();
  });
});
