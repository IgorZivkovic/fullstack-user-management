import { TitleCasePipe } from '@angular/common';
import { Component, DestroyRef, EventEmitter, Output, effect, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  CompanySummary,
  JobApplication,
  JobApplicationPayload,
  JobApplicationStatus,
  JOB_APPLICATION_STATUSES,
  WorkMode,
  WORK_MODES,
} from '../../models/job-tracker.model';

export type ApplicationDialogMode = 'create' | 'edit';
export type ApplicationFieldErrors = Record<string, string[]>;

@Component({
  selector: 'app-application-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    TitleCasePipe,
  ],
  templateUrl: './application-dialog.component.html',
  styleUrl: './application-dialog.component.scss',
})
export class ApplicationDialogComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly visible = input(false);
  readonly mode = input<ApplicationDialogMode>('create');
  readonly application = input<JobApplication | null>(null);
  readonly companies = input<CompanySummary[]>([]);
  readonly saving = input(false);
  readonly fieldErrors = input<ApplicationFieldErrors>({});

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<JobApplicationPayload>();

  readonly statuses = JOB_APPLICATION_STATUSES;
  readonly workModes = WORK_MODES;
  readonly form = this.formBuilder.nonNullable.group({
    company_id: [0, [Validators.required, Validators.min(1)]],
    position: ['', [Validators.required, Validators.maxLength(160)]],
    status: ['saved' as JobApplicationStatus, [Validators.required]],
    work_mode: ['remote' as WorkMode, [Validators.required]],
    employment_type: ['', [Validators.maxLength(80)]],
    source_url: ['', [Validators.pattern(/^https?:\/\/\S+$/i), Validators.maxLength(2048)]],
    applied_at: [''],
    next_action_at: [''],
    salary_min: ['', [Validators.min(0), Validators.max(9_999_999_999.99)]],
    salary_max: ['', [Validators.min(0), Validators.max(9_999_999_999.99)]],
    currency: ['', [Validators.pattern(/^[A-Za-z]{3}$/)]],
    notes: ['', [Validators.maxLength(10000)]],
  });

  constructor() {
    effect(() => {
      if (!this.visible()) {
        return;
      }

      const application = this.application();
      this.form.reset(
        {
          company_id: application?.company_id ?? this.companies()[0]?.id ?? 0,
          position: application?.position ?? '',
          status: application?.status ?? 'saved',
          work_mode: application?.work_mode ?? 'remote',
          employment_type: application?.employment_type ?? '',
          source_url: application?.source_url ?? '',
          applied_at: this.dateValue(application?.applied_at),
          next_action_at: this.dateValue(application?.next_action_at),
          salary_min: application?.salary_min?.toString() ?? '',
          salary_max: application?.salary_max?.toString() ?? '',
          currency: application?.currency ?? '',
          notes: application?.notes ?? '',
        },
        { emitEvent: false },
      );
    });

    effect(() => {
      const errors = this.fieldErrors();
      if (this.visible()) {
        this.applyServerErrors(errors);
      }
    });

    Object.keys(this.form.controls).forEach((field) => {
      const control = this.form.get(field);
      control?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        if (!control.hasError('server')) {
          return;
        }

        const remainingErrors = { ...control.errors };
        delete remainingErrors['server'];
        control.setErrors(Object.keys(remainingErrors).length > 0 ? remainingErrors : null, {
          emitEvent: false,
        });
      });
    });

    effect(() => {
      if (this.saving()) {
        this.form.disable({ emitEvent: false });
      } else {
        this.form.enable({ emitEvent: false });
      }
    });
  }

  get title(): string {
    return this.mode() === 'edit' ? 'Edit application' : 'Add application';
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.save.emit({
      company_id: value.company_id,
      position: value.position.trim(),
      status: value.status,
      work_mode: value.work_mode,
      employment_type: this.optionalText(value.employment_type),
      source_url: this.optionalText(value.source_url),
      applied_at: this.optionalText(value.applied_at),
      next_action_at: this.optionalText(value.next_action_at),
      salary_min: this.optionalNumber(value.salary_min),
      salary_max: this.optionalNumber(value.salary_max),
      currency: this.optionalText(value.currency)?.toUpperCase() ?? null,
      notes: this.optionalText(value.notes),
    });
  }

  serverError(field: string): string | null {
    return this.form.get(field)?.getError('server') ?? null;
  }

  private applyServerErrors(errors: ApplicationFieldErrors): void {
    Object.values(this.form.controls).forEach((control) => {
      if (control.hasError('server')) {
        const remainingErrors = { ...control.errors };
        delete remainingErrors['server'];
        control.setErrors(Object.keys(remainingErrors).length > 0 ? remainingErrors : null);
      }
    });

    Object.entries(errors).forEach(([field, messages]) => {
      const control = this.form.get(field);
      if (!control || messages.length === 0) {
        return;
      }

      control.setErrors({ ...control.errors, server: messages[0] });
      control.markAsTouched();
    });
  }

  private optionalText(value: string): string | null {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }

  private optionalNumber(value: string): number | null {
    const trimmed = value.trim();
    return trimmed === '' ? null : Number(trimmed);
  }

  private dateValue(value: string | null | undefined): string {
    return value?.slice(0, 10) ?? '';
  }
}
