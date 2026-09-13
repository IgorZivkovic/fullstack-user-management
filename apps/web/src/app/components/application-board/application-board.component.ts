import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import {
  JobApplication,
  JobApplicationStatus,
  JOB_APPLICATION_STATUSES,
} from '../../models/job-tracker.model';

type BoardColumn = {
  status: JobApplicationStatus;
  applications: JobApplication[];
};

@Component({
  selector: 'app-application-board',
  standalone: true,
  imports: [DatePipe, MatButtonModule, MatIconModule, RouterLink, TitleCasePipe],
  templateUrl: './application-board.component.html',
  styleUrl: './application-board.component.scss',
})
export class ApplicationBoardComponent {
  readonly applications = input.required<JobApplication[]>();
  readonly totalApplications = input(0);

  readonly columns = computed<BoardColumn[]>(() =>
    JOB_APPLICATION_STATUSES.map((status) => ({
      status,
      applications: this.applications().filter((application) => application.status === status),
    })),
  );

  readonly isTruncated = computed(() => this.totalApplications() > this.applications().length);
}
