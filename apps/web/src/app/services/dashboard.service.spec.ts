import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { JobTrackerDashboard } from '../models/job-tracker.model';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(DashboardService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads and unwraps the authenticated dashboard summary', () => {
    const dashboard: JobTrackerDashboard = {
      total_applications: 0,
      applications_by_status: {
        saved: 0,
        applied: 0,
        interview: 0,
        offer: 0,
        rejected: 0,
        withdrawn: 0,
      },
      recent_applications: [],
      upcoming_interviews: [],
    };

    service.get().subscribe((result) => expect(result).toEqual(dashboard));

    const request = http.expectOne('/api/v1/dashboard');
    expect(request.request.method).toBe('GET');
    request.flush({ data: dashboard });
  });
});
