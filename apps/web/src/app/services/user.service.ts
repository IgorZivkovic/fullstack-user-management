import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, catchError, map, of, switchMap, tap, throwError } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

type UsersResponse = {
  data: User[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
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
  };
};

type UserResponse = {
  data: User;
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
  private readonly queryRequests = new Subject<UsersQueryParams>();
  private currentQuery: UsersQueryParams = { page: 1, pageSize: 10 };

  readonly users = this._users.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly total = this._total.asReadonly();
  readonly page = this._page.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();
  readonly operationError = this._operationError.asReadonly();

  constructor(private readonly http: HttpClient) {
    this.queryRequests
      .pipe(
        tap(() => this._loading.set(true)),
        switchMap((query) => this.requestUsers(query)),
      )
      .subscribe((response) => {
        this._loading.set(false);

        if (!response) {
          return;
        }

        this._users.set(response.data);
        this._total.set(response.meta.total);
        this._page.set(response.meta.current_page);
        this._pageSize.set(response.meta.per_page);
        this.currentQuery = {
          ...this.currentQuery,
          page: response.meta.current_page,
          pageSize: response.meta.per_page,
        };
      });
  }

  add(user: User) {
    const payload = this.toPayload(user);
    return this.http.post<UserResponse>(`${this.apiBaseUrl}/users`, payload).pipe(
      tap(() => {
        this.fetchFromApi();
      }),
      map((response) => response.data),
      catchError((error) => {
        this.setOperationError('Failed to create user.');
        console.error('Failed to create user:', error);
        return throwError(() => error);
      }),
    );
  }

  update(user: User) {
    const payload = this.toPayload(user);
    return this.http.put<UserResponse>(`${this.apiBaseUrl}/users/${user.id}`, payload).pipe(
      tap(() => {
        this.fetchFromApi();
      }),
      map((response) => response.data),
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
    this.queryRequests.next(query);
  }

  private requestUsers(query: UsersQueryParams): Observable<UsersResponse | null> {
    const params = new HttpParams({
      fromObject: {
        page: String(query.page ?? 1),
        per_page: String(query.pageSize ?? 10),
        ...(query.search?.trim() ? { search: query.search.trim() } : {}),
        ...(query.gender && query.gender !== 'all' ? { gender: query.gender } : {}),
      },
    });

    return this.http.get<UsersResponse>(`${this.apiBaseUrl}/users`, { params }).pipe(
      catchError((error) => {
        this.setOperationError('Failed to load users.');
        console.error('Failed to fetch users from API:', error);
        return of(null);
      }),
    );
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
