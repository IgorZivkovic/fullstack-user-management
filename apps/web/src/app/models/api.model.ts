export interface DataResponse<T> {
  data: T;
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  path: string;
  per_page: number;
  to: number | null;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

export interface DeleteResponse {
  deleted: boolean;
}

export interface ApiErrorResponse {
  statusCode: number;
  errorCode: string;
  timestamp: string;
  path: string;
  message: string;
  details?: string[];
}

export interface ApiOperationError {
  message: string;
  occurredAt: number;
}
