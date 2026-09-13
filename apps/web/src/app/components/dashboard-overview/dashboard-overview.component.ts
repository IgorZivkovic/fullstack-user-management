import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { DashboardInterview, JobApplication } from '../../models/job-tracker.model';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [DatePipe, MatButtonModule, MatIconModule, RouterLink, TitleCasePipe],
  templateUrl: './dashboard-overview.component.html',
  styleUrl: './dashboard-overview.component.scss',
})
export class DashboardOverviewComponent {
  readonly recentApplications = input.required<JobApplication[]>();
  readonly upcomingInterviews = input.required<DashboardInterview[]>();
}
