import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DataResponse, DeleteResponse, PaginatedResponse } from '../models/api.model';
import {
  Company,
  CompanyFilters,
  CompanyPayload,
  UpdateCompanyPayload,
} from '../models/job-tracker.model';
import { ApiErrorService } from './api-error.service';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly http = inject(HttpClient);
  private readonly errors = inject(ApiErrorService);
  private readonly endpoint = `${environment.apiBaseUrl}/companies`;

  list(filters: CompanyFilters = {}): Observable<PaginatedResponse<Company>> {
    const params = new HttpParams({
      fromObject: {
        page: String(filters.page ?? 1),
        per_page: String(filters.per_page ?? 15),
        ...(filters.search?.trim() ? { search: filters.search.trim() } : {}),
      },
    });

    return this.http
      .get<PaginatedResponse<Company>>(this.endpoint, { params })
      .pipe(catchError((error) => this.errors.handle(error, 'Failed to load companies.')));
  }

  get(id: number): Observable<Company> {
    return this.http.get<DataResponse<Company>>(`${this.endpoint}/${id}`).pipe(
      map((response) => response.data),
      catchError((error) => this.errors.handle(error, 'Failed to load the company.')),
    );
  }

  create(payload: CompanyPayload): Observable<Company> {
    return this.http.post<DataResponse<Company>>(this.endpoint, payload).pipe(
      map((response) => response.data),
      catchError((error) => this.errors.handle(error, 'Failed to create the company.')),
    );
  }

  update(id: number, payload: UpdateCompanyPayload): Observable<Company> {
    return this.http.patch<DataResponse<Company>>(`${this.endpoint}/${id}`, payload).pipe(
      map((response) => response.data),
      catchError((error) => this.errors.handle(error, 'Failed to update the company.')),
    );
  }

  remove(id: number): Observable<DeleteResponse> {
    return this.http
      .delete<DeleteResponse>(`${this.endpoint}/${id}`)
      .pipe(catchError((error) => this.errors.handle(error, 'Failed to delete the company.')));
  }
}
