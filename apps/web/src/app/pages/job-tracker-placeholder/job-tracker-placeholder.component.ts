import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-job-tracker-placeholder',
  standalone: true,
  templateUrl: './job-tracker-placeholder.component.html',
  styleUrl: './job-tracker-placeholder.component.scss',
})
export class JobTrackerPlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  readonly title = this.route.snapshot.data['title'] as string;
  readonly description = this.route.snapshot.data['description'] as string;
}
