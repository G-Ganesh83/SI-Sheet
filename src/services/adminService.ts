import { supabase } from "../lib/supabase";
import type { AdminUser, AdminUsersResponse } from "../types/admin";

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  // Primary Path: Invoke secure Supabase Edge Function
  try {
    const { data, error } = await supabase.functions.invoke<AdminUsersResponse>("admin-users");

    if (error) {
      console.warn("[AdminService] Edge function invoke notice:", error.message);
      // If error occurred (e.g. edge function not running locally), attempt database fallback for admin
      return await fetchAdminUsersFallback();
    }

    if (data && Array.isArray(data.users)) {
      return data.users;
    }
  } catch (err: unknown) {
    console.warn("[AdminService] Edge function exception, falling back:", err);
    return await fetchAdminUsersFallback();
  }

  return await fetchAdminUsersFallback();
}

/**
 * Fallback query for local database development where Edge Functions are not running.
 * Queries public.profiles and public.user_progress (allowed for admin via RLS).
 */
async function fetchAdminUsersFallback(): Promise<AdminUser[]> {
  if (!supabase) return [];

  // Query profiles (Admin has RLS select access to all profiles)
  const { data: profiles, error: profileErr } = await supabase
    .from("profiles")
    .select("user_id, display_name, avatar_url, role, created_at")
    .order("created_at", { ascending: false });

  if (profileErr) {
    throw new Error(`Failed to fetch profiles: ${profileErr.message}`);
  }

  if (!profiles || profiles.length === 0) {
    return [];
  }

  // Attempt to fetch progress counts (aggregated per user)
  const { data: progressRows } = await supabase
    .from("user_progress")
    .select("user_id, status, revision");

  const statsMap = new Map<
    string,
    { completed_count: number; in_progress_count: number; revision_count: number }
  >();

  for (const row of progressRows || []) {
    const current = statsMap.get(row.user_id) || {
      completed_count: 0,
      in_progress_count: 0,
      revision_count: 0,
    };
    if (row.status === "completed") current.completed_count += 1;
    else if (row.status === "in_progress") current.in_progress_count += 1;
    if (row.revision) current.revision_count += 1;
    statsMap.set(row.user_id, current);
  }

  return profiles.map((p) => {
    const stats = statsMap.get(p.user_id) || {
      completed_count: 0,
      in_progress_count: 0,
      revision_count: 0,
    };
    return {
      id: p.user_id,
      email: null,
      display_name: p.display_name || "Learner",
      avatar_url: p.avatar_url,
      role: (p.role as "user" | "admin") || "user",
      created_at: p.created_at,
      last_sign_in_at: null,
      completed_count: stats.completed_count,
      in_progress_count: stats.in_progress_count,
      revision_count: stats.revision_count,
    };
  });
}
