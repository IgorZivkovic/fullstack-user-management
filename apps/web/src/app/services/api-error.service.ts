import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { ApiErrorResponse, ApiOperationError } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  private readonly _lastError = signal<ApiOperationError | null>(null);

  readonly lastError = this._lastError.asReadonly();

  handle(error: unknown, fallbackMessage: string): Observable<never> {
    const response = this.extractResponse(error);
    const message = response?.message ?? fallbackMessage;
    this._lastError.set({
      message,
      occurredAt: Date.now(),
      ...(response?.errors ? { fieldErrors: response.errors } : {}),
    });

    return throwError(() => error);
  }

  clear(): void {
    this._lastError.set(null);
  }

  private extractResponse(error: unknown): ApiErrorResponse | null {
    if (!(error instanceof HttpErrorResponse) || !this.isApiError(error.error)) {
      return null;
    }

    return error.error;
  }

  private isApiError(value: unknown): value is ApiErrorResponse {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const candidate = value as Partial<ApiErrorResponse>;

    return typeof candidate.statusCode === 'number' && typeof candidate.message === 'string';
  }
}
