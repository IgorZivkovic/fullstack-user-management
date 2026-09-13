import {
  AfterContentInit,
  Component,
  ContentChildren,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChild,
} from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatColumnDef, MatTable, MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-data-table-shell',
  standalone: true,
  imports: [MatPaginatorModule, MatProgressBarModule, MatTableModule],
  templateUrl: './data-table-shell.component.html',
  styleUrl: './data-table-shell.component.scss',
})
export class DataTableShellComponent<T> implements AfterContentInit {
  @ContentChildren(MatColumnDef) private columnDefinitions!: QueryList<MatColumnDef>;
  @ViewChild(MatTable, { static: true }) private table!: MatTable<T>;

  @Input({ required: true }) data: T[] = [];
  @Input({ required: true }) displayedColumns: string[] = [];
  @Input() loading = false;
  @Input() loadingMessage = 'Loading...';
  @Input() emptyMessage = 'No records found.';
  @Input() totalRecords = 0;
  @Input() pageIndex = 0;
  @Input() pageSize = 10;
  @Input() tableMinWidth = '760px';
  @Input() paginatorLabel = 'Select page';

  @Output() pageChange = new EventEmitter<PageEvent>();

  get stateMessage(): string {
    return this.loading ? this.loadingMessage : this.emptyMessage;
  }

  ngAfterContentInit(): void {
    this.columnDefinitions.forEach((columnDefinition) => {
      this.table.addColumnDef(columnDefinition);
    });
  }

  handlePageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }
}
