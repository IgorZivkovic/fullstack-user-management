import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserService } from '../../services/user-service';
import { UserTableComponent } from '../../components/user-table-component/user-table-component';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import {
  UserDialogComponent,
  UserDialogMode,
} from '../../components/user-dialog-component/user-dialog-component';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-users-page-component',
  standalone: true,
  imports: [
    ButtonModule,
    RouterLink,
    UserTableComponent,
    UserDialogComponent,
    ConfirmDialogModule,
  ],
  templateUrl: './users-page-component.html',
  styleUrl: './users-page-component.scss',
  providers: [ConfirmationService],
})
export class UsersPageComponent {
  private readonly userService = inject(UserService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly users = this.userService.users;
  readonly dialogVisible = signal(false);
  readonly dialogMode = signal<UserDialogMode>('add');
  readonly selectedUser = signal<User | null>(null);

  openAdd(): void {
    this.dialogMode.set('add');
    this.selectedUser.set(null);
    this.dialogVisible.set(true);
  }

  handleClose(): void {
    this.dialogVisible.set(false);
  }

  openEdit(user: User): void {
    this.dialogMode.set('edit');
    this.selectedUser.set(user);
    this.dialogVisible.set(true);
  }

  openView(user: User): void {
    this.dialogMode.set('view');
    this.selectedUser.set(user);
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
}
