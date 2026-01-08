import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule],
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
}
