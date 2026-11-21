export type Role = 'user' | 'seller' | 'admin';
export type VerifiedStatus = 'none' | 'verified' | 'trial' | 'unverified';
export interface Profile {
  id: string; email: string | null; display_name: string; username: string; role: Role;
  store_name: string | null; store_bio: string | null; balance: number; seen_reference: boolean;
  verified_status: VerifiedStatus; trial_ends_at: string | null;
  store_rating_avg: number; store_rating_count: number; created_at: string;
}
