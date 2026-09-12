import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DataResponse, DeleteResponse } from '../models/api.model';
import { Interview, InterviewPayload, UpdateInterviewPayload } from '../models/job-tracker.model';
import { ApiErrorService } from './api-error.service';

@Injectable({ providedIn: 'root' })
export class InterviewService {
  private readonly http = inject(HttpClient);
  private readonly errors = inject(ApiErrorService);
  private readonly applicationsEndpoint = `${environment.apiBaseUrl}/job-applications`;

  list(applicationId: number): Observable<Interview[]> {
    return this.http.get<DataResponse<Interview[]>>(this.endpoint(applicationId)).pipe(
      map((response) => response.data),
      catchError((error) => this.errors.handle(error, 'Failed to load interviews.')),
    );
  }

  create(applicationId: number, payload: InterviewPayload): Observable<Interview> {
    return this.http.post<DataResponse<Interview>>(this.endpoint(applicationId), payload).pipe(
      map((response) => response.data),
      catchError((error) => this.errors.handle(error, 'Failed to schedule the interview.')),
    );
  }

  update(
    applicationId: number,
    interviewId: number,
    payload: UpdateInterviewPayload,
  ): Observable<Interview> {
    return this.http
      .patch<DataResponse<Interview>>(`${this.endpoint(applicationId)}/${interviewId}`, payload)
      .pipe(
        map((response) => response.data),
        catchError((error) => this.errors.handle(error, 'Failed to update the interview.')),
      );
  }

  remove(applicationId: number, interviewId: number): Observable<DeleteResponse> {
    return this.http
      .delete<DeleteResponse>(`${this.endpoint(applicationId)}/${interviewId}`)
      .pipe(catchError((error) => this.errors.handle(error, 'Failed to delete the interview.')));
  }

  private endpoint(applicationId: number): string {
    return `${this.applicationsEndpoint}/${applicationId}/interviews`;
  }
}
