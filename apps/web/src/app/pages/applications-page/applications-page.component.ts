import { CommonModule } from '@angular/common';
import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { ApplicationTableComponent } from '../../components/application-table/application-table.component';
import {
  CompanySummary,
  JobApplication,
  JobApplicationFilters,
  JobApplicationSortField,
  JobApplicationStatus,
  JOB_APPLICATION_STATUSES,
  SortDirection,
  WorkMode,
  WORK_MODES,
} from '../../models/job-tracker.model';
import { ApiErrorService } from '../../services/api-error.service';
import { CompanyService } from '../../services/company.service';
import { JobApplicationService } from '../../services/job-application.service';
import {
  ApplicationQueryState,
  DEFAULT_APPLICATION_QUERY_STATE,
  readApplicationQueryState,
  toJobApplicationFilters,
  writeApplicationQueryState,
} from './application-query-state';

@Component({
  selector: 'app-applications-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ApplicationTableComponent,
  ],
  templateUrl: './applications-page.component.html',
  styleUrl: './applications-page.component.scss',
})
export class ApplicationsPageComponent {
  private readonly applicationService = inject(JobApplicationService);
  private readonly companyService = inject(CompanyService);
  private readonly apiErrors = inject(ApiErrorService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly searchChanges = new Subject<string>();

  readonly applications = signal<JobApplication[]>([]);
  readonly companies = signal<CompanySummary[]>([]);
  readonly loading = signal(false);
  readonly companiesLoading = signal(false);
  readonly loadFailed = signal(false);
  readonly total = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = 10;
  readonly statuses = JOB_APPLICATION_STATUSES;
  readonly workModes = WORK_MODES;

  searchTerm = '';
  selectedStatus: JobApplicationStatus | '' = '';
  selectedWorkMode: WorkMode | '' = '';
  selectedCompanyId: number | null = null;
  selectedSort: JobApplicationSortField = 'created_at';
  selectedDirection: SortDirection = 'desc';

  get emptyMessage(): string {
    if (this.loadFailed()) {
      return 'Applications could not be loaded. Try refreshing the page.';
    }

    return this.hasActiveFilters
      ? 'No applications match your filters.'
      : 'No job applications yet.';
  }

  get hasActiveFilters(): boolean {
    return (
      this.searchTerm.trim() !== '' ||
      this.selectedStatus !== '' ||
      this.selectedWorkMode !== '' ||
      this.selectedCompanyId !== null ||
      this.selectedSort !== 'created_at' ||
      this.selectedDirection !== 'desc'
    );
  }

  constructor() {
    this.searchChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateQueryParams(1));

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

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const state = readApplicationQueryState(params);
      this.applyQueryState(state);
      this.loadApplications(toJobApplicationFilters(state));
    });
  }

  handleSearchChange(value: string): void {
    this.searchTerm = value;
    this.searchChanges.next(value.trim());
  }

  applyFilters(): void {
    this.updateQueryParams(1);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedWorkMode = '';
    this.selectedCompanyId = null;
    this.selectedSort = DEFAULT_APPLICATION_QUERY_STATE.sort;
    this.selectedDirection = DEFAULT_APPLICATION_QUERY_STATE.direction;
    this.updateQueryParams(1);
  }

  handlePageChange(event: PageEvent): void {
    const page = event.pageIndex + 1;
    if (page !== this.currentPage()) {
      this.updateQueryParams(page);
    }
  }

  loadApplications(
    filters: JobApplicationFilters = toJobApplicationFilters(this.currentQueryState()),
  ): void {
    this.apiErrors.clear();
    this.loadFailed.set(false);
    this.loading.set(true);
    this.applicationService
      .list({ ...filters, per_page: this.pageSize })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.applications.set(response.data);
          this.total.set(response.meta.total);
          this.currentPage.set(response.meta.current_page);
        },
        error: () => {
          this.applications.set([]);
          this.total.set(0);
          this.loadFailed.set(true);
        },
      });
  }

  private loadCompanies(): void {
    this.companiesLoading.set(true);
    this.companyService
      .list({ page: 1, per_page: 100 })
      .pipe(
        finalize(() => this.companiesLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.companies.set(response.data.map(({ id, name }) => ({ id, name })));
        },
        error: () => {
          this.companies.set([]);
        },
      });
  }

  private updateQueryParams(page: number): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: writeApplicationQueryState({ ...this.currentQueryState(), page }),
      replaceUrl: true,
    });
  }

  private currentQueryState(): ApplicationQueryState {
    return {
      page: this.currentPage(),
      search: this.searchTerm,
      status: this.selectedStatus,
      workMode: this.selectedWorkMode,
      companyId: this.selectedCompanyId,
      sort: this.selectedSort,
      direction: this.selectedDirection,
    };
  }

  private applyQueryState(state: ApplicationQueryState): void {
    this.searchTerm = state.search;
    this.selectedStatus = state.status;
    this.selectedWorkMode = state.workMode;
    this.selectedCompanyId = state.companyId;
    this.selectedSort = state.sort;
    this.selectedDirection = state.direction;
    this.currentPage.set(state.page);
  }
}
