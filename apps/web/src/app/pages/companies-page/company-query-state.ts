import { ParamMap, Params } from '@angular/router';
import { parsePositiveIntegerQueryParam } from '../../shared/utils/query-param.utils';

export interface CompanyQueryState {
  page: number;
  search: string;
}

export function readCompanyQueryState(params: ParamMap): CompanyQueryState {
  return {
    page: parsePositiveIntegerQueryParam(params.get('page')) ?? 1,
    search: params.get('search')?.trim() ?? '',
  };
}

export function writeCompanyQueryState(state: CompanyQueryState): Params {
  return {
    ...(state.search.trim() ? { search: state.search.trim() } : {}),
    ...(state.page > 1 ? { page: state.page } : {}),
  };
}
