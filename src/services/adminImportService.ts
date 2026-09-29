import { supabase, isSupabaseConfigured } from "../lib/supabase";
import type { DatasetImportCandidate } from "../types/tracker";

export interface AdminImportPayloadCandidate {
  id: string;
  title: string;
  url: string;
  platform: string;
  topics: string[];
  labDates: string[];
  action: DatasetImportCandidate["action"];
  existingProblemId?: string;
  existingProblemUrl?: string;
}

export interface AdminImportResponse {
  ok: boolean;
  message?: string;
  error?: string;
  details?: string;
  added?: number;
  updated?: number;
  processed?: number;
}

/**
 * Call the admin-import Edge Function to write selected import candidates
 * into the shared Supabase catalog inside an all-or-nothing PostgreSQL transaction.
 *
 * Only admins can call this successfully — the Edge Function enforces auth + role.
 * Never exposes service-role keys to the browser.
 */
export async function adminImportToCatalog(
  candidates: DatasetImportCandidate[]
): Promise<AdminImportResponse> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured. Cannot perform catalog import.");
  }

  // Only send NEW and ADD LAB DATE candidates
  const actionable: AdminImportPayloadCandidate[] = candidates
    .filter(
      (c) =>
        c.selected &&
        (c.action === "new" || c.action === "add-lab-date")
    )
    .map((c) => ({
      id: c.id,
      title: c.title,
      url: c.url,
      platform: c.platform,
      topics: c.topics,
      labDates: c.labDates,
      action: c.action,
      existingProblemId: c.existingProblemId,
      existingProblemUrl: c.action === "add-lab-date" ? c.url : undefined,
    }));

  if (actionable.length === 0) {
    throw new Error(
      "No actionable candidates selected. Select at least one NEW or ADD LAB DATE row."
    );
  }

  const { data, error } = await supabase.functions.invoke<AdminImportResponse>(
    "admin-import",
    {
      body: { candidates: actionable },
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
      customMessage || error.message || "Import failed. No changes were made to the shared catalog."
    );
  }

  if (!data) {
    throw new Error("Import Edge Function returned an empty response.");
  }

  if (!data.ok) {
    const errMsg = data.error || "Import failed. No changes were made to the shared catalog.";
    const fullMsg = data.details ? `${errMsg} (${data.details})` : errMsg;
    throw new Error(fullMsg);
  }

  return data;
}
