import { Component, EventEmitter, Output, effect, inject, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Company, CompanyPayload } from '../../models/job-tracker.model';

export type CompanyDialogMode = 'create' | 'edit';

@Component({
  selector: 'app-company-dialog',
  standalone: true,
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  templateUrl: './company-dialog.component.html',
  styleUrl: './company-dialog.component.scss',
})
export class CompanyDialogComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly visible = input(false);
  readonly mode = input<CompanyDialogMode>('create');
  readonly company = input<Company | null>(null);
  readonly saving = input(false);

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CompanyPayload>();

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(160)]],
    website: ['', [Validators.pattern(/^https?:\/\/\S+$/i), Validators.maxLength(2048)]],
    location: ['', [Validators.maxLength(160)]],
    notes: ['', [Validators.maxLength(5000)]],
  });

  constructor() {
    effect(() => {
      if (!this.visible()) {
        return;
      }

      const company = this.company();
      this.form.reset({
        name: company?.name ?? '',
        website: company?.website ?? '',
        location: company?.location ?? '',
        notes: company?.notes ?? '',
      });
    });

    effect(() => {
      if (this.saving()) {
        this.form.disable();
      } else {
        this.form.enable();
      }
    });
  }

  get title(): string {
    return this.mode() === 'edit' ? 'Edit company' : 'Add company';
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.save.emit({
      name: value.name.trim(),
      website: this.optionalValue(value.website),
      location: this.optionalValue(value.location),
      notes: this.optionalValue(value.notes),
    });
  }

  private optionalValue(value: string): string | null {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }
}
