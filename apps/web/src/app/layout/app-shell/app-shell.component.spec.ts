import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService, AuthUser } from '../../services/auth.service';
import { AppShellComponent } from './app-shell.component';

describe('AppShellComponent', () => {
  let fixture: ComponentFixture<AppShellComponent>;
  let router: Router;
  let authService: {
    currentUser: ReturnType<typeof signal<AuthUser | null>>;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authService = {
      currentUser: signal<AuthUser | null>({
        id: 1,
        email: 'admin@example.com',
        role: 'admin',
      }),
      logout: vi.fn(() => of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AppShellComponent);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('shows the job application tracker navigation and current account', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Job Application Tracker');
    expect(text).toContain('Dashboard');
    expect(text).toContain('Applications');
    expect(text).toContain('Companies');
    expect(text).toContain('Users');
    expect(text).toContain('admin@example.com');
  });

  it('logs out and returns to the login page', () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.logout();

    expect(authService.logout).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
