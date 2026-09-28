import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase";
import { PROBLEMS } from "../data/problems";
import type { Problem, ProblemStatus, UserProblemState } from "../types/tracker";

export type DbProblemStatus = "not_started" | "in_progress" | "completed";

export interface DbProblem {
  id: string;
  url: string;
  title: string;
  platform?: string;
}

export interface DbUserProgressRow {
  id: string;
  user_id: string;
  problem_id: string;
  status: DbProblemStatus;
  revision: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Convert frontend ProblemStatus ("not-started" | "in-progress" | "completed") to DB enum string */
export function toDbStatus(status: ProblemStatus): DbProblemStatus {
  switch (status) {
    case "in-progress":
      return "in_progress";
    case "completed":
      return "completed";
    case "not-started":
    default:
      return "not_started";
  }
}

/** Convert DB status string ("not_started" | "in_progress" | "completed") to frontend ProblemStatus */
export function toAppStatus(status: string | null | undefined): ProblemStatus {
  switch (status) {
    case "in_progress":
    case "in-progress":
      return "in-progress";
    case "completed":
      return "completed";
    case "not_started":
    case "not-started":
    default:
      return "not-started";
  }
}

// In-memory catalog mapping cache
let cachedCatalogProblems: DbProblem[] | null = null;
let urlToDbId = new Map<string, string>();
let titleToDbId = new Map<string, string>();
let dbIdToProblem = new Map<string, DbProblem>();
let dbIdToAppProblem = new Map<string, Problem>();

/** Normalize string for loose title matching */
function normalizeTitle(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

/**
 * Fetch problem catalog from Supabase and build bidirectional lookup maps.
 */
export async function getCatalogProblems(forceRefresh = false): Promise<DbProblem[]> {
  if (cachedCatalogProblems && !forceRefresh) {
    return cachedCatalogProblems;
  }

  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("problems")
      .select("id, url, title, platform");

    if (error) {
      console.warn("[progressService] Could not fetch catalog problems from Supabase:", error.message);
      return cachedCatalogProblems || [];
    }

    if (data && Array.isArray(data)) {
      cachedCatalogProblems = data as DbProblem[];
      urlToDbId.clear();
      titleToDbId.clear();
      dbIdToProblem.clear();
      dbIdToAppProblem.clear();

      for (const p of cachedCatalogProblems) {
        urlToDbId.set(p.url.trim().toLowerCase(), p.id);
        titleToDbId.set(normalizeTitle(p.title), p.id);
        dbIdToProblem.set(p.id, p);

        // Find corresponding problem in frontend PROBLEMS
        const appProb = PROBLEMS.find(
          (ap) =>
            ap.url.trim().toLowerCase() === p.url.trim().toLowerCase() ||
            normalizeTitle(ap.title) === normalizeTitle(p.title)
        );
        if (appProb) {
          dbIdToAppProblem.set(p.id, appProb);
        }
      }
    }

    return cachedCatalogProblems || [];
  } catch (err) {
    console.error("[progressService] Unexpected error fetching problems catalog:", err);
    return cachedCatalogProblems || [];
  }
}

/**
 * Resolve frontend problem identifier (slug/id/url) to remote database problem UUID.
 */
export async function resolveDbProblemId(
  problemIdentifier: string,
  problemUrl?: string,
  problemTitle?: string
): Promise<string | null> {
  // If no catalog loaded yet, load it now
  if (!cachedCatalogProblems) {
    await getCatalogProblems();
  }

  // Check 1: exact URL match
  if (problemUrl) {
    const dbId = urlToDbId.get(problemUrl.trim().toLowerCase());
    if (dbId) return dbId;
  }

  // Check 2: frontend problem match in PROBLEMS
  const appProb = PROBLEMS.find((p) => p.id === problemIdentifier);
  if (appProb) {
    const dbIdByUrl = urlToDbId.get(appProb.url.trim().toLowerCase());
    if (dbIdByUrl) return dbIdByUrl;

    const dbIdByTitle = titleToDbId.get(normalizeTitle(appProb.title));
    if (dbIdByTitle) return dbIdByTitle;
  }

  // Check 3: title match
  if (problemTitle) {
    const dbId = titleToDbId.get(normalizeTitle(problemTitle));
    if (dbId) return dbId;
  }

  // Check 4: direct UUID match if problemIdentifier is already a DB UUID
  if (dbIdToProblem.has(problemIdentifier)) {
    return problemIdentifier;
  }

  // Try refreshing catalog once in case problems were recently seeded
  const refreshed = await getCatalogProblems(true);
  if (refreshed.length > 0) {
    if (problemUrl) {
      const dbId = urlToDbId.get(problemUrl.trim().toLowerCase());
      if (dbId) return dbId;
    }
    if (appProb) {
      const dbId = urlToDbId.get(appProb.url.trim().toLowerCase()) ?? titleToDbId.get(normalizeTitle(appProb.title));
      if (dbId) return dbId;
    }
  }

  return null;
}

/**
 * Load all progress for the authenticated user from Supabase user_progress table.
 * Returns records keyed by frontend problem ID.
 */
export async function loadUserProgress(
  userId: string
): Promise<{ data: Record<string, UserProblemState>; error: Error | null }> {
  try {
    // Ensure catalog mapping is ready
    await getCatalogProblems();

    if (!isSupabaseConfigured) {
      return { data: {}, error: new Error("Supabase is not configured.") };
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("user_progress")
      .select("id, problem_id, status, revision, notes, updated_at")
      .eq("user_id", userId);

    if (error) {
      console.error("[progressService] Failed to load user progress:", error);
      return { data: {}, error: new Error(error.message) };
    }

    const progressRecord: Record<string, UserProblemState> = {};

    if (data && Array.isArray(data)) {
      for (const row of data as DbUserProgressRow[]) {
        // Resolve frontend problem key
        const appProb = dbIdToAppProblem.get(row.problem_id);
        const problemKey = appProb ? appProb.id : row.problem_id;

        progressRecord[problemKey] = {
          status: toAppStatus(row.status),
          revision: Boolean(row.revision),
          notes: row.notes || "",
          updatedAt: row.updated_at,
        };
      }
    }

    return { data: progressRecord, error: null };
  } catch (err) {
    console.error("[progressService] Unexpected exception loading progress:", err);
    return { data: {}, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Upsert a single problem progress row for the authenticated user.
 */
export async function upsertProgress(
  userId: string,
  problemId: string,
  updates: Partial<UserProblemState>,
  currentProgress?: UserProblemState,
  problemUrl?: string,
  problemTitle?: string
): Promise<{ data: UserProblemState | null; error: Error | null }> {
  try {
    const dbProblemId = await resolveDbProblemId(problemId, problemUrl, problemTitle);
    if (!dbProblemId) {
      const err = new Error(`Problem "${problemId}" could not be matched with a remote database catalog entry.`);
      console.error("[progressService]", err.message);
      return { data: null, error: err };
    }

    const newStatus = updates.status !== undefined ? updates.status : (currentProgress?.status ?? "not-started");
    const newRevision = updates.revision !== undefined ? updates.revision : (currentProgress?.revision ?? false);
    const newNotes = updates.notes !== undefined ? updates.notes : (currentProgress?.notes ?? "");

    if (!isSupabaseConfigured) {
      return { data: null, error: new Error("Supabase is not configured.") };
    }

    const nowIso = new Date().toISOString();
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("user_progress")
      .upsert(
        {
          user_id: userId,
          problem_id: dbProblemId,
          status: toDbStatus(newStatus),
          revision: newRevision,
          notes: newNotes,
          updated_at: nowIso,
        },
        {
          onConflict: "user_id,problem_id",
        }
      )
      .select("id, problem_id, status, revision, notes, updated_at")
      .single();

    if (error) {
      console.error("[progressService] Upsert error:", error);
      return { data: null, error: new Error(error.message) };
    }

    const resultState: UserProblemState = {
      status: toAppStatus(data.status),
      revision: Boolean(data.revision),
      notes: data.notes || "",
      updatedAt: data.updated_at || nowIso,
    };

    return { data: resultState, error: null };
  } catch (err) {
    console.error("[progressService] Unexpected error upserting progress:", err);
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/** Save/update status for a problem */
export async function saveStatus(
  userId: string,
  problemId: string,
  status: ProblemStatus,
  currentProgress?: UserProblemState,
  problemUrl?: string,
  problemTitle?: string
): Promise<{ data: UserProblemState | null; error: Error | null }> {
  return upsertProgress(userId, problemId, { status }, currentProgress, problemUrl, problemTitle);
}

/** Save/update revision flag for a problem */
export async function saveRevision(
  userId: string,
  problemId: string,
  revision: boolean,
  currentProgress?: UserProblemState,
  problemUrl?: string,
  problemTitle?: string
): Promise<{ data: UserProblemState | null; error: Error | null }> {
  return upsertProgress(userId, problemId, { revision }, currentProgress, problemUrl, problemTitle);
}

/** Save/update notes for a problem */
export async function saveNotesToDb(
  userId: string,
  problemId: string,
  notes: string,
  currentProgress?: UserProblemState,
  problemUrl?: string,
  problemTitle?: string
): Promise<{ data: UserProblemState | null; error: Error | null }> {
  return upsertProgress(userId, problemId, { notes }, currentProgress, problemUrl, problemTitle);
}

/** Delete all progress for an authenticated user */
export async function deleteAllUserProgress(
  userId: string
): Promise<{ error: Error | null }> {
  try {
    if (!isSupabaseConfigured) {
      return { error: new Error("Supabase is not configured.") };
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("user_progress")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("[progressService] Delete all progress error:", error);
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    console.error("[progressService] Unexpected error deleting progress:", err);
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}
