import { Component, DestroyRef, ViewChild, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { UserService } from '../../services/user.service';
import { UserTableComponent } from '../../components/user-table/user-table.component';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import {
  UserDialogComponent,
  UserDialogMode,
} from '../../components/user-dialog/user-dialog.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { Gender, User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    RouterLink,
    InputTextModule,
    SelectModule,
    ToastModule,
    UserTableComponent,
    UserDialogComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.scss',
  providers: [ConfirmationService, MessageService],
})
export class UsersPageComponent {
  @ViewChild(UserDialogComponent) dialogComponent?: UserDialogComponent;

  private readonly userService = inject(UserService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchChanges = new Subject<string>();

  readonly users = this.userService.users;
  readonly loading = this.userService.loading;
  readonly total = this.userService.total;
  readonly dialogVisible = signal(false);
  readonly dialogMode = signal<UserDialogMode>('add');
  readonly selectedUser = signal<User | null>(null);

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

  constructor() {
    this.searchChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.searchTerm = value;
        this.first = 0;
        this.loadUsers(1);
      });

    effect(() => {
      const error = this.userService.operationError();
      if (!error) {
        return;
      }

      this.messageService.add({
        severity: 'error',
        summary: 'Request failed',
        detail: error.message,
      });
    });

    this.loadUsers();
  }

  openAdd(): void {
    this.dialogMode.set('add');
    this.selectedUser.set(null);
    this.dialogComponent?.setupForm(null, 'add');
    this.dialogVisible.set(true);
  }

  handleClose(): void {
    this.dialogVisible.set(false);
  }

  openEdit(user: User): void {
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
    if (this.dialogMode() === 'edit') {
      this.userService.update(user);
    } else {
      this.userService.add(user);
    }

    this.dialogVisible.set(false);
  }

  handleDelete(user: User): void {
    this.confirmationService.confirm({
      header: 'Confirm Delete',
      message: `Delete ${user.name}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes, delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.userService.remove(user.id);

        if (this.selectedUser()?.id === user.id) {
          this.handleClose();
          this.selectedUser.set(null);
          this.dialogMode.set('add');
        }
      },
    });
  }

  handleLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      },
    });
  }

  handleSearchChange(value: string): void {
    this.searchTerm = value;
    this.searchChanges.next(value);
  }

  handleGenderChange(value: Gender | 'all'): void {
    this.genderFilter = value;
    this.first = 0;
    this.loadUsers(1);
  }

  handlePageChange(event: { first: number; rows: number }): void {
    if (event.first === this.first) {
      return;
    }
    this.first = event.first;
    const nextPage = Math.floor(this.first / this.pageSize) + 1;
    this.loadUsers(nextPage, this.pageSize);
  }

  private loadUsers(page = 1, pageSize = this.pageSize): void {
    this.userService.fetchFromApi({
      page,
      pageSize,
      search: this.searchTerm,
      gender: this.genderFilter,
    });
  }
}
