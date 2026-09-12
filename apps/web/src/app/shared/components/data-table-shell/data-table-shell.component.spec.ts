import { PageEvent } from '@angular/material/paginator';
import { DataTableShellComponent } from './data-table-shell.component';

describe('DataTableShellComponent', () => {
  it('uses a consistent loading and empty-state message', () => {
    const component = new DataTableShellComponent<object>();
    component.loadingMessage = 'Loading applications...';
    component.emptyMessage = 'No applications yet.';

    component.loading = true;
    expect(component.stateMessage).toBe('Loading applications...');

    component.loading = false;
    expect(component.stateMessage).toBe('No applications yet.');
  });

  it('forwards Angular Material pagination events', () => {
    const component = new DataTableShellComponent<object>();
    const event: PageEvent = { pageIndex: 1, pageSize: 10, length: 25 };
    const emit = vi.spyOn(component.pageChange, 'emit');

    component.handlePageChange(event);

    expect(emit).toHaveBeenCalledWith(event);
  });
});
