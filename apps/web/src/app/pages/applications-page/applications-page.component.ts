import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ApplicationTableComponent } from '../../components/application-table/application-table.component';
import { JobApplication } from '../../models/job-tracker.model';
import { ApiErrorService } from '../../services/api-error.service';
import { JobApplicationService } from '../../services/job-application.service';

@Component({
  selector: 'app-applications-page',
  standalone: true,
  imports: [ApplicationTableComponent],
  templateUrl: './applications-page.component.html',
  styleUrl: './applications-page.component.scss',
})
export class ApplicationsPageComponent {
  private readonly applicationService = inject(JobApplicationService);
  private readonly apiErrors = inject(ApiErrorService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly applications = signal<JobApplication[]>([]);
  readonly loading = signal(false);
  readonly loadFailed = signal(false);
  readonly total = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = 10;

  get emptyMessage(): string {
    return this.loadFailed()
      ? 'Applications could not be loaded. Try refreshing the page.'
      : 'No job applications yet.';
  }

  constructor() {
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

    this.loadApplications();
  }

  handlePageChange(event: PageEvent): void {
    const page = event.pageIndex + 1;
    if (page !== this.currentPage()) {
      this.loadApplications(page);
    }
  }

  loadApplications(page = this.currentPage()): void {
    this.apiErrors.clear();
    this.loadFailed.set(false);
    this.loading.set(true);
    this.applicationService
      .list({ page, per_page: this.pageSize })
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
}
