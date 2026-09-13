import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let authService: { login: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    authService = {
      login: vi.fn(() => of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('opens the dashboard after a successful login', () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.componentInstance.form.setValue({
      email: 'admin@example.com',
      password: 'admin12345',
    });

    fixture.componentInstance.submit();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'admin12345',
    });
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
