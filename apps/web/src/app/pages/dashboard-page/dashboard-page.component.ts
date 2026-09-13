import { TitleCasePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { ApplicationBoardComponent } from '../../components/application-board/application-board.component';
import { DashboardOverviewComponent } from '../../components/dashboard-overview/dashboard-overview.component';
import {
  JobApplication,
  JobApplicationStatus,
  JobTrackerDashboard,
  JOB_APPLICATION_STATUSES,
} from '../../models/job-tracker.model';
import { ApiErrorService } from '../../services/api-error.service';
import { DashboardService } from '../../services/dashboard.service';
import { JobApplicationService } from '../../services/job-application.service';

type StatusSummary = {
  status: JobApplicationStatus;
  count: number;
};

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    ApplicationBoardComponent,
    DashboardOverviewComponent,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    RouterLink,
    TitleCasePipe,
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly applicationService = inject(JobApplicationService);
  private readonly apiErrors = inject(ApiErrorService);
  private readonly destroyRef = inject(DestroyRef);

  readonly dashboard = signal<JobTrackerDashboard | null>(null);
  readonly boardApplications = signal<JobApplication[]>([]);
  readonly boardTotal = signal(0);
  readonly loading = signal(true);
  readonly loadFailed = signal(false);

  readonly statusSummary = computed<StatusSummary[]>(() => {
    const dashboard = this.dashboard();
    return JOB_APPLICATION_STATUSES.map((status) => ({
      status,
      count: dashboard?.applications_by_status[status] ?? 0,
    }));
  });

  constructor() {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.apiErrors.clear();
    this.loading.set(true);
    this.loadFailed.set(false);
    this.dashboard.set(null);
    this.boardApplications.set([]);
    this.boardTotal.set(0);

    forkJoin({
      dashboard: this.dashboardService.get(),
      board: this.applicationService.list({
        page: 1,
        per_page: 100,
        sort: 'created_at',
        direction: 'desc',
      }),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ dashboard, board }) => {
          this.dashboard.set(dashboard);
          this.boardApplications.set(board.data);
          this.boardTotal.set(board.meta.total);
        },
        error: () => {
          this.loadFailed.set(true);
        },
      });
  }
}
