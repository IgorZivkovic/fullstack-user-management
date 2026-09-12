import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Company } from '../../models/job-tracker.model';
import { CompanyDialogComponent } from './company-dialog.component';

describe('CompanyDialogComponent', () => {
  let fixture: ComponentFixture<CompanyDialogComponent>;
  let component: CompanyDialogComponent;

  const company: Company = {
    id: 1,
    name: 'Northstar Labs',
    website: 'https://northstar.example.com',
    location: 'Berlin',
    notes: null,
    created_at: '2026-09-12T10:00:00Z',
    updated_at: '2026-09-12T10:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CompanyDialogComponent] }).compileComponents();
    fixture = TestBed.createComponent(CompanyDialogComponent);
    component = fixture.componentInstance;
  });

  it('requires a company name and a complete website URL', () => {
    component.form.setValue({
      name: '',
      website: 'northstar.example.com',
      location: '',
      notes: '',
    });

    expect(component.form.controls.name.hasError('required')).toBe(true);
    expect(component.form.controls.website.hasError('pattern')).toBe(true);
  });

  it('normalizes optional empty values before saving', () => {
    const save = vi.spyOn(component.save, 'emit');
    component.form.setValue({
      name: '  Northstar Labs  ',
      website: 'https://northstar.example.com',
      location: '   ',
      notes: '',
    });

    component.submit();

    expect(save).toHaveBeenCalledWith({
      name: 'Northstar Labs',
      website: 'https://northstar.example.com',
      location: null,
      notes: null,
    });
  });

  it('fills the form when an existing company is opened', () => {
    fixture.componentRef.setInput('company', company);
    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();

    expect(component.form.getRawValue()).toEqual({
      name: company.name,
      website: company.website,
      location: company.location,
      notes: '',
    });
    expect(component.title).toBe('Edit company');
  });
});
