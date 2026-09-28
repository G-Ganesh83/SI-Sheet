export interface AdminUser {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  created_at: string;
  last_sign_in_at: string | null;
  completed_count: number;
  in_progress_count: number;
  revision_count: number;
}

export interface AdminUsersResponse {
  users: AdminUser[];
}
