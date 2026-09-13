import { Company } from '../../models/job-tracker.model';
import { CompanyTableComponent } from './company-table.component';

describe('CompanyTableComponent', () => {
  const company: Company = {
    id: 1,
    name: 'Northstar Labs',
    website: null,
    location: 'Berlin',
    notes: null,
    created_at: '2026-09-12T10:00:00Z',
    updated_at: '2026-09-12T10:00:00Z',
  };

  it('forwards company actions', () => {
    const component = new CompanyTableComponent();
    const edit = vi.spyOn(component.edit, 'emit');
    const remove = vi.spyOn(component.remove, 'emit');

    component.edit.emit(company);
    component.remove.emit(company);

    expect(edit).toHaveBeenCalledWith(company);
    expect(remove).toHaveBeenCalledWith(company);
  });
});
