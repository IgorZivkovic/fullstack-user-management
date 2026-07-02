import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, finalize, tap, throwError } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

type UsersResponse = {
  data: User[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

type UsersQueryParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  gender?: User['gender'] | 'all';
};

type UserOperationError = {
  message: string;
  occurredAt: number;
};

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly apiBaseUrl = environment.apiBaseUrl;
  private readonly _users = signal<User[]>([]);
  private readonly _loading = signal<boolean>(true);
  private readonly _total = signal<number>(0);
  private readonly _page = signal<number>(1);
  private readonly _pageSize = signal<number>(10);
  private readonly _operationError = signal<UserOperationError | null>(null);
  private currentQuery: UsersQueryParams = { page: 1, pageSize: 10 };

  readonly users = this._users.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly total = this._total.asReadonly();
  readonly page = this._page.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();
  readonly operationError = this._operationError.asReadonly();

  constructor(private readonly http: HttpClient) {}

  add(user: User) {
    const payload = this.toPayload(user);
    return this.http.post<User>(`${this.apiBaseUrl}/users`, payload).pipe(
      tap(() => {
        this.fetchFromApi();
      }),
      catchError((error) => {
        this.setOperationError('Failed to create user.');
        console.error('Failed to create user:', error);
        return throwError(() => error);
      }),
    );
  }

  update(user: User) {
    const payload = this.toPayload(user);
    return this.http.put<User>(`${this.apiBaseUrl}/users/${user.id}`, payload).pipe(
      tap(() => {
        this.fetchFromApi();
      }),
      catchError((error) => {
        this.setOperationError('Failed to update user.');
        console.error('Failed to update user:', error);
        return throwError(() => error);
      }),
    );
  }

  remove(id: number): void {
    this.http.delete<{ deleted: boolean }>(`${this.apiBaseUrl}/users/${id}`).subscribe({
      next: () => {
        this.fetchFromApi();
      },
      error: (error) => {
        this.setOperationError('Failed to delete user.');
        console.error('Failed to delete user:', error);
      },
    });
  }

  fetchFromApi(overrides: UsersQueryParams = {}): void {
    const query = { ...this.currentQuery, ...overrides };
    this.currentQuery = query;

    const params = new HttpParams({
      fromObject: {
        page: String(query.page ?? 1),
        pageSize: String(query.pageSize ?? 10),
        ...(query.search?.trim() ? { search: query.search.trim() } : {}),
        ...(query.gender && query.gender !== 'all' ? { gender: query.gender } : {}),
      },
    });

    this._loading.set(true);
    this.http
      .get<UsersResponse>(`${this.apiBaseUrl}/users`, { params })
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (response) => {
          this._users.set(response.data);
          this._total.set(response.pagination.total);
          this._page.set(response.pagination.page);
          this._pageSize.set(response.pagination.pageSize);
          this.currentQuery = {
            ...this.currentQuery,
            page: response.pagination.page,
            pageSize: response.pagination.pageSize,
          };
        },
        error: (error) => {
          this.setOperationError('Failed to load users.');
          console.error('Failed to fetch users from API:', error);
        },
      });
  }

  private toPayload(user: User): Omit<User, 'id'> {
    return {
      name: user.name,
      birthday: user.birthday,
      gender: user.gender,
      country: user.country,
    };
  }

  private setOperationError(message: string): void {
    this._operationError.set({ message, occurredAt: Date.now() });
  }
}
