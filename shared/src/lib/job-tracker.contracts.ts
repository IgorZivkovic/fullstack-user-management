export const JOB_APPLICATION_STATUSES = [
  'saved',
  'applied',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
] as const;

export const WORK_MODES = ['onsite', 'hybrid', 'remote'] as const;

export const INTERVIEW_TYPES = ['screening', 'technical', 'hr', 'final'] as const;

export const INTERVIEW_OUTCOMES = ['passed', 'failed', 'cancelled'] as const;

export const JOB_APPLICATION_SORT_FIELDS = [
  'position',
  'status',
  'work_mode',
  'applied_at',
  'next_action_at',
  'created_at',
] as const;

export const SORT_DIRECTIONS = ['asc', 'desc'] as const;

export type JobApplicationStatus = (typeof JOB_APPLICATION_STATUSES)[number];
export type WorkMode = (typeof WORK_MODES)[number];
export type InterviewType = (typeof INTERVIEW_TYPES)[number];
export type InterviewOutcome = (typeof INTERVIEW_OUTCOMES)[number];
export type JobApplicationSortField = (typeof JOB_APPLICATION_SORT_FIELDS)[number];
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export interface Company {
  id: number;
  name: string;
  website: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CompanySummary = Pick<Company, 'id' | 'name'>;

export interface JobApplication {
  id: number;
  company_id: number;
  company: CompanySummary;
  position: string;
  status: JobApplicationStatus;
  work_mode: WorkMode;
  employment_type: string | null;
  source_url: string | null;
  applied_at: string | null;
  next_action_at: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Interview {
  id: number;
  job_application_id: number;
  type: InterviewType;
  scheduled_at: string;
  contact_name: string | null;
  contact_email: string | null;
  location_or_link: string | null;
  notes: string | null;
  outcome: InterviewOutcome | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyFilters {
  page?: number;
  per_page?: number;
  search?: string;
}

export interface JobApplicationFilters {
  page?: number;
  per_page?: number;
  search?: string;
  status?: JobApplicationStatus;
  work_mode?: WorkMode;
  company_id?: number;
  sort?: JobApplicationSortField;
  direction?: SortDirection;
}
