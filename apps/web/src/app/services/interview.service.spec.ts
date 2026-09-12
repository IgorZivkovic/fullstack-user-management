import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Interview, InterviewPayload } from '../models/job-tracker.model';
import { InterviewService } from './interview.service';

describe('InterviewService', () => {
  let service: InterviewService;
  let http: HttpTestingController;

  const interview: Interview = {
    id: 8,
    job_application_id: 12,
    type: 'technical',
    scheduled_at: '2026-09-20T08:30:00Z',
    contact_name: 'Alex Recruiter',
    contact_email: 'alex@example.com',
    location_or_link: 'https://meet.example.com/interview',
    notes: null,
    outcome: null,
    created_at: '2026-09-12T10:00:00Z',
    updated_at: '2026-09-12T10:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(InterviewService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads interviews from the nested application URL', () => {
    service.list(12).subscribe((interviews) => expect(interviews).toEqual([interview]));

    const request = http.expectOne('/api/v1/job-applications/12/interviews');
    expect(request.request.method).toBe('GET');
    request.flush({ data: [interview] });
  });

  it('uses nested URLs and preserves interview payloads for writes', () => {
    const payload: InterviewPayload = {
      type: 'technical',
      scheduled_at: '2026-09-20T10:30:00+02:00',
      contact_name: 'Alex Recruiter',
      contact_email: 'alex@example.com',
      outcome: null,
    };

    service.create(12, payload).subscribe();
    const createRequest = http.expectOne('/api/v1/job-applications/12/interviews');
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual(payload);
    createRequest.flush({ data: interview });

    service.update(12, 8, { outcome: 'passed' }).subscribe();
    const updateRequest = http.expectOne('/api/v1/job-applications/12/interviews/8');
    expect(updateRequest.request.method).toBe('PATCH');
    expect(updateRequest.request.body).toEqual({ outcome: 'passed' });
    updateRequest.flush({ data: { ...interview, outcome: 'passed' } });

    service.remove(12, 8).subscribe();
    const deleteRequest = http.expectOne('/api/v1/job-applications/12/interviews/8');
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush({ deleted: true });
  });
});
