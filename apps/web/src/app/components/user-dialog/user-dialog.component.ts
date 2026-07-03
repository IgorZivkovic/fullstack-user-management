import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, effect, inject, input, model } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TuiDay } from '@taiga-ui/cdk/date-time';
import { TuiButton, TuiInput, TuiTextfield } from '@taiga-ui/core';
import { TuiInputDate, TuiSelect } from '@taiga-ui/kit';

import { Gender, User } from '../../models/user.model';

export type UserDialogMode = 'add' | 'edit' | 'view';

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TuiButton,
    TuiInput,
    TuiInputDate,
    TuiSelect,
    TuiTextfield,
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
  readonly genderValues = this.genderOptions.map((option) => option.value);
  readonly genderLabels = this.genderOptions.map((option) => option.label);

  readonly form = this.fb.nonNullable.group({
    id: 0,
    name: ['', [Validators.required, Validators.minLength(2)]],
    birthday: [null as TuiDay | null, [Validators.required]],
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
        birthday: TuiDay.jsonParse(u.birthday),
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
      birthday: birthday.toJSON(),
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
}
