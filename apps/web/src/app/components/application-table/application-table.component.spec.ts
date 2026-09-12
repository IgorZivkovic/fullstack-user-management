import { PageEvent } from '@angular/material/paginator';
import { ApplicationTableComponent } from './application-table.component';

describe('ApplicationTableComponent', () => {
  it('forwards pagination events', () => {
    const component = new ApplicationTableComponent();
    const event: PageEvent = { pageIndex: 1, pageSize: 10, length: 21 };
    const emit = vi.spyOn(component.pageChange, 'emit');

    component.pageChange.emit(event);

    expect(emit).toHaveBeenCalledWith(event);
  });
});
