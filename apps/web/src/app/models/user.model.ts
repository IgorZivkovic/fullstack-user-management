export type Gender = 'male' | 'female' | 'other';

export interface User {
  id: number;
  name: string;
  birthday: string; // ISO date string (YYYY-MM-DD)
  gender: Gender;
  country: string;
}
