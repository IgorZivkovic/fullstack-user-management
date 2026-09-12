import { UserTableComponent } from './user-table.component';

describe('UserTableComponent empty state', () => {
  let component: UserTableComponent;

  beforeEach(() => {
    component = new UserTableComponent();
  });

  it('explains when the current filters have no matches', () => {
    component.hasActiveFilters = true;

    expect(component.emptyMessage).toBe('No users match your search or filters.');
  });

  it('shows an initial loading message before users arrive', () => {
    component.loading = true;

    expect(component.emptyMessage).toBe('Loading users...');
  });

  it('invites administrators to add the first user', () => {
    component.canManageUsers = true;

    expect(component.emptyMessage).toBe('No users yet. Use "Add User" to create one.');
  });

  it('does not suggest an unavailable action to read-only users', () => {
    component.canManageUsers = false;

    expect(component.emptyMessage).toBe('No users are available.');
  });
});
