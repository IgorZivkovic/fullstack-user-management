import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ApiErrorService } from './api-error.service';

describe('ApiErrorService', () => {
  let service: ApiErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiErrorService);
  });

  it('uses the structured Laravel API message when one is available', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: {
        statusCode: 409,
        errorCode: 'COMPANY_HAS_APPLICATIONS',
        timestamp: '2026-09-12T10:00:00Z',
        path: '/api/v1/companies/1',
        message: 'Company cannot be deleted while it has job applications',
      },
    });

    service.handle(error, 'Fallback message').subscribe({ error: () => undefined });

    expect(service.lastError()?.message).toBe(
      'Company cannot be deleted while it has job applications',
    );
  });

  it('uses a contextual fallback for an unknown error shape', () => {
    service.handle(new Error('Network unavailable'), 'Failed to load data.').subscribe({
      error: () => undefined,
    });

    expect(service.lastError()?.message).toBe('Failed to load data.');

    service.clear();
    expect(service.lastError()).toBeNull();
  });

  it('keeps structured validation errors for forms', () => {
    const error = new HttpErrorResponse({
      status: 422,
      error: {
        statusCode: 422,
        errorCode: 'VALIDATION_ERROR',
        timestamp: '2026-09-12T10:00:00Z',
        path: '/api/v1/job-applications',
        message: 'Validation failed',
        errors: { position: ['The position field is required.'] },
      },
    });

    service.handle(error, 'Fallback message').subscribe({ error: () => undefined });

    expect(service.lastError()?.fieldErrors).toEqual({
      position: ['The position field is required.'],
    });
  });
});
