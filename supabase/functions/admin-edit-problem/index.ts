import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EditProblemPayload {
  problemId?: string;
  originalUrl?: string;
  title: string;
  url: string;
  platform: string;
  topics: string[];
  labDates: string[];
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Missing Supabase server configuration",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 1: Authenticate calling user ──────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Missing Authorization header",
        }),
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
        JSON.stringify({
          ok: false,
          error: "Invalid or expired session",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 2: Privileged admin client ────────────────────────────────────
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    // ── Step 3: Verify admin role ───────────────────────────────────────────
    const { data: callerProfile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("user_id", callingUser.id)
      .maybeSingle();

    if (profileErr || !callerProfile || callerProfile.role !== "admin") {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Forbidden: Admin privileges required",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 4: Parse payload ──────────────────────────────────────────────
    let payload: EditProblemPayload;
    try {
      payload = await req.json() as EditProblemPayload;
    } catch {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Invalid JSON payload",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!payload || !payload.title || !payload.url) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Title and URL are required.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 5: Execute atomic update via PostgreSQL RPC ───────────────────
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
      "admin_edit_problem",
      { payload }
    );

    if (rpcError) {
      console.error("[admin-edit-problem] RPC transaction failed:", rpcError);
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Edit failed. No changes were made to the shared catalog.",
          details: rpcError.message,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Problem updated successfully.",
        problem: rpcData?.problem,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[admin-edit-problem] Unexpected exception:", err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Edit failed. No changes were made to the shared catalog.",
        details: message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
