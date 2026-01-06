import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

type ErrorPayload = {
  message?: string | string[];
  error?: string;
  errorCode?: string;
};

const statusCodeMap: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
  [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Internal server error';
    let errorCode: string | undefined;
    let details: string[] | undefined;

    if (isHttpException) {
      const payload = exception.getResponse() as ErrorPayload | string;
      if (typeof payload === 'string') {
        message = payload;
      } else if (payload && typeof payload === 'object') {
        message = payload.message ?? exception.message;
        errorCode = payload.errorCode;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    if (status === HttpStatus.BAD_REQUEST && Array.isArray(message)) {
      details = message;
      message = 'Validation failed';
      errorCode = errorCode ?? 'VALIDATION_ERROR';
    }

    if (!errorCode) {
      errorCode = statusCodeMap[status] ?? 'UNKNOWN_ERROR';
    }

    response.status(status).json({
      statusCode: status,
      errorCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      ...(details ? { details } : {}),
    });
  }
}
