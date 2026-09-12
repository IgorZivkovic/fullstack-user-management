import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { JobApplication } from '../../models/job-tracker.model';
import { DataTableShellComponent } from '../../shared/components/data-table-shell/data-table-shell.component';

@Component({
  selector: 'app-application-table',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    RouterLink,
    DataTableShellComponent,
  ],
  templateUrl: './application-table.component.html',
  styleUrl: './application-table.component.scss',
})
export class ApplicationTableComponent {
  readonly displayedColumns = [
    'position',
    'company',
    'status',
    'work_mode',
    'applied_at',
    'next_action_at',
    'actions',
  ];

  @Input({ required: true }) applications: JobApplication[] = [];
  @Input() loading = false;
  @Input() emptyMessage = 'No job applications found.';
  @Input() totalRecords = 0;
  @Input() pageIndex = 0;
  @Input() pageSize = 10;

  @Output() pageChange = new EventEmitter<PageEvent>();
}
