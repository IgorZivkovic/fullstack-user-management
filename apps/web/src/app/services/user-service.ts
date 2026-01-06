import { Injectable, signal } from '@angular/core';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly storageKey = 'users-data';
  private readonly _users = signal<User[]>([]);
  private readonly _loading = signal<boolean>(true);

  readonly users = this._users.asReadonly();
  readonly loading = this._loading.asReadonly();

  constructor() {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        this._users.set(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse stored users:', error);
        localStorage.removeItem(this.storageKey);
        this._users.set([]);
      }
    }

    this._loading.set(false);
  }

  add(user: User): void {
    this._users.update((users) => [...users, user]);
    this.persist();
  }

  update(user: User): void {
    this._users.update((users) =>
      users.map((existing) => (existing.id === user.id ? user : existing))
    );
    this.persist();
  }

  remove(id: number): void {
    this._users.update((users) => users.filter((u) => u.id !== id));
    this.persist();
  }

  private persist(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this._users()));
  }
}
