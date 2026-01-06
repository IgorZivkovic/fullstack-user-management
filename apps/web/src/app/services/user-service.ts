import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly apiBaseUrl = 'http://localhost:3000/api/v1';
  // Legacy localStorage support (used before the API was implemented and wired).
  // Leave this commented for reference during development.
  // private readonly storageKey = 'users-data';
  private readonly _users = signal<User[]>([]);
  private readonly _loading = signal<boolean>(true);

  readonly users = this._users.asReadonly();
  readonly loading = this._loading.asReadonly();

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
    this.fetchFromApi();
  }

  add(user: User): void {
    const payload = this.toPayload(user);
    this.http.post<User>(`${this.apiBaseUrl}/users`, payload).subscribe({
      next: (created) => {
        this._users.update((users) => [...users, created]);
        // this.persist();
      },
      error: (error) => {
        console.error('Failed to create user:', error);
      },
    });
  }

  update(user: User): void {
    const payload = this.toPayload(user);
    this.http.put<User>(`${this.apiBaseUrl}/users/${user.id}`, payload).subscribe({
      next: (updated) => {
        this._users.update((users) =>
          users.map((existing) => (existing.id === updated.id ? updated : existing))
        );
        // this.persist();
      },
      error: (error) => {
        console.error('Failed to update user:', error);
      },
    });
  }

  remove(id: number): void {
    this.http.delete<{ deleted: boolean }>(`${this.apiBaseUrl}/users/${id}`).subscribe({
      next: () => {
        this._users.update((users) => users.filter((u) => u.id !== id));
        // this.persist();
      },
      error: (error) => {
        console.error('Failed to delete user:', error);
      },
    });
  }

  private fetchFromApi(): void {
    this._loading.set(true);
    this.http.get<User[]>(`${this.apiBaseUrl}/users`).subscribe({
      next: (users) => {
        console.log('Fetched users from API:', users);
        this._users.set(users);
        // this.persist();
        this._loading.set(false);
      },
      error: (error) => {
        console.error('Failed to fetch users from API:', error);
        this._loading.set(false);
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
