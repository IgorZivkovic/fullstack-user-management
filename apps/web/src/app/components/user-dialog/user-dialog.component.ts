import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, effect, inject, input, model } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Gender, User } from '../../models/user.model';

export type UserDialogMode = 'add' | 'edit' | 'view';

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './user-dialog.component.html',
  styleUrl: './user-dialog.component.scss',
})
export class UserDialogComponent {
  private readonly fb = inject(FormBuilder);

  readonly visible = model<boolean>(false);
  readonly mode = input<UserDialogMode>('add');
  readonly user = input<User | null>(null);
  readonly saving = input(false);

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
    birthday: [null as Date | null, [Validators.required]],
    gender: ['male' as Gender, [Validators.required]],
    country: ['', [Validators.required, Validators.minLength(2)]],
  });

  constructor() {
    effect(() => {
      if (this.saving()) {
        this.form.disable();
        return;
      }

      this.applyModeState();
    });
  }

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
        birthday: this.parseDate(u.birthday),
        gender: u.gender,
        country: u.country,
      });
    }

    this.applyModeState(mode);
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
    const birthday = raw.birthday;
    if (!birthday) {
      return;
    }

    const result: User = {
      id: raw.id || Date.now(),
      name: raw.name.trim(),
      birthday: this.formatDate(birthday),
      gender: raw.gender,
      country: raw.country.trim(),
    };

    this.save.emit(result);
  }

  private applyModeState(mode: UserDialogMode = this.mode()): void {
    if (mode === 'view') {
      this.form.disable();
      return;
    }

    this.form.enable();
    this.form.controls.id.disable();
  }

  private parseDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private formatDate(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
