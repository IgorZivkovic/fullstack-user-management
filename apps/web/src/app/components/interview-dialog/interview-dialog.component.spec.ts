import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Interview } from '../../models/job-tracker.model';
import { InterviewDialogComponent } from './interview-dialog.component';

describe('InterviewDialogComponent', () => {
  let fixture: ComponentFixture<InterviewDialogComponent>;
  let component: InterviewDialogComponent;

  const interview: Interview = {
    id: 8,
    job_application_id: 12,
    type: 'technical',
    scheduled_at: '2030-09-20T08:30:00Z',
    contact_name: 'Alex Recruiter',
    contact_email: 'alex@example.com',
    location_or_link: 'https://meet.example.com/interview',
    notes: 'Prepare architecture examples.',
    outcome: null,
    created_at: '2026-09-12T10:00:00Z',
    updated_at: '2026-09-12T10:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterviewDialogComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(InterviewDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
  });

  it('requires a schedule and validates email and field lengths', () => {
    component.form.patchValue({
      scheduled_at: '',
      contact_email: 'not-an-email',
      contact_name: 'a'.repeat(161),
    });

    expect(component.form.controls.scheduled_at.hasError('required')).toBe(true);
    expect(component.form.controls.contact_email.hasError('email')).toBe(true);
    expect(component.form.controls.contact_name.hasError('maxlength')).toBe(true);
  });

  it('normalizes optional fields and converts local time to an ISO timestamp', () => {
    const save = vi.spyOn(component.save, 'emit');
    component.form.patchValue({
      type: 'hr',
      scheduled_at: '2030-09-20T10:30',
      contact_name: '  Alex Recruiter  ',
      contact_email: '',
      location_or_link: '  Main office  ',
      notes: '',
      outcome: 'passed',
    });

    component.submit();

    expect(save).toHaveBeenCalledWith({
      type: 'hr',
      scheduled_at: new Date('2030-09-20T10:30').toISOString(),
      contact_name: 'Alex Recruiter',
      contact_email: null,
      location_or_link: 'Main office',
      notes: null,
      outcome: 'passed',
    });
  });

  it('fills the edit form with a local datetime value', () => {
    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('interview', interview);
    fixture.detectChanges();

    const scheduled = new Date(interview.scheduled_at);
    const expectedLocal = new Date(scheduled.getTime() - scheduled.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 16);

    expect(component.form.controls.scheduled_at.value).toBe(expectedLocal);
    expect(component.form.controls.contact_name.value).toBe('Alex Recruiter');
    expect(component.title).toBe('Edit interview');
  });

  it('places backend errors on fields and clears each one after editing', () => {
    fixture.componentRef.setInput('fieldErrors', {
      scheduled_at: ['The scheduled at field must be a valid date.'],
    });
    fixture.detectChanges();

    expect(component.serverError('scheduled_at')).toBe(
      'The scheduled at field must be a valid date.',
    );

    component.form.controls.scheduled_at.setValue('2030-09-21T10:00');
    expect(component.serverError('scheduled_at')).toBeNull();
  });
});
