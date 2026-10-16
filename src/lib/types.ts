export type UserRole = "client" | "psychologist" | "admin";
export type PlanKind = "subscription" | "package";
export type MembershipStatus = "pending" | "active" | "canceled" | "expired";
export type TriageStatus = "open" | "scheduled" | "closed";
export type AppointmentStatus = "scheduled" | "completed" | "canceled" | "no_show";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  consent_at: string | null;
  created_at: string;
}

export interface Psychologist {
  id: string;
  display_name: string;
  crp: string;
  bio: string;
  approach: string;
  photo_url: string | null;
  meet_url?: string | null;
  active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  active: boolean;
  sort_order: number;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  kind: PlanKind;
  sessions_included: number | null;
  price_cents: number;
  duration_days: number;
  highlighted: boolean;
  active: boolean;
  sort_order: number;
}

export interface MembershipBalance {
  id: string;
  client_id: string;
  plan_id: string;
  kind: PlanKind;
  plan_name: string;
  sessions_total: number | null;
  price_cents: number;
  status: MembershipStatus;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  sessions_used: number;
  sessions_remaining: number | null;
  is_current: boolean;
}

export interface TriageQuestion {
  id: string;
  category_id: string | null;
  text: string;
  help_text: string;
  is_root: boolean;
  sort_order: number;
}

export interface TriageOption {
  id: string;
  question_id: string;
  label: string;
  next_question_id: string | null;
  risk_level: 0 | 1 | 2;
  sort_order: number;
}

export interface TriageAnswer {
  question: string;
  answer: string;
  risk_level: number;
}

export interface Triage {
  id: string;
  client_id: string;
  category_id: string;
  answers: TriageAnswer[];
  risk_level: 0 | 1 | 2;
  status: TriageStatus;
  reviewed_at: string | null;
  created_at: string;
}

export interface AvailabilityRule {
  id: string;
  psychologist_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
}

export interface Appointment {
  id: string;
  client_id: string;
  psychologist_id: string;
  category_id: string;
  triage_id: string | null;
  membership_id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  meet_url: string | null;
  credit_refunded: boolean;
  canceled_at: string | null;
  canceled_by: UserRole | null;
  cancel_reason: string | null;
  created_at: string;
}

export interface Settings {
  session_minutes: number;
  cancel_window_hours: number;
  min_notice_hours: number;
  booking_horizon_days: number;
  max_open_appointments: number;
}

export interface Slot {
  psychologist_id: string;
  starts_at: string;
  ends_at: string;
}
