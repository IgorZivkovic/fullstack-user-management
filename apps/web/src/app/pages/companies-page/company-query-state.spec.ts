import { convertToParamMap } from '@angular/router';
import { readCompanyQueryState, writeCompanyQueryState } from './company-query-state';

describe('company query state', () => {
  it('normalizes URL values and omits defaults', () => {
    expect(readCompanyQueryState(convertToParamMap({ page: '2', search: '  north  ' }))).toEqual({
      page: 2,
      search: 'north',
    });
    expect(readCompanyQueryState(convertToParamMap({ page: 'invalid' }))).toEqual({
      page: 1,
      search: '',
    });
    expect(writeCompanyQueryState({ page: 1, search: '  ' })).toEqual({});
  });
});
