import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './user-table.component.html',
  styleUrl: './user-table.component.scss',
})
export class UserTableComponent {
  readonly displayedColumns = ['id', 'name', 'birthday', 'gender', 'country', 'actions'];

  @Input({ required: true }) users: User[] = [];
  @Input() first = 0;
  @Input() totalRecords = 0;
  @Input() pageSize = 10;
  @Input() canManageUsers = false;
  @Input() hasActiveFilters = false;
  @Input() loading = false;

  @Output() view = new EventEmitter<User>();
  @Output() edit = new EventEmitter<User>();
  @Output() remove = new EventEmitter<User>();
  @Output() pageChange = new EventEmitter<{ first: number; rows: number }>();

  get pageIndex(): number {
    return Math.floor(this.first / this.pageSize);
  }

  get emptyMessage(): string {
    if (this.loading) {
      return 'Loading users...';
    }

    if (this.hasActiveFilters) {
      return 'No users match your search or filters.';
    }

    return this.canManageUsers
      ? 'No users yet. Use "Add user" to create one.'
      : 'No users are available.';
  }

  handlePageChange(event: PageEvent): void {
    this.pageChange.emit({
      first: event.pageIndex * event.pageSize,
      rows: event.pageSize,
    });
  }
}
