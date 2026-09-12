import { PageEvent } from '@angular/material/paginator';
import { JobApplication } from '../../models/job-tracker.model';
import { ApplicationTableComponent } from './application-table.component';

describe('ApplicationTableComponent', () => {
  const application = {
    id: 12,
    position: 'Angular Developer',
  } as JobApplication;

  it('forwards pagination events', () => {
    const component = new ApplicationTableComponent();
    const event: PageEvent = { pageIndex: 1, pageSize: 10, length: 21 };
    const emit = vi.spyOn(component.pageChange, 'emit');

    component.pageChange.emit(event);

    expect(emit).toHaveBeenCalledWith(event);
  });

  it('forwards edit and delete actions', () => {
    const component = new ApplicationTableComponent();
    const edit = vi.spyOn(component.edit, 'emit');
    const remove = vi.spyOn(component.remove, 'emit');

    component.edit.emit(application);
    component.remove.emit(application);

    expect(edit).toHaveBeenCalledWith(application);
    expect(remove).toHaveBeenCalledWith(application);
  });
});
