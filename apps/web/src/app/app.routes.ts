import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing-component/landing-component';
import { UsersPageComponent } from './pages/users-page-component/users-page-component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'users', component: UsersPageComponent },
  { path: '**', redirectTo: '' },
];
