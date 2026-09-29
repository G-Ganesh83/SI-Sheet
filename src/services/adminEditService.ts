import { supabase, isSupabaseConfigured } from "../lib/supabase";
import type { Problem } from "../types/tracker";

export interface AdminEditProblemPayload {
  problemId?: string;
  originalUrl?: string;
  title: string;
  url: string;
  platform: string;
  topics: string[];
  labDates: string[];
}

export interface AdminEditProblemResponse {
  ok: boolean;
  message?: string;
  error?: string;
  details?: string;
  problem?: Problem;
}

/**
 * Call the admin-edit-problem Edge Function to atomically update a problem's
 * metadata, topics, and lab assignments in the shared Supabase catalog.
 *
 * Guaranteed to preserve the problem UUID and user_progress records.
 */
export async function adminEditProblem(
  payload: AdminEditProblemPayload
): Promise<AdminEditProblemResponse> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured. Cannot edit catalog problem.");
  }

  const { data, error } = await supabase.functions.invoke<AdminEditProblemResponse>(
    "admin-edit-problem",
    {
      body: payload,
    }
  );

  if (error) {
    let customMessage = "";
    try {
      if ("context" in error && typeof (error as any).context?.json === "function") {
        const body = await (error as any).context.json();
        if (body?.error) {
          customMessage = body.details ? `${body.error} (${body.details})` : body.error;
        }
      }
    } catch {
      // fallback
    }
    throw new Error(
      customMessage || error.message || "Edit failed. No changes were made to the shared catalog."
    );
  }

  if (!data) {
    throw new Error("Edit Edge Function returned an empty response.");
  }

  if (!data.ok) {
    const errMsg = data.error || "Edit failed. No changes were made to the shared catalog.";
    const fullMsg = data.details ? `${errMsg} (${data.details})` : errMsg;
    throw new Error(fullMsg);
  }

  return data;
}
