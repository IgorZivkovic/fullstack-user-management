import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { UsersPageComponent } from './pages/users-page/users-page.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'users', component: UsersPageComponent },
  { path: '**', redirectTo: '' },
];
