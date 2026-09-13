import { Component, DestroyRef, ViewChild, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { UserService } from '../../services/user.service';
import { UserTableComponent } from '../../components/user-table/user-table.component';
import {
  UserDialogComponent,
  UserDialogMode,
} from '../../components/user-dialog/user-dialog.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { Gender, User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { readUserQueryState, writeUserQueryState } from './user-query-state';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    UserTableComponent,
    UserDialogComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.scss',
})
export class UsersPageComponent {
  @ViewChild(UserDialogComponent) dialogComponent?: UserDialogComponent;

  private readonly userService = inject(UserService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly searchChanges = new Subject<string>();

  readonly users = this.userService.users;
  readonly loading = this.userService.loading;
  readonly total = this.userService.total;
  readonly canManageUsers = this.authService.canManageUsers;
  readonly dialogVisible = signal(false);
  readonly dialogMode = signal<UserDialogMode>('add');
  readonly selectedUser = signal<User | null>(null);
  readonly savingUser = signal(false);
  readonly confirmDeleteVisible = signal(false);
  readonly userPendingDelete = signal<User | null>(null);

  searchTerm = '';
  genderFilter: Gender | 'all' = 'all';
  first = 0;
  readonly pageSize = 10;

  readonly genderOptions: { label: string; value: Gender | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
  ];

  get hasActiveFilters(): boolean {
    return this.searchTerm.trim().length > 0 || this.genderFilter !== 'all';
  }

  constructor() {
    this.searchChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateQueryParams(1));

    effect(() => {
      const error = this.userService.operationError();
      if (!error) {
        return;
      }

      this.snackBar.open(error.message, 'Dismiss', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar'],
      });
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const state = readUserQueryState(params);
      this.searchTerm = state.search;
      this.genderFilter = state.gender;
      this.first = (state.page - 1) * this.pageSize;
      this.loadUsers(state.page);
    });
  }

  openAdd(): void {
    if (!this.canManageUsers()) {
      return;
    }

    this.dialogMode.set('add');
    this.selectedUser.set(null);
    this.dialogComponent?.setupForm(null, 'add');
    this.dialogVisible.set(true);
  }

  handleClose(): void {
    this.dialogVisible.set(false);
  }

  openEdit(user: User): void {
    if (!this.canManageUsers()) {
      return;
    }

    this.dialogMode.set('edit');
    this.selectedUser.set(user);
    this.dialogComponent?.setupForm(user, 'edit');
    this.dialogVisible.set(true);
  }

  openView(user: User): void {
    this.dialogMode.set('view');
    this.selectedUser.set(user);
    this.dialogComponent?.setupForm(user, 'view');
    this.dialogVisible.set(true);
  }

  handleSave(user: User): void {
    if (!this.canManageUsers()) {
      return;
    }

    const request =
      this.dialogMode() === 'edit' ? this.userService.update(user) : this.userService.add(user);

    this.savingUser.set(true);
    request
      .pipe(
        finalize(() => this.savingUser.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.dialogVisible.set(false);
        },
        error: () => {
          // UserService surfaces the error through operationError; keep the dialog open.
        },
      });
  }

  handleDelete(user: User): void {
    if (!this.canManageUsers()) {
      return;
    }

    this.userPendingDelete.set(user);
    this.confirmDeleteVisible.set(true);
  }

  cancelDelete(): void {
    this.confirmDeleteVisible.set(false);
    this.userPendingDelete.set(null);
  }

  confirmDelete(): void {
    if (!this.canManageUsers()) {
      this.cancelDelete();
      return;
    }

    const user = this.userPendingDelete();

    if (!user) {
      return;
    }

    this.userService.remove(user.id);

    if (this.selectedUser()?.id === user.id) {
      this.handleClose();
      this.selectedUser.set(null);
      this.dialogMode.set('add');
    }

    this.cancelDelete();
  }

  handleSearchChange(value: string): void {
    this.searchTerm = value;
    this.searchChanges.next(value);
  }

  handleGenderChange(value: Gender | 'all'): void {
    this.genderFilter = value;
    this.updateQueryParams(1);
  }

  handlePageChange(event: { first: number; rows: number }): void {
    if (event.first === this.first) {
      return;
    }
    const nextPage = Math.floor(event.first / this.pageSize) + 1;
    this.updateQueryParams(nextPage);
  }

  private loadUsers(page = 1, pageSize = this.pageSize): void {
    this.userService.fetchFromApi({
      page,
      pageSize,
      search: this.searchTerm,
      gender: this.genderFilter,
    });
  }

  private updateQueryParams(page: number): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: writeUserQueryState({
        page,
        search: this.searchTerm,
        gender: this.genderFilter,
      }),
      replaceUrl: true,
    });
  }
}
