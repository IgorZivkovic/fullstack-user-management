import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { UsersPageComponent } from './users-page.component';

describe('UsersPageComponent', () => {
  let fixture: ComponentFixture<UsersPageComponent>;
  let component: UsersPageComponent;
  let router: Router;
  let userService: {
    users: WritableSignal<User[]>;
    loading: WritableSignal<boolean>;
    total: WritableSignal<number>;
    operationError: WritableSignal<null>;
    fetchFromApi: ReturnType<typeof vi.fn>;
    add: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  const user: User = {
    id: 1,
    name: 'Daniel Kim',
    birthday: '1999-12-26',
    gender: 'male',
    country: 'Australia',
  };

  beforeEach(async () => {
    userService = {
      users: signal([user]),
      loading: signal(false),
      total: signal(21),
      operationError: signal(null),
      fetchFromApi: vi.fn(),
      add: vi.fn(() => of(user)),
      update: vi.fn(() => of(user)),
      remove: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [UsersPageComponent],
      providers: [
        provideRouter([]),
        { provide: UserService, useValue: userService },
        { provide: AuthService, useValue: { canManageUsers: signal(true) } },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('loads users with the default URL state', () => {
    expect(userService.fetchFromApi).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      search: '',
      gender: 'all',
    });
    expect(fixture.nativeElement.textContent).toContain('Daniel Kim');
  });

  it('debounces user search before storing it in the URL', async () => {
    vi.useFakeTimers();
    const initialCallCount = userService.fetchFromApi.mock.calls.length;

    component.handleSearchChange('  daniel  ');
    vi.advanceTimersByTime(299);
    expect(userService.fetchFromApi).toHaveBeenCalledTimes(initialCallCount);

    vi.advanceTimersByTime(1);
    await vi.runAllTimersAsync();
    await fixture.whenStable();

    expect(router.url).toBe('/?search=daniel');
    expect(userService.fetchFromApi).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 10,
      search: 'daniel',
      gender: 'all',
    });
    vi.useRealTimers();
  });

  it('stores gender and paginator changes in the URL', async () => {
    component.handleGenderChange('female');
    await fixture.whenStable();

    component.handlePageChange({ first: 10, rows: 10 });
    await fixture.whenStable();

    expect(router.url).toBe('/?gender=female&page=2');
    expect(userService.fetchFromApi).toHaveBeenLastCalledWith({
      page: 2,
      pageSize: 10,
      search: '',
      gender: 'female',
    });
  });

  it('restores search, gender and pagination from the URL', async () => {
    await router.navigateByUrl('/?search=kim&gender=male&page=3');
    await fixture.whenStable();

    expect(component.searchTerm).toBe('kim');
    expect(component.genderFilter).toBe('male');
    expect(component.first).toBe(20);
    expect(userService.fetchFromApi).toHaveBeenLastCalledWith({
      page: 3,
      pageSize: 10,
      search: 'kim',
      gender: 'male',
    });
  });
});
