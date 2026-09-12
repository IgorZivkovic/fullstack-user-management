import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { ApiOperationError } from '../../models/api.model';
import { Company } from '../../models/job-tracker.model';
import { ApiErrorService } from '../../services/api-error.service';
import { CompanyService } from '../../services/company.service';
import { CompaniesPageComponent } from './companies-page.component';

describe('CompaniesPageComponent', () => {
  let fixture: ComponentFixture<CompaniesPageComponent>;
  let component: CompaniesPageComponent;
  let companyService: {
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let apiError: WritableSignal<ApiOperationError | null>;
  let snackBar: { open: ReturnType<typeof vi.fn> };

  const company: Company = {
    id: 1,
    name: 'Northstar Labs',
    website: 'https://northstar.example.com',
    location: 'Berlin',
    notes: 'Product engineering',
    created_at: '2026-09-12T10:00:00Z',
    updated_at: '2026-09-12T10:00:00Z',
  };

  beforeEach(async () => {
    companyService = {
      list: vi.fn(() => of(paginated([company]))),
      create: vi.fn(() => of(company)),
      update: vi.fn(() => of(company)),
      remove: vi.fn(() => of({ deleted: true })),
    };
    apiError = signal<ApiOperationError | null>(null);
    snackBar = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CompaniesPageComponent],
      providers: [
        { provide: CompanyService, useValue: companyService },
        {
          provide: ApiErrorService,
          useValue: { lastError: apiError.asReadonly(), clear: vi.fn(() => apiError.set(null)) },
        },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CompaniesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the paginated company list', () => {
    expect(companyService.list).toHaveBeenCalledWith({ page: 1, per_page: 10, search: '' });
    expect(component.companies()).toEqual([company]);
    expect(component.total()).toBe(1);
  });

  it('creates a company and reloads the first page', () => {
    const payload = {
      name: company.name,
      website: company.website,
      location: company.location,
      notes: company.notes,
    };
    component.openCreate();

    component.saveCompany(payload);

    expect(companyService.create).toHaveBeenCalledWith(payload);
    expect(companyService.list).toHaveBeenLastCalledWith({ page: 1, per_page: 10, search: '' });
    expect(component.dialogVisible()).toBe(false);
  });

  it('debounces company search and restarts pagination', () => {
    vi.useFakeTimers();

    component.handleSearchChange('  berlin  ');
    vi.advanceTimersByTime(300);

    expect(companyService.list).toHaveBeenLastCalledWith({
      page: 1,
      per_page: 10,
      search: '  berlin  ',
    });
    vi.useRealTimers();
  });

  it('updates the selected company', () => {
    component.openEdit(company);

    component.saveCompany({
      name: company.name,
      website: company.website,
      location: 'Remote',
      notes: company.notes,
    });

    expect(companyService.update).toHaveBeenCalledWith(company.id, {
      name: company.name,
      website: company.website,
      location: 'Remote',
      notes: company.notes,
    });
  });

  it('deletes only after confirmation and refreshes the list', () => {
    component.requestDelete(company);

    component.confirmDelete();

    expect(companyService.remove).toHaveBeenCalledWith(company.id);
    expect(component.confirmDeleteVisible()).toBe(false);
    expect(companyService.list).toHaveBeenCalledTimes(2);
  });

  it('shows the backend conflict message when a company has applications', () => {
    companyService.remove.mockImplementationOnce(() => {
      apiError.set({
        message: 'Company cannot be deleted while it has job applications',
        occurredAt: Date.now(),
      });
      return throwError(() => new Error('Conflict'));
    });
    component.requestDelete(company);

    component.confirmDelete();
    fixture.detectChanges();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Company cannot be deleted while it has job applications',
      'Dismiss',
      expect.objectContaining({ duration: 5000 }),
    );
    expect(component.confirmDeleteVisible()).toBe(false);
  });
});

function paginated(data: Company[]) {
  return {
    data,
    links: { first: null, last: null, prev: null, next: null },
    meta: {
      current_page: 1,
      from: data.length === 0 ? null : 1,
      last_page: 1,
      links: [],
      path: '/api/v1/companies',
      per_page: 10,
      to: data.length === 0 ? null : data.length,
      total: data.length,
    },
  };
}
