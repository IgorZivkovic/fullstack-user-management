import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Company, CompanyPayload } from '../models/job-tracker.model';
import { CompanyService } from './company.service';

describe('CompanyService', () => {
  let service: CompanyService;
  let http: HttpTestingController;

  const company: Company = {
    id: 4,
    name: 'Northstar Labs',
    website: 'https://northstar.example.com',
    location: 'Berlin',
    notes: null,
    created_at: '2026-09-12T10:00:00Z',
    updated_at: '2026-09-12T10:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(CompanyService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends Laravel pagination and trimmed search parameters', () => {
    service.list({ page: 2, per_page: 5, search: '  north  ' }).subscribe();

    const request = http.expectOne((candidate) => candidate.url === '/api/v1/companies');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('per_page')).toBe('5');
    expect(request.request.params.get('search')).toBe('north');

    request.flush(paginated([company]));
  });

  it('uses the expected URLs, methods and payloads for company CRUD', () => {
    const payload: CompanyPayload = {
      name: 'Northstar Labs',
      website: 'https://northstar.example.com',
      location: 'Berlin',
      notes: null,
    };

    service.get(company.id).subscribe();
    http.expectOne(`/api/v1/companies/${company.id}`).flush({ data: company });

    service.create(payload).subscribe();
    const createRequest = http.expectOne('/api/v1/companies');
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual(payload);
    createRequest.flush({ data: company });

    service.update(company.id, { location: 'Remote' }).subscribe();
    const updateRequest = http.expectOne(`/api/v1/companies/${company.id}`);
    expect(updateRequest.request.method).toBe('PATCH');
    expect(updateRequest.request.body).toEqual({ location: 'Remote' });
    updateRequest.flush({ data: { ...company, location: 'Remote' } });

    service.remove(company.id).subscribe();
    const deleteRequest = http.expectOne(`/api/v1/companies/${company.id}`);
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush({ deleted: true });
  });
});

function paginated(data: Company[]) {
  return {
    data,
    links: { first: null, last: null, prev: null, next: null },
    meta: {
      current_page: 2,
      from: 6,
      last_page: 2,
      links: [],
      path: '/api/v1/companies',
      per_page: 5,
      to: 6,
      total: 6,
    },
  };
}
