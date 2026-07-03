import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';
import { TuiPagination } from '@taiga-ui/kit';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [CommonModule, TuiButton, TuiPagination],
  templateUrl: './user-table.component.html',
  styleUrl: './user-table.component.scss',
})
export class UserTableComponent {
  @Input({ required: true }) users: User[] = [];
  @Input() first = 0;
  @Input() totalRecords = 0;
  @Input() pageSize = 10;

  @Output() view = new EventEmitter<User>();
  @Output() edit = new EventEmitter<User>();
  @Output() remove = new EventEmitter<User>();
  @Output() pageChange = new EventEmitter<{ first: number; rows: number }>();

  get pageIndex(): number {
    return Math.floor(this.first / this.pageSize);
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.totalRecords / this.pageSize));
  }

  get pageStart(): number {
    return this.totalRecords === 0 ? 0 : this.first + 1;
  }

  get pageEnd(): number {
    return Math.min(this.first + this.pageSize, this.totalRecords);
  }

  handlePageIndexChange(index: number): void {
    this.pageChange.emit({
      first: index * this.pageSize,
      rows: this.pageSize,
    });
  }
}
