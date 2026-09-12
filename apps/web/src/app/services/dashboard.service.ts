import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DataResponse } from '../models/api.model';
import { JobTrackerDashboard } from '../models/job-tracker.model';
import { ApiErrorService } from './api-error.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly errors = inject(ApiErrorService);
  private readonly endpoint = `${environment.apiBaseUrl}/dashboard`;

  get(): Observable<JobTrackerDashboard> {
    return this.http.get<DataResponse<JobTrackerDashboard>>(this.endpoint).pipe(
      map((response) => response.data),
      catchError((error) => this.errors.handle(error, 'Failed to load the dashboard.')),
    );
  }
}
