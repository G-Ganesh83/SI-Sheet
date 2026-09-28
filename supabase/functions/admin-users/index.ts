import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase server configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Authenticate calling user using anon client with user's Auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const {
      data: { user: callingUser },
      error: authError,
    } = await supabaseUserClient.auth.getUser();

    if (authError || !callingUser) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Initialize Privileged Service-Role Admin Client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    // 3. Verify that calling user has role = 'admin' in public.profiles
    const { data: callerProfile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("user_id", callingUser.id)
      .maybeSingle();

    if (profileErr || !callerProfile || callerProfile.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin privileges required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Fetch Auth Users via privileged Admin API
    const {
      data: { users: authUsers },
      error: listUsersErr,
    } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

    if (listUsersErr) {
      return new Response(
        JSON.stringify({ error: `Failed to list auth users: ${listUsersErr.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Fetch Profiles
    const { data: profiles, error: profilesFetchErr } = await supabaseAdmin
      .from("profiles")
      .select("user_id, display_name, avatar_url, role, created_at");

    if (profilesFetchErr) {
      return new Response(
        JSON.stringify({ error: `Failed to load profiles: ${profilesFetchErr.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Fetch Progress Aggregates (Strictly only status and revision, NO notes column)
    const { data: progressRows, error: progressErr } = await supabaseAdmin
      .from("user_progress")
      .select("user_id, status, revision");

    if (progressErr) {
      return new Response(
        JSON.stringify({ error: `Failed to aggregate progress: ${progressErr.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Aggregate progress metrics per user
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

      if (row.status === "completed") {
        current.completed_count += 1;
      } else if (row.status === "in_progress") {
        current.in_progress_count += 1;
      }

      if (row.revision) {
        current.revision_count += 1;
      }

      statsMap.set(row.user_id, current);
    }

    const profilesMap = new Map<string, (typeof profiles)[number]>();
    for (const p of profiles || []) {
      profilesMap.set(p.user_id, p);
    }

    // 7. Compose safe response objects
    const resultUsers = authUsers.map((u) => {
      const userProf = profilesMap.get(u.id);
      const userStats = statsMap.get(u.id) || {
        completed_count: 0,
        in_progress_count: 0,
        revision_count: 0,
      };

      const displayName =
        userProf?.display_name ||
        (u.user_metadata?.full_name as string) ||
        (u.user_metadata?.name as string) ||
        u.email?.split("@")[0] ||
        "Learner";

      const avatarUrl =
        userProf?.avatar_url ||
        (u.user_metadata?.avatar_url as string) ||
        (u.user_metadata?.picture as string) ||
        null;

      const role = userProf?.role || "user";

      // Explicitly extract Auth fields — email and last_sign_in_at come from Supabase Auth,
      // not from public.profiles. Never return undefined — use null as the sentinel.
      const email: string | null = typeof u.email === "string" && u.email.length > 0 ? u.email : null;
      const lastSignInAt: string | null =
        typeof u.last_sign_in_at === "string" && u.last_sign_in_at.length > 0
          ? u.last_sign_in_at
          : null;

      return {
        id: u.id,
        email,
        display_name: displayName,
        avatar_url: avatarUrl,
        role,
        created_at: u.created_at,
        last_sign_in_at: lastSignInAt,
        completed_count: userStats.completed_count,
        in_progress_count: userStats.in_progress_count,
        revision_count: userStats.revision_count,
      };
    });

    // Sort by created_at descending (newest first)
    resultUsers.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return new Response(JSON.stringify({ users: resultUsers }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
