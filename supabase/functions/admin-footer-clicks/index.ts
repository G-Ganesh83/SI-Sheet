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

    // 4. Fetch Footer Clicks
    const { data: rawClicks, error: clicksErr } = await supabaseAdmin
      .from("footer_clicks")
      .select("id, user_id, clicked_at, created_at")
      .order("clicked_at", { ascending: false });

    if (clicksErr) {
      return new Response(
        JSON.stringify({ error: `Failed to load footer clicks: ${clicksErr.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Fetch Profiles and Auth Users for user_ids associated with clicks
    const authenticatedUserIds = Array.from(
      new Set((rawClicks || []).filter((c) => Boolean(c.user_id)).map((c) => c.user_id as string))
    );

    const profilesMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
    const emailsMap = new Map<string, string | null>();

    if (authenticatedUserIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", authenticatedUserIds);

      for (const p of profiles || []) {
        profilesMap.set(p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url });
      }

      const {
        data: { users: authUsers },
      } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

      for (const u of authUsers || []) {
        if (authenticatedUserIds.includes(u.id)) {
          emailsMap.set(u.id, u.email || null);
          if (!profilesMap.has(u.id)) {
            const name =
              (u.user_metadata?.full_name as string) ||
              (u.user_metadata?.name as string) ||
              u.email?.split("@")[0] ||
              "Learner";
            profilesMap.set(u.id, { display_name: name, avatar_url: null });
          }
        }
      }
    }

    let total = 0;
    let signedIn = 0;
    let anonymous = 0;

    const clicks = (rawClicks || []).map((click) => {
      total += 1;
      const isAuth = Boolean(click.user_id);
      if (isAuth) {
        signedIn += 1;
        const profile = profilesMap.get(click.user_id as string);
        const email = emailsMap.get(click.user_id as string) || null;
        return {
          id: click.id,
          user_id: click.user_id,
          clicked_at: click.clicked_at,
          visitor_name: profile?.display_name || "Learner",
          visitor_email: email,
          visitor_type: "signed_in" as const,
        };
      } else {
        anonymous += 1;
        return {
          id: click.id,
          user_id: null,
          clicked_at: click.clicked_at,
          visitor_name: "Anonymous",
          visitor_email: null,
          visitor_type: "anonymous" as const,
        };
      }
    });

    return new Response(
      JSON.stringify({
        summary: {
          total,
          signed_in: signedIn,
          anonymous,
        },
        clicks,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
