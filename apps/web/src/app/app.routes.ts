import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login.component';
import { UsersPageComponent } from './pages/users-page/users-page.component';
import { authGuard } from './guards/auth.guard';
import { AppShellComponent } from './layout/app-shell/app-shell.component';
import { JobTrackerPlaceholderComponent } from './pages/job-tracker-placeholder/job-tracker-placeholder.component';
import { CompaniesPageComponent } from './pages/companies-page/companies-page.component';
import { ApplicationsPageComponent } from './pages/applications-page/applications-page.component';

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
        component: JobTrackerPlaceholderComponent,
        data: {
          title: 'Dashboard',
          description:
            'Application totals, recent activity, and upcoming interviews will appear here.',
        },
      },
      {
        path: 'applications',
        component: ApplicationsPageComponent,
      },
      {
        path: 'applications/:id',
        component: JobTrackerPlaceholderComponent,
        data: {
          title: 'Application details',
          description: 'Application details and the interview timeline will appear here.',
        },
      },
      {
        path: 'companies',
        component: CompaniesPageComponent,
      },
      { path: 'users', component: UsersPageComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
