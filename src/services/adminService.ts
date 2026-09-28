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

/**
 * Records a click on the Ganesh GitHub creator footer link.
 * Asynchronously invokes the Supabase Edge Function without blocking user navigation.
 */
export async function recordFooterClick(): Promise<void> {
  if (!supabase) return;

  try {
    const { error } = await supabase.functions.invoke("record-footer-click", {
      body: {},
    });

    if (error) {
      console.warn("[FooterClick] Edge function invoke notice:", error.message);
    }
  } catch (err: unknown) {
    // Fail silently so clicking the link is never delayed or disrupted
    console.warn("[FooterClick] Recording notice:", err);
  }
}

/**
 * Fetches footer click statistics and paginated click list for Admins.
 */
export async function fetchAdminFooterClicks(): Promise<import("../types/admin").AdminFooterClicksResponse> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  // Primary Path: Invoke secure Supabase Edge Function
  try {
    const { data, error } = await supabase.functions.invoke<import("../types/admin").AdminFooterClicksResponse>(
      "admin-footer-clicks"
    );

    if (error) {
      console.warn("[AdminService] Footer clicks edge function notice:", error.message);
      return await fetchAdminFooterClicksFallback();
    }

    if (data && data.summary && Array.isArray(data.clicks)) {
      return data;
    }
  } catch (err: unknown) {
    console.warn("[AdminService] Footer clicks edge function exception, falling back:", err);
    return await fetchAdminFooterClicksFallback();
  }

  return await fetchAdminFooterClicksFallback();
}

/**
 * Fallback query for local database development where Edge Functions are not running.
 */
async function fetchAdminFooterClicksFallback(): Promise<import("../types/admin").AdminFooterClicksResponse> {
  if (!supabase) {
    return { summary: { total: 0, signed_in: 0, anonymous: 0 }, clicks: [] };
  }

  const { data: rawClicks, error: clickErr } = await supabase
    .from("footer_clicks")
    .select("id, user_id, clicked_at, created_at")
    .order("clicked_at", { ascending: false });

  if (clickErr) {
    throw new Error(`Failed to fetch footer clicks: ${clickErr.message}`);
  }

  const userIds = Array.from(
    new Set((rawClicks || []).filter((c) => Boolean(c.user_id)).map((c) => c.user_id as string))
  );

  const profilesMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);

    for (const p of profiles || []) {
      profilesMap.set(p.user_id, p.display_name || "Learner");
    }
  }

  let total = 0;
  let signedIn = 0;
  let anonymous = 0;

  const clicks = (rawClicks || []).map((c) => {
    total += 1;
    const isAuth = Boolean(c.user_id);
    if (isAuth) {
      signedIn += 1;
      return {
        id: c.id,
        user_id: c.user_id,
        clicked_at: c.clicked_at,
        visitor_name: profilesMap.get(c.user_id as string) || "Learner",
        visitor_email: null,
        visitor_type: "signed_in" as const,
      };
    } else {
      anonymous += 1;
      return {
        id: c.id,
        user_id: null,
        clicked_at: c.clicked_at,
        visitor_name: "Anonymous",
        visitor_email: null,
        visitor_type: "anonymous" as const,
      };
    }
  });

  return {
    summary: { total, signed_in: signedIn, anonymous },
    clicks,
  };
}

