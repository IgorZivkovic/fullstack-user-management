import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { JobApplication } from '../../models/job-tracker.model';
import { ApiErrorService } from '../../services/api-error.service';
import { JobApplicationService } from '../../services/job-application.service';
import { ApplicationsPageComponent } from './applications-page.component';

describe('ApplicationsPageComponent', () => {
  let fixture: ComponentFixture<ApplicationsPageComponent>;
  let component: ApplicationsPageComponent;
  let applicationService: { list: ReturnType<typeof vi.fn> };

  const application: JobApplication = {
    id: 12,
    company_id: 4,
    company: { id: 4, name: 'Northstar Labs' },
    position: 'Angular Developer',
    status: 'applied',
    work_mode: 'remote',
    employment_type: 'full-time',
    source_url: null,
    applied_at: '2026-09-10',
    next_action_at: '2026-09-20',
    salary_min: 60_000,
    salary_max: 75_000,
    currency: 'EUR',
    notes: null,
    created_at: '2026-09-12T10:00:00Z',
    updated_at: '2026-09-12T10:00:00Z',
  };

  beforeEach(async () => {
    applicationService = {
      list: vi.fn(() => of(paginated([application], 1))),
    };

    await TestBed.configureTestingModule({
      imports: [ApplicationsPageComponent],
      providers: [
        provideRouter([]),
        { provide: JobApplicationService, useValue: applicationService },
        {
          provide: ApiErrorService,
          useValue: { lastError: signal(null), clear: vi.fn() },
        },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the first Laravel pagination page', () => {
    expect(applicationService.list).toHaveBeenCalledWith({ page: 1, per_page: 10 });
    expect(component.applications()).toEqual([application]);
    expect(component.total()).toBe(21);
    expect(component.currentPage()).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Angular Developer');
    expect(fixture.nativeElement.textContent).toContain('Northstar Labs');
  });

  it('loads the page selected in the shared paginator', () => {
    applicationService.list.mockReturnValueOnce(of(paginated([application], 2)));

    component.handlePageChange({ pageIndex: 1, pageSize: 10, length: 21 });

    expect(applicationService.list).toHaveBeenLastCalledWith({ page: 2, per_page: 10 });
    expect(component.currentPage()).toBe(2);
  });

  it('exposes a distinct error state when loading fails', () => {
    applicationService.list.mockReturnValueOnce(throwError(() => new Error('Network error')));

    component.loadApplications();

    expect(component.loadFailed()).toBe(true);
    expect(component.applications()).toEqual([]);
    expect(component.emptyMessage).toBe(
      'Applications could not be loaded. Try refreshing the page.',
    );
  });
});

function paginated(data: JobApplication[], currentPage: number) {
  return {
    data,
    links: { first: null, last: null, prev: null, next: null },
    meta: {
      current_page: currentPage,
      from: (currentPage - 1) * 10 + 1,
      last_page: 3,
      links: [],
      path: '/api/v1/job-applications',
      per_page: 10,
      to: currentPage * 10,
      total: 21,
    },
  };
}
