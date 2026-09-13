import { ParamMap, Params } from '@angular/router';
import { Gender } from '../../models/user.model';
import { parsePositiveIntegerQueryParam } from '../../shared/utils/query-param.utils';

export interface UserQueryState {
  page: number;
  search: string;
  gender: Gender | 'all';
}

export function readUserQueryState(params: ParamMap): UserQueryState {
  return {
    page: parsePositiveIntegerQueryParam(params.get('page')) ?? 1,
    search: params.get('search')?.trim() ?? '',
    gender: parseGender(params.get('gender')),
  };
}

export function writeUserQueryState(state: UserQueryState): Params {
  return {
    ...(state.search.trim() ? { search: state.search.trim() } : {}),
    ...(state.gender !== 'all' ? { gender: state.gender } : {}),
    ...(state.page > 1 ? { page: state.page } : {}),
  };
}

function parseGender(value: string | null): Gender | 'all' {
  return value === 'male' || value === 'female' || value === 'other' ? value : 'all';
}
