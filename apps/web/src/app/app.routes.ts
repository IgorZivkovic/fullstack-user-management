import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login.component';
import { UsersPageComponent } from './pages/users-page/users-page.component';
import { authGuard } from './guards/auth.guard';
import { AppShellComponent } from './layout/app-shell/app-shell.component';
import { JobTrackerPlaceholderComponent } from './pages/job-tracker-placeholder/job-tracker-placeholder.component';

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
        component: JobTrackerPlaceholderComponent,
        data: {
          title: 'Applications',
          description: 'Search, filter, and manage job applications from this page.',
        },
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
        component: JobTrackerPlaceholderComponent,
        data: {
          title: 'Companies',
          description: 'Manage the companies connected to your applications.',
        },
      },
      { path: 'users', component: UsersPageComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
