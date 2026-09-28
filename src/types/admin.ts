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

export interface FooterClickItem {
  id: string;
  user_id: string | null;
  clicked_at: string;
  visitor_name: string;
  visitor_email: string | null;
  visitor_type: "signed_in" | "anonymous";
}

export interface FooterClicksSummary {
  total: number;
  signed_in: number;
  anonymous: number;
}

export interface AdminFooterClicksResponse {
  summary: FooterClicksSummary;
  clicks: FooterClickItem[];
}

