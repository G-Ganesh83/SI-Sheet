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

    let authenticatedUserId: string | null = null;
    const authHeader = req.headers.get("Authorization");

    // If Authorization header is provided, attempt to verify user session
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } },
          auth: { persistSession: false },
        });

        const {
          data: { user },
        } = await supabaseUserClient.auth.getUser();

        if (user) {
          authenticatedUserId = user.id;
        }
      } catch {
        // Fallback to anonymous if auth token is invalid or expired
        authenticatedUserId = null;
      }
    }

    // Initialize privileged client to record the click record securely
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    const { error: insertErr } = await supabaseAdmin.from("footer_clicks").insert({
      user_id: authenticatedUserId,
      clicked_at: new Date().toISOString(),
    });

    if (insertErr) {
      return new Response(
        JSON.stringify({ error: `Failed to record click: ${insertErr.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only return success/failure status (do NOT return existing click records)
    return new Response(JSON.stringify({ ok: true }), {
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
