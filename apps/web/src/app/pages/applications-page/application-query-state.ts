import { ParamMap, Params } from '@angular/router';
import {
  JobApplicationFilters,
  JobApplicationSortField,
  JobApplicationStatus,
  JOB_APPLICATION_SORT_FIELDS,
  JOB_APPLICATION_STATUSES,
  SortDirection,
  SORT_DIRECTIONS,
  WorkMode,
  WORK_MODES,
} from '../../models/job-tracker.model';
import { parsePositiveIntegerQueryParam } from '../../shared/utils/query-param.utils';

export interface ApplicationQueryState {
  page: number;
  search: string;
  status: JobApplicationStatus | '';
  workMode: WorkMode | '';
  companyId: number | null;
  sort: JobApplicationSortField;
  direction: SortDirection;
}

export const DEFAULT_APPLICATION_QUERY_STATE: ApplicationQueryState = {
  page: 1,
  search: '',
  status: '',
  workMode: '',
  companyId: null,
  sort: 'created_at',
  direction: 'desc',
};

export function readApplicationQueryState(params: ParamMap): ApplicationQueryState {
  return {
    page: parsePositiveIntegerQueryParam(params.get('page')) ?? 1,
    search: params.get('search')?.trim() ?? '',
    status: valueFromList(params.get('status'), JOB_APPLICATION_STATUSES) ?? '',
    workMode: valueFromList(params.get('work_mode'), WORK_MODES) ?? '',
    companyId: parsePositiveIntegerQueryParam(params.get('company_id')) ?? null,
    sort: valueFromList(params.get('sort'), JOB_APPLICATION_SORT_FIELDS) ?? 'created_at',
    direction: valueFromList(params.get('direction'), SORT_DIRECTIONS) ?? 'desc',
  };
}

export function writeApplicationQueryState(state: ApplicationQueryState): Params {
  return {
    ...(state.search.trim() ? { search: state.search.trim() } : {}),
    ...(state.status ? { status: state.status } : {}),
    ...(state.workMode ? { work_mode: state.workMode } : {}),
    ...(state.companyId ? { company_id: state.companyId } : {}),
    ...(state.sort !== 'created_at' ? { sort: state.sort } : {}),
    ...(state.direction !== 'desc' ? { direction: state.direction } : {}),
    ...(state.page > 1 ? { page: state.page } : {}),
  };
}

export function toJobApplicationFilters(state: ApplicationQueryState): JobApplicationFilters {
  return {
    page: state.page,
    ...(state.search.trim() ? { search: state.search.trim() } : {}),
    ...(state.status ? { status: state.status } : {}),
    ...(state.workMode ? { work_mode: state.workMode } : {}),
    ...(state.companyId ? { company_id: state.companyId } : {}),
    sort: state.sort,
    direction: state.direction,
  };
}

function valueFromList<T extends string>(
  value: string | null,
  options: readonly T[],
): T | undefined {
  return options.includes(value as T) ? (value as T) : undefined;
}
