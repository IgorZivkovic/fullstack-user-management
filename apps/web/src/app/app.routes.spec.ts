import { authGuard } from './guards/auth.guard';
import { AppShellComponent } from './layout/app-shell/app-shell.component';
import { ApplicationsPageComponent } from './pages/applications-page/applications-page.component';
import { CompaniesPageComponent } from './pages/companies-page/companies-page.component';
import { JobTrackerPlaceholderComponent } from './pages/job-tracker-placeholder/job-tracker-placeholder.component';
import { UsersPageComponent } from './pages/users-page/users-page.component';
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

  it('lazy-loads the real companies page instead of the job tracker placeholder', async () => {
    const shellRoute = routes.find((route) => route.component === AppShellComponent);
    const companiesRoute = shellRoute?.children?.find((route) => route.path === 'companies');

    expect(companiesRoute?.component).toBeUndefined();
    expect(await companiesRoute?.loadComponent?.()).toBe(CompaniesPageComponent);
  });

  it('lazy-loads feature pages while keeping the details placeholder', async () => {
    const shellRoute = routes.find((route) => route.component === AppShellComponent);
    const applicationsRoute = shellRoute?.children?.find((route) => route.path === 'applications');
    const detailsRoute = shellRoute?.children?.find((route) => route.path === 'applications/:id');
    const dashboardRoute = shellRoute?.children?.find((route) => route.path === 'dashboard');
    const usersRoute = shellRoute?.children?.find((route) => route.path === 'users');

    expect(await applicationsRoute?.loadComponent?.()).toBe(ApplicationsPageComponent);
    expect(await detailsRoute?.loadComponent?.()).toBe(JobTrackerPlaceholderComponent);
    expect(await dashboardRoute?.loadComponent?.()).toBe(JobTrackerPlaceholderComponent);
    expect(await usersRoute?.loadComponent?.()).toBe(UsersPageComponent);
  });
});
