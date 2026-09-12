import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { ApiErrorResponse, ApiOperationError } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  private readonly _lastError = signal<ApiOperationError | null>(null);

  readonly lastError = this._lastError.asReadonly();

  handle(error: unknown, fallbackMessage: string): Observable<never> {
    const message = this.extractMessage(error) ?? fallbackMessage;
    this._lastError.set({ message, occurredAt: Date.now() });

    return throwError(() => error);
  }

  clear(): void {
    this._lastError.set(null);
  }

  private extractMessage(error: unknown): string | null {
    if (!(error instanceof HttpErrorResponse) || !this.isApiError(error.error)) {
      return null;
    }

    return error.error.message;
  }

  private isApiError(value: unknown): value is ApiErrorResponse {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const candidate = value as Partial<ApiErrorResponse>;

    return typeof candidate.statusCode === 'number' && typeof candidate.message === 'string';
  }
}
