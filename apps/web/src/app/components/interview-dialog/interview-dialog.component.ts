import { TitleCasePipe } from '@angular/common';
import { Component, DestroyRef, EventEmitter, Output, effect, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  INTERVIEW_OUTCOMES,
  INTERVIEW_TYPES,
  Interview,
  InterviewOutcome,
  InterviewPayload,
  InterviewType,
} from '../../models/job-tracker.model';

export type InterviewDialogMode = 'create' | 'edit';
export type InterviewFieldErrors = Record<string, string[]>;

@Component({
  selector: 'app-interview-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    TitleCasePipe,
  ],
  templateUrl: './interview-dialog.component.html',
  styleUrl: './interview-dialog.component.scss',
})
export class InterviewDialogComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly visible = input(false);
  readonly mode = input<InterviewDialogMode>('create');
  readonly interview = input<Interview | null>(null);
  readonly saving = input(false);
  readonly fieldErrors = input<InterviewFieldErrors>({});

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<InterviewPayload>();

  readonly types = INTERVIEW_TYPES;
  readonly outcomes = INTERVIEW_OUTCOMES;
  readonly form = this.formBuilder.nonNullable.group({
    type: ['screening' as InterviewType, [Validators.required]],
    scheduled_at: ['', [Validators.required]],
    contact_name: ['', [Validators.maxLength(160)]],
    contact_email: ['', [Validators.email, Validators.maxLength(160)]],
    location_or_link: ['', [Validators.maxLength(2048)]],
    notes: ['', [Validators.maxLength(10000)]],
    outcome: [null as InterviewOutcome | null],
  });

  constructor() {
    effect(() => {
      if (!this.visible()) {
        return;
      }

      const interview = this.interview();
      this.form.reset(
        {
          type: interview?.type ?? 'screening',
          scheduled_at: this.localDateTimeValue(interview?.scheduled_at),
          contact_name: interview?.contact_name ?? '',
          contact_email: interview?.contact_email ?? '',
          location_or_link: interview?.location_or_link ?? '',
          notes: interview?.notes ?? '',
          outcome: interview?.outcome ?? null,
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

        const { server: _server, ...remainingErrors } = control.errors ?? {};
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
    return this.mode() === 'edit' ? 'Edit interview' : 'Schedule interview';
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.save.emit({
      type: value.type,
      scheduled_at: new Date(value.scheduled_at).toISOString(),
      contact_name: this.optionalText(value.contact_name),
      contact_email: this.optionalText(value.contact_email),
      location_or_link: this.optionalText(value.location_or_link),
      notes: this.optionalText(value.notes),
      outcome: value.outcome,
    });
  }

  serverError(field: string): string | null {
    return this.form.get(field)?.getError('server') ?? null;
  }

  private applyServerErrors(errors: InterviewFieldErrors): void {
    Object.values(this.form.controls).forEach((control) => {
      if (control.hasError('server')) {
        const { server: _server, ...remainingErrors } = control.errors ?? {};
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

  private localDateTimeValue(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return localDate.toISOString().slice(0, 16);
  }
}
