import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(
  typeof supabaseUrl === "string" &&
    supabaseUrl.trim() !== "" &&
    typeof supabasePublishableKey === "string" &&
    supabasePublishableKey.trim() !== ""
);

function getMissingEnvVars(): string[] {
  const missing: string[] = [];
  if (!supabaseUrl || supabaseUrl.trim() === "") {
    missing.push("VITE_SUPABASE_URL");
  }
  if (!supabasePublishableKey || supabasePublishableKey.trim() === "") {
    missing.push("VITE_SUPABASE_PUBLISHABLE_KEY");
  }
  return missing;
}

const missingVars = getMissingEnvVars();
if (missingVars.length > 0 && import.meta.env.DEV) {
  console.warn(
    `[Supabase Configuration]: Missing required environment variable(s): ${missingVars.join(
      ", "
    )}. Please configure them in .env.local.`
  );
}

/**
 * Singleton Supabase client instance.
 * Returns null if Supabase environment variables are missing,
 * allowing existing local features to operate uninterrupted.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabasePublishableKey!)
  : null;

/**
 * Safe accessor for the Supabase client that throws an explicit configuration
 * error when invoked in an unconfigured environment, without exposing any secret values.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      `[Supabase Configuration Error]: Missing required environment variable(s): ${missingVars.join(
        ", "
      )}.`
    );
  }
  return supabase;
}
