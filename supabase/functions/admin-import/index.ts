import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ImportCandidatePayload {
  id: string;
  title: string;
  url: string;
  platform: string;
  topics: string[];
  labDates: string[];
  action: "new" | "add-lab-date" | "already-exists" | "possible-duplicate" | "invalid";
  existingProblemId?: string;
  existingProblemUrl?: string;
}

interface ImportPayload {
  candidates: ImportCandidatePayload[];
}

interface RpcImportResult {
  ok: boolean;
  added: number;
  updated: number;
  processed: number;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
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

    // ── Step 4: Parse and validate payload ─────────────────────────────────
    let payload: ImportPayload;
    try {
      payload = await req.json() as ImportPayload;
    } catch {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Invalid JSON payload",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!payload || !Array.isArray(payload.candidates)) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Payload must have a 'candidates' array",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only process actionable candidates (NEW and ADD LAB DATE)
    const actionable = payload.candidates.filter(
      (c) => c.action === "new" || c.action === "add-lab-date"
    );

    if (actionable.length === 0) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "No actionable candidates (NEW or ADD LAB DATE) in payload",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 5: Execute atomic catalog mutations inside single PostgreSQL transaction ──
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
      "admin_import_catalog",
      { payload: { candidates: actionable } }
    );

    if (rpcError) {
      console.error("[admin-import] Transaction aborted and rolled back:", rpcError);
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Import failed. No changes were made to the shared catalog.",
          details: rpcError.message,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = rpcData as RpcImportResult;

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Import completed successfully.",
        added: result?.added ?? 0,
        updated: result?.updated ?? 0,
        processed: result?.processed ?? actionable.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[admin-import] Unexpected exception:", err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Import failed. No changes were made to the shared catalog.",
        details: message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
