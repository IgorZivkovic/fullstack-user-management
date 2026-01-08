import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { finalize } from 'rxjs';
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

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly apiBaseUrl = environment.apiBaseUrl;
  // Legacy localStorage support (used before the API was implemented and wired).
  // Leave this commented for reference during development.
  // private readonly storageKey = 'users-data';
  private readonly _users = signal<User[]>([]);
  private readonly _loading = signal<boolean>(true);
  private readonly _total = signal<number>(0);
  private readonly _page = signal<number>(1);
  private readonly _pageSize = signal<number>(10);
  private currentQuery: UsersQueryParams = { page: 1, pageSize: 10 };

  readonly users = this._users.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly total = this._total.asReadonly();
  readonly page = this._page.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();

  constructor(private readonly http: HttpClient) {
    // Legacy localStorage hydrate (used before the API was implemented and wired).
    // const stored = localStorage.getItem(this.storageKey);
    // if (stored) {
    //   try {
    //     this._users.set(JSON.parse(stored));
    //   } catch (error) {
    //     console.error('Failed to parse stored users:', error);
    //     localStorage.removeItem(this.storageKey);
    //     this._users.set([]);
    //   }
    // }
  }

  add(user: User): void {
    const payload = this.toPayload(user);
    this.http.post<User>(`${this.apiBaseUrl}/users`, payload).subscribe({
      next: () => {
        this.fetchFromApi();
      },
      error: (error) => {
        console.error('Failed to create user:', error);
      },
    });
  }

  update(user: User): void {
    const payload = this.toPayload(user);
    this.http.put<User>(`${this.apiBaseUrl}/users/${user.id}`, payload).subscribe({
      next: () => {
        this.fetchFromApi();
      },
      error: (error) => {
        console.error('Failed to update user:', error);
      },
    });
  }

  remove(id: number): void {
    this.http.delete<{ deleted: boolean }>(`${this.apiBaseUrl}/users/${id}`).subscribe({
      next: () => {
        this.fetchFromApi();
      },
      error: (error) => {
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
      .get<UsersResponse | User[]>(`${this.apiBaseUrl}/users`, { params })
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
      next: (response) => {
        if (Array.isArray(response)) {
          this._users.set(response);
          this._total.set(response.length);
          this._page.set(1);
          this._pageSize.set(response.length);
          return;
        }
        this._users.set(response.data);
        this._total.set(response.pagination.total);
        this._page.set(response.pagination.page);
        this._pageSize.set(response.pagination.pageSize);
        this.currentQuery = {
          ...this.currentQuery,
          page: response.pagination.page,
          pageSize: response.pagination.pageSize,
        };
        // this.persist();
      },
      error: (error) => {
        console.error('Failed to fetch users from API:', error);
      },
    });
  }

  private toPayload(user: User): Omit<User, 'id'> {
    const { id: _id, ...payload } = user;
    return payload;
  }

  // Legacy localStorage persist (used before the API was implemented and wired).
  // private persist(): void {
  //   localStorage.setItem(this.storageKey, JSON.stringify(this._users()));
  // }
}
