import { CommonModule } from '@angular/common';
import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import {
  CompanyDialogComponent,
  CompanyDialogMode,
} from '../../components/company-dialog/company-dialog.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { Company, CompanyPayload } from '../../models/job-tracker.model';
import { ApiErrorService } from '../../services/api-error.service';
import { CompanyService } from '../../services/company.service';

@Component({
  selector: 'app-companies-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatTableModule,
    MatTooltipModule,
    CompanyDialogComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './companies-page.component.html',
  styleUrl: './companies-page.component.scss',
})
export class CompaniesPageComponent {
  private readonly companyService = inject(CompanyService);
  private readonly apiErrors = inject(ApiErrorService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchChanges = new Subject<string>();

  readonly displayedColumns = ['name', 'location', 'website', 'notes', 'actions'];
  readonly companies = signal<Company[]>([]);
  readonly loading = signal(false);
  readonly total = signal(0);
  readonly currentPage = signal(1);
  readonly dialogVisible = signal(false);
  readonly dialogMode = signal<CompanyDialogMode>('create');
  readonly selectedCompany = signal<Company | null>(null);
  readonly saving = signal(false);
  readonly confirmDeleteVisible = signal(false);
  readonly companyPendingDelete = signal<Company | null>(null);
  readonly deleting = signal(false);

  searchTerm = '';
  readonly pageSize = 10;

  get hasActiveSearch(): boolean {
    return this.searchTerm.trim().length > 0;
  }

  constructor() {
    this.searchChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadCompanies(1);
      });

    effect(() => {
      const error = this.apiErrors.lastError();
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

    this.loadCompanies();
  }

  openCreate(): void {
    this.selectedCompany.set(null);
    this.dialogMode.set('create');
    this.dialogVisible.set(true);
  }

  openEdit(company: Company): void {
    this.selectedCompany.set(company);
    this.dialogMode.set('edit');
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    if (!this.saving()) {
      this.dialogVisible.set(false);
    }
  }

  saveCompany(payload: CompanyPayload): void {
    const company = this.selectedCompany();
    const request = company
      ? this.companyService.update(company.id, payload)
      : this.companyService.create(payload);

    this.apiErrors.clear();
    this.saving.set(true);
    request
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          const wasCreated = company === null;
          this.dialogVisible.set(false);
          this.snackBar.open(wasCreated ? 'Company added.' : 'Company updated.', 'Dismiss', {
            duration: 3000,
          });
          this.loadCompanies(wasCreated ? 1 : this.currentPage());
        },
        error: () => {
          // ApiErrorService displays the backend validation or operation message.
        },
      });
  }

  requestDelete(company: Company): void {
    this.companyPendingDelete.set(company);
    this.confirmDeleteVisible.set(true);
  }

  cancelDelete(): void {
    if (this.deleting()) {
      return;
    }

    this.confirmDeleteVisible.set(false);
    this.companyPendingDelete.set(null);
  }

  confirmDelete(): void {
    const company = this.companyPendingDelete();
    if (!company || this.deleting()) {
      return;
    }

    this.apiErrors.clear();
    this.deleting.set(true);
    this.companyService
      .remove(company.id)
      .pipe(
        finalize(() => this.deleting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.confirmDeleteVisible.set(false);
          this.companyPendingDelete.set(null);
          this.snackBar.open('Company deleted.', 'Dismiss', { duration: 3000 });

          const targetPage =
            this.companies().length === 1 && this.currentPage() > 1
              ? this.currentPage() - 1
              : this.currentPage();
          this.loadCompanies(targetPage);
        },
        error: () => {
          this.confirmDeleteVisible.set(false);
          this.companyPendingDelete.set(null);
        },
      });
  }

  handleSearchChange(value: string): void {
    this.searchTerm = value;
    this.searchChanges.next(value.trim());
  }

  handlePageChange(event: PageEvent): void {
    const page = event.pageIndex + 1;
    if (page !== this.currentPage()) {
      this.loadCompanies(page);
    }
  }

  loadCompanies(page = this.currentPage()): void {
    this.apiErrors.clear();
    this.loading.set(true);
    this.companyService
      .list({ page, per_page: this.pageSize, search: this.searchTerm })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.companies.set(response.data);
          this.total.set(response.meta.total);
          this.currentPage.set(response.meta.current_page);
        },
        error: () => {
          // ApiErrorService keeps the previous list visible and reports the error.
        },
      });
  }
}
