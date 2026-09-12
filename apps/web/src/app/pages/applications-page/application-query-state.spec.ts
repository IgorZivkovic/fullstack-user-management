import { convertToParamMap } from '@angular/router';
import {
  readApplicationQueryState,
  toJobApplicationFilters,
  writeApplicationQueryState,
} from './application-query-state';

describe('application query state', () => {
  it('reads supported values and converts them to API filters', () => {
    const state = readApplicationQueryState(
      convertToParamMap({
        page: '2',
        search: '  angular  ',
        status: 'interview',
        work_mode: 'remote',
        company_id: '4',
        sort: 'position',
        direction: 'asc',
      }),
    );

    expect(state).toEqual({
      page: 2,
      search: 'angular',
      status: 'interview',
      workMode: 'remote',
      companyId: 4,
      sort: 'position',
      direction: 'asc',
    });
    expect(toJobApplicationFilters(state)).toEqual({
      page: 2,
      search: 'angular',
      status: 'interview',
      work_mode: 'remote',
      company_id: 4,
      sort: 'position',
      direction: 'asc',
    });
  });

  it('falls back from invalid values and omits defaults from the URL', () => {
    const state = readApplicationQueryState(
      convertToParamMap({
        page: '0',
        status: 'unknown',
        work_mode: 'space',
        company_id: '-1',
        sort: 'company',
        direction: 'sideways',
      }),
    );

    expect(writeApplicationQueryState(state)).toEqual({});
  });
});
