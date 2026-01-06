import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject, input, model } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';

import { Gender, User } from '../../models/user.model';

export type UserDialogMode = 'add' | 'edit' | 'view';

@Component({
  selector: 'app-user-dialog-component',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    ReactiveFormsModule,
  ],
  templateUrl: './user-dialog-component.html',
  styleUrl: './user-dialog-component.scss',
})
export class UserDialogComponent {
  private readonly fb = inject(FormBuilder);

  readonly visible = model<boolean>(false);
  readonly mode = input<UserDialogMode>('add');
  readonly user = input<User | null>(null);

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<User>();

  readonly genderOptions: { label: string; value: Gender }[] = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
  ];

  readonly form = this.fb.nonNullable.group({
    id: 0,
    name: ['', [Validators.required, Validators.minLength(2)]],
    birthday: [null as unknown as Date | null, [Validators.required]],
    gender: ['male' as Gender, [Validators.required]],
    country: ['', [Validators.required, Validators.minLength(2)]],
  });

  get header(): string {
    switch (this.mode()) {
      case 'add':
        return 'Add User';
      case 'edit':
        return 'Edit User';
      case 'view':
        return 'View User';
    }
  }

  setupForm(user: User | null = this.user(), mode: UserDialogMode = this.mode()): void {
    const u = user;

    if (!u) {
      this.form.reset({
        id: 0,
        name: '',
        birthday: null,
        gender: 'male',
        country: '',
      });
    } else {
      this.form.reset({
        id: u.id,
        name: u.name,
        birthday: this.isoToDate(u.birthday),
        gender: u.gender,
        country: u.country,
      });
    }

    if (mode === 'view') {
      this.form.disable();
    } else {
      this.form.enable();

      this.form.controls.id.disable();
    }
  }

  onHide(): void {
    this.visible.set(false);
    this.close.emit();
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    const result: User = {
      id: raw.id || Date.now(),
      name: raw.name.trim(),
      birthday: this.dateToIso(raw.birthday!),
      gender: raw.gender,
      country: raw.country.trim(),
    };

    this.save.emit(result);
  }

  private isoToDate(iso: string): Date {
    // expects YYYY-MM-DD
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
  }

  private dateToIso(d: Date): string {
    // convert to YYYY-MM-DD (local date)
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
