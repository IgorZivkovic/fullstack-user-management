import { convertToParamMap } from '@angular/router';
import { readUserQueryState, writeUserQueryState } from './user-query-state';

describe('user query state', () => {
  it('normalizes supported URL values', () => {
    expect(
      readUserQueryState(convertToParamMap({ page: '3', search: '  daniel  ', gender: 'male' })),
    ).toEqual({ page: 3, search: 'daniel', gender: 'male' });
  });

  it('uses defaults for invalid values and omits them from the URL', () => {
    const state = readUserQueryState(convertToParamMap({ page: '-2', gender: 'unknown' }));

    expect(state).toEqual({ page: 1, search: '', gender: 'all' });
    expect(writeUserQueryState(state)).toEqual({});
  });
});
