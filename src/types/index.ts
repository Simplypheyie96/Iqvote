export interface Employee {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  is_admin?: boolean;
  created_at: string;
  department?: string;
  image_url?: string;
}

export interface Election {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  timezone: string;
  created_at: string;
  created_by: string;
  eligible_employees?: string[]; // IDs of employees who can receive votes
  is_historical?: boolean; // For imported historical data
}

export interface BallotSelection {
  rank: number;
  employee_id: string;
  points: number;
  reason?: string; // Optional reason why voter chose this person
}

export interface Ballot {
  voter_id: string;
  election_id: string;
  selections: BallotSelection[];
  created_at: string;
  updated_at: string;
  revoked: boolean;
  revoked_at?: string;
  revoked_by?: string;
  revoke_reason?: string;
}

export interface Tally {
  employee_id: string;
  total_points: number;
  count_first: number;
  count_second: number;
  count_third: number;
  employee?: Employee;
}

export interface LeaderboardEntry extends Tally {
  rank?: number;
}