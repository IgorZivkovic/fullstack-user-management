import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-table-component',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule],
  templateUrl: './user-table-component.html',
  styleUrl: './user-table-component.scss',
})
export class UserTableComponent {
  @Input({ required: true }) users: User[] = [];

  @Output() edit = new EventEmitter<User>();
  @Output() remove = new EventEmitter<User>();
}
