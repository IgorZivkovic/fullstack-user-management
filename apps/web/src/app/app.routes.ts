import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { AppShellComponent } from './layout/app-shell/app-shell.component';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login.component';

export const routes: Routes = [
  { path: '', component: LandingComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard-page/dashboard-page.component').then(
            (module) => module.DashboardPageComponent,
          ),
      },
      {
        path: 'applications',
        loadComponent: () =>
          import('./pages/applications-page/applications-page.component').then(
            (module) => module.ApplicationsPageComponent,
          ),
      },
      {
        path: 'applications/:id',
        loadComponent: () =>
          import('./pages/application-details-page/application-details-page.component').then(
            (module) => module.ApplicationDetailsPageComponent,
          ),
      },
      {
        path: 'companies',
        loadComponent: () =>
          import('./pages/companies-page/companies-page.component').then(
            (module) => module.CompaniesPageComponent,
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users-page/users-page.component').then(
            (module) => module.UsersPageComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
