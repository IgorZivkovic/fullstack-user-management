import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Company } from '../../models/job-tracker.model';
import { DataTableShellComponent } from '../../shared/components/data-table-shell/data-table-shell.component';

@Component({
  selector: 'app-company-table',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    DataTableShellComponent,
  ],
  templateUrl: './company-table.component.html',
  styleUrl: './company-table.component.scss',
})
export class CompanyTableComponent {
  readonly displayedColumns = ['name', 'location', 'website', 'notes', 'actions'];

  @Input({ required: true }) companies: Company[] = [];
  @Input() loading = false;
  @Input() emptyMessage = 'No companies found.';
  @Input() totalRecords = 0;
  @Input() pageIndex = 0;
  @Input() pageSize = 10;

  @Output() edit = new EventEmitter<Company>();
  @Output() remove = new EventEmitter<Company>();
  @Output() pageChange = new EventEmitter<PageEvent>();
}
