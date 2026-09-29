import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type {
  DatasetStore,
  Problem,
  ProblemStatus,
  UserProblemState,
  ImportHistoryEntry,
  TopicStat,
  LabStat,
  ViewTab,
  FilterState,
} from "../types/tracker";
import { PROBLEMS } from "../data/problems";
import { runDevDatasetValidation } from "../data/validator";
import { TrackerContext } from "./TrackerContextBase";
import { DATASET_SCHEMA_VERSION } from "../data/importer";
import { useAuth } from "./useAuth";
import {
  loadUserProgress,
  saveStatus,
  saveRevision,
  saveNotesToDb,
  deleteAllUserProgress,
  invalidateCatalogCache,
  getCatalogProblems,
} from "../services/progressService";
import { Toast, type ToastMessage } from "../components/common/Toast";

const DATASET_STORAGE_KEY = "dsa-lab-tracker:dataset:v1";
const THEME_STORAGE_KEY = "si-sheet:theme";
const IMPORT_HISTORY_LIMIT = 10;

export interface TrackerContextValue {
  // Theme
  theme: "dark" | "light";
  toggleTheme: () => void;

  // Navigation
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;

  // Selected Problem Drawer
  selectedProblemId: string | null;
  setSelectedProblemId: (id: string | null) => void;

  // Raw and enhanced problems
  problems: Problem[];
  allTopics: string[];
  allLabDates: string[];
  allPlatforms: string[];
  getProgress: (problemId: string) => UserProblemState;

  // Loading & Error States for Progress
  isLoadingProgress: boolean;
  progressError: string | null;

  // Progress Mutations
  updateStatus: (problemId: string, status: ProblemStatus) => Promise<void> | void;
  toggleRevision: (problemId: string) => Promise<void> | void;
  saveNotes: (problemId: string, notes: string) => Promise<void> | void;
  resetAllProgress: () => Promise<void> | void;
  exportData: () => void;
  importData: (jsonData: string) => boolean;
  exportDataset: () => void;
  importHistory: ImportHistoryEntry[];
  /**
   * Refresh the session-local problem list from the Supabase catalog.
   * Call this after a successful admin import to make newly added problems
   * appear in the current session without a page reload.
   * Returns the number of newly merged catalog problems.
   */
  refreshImportedProblems: () => Promise<number>;

  // Computed Metrics
  totalProblems: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  revisionCount: number;
  completionPercentage: number;

  // Filtered queries & sections
  inProgressProblems: Problem[];
  recentWorkedProblems: Problem[];
  revisionProblems: Problem[];
  topicStats: TopicStat[];
  labStats: LabStat[];

  // Global filters
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  selectTopicFilter: (topic: string) => void;
  selectLabFilter: (labDate: string) => void;
}

const defaultUserProgress: UserProblemState = {
  status: "not-started",
  revision: false,
  notes: "",
};

function normalizeProblem(value: unknown): Problem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<Problem>;
  if (
    typeof item.id !== "string" ||
    typeof item.title !== "string" ||
    typeof item.url !== "string" ||
    typeof item.platform !== "string" ||
    !Array.isArray(item.topics) ||
    !Array.isArray(item.labDates)
  ) {
    return null;
  }

  const topics = item.topics.filter((topic): topic is string => typeof topic === "string" && topic.trim() !== "");
  const labDates = Array.from(
    new Set(item.labDates.filter((date): date is string => typeof date === "string" && date.trim() !== ""))
  );

  if (!item.id.trim() || !item.title.trim() || !item.url.trim() || !item.platform.trim() || topics.length === 0 || labDates.length === 0) {
    return null;
  }

  return {
    id: item.id.trim(),
    title: item.title.trim(),
    url: item.url.trim(),
    platform: item.platform.trim(),
    topics,
    labDates,
  };
}

function normalizeDatasetStore(value: unknown): DatasetStore {
  const parsed = value && typeof value === "object" ? (value as Partial<DatasetStore>) : {};
  const importedProblems = Array.isArray(parsed.importedProblems)
    ? parsed.importedProblems.map(normalizeProblem).filter((problem): problem is Problem => Boolean(problem))
    : [];
  const history = Array.isArray(parsed.history)
    ? parsed.history
        .filter((entry): entry is ImportHistoryEntry => (
          Boolean(entry) &&
          typeof entry.id === "string" &&
          typeof entry.timestamp === "string" &&
          typeof entry.processed === "number" &&
          typeof entry.added === "number" &&
          typeof entry.updated === "number" &&
          typeof entry.skipped === "number"
        ))
        .slice(0, IMPORT_HISTORY_LIMIT)
    : [];
  const undo =
    parsed.undo &&
    typeof parsed.undo === "object" &&
    typeof parsed.undo.operationId === "string" &&
    typeof parsed.undo.timestamp === "string" &&
    Array.isArray(parsed.undo.importedProblemsBefore)
      ? {
          operationId: parsed.undo.operationId,
          timestamp: parsed.undo.timestamp,
          importedProblemsBefore: parsed.undo.importedProblemsBefore
            .map(normalizeProblem)
            .filter((problem): problem is Problem => Boolean(problem)),
        }
      : null;

  return {
    version: DATASET_SCHEMA_VERSION,
    importedProblems,
    history,
    undo,
  };
}

function readDatasetStore(): DatasetStore {
  try {
    const saved = localStorage.getItem(DATASET_STORAGE_KEY);
    if (saved) {
      return normalizeDatasetStore(JSON.parse(saved));
    }
  } catch (e) {
    console.warn("Failed to load imported dataset from localStorage, using base dataset only:", e);
  }
  return {
    version: DATASET_SCHEMA_VERSION,
    importedProblems: [],
    history: [],
    undo: null,
  };
}

function mergeProblems(baseProblems: Problem[], importedProblems: Problem[]): Problem[] {
  const byId = new Map<string, Problem>();
  for (const problem of baseProblems) {
    byId.set(problem.id, problem);
  }
  for (const imported of importedProblems) {
    const current = byId.get(imported.id);
    byId.set(imported.id, {
      ...(current ?? imported),
      ...imported,
      labDates: Array.from(new Set([...(current?.labDates ?? []), ...imported.labDates])),
    });
  }
  return Array.from(byId.values());
}

function normalizeProblemState(value: unknown): UserProblemState {
  const item = value && typeof value === "object" ? (value as Partial<UserProblemState>) : {};
  return {
    status:
      item.status === "completed" || item.status === "in-progress"
        ? item.status
        : "not-started",
    revision: item.revision === true,
    notes: typeof item.notes === "string" ? item.notes : "",
    updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : undefined,
  };
}

const initialFilters: FilterState = {
  search: "",
  status: "all",
  revision: "all",
  topic: "all",
  labDate: "all",
  platform: "all",
  sortBy: "date-asc",
};

export const TrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, showAuthPrompt } = useAuth();

  // Run dataset validation once on initialization in development
  useEffect(() => {
    if (import.meta.env.DEV) {
      runDevDatasetValidation();
    }
  }, []);

  // Theme preference is kept in localStorage as a harmless UI preference
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === "light" || saved === "dark") {
        return saved;
      }
    } catch {
      // fallback
    }
    return "dark";
  });

  // Progress state: strictly Supabase-backed in-memory state.
  // NO progress is read from or written to localStorage.
  const [progress, setProgress] = useState<Record<string, UserProblemState>>({});
  const [isLoadingProgress, setIsLoadingProgress] = useState<boolean>(false);
  const [progressError, setProgressError] = useState<string | null>(null);

  // Toast feedback state
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((message: string, type: "error" | "success" | "info" = "info") => {
    setToast({ id: `${Date.now()}-${Math.random()}`, message, type });
  }, []);

  // Track the active user ID for which progress is loaded to guarantee logout & account-switch safety
  const activeUserIdRef = useRef<string | null>(null);

  // Active view tab & filters
  const [activeTab, setActiveTab] = useState<ViewTab>("dashboard");
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [datasetStore, setDatasetStore] = useState<DatasetStore>(() => readDatasetStore());

  const problems = useMemo(
    () => mergeProblems(PROBLEMS, datasetStore.importedProblems),
    [datasetStore.importedProblems]
  );

  const allLabDates = useMemo(() => {
    const dates = Array.from(new Set(problems.flatMap((problem) => problem.labDates)));
    return dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [problems]);

  const allTopics = useMemo(
    () => Array.from(new Set(problems.flatMap((problem) => problem.topics))).sort(),
    [problems]
  );

  const allPlatforms = useMemo(
    () => Array.from(new Set(problems.map((problem) => problem.platform))).sort(),
    [problems]
  );

  // Sync theme to DOM and localStorage
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      document.documentElement.setAttribute("data-theme", theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch (e) {
      console.error("Failed to persist theme preference to localStorage:", e);
    }
  }, [theme]);

  // Sync imported dataset to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(DATASET_STORAGE_KEY, JSON.stringify(datasetStore));
    } catch (e) {
      console.error("Failed to persist imported dataset to localStorage:", e);
    }
  }, [datasetStore]);

  // Auth & Progress synchronization
  useEffect(() => {
    let isSubscribed = true;

    // Scenario: Anonymous or Logged Out
    if (!user) {
      activeUserIdRef.current = null;
      queueMicrotask(() => {
        if (isSubscribed) {
          setProgress((prev) => (Object.keys(prev).length === 0 ? prev : {}));
          setIsLoadingProgress(false);
          setProgressError(null);
        }
      });
      return;
    }

    // Scenario: User account switched
    if (activeUserIdRef.current !== user.id) {
      activeUserIdRef.current = user.id;
      queueMicrotask(() => {
        if (isSubscribed) {
          setProgress((prev) => (Object.keys(prev).length === 0 ? prev : {}));
        }
      });
    }

    const fetchProgress = async () => {
      setIsLoadingProgress(true);
      setProgressError(null);

      try {
        const { data, error } = await loadUserProgress(user.id);
        if (!isSubscribed || activeUserIdRef.current !== user.id) return;

        if (error) {
          console.error("[TrackerContext] Error loading user progress from Supabase:", error);
          setProgressError("Could not load progress from database.");
          showToast("Failed to load your personal progress from Supabase.", "error");
        } else {
          setProgress(data);
        }
      } catch (err) {
        if (!isSubscribed || activeUserIdRef.current !== user.id) return;
        console.error("[TrackerContext] Unexpected exception loading progress:", err);
        setProgressError("Failed to connect to progress service.");
      } finally {
        if (isSubscribed && activeUserIdRef.current === user.id) {
          setIsLoadingProgress(false);
        }
      }
    };

    queueMicrotask(() => {
      if (isSubscribed) {
        void fetchProgress();
      }
    });

    return () => {
      isSubscribed = false;
    };
  }, [user, showToast]);

  const toggleTheme = useCallback(() => {
    document.documentElement.classList.add("is-theme-transitioning");
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    setTimeout(() => {
      document.documentElement.classList.remove("is-theme-transitioning");
    }, 350);
  }, []);

  const getProgress = useCallback(
    (problemId: string): UserProblemState => {
      const item = progress[problemId];
      if (!item) return defaultUserProgress;
      return normalizeProblemState(item);
    },
    [progress]
  );

  const updateStatus = useCallback(
    async (problemId: string, status: ProblemStatus) => {
      if (!user) {
        showAuthPrompt();
        return;
      }

      const problem = problems.find((p) => p.id === problemId);
      const prevProgress = progress[problemId] ?? defaultUserProgress;

      // Optimistic update
      const optimisticState: UserProblemState = {
        ...prevProgress,
        status,
        updatedAt: new Date().toISOString(),
      };

      setProgress((prev) => ({
        ...prev,
        [problemId]: optimisticState,
      }));

      // Persist to Supabase
      const { data, error } = await saveStatus(
        user.id,
        problemId,
        status,
        prevProgress,
        problem?.url,
        problem?.title
      );

      if (error) {
        console.error(`[TrackerContext] Failed to save status for ${problemId}:`, error);
        // Rollback
        setProgress((prev) => ({
          ...prev,
          [problemId]: prevProgress,
        }));
        showToast("Failed to update status on server. Please try again.", "error");
      } else if (data) {
        // Sync confirmed server state
        setProgress((prev) => ({
          ...prev,
          [problemId]: data,
        }));
      }
    },
    [user, problems, progress, showAuthPrompt, showToast]
  );

  const toggleRevision = useCallback(
    async (problemId: string) => {
      if (!user) {
        showAuthPrompt();
        return;
      }

      const problem = problems.find((p) => p.id === problemId);
      const prevProgress = progress[problemId] ?? defaultUserProgress;
      const nextRevision = !prevProgress.revision;

      // Optimistic update
      const optimisticState: UserProblemState = {
        ...prevProgress,
        revision: nextRevision,
        updatedAt: new Date().toISOString(),
      };

      setProgress((prev) => ({
        ...prev,
        [problemId]: optimisticState,
      }));

      // Persist to Supabase
      const { data, error } = await saveRevision(
        user.id,
        problemId,
        nextRevision,
        prevProgress,
        problem?.url,
        problem?.title
      );

      if (error) {
        console.error(`[TrackerContext] Failed to save revision for ${problemId}:`, error);
        // Rollback
        setProgress((prev) => ({
          ...prev,
          [problemId]: prevProgress,
        }));
        showToast("Failed to update revision status. Please try again.", "error");
      } else if (data) {
        setProgress((prev) => ({
          ...prev,
          [problemId]: data,
        }));
      }
    },
    [user, problems, progress, showAuthPrompt, showToast]
  );

  const saveNotes = useCallback(
    async (problemId: string, notes: string) => {
      if (!user) {
        showAuthPrompt();
        return;
      }

      const problem = problems.find((p) => p.id === problemId);
      const prevProgress = progress[problemId] ?? defaultUserProgress;

      // Optimistic update
      const optimisticState: UserProblemState = {
        ...prevProgress,
        notes,
        updatedAt: new Date().toISOString(),
      };

      setProgress((prev) => ({
        ...prev,
        [problemId]: optimisticState,
      }));

      // Persist to Supabase
      const { data, error } = await saveNotesToDb(
        user.id,
        problemId,
        notes,
        prevProgress,
        problem?.url,
        problem?.title
      );

      if (error) {
        console.error(`[TrackerContext] Failed to save notes for ${problemId}:`, error);
        // Rollback
        setProgress((prev) => ({
          ...prev,
          [problemId]: prevProgress,
        }));
        showToast("Failed to save personal notes to server.", "error");
      } else if (data) {
        setProgress((prev) => ({
          ...prev,
          [problemId]: data,
        }));
      }
    },
    [user, problems, progress, showAuthPrompt, showToast]
  );

  const resetAllProgress = useCallback(async () => {
    if (!user) {
      showAuthPrompt();
      return;
    }

    if (!window.confirm("Are you sure you want to reset all problem progress and notes? This cannot be undone.")) {
      return;
    }

    const previousProgress = progress;
    setProgress({});

    const { error } = await deleteAllUserProgress(user.id);
    if (error) {
      console.error("[TrackerContext] Failed to reset progress in Supabase:", error);
      setProgress(previousProgress);
      showToast("Failed to reset progress. Please try again.", "error");
    } else {
      showToast("All personal progress has been reset.", "info");
    }
  }, [user, progress, showAuthPrompt, showToast]);

  const exportData = useCallback(() => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(
        JSON.stringify(
          {
            version: 1,
            progress,
            theme,
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `dsa-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [progress, theme]);

  const importData = useCallback((): boolean => {
    // In Phase 6, localStorage imports of progress are deprecated in favor of Supabase.
    console.warn("[TrackerContext] importData is disabled. Supabase user_progress is the authoritative store.");
    return false;
  }, []);

  const exportDataset = useCallback(() => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify({ schemaVersion: DATASET_SCHEMA_VERSION, problems }, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `dsa-tracker-dataset-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [problems]);

  /**
   * Refresh the session-local problem list by loading the Supabase catalog and
   * merging any new problems (not in PROBLEMS) into the local datasetStore.
   * Called by ImportView after a successful admin import.
   */
  const refreshImportedProblems = useCallback(async (): Promise<number> => {
    // Force a fresh fetch of the Supabase catalog
    invalidateCatalogCache();
    const catalogProblems = await getCatalogProblems(true);

    // Build a set of URLs/IDs already in the hardcoded base dataset
    const baseUrls = new Set(PROBLEMS.map((p) => p.url.trim().toLowerCase()));
    const baseIds = new Set(PROBLEMS.map((p) => p.id));

    // Find catalog problems not in base dataset
    const existingImportedUrls = new Set(
      datasetStore.importedProblems.map((p) => p.url.trim().toLowerCase())
    );

    // Build Problem-shaped objects for any catalog entries not already present
    const newFromCatalog: Problem[] = [];
    for (const dbProblem of catalogProblems) {
      const urlKey = dbProblem.url.trim().toLowerCase();
      if (baseUrls.has(urlKey) || existingImportedUrls.has(urlKey)) continue;
      newFromCatalog.push({
        id: dbProblem.id, // use Supabase UUID as id for new catalog problems
        title: dbProblem.title,
        url: dbProblem.url,
        platform: dbProblem.platform ?? "Unknown",
        topics: dbProblem.topics && dbProblem.topics.length > 0 ? dbProblem.topics : ["Imported"],
        labDates: dbProblem.labDates && dbProblem.labDates.length > 0 ? dbProblem.labDates : [],
      });
      existingImportedUrls.add(urlKey);
    }

    if (newFromCatalog.length === 0 && baseIds.size === PROBLEMS.length) {
      return 0;
    }

    if (newFromCatalog.length > 0) {
      setDatasetStore((prev) => {
        const merged = [...prev.importedProblems, ...newFromCatalog];
        const operationId = `import-${Date.now()}`;
        const entry: ImportHistoryEntry = {
          id: operationId,
          timestamp: new Date().toISOString(),
          processed: newFromCatalog.length,
          added: newFromCatalog.length,
          updated: 0,
          skipped: 0,
        };
        return {
          version: DATASET_SCHEMA_VERSION,
          importedProblems: merged,
          history: [entry, ...prev.history].slice(0, IMPORT_HISTORY_LIMIT),
          undo: null, // Supabase imports cannot be locally undone
        };
      });
    }

    return newFromCatalog.length;
  }, [datasetStore.importedProblems]);

  // Load any newly added shared catalog problems from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) {
        void refreshImportedProblems();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [refreshImportedProblems]);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const selectTopicFilter = useCallback((topic: string) => {
    setFilters((prev) => ({
      ...prev,
      topic: topic,
    }));
    setActiveTab("problems");
  }, []);

  const selectLabFilter = useCallback((labDate: string) => {
    setFilters((prev) => ({
      ...prev,
      labDate: labDate,
    }));
    setActiveTab("problems");
  }, []);

  // Compute overall counts dynamically from in-memory Supabase progress
  const {
    totalProblems,
    completedCount,
    inProgressCount,
    notStartedCount,
    revisionCount,
    completionPercentage,
    inProgressProblems,
    recentWorkedProblems,
    revisionProblems,
  } = useMemo(() => {
    const total = problems.length;
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;
    let revision = 0;

    const inProgressList: Problem[] = [];
    const revisionList: Problem[] = [];
    const updatedWithTime: { problem: Problem; updatedAt: string }[] = [];

    for (const p of problems) {
      const state = normalizeProblemState(progress[p.id]);
      if (state.status === "completed") {
        completed++;
      } else if (state.status === "in-progress") {
        inProgress++;
        inProgressList.push(p);
      } else {
        notStarted++;
      }

      if (state.revision) {
        revision++;
        revisionList.push(p);
      }

      if (state.updatedAt) {
        updatedWithTime.push({ problem: p, updatedAt: state.updatedAt });
      }
    }

    // Sort recent worked problems descending by updatedAt
    updatedWithTime.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const recentWorked = updatedWithTime.map((item) => item.problem).slice(0, 5);

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      totalProblems: total,
      completedCount: completed,
      inProgressCount: inProgress,
      notStartedCount: notStarted,
      revisionCount: revision,
      completionPercentage: percentage,
      inProgressProblems: inProgressList,
      recentWorkedProblems: recentWorked,
      revisionProblems: revisionList,
    };
  }, [problems, progress]);

  // Compute Topic Statistics dynamically from in-memory Supabase progress
  const topicStats: TopicStat[] = useMemo(() => {
    return allTopics.map((topic) => {
      const topicProblems = problems.filter((p) => p.topics.includes(topic));
      let completed = 0;
      let inProgress = 0;
      let notStarted = 0;
      let revision = 0;

      for (const p of topicProblems) {
        const state = normalizeProblemState(progress[p.id]);
        if (state.status === "completed") completed++;
        else if (state.status === "in-progress") inProgress++;
        else notStarted++;

        if (state.revision) revision++;
      }

      return {
        topic,
        total: topicProblems.length,
        completed,
        inProgress,
        notStarted,
        revision,
      };
    }).sort((a, b) => b.total - a.total || a.topic.localeCompare(b.topic));
  }, [allTopics, problems, progress]);

  // Compute Lab Statistics dynamically from in-memory Supabase progress
  const labStats: LabStat[] = useMemo(() => {
    return allLabDates.map((date) => {
      const labProblems = problems.filter((p) => p.labDates.includes(date));
      let completed = 0;
      let inProgress = 0;
      let notStarted = 0;

      for (const p of labProblems) {
        const state = normalizeProblemState(progress[p.id]);
        if (state.status === "completed") completed++;
        else if (state.status === "in-progress") inProgress++;
        else notStarted++;
      }

      return {
        date,
        total: labProblems.length,
        completed,
        inProgress,
        notStarted,
        problems: labProblems,
      };
    });
  }, [allLabDates, problems, progress]);

  const value: TrackerContextValue = {
    theme,
    toggleTheme,
    activeTab,
    setActiveTab,
    selectedProblemId,
    setSelectedProblemId,
    problems,
    allTopics,
    allLabDates,
    allPlatforms,
    getProgress,
    isLoadingProgress,
    progressError,
    updateStatus,
    toggleRevision,
    saveNotes,
    resetAllProgress,
    exportData,
    importData,
    exportDataset,
    importHistory: datasetStore.history,
    refreshImportedProblems,
    totalProblems,
    completedCount,
    inProgressCount,
    notStartedCount,
    revisionCount,
    completionPercentage,
    inProgressProblems,
    recentWorkedProblems,
    revisionProblems,
    topicStats,
    labStats,
    filters,
    setFilters,
    resetFilters,
    selectTopicFilter,
    selectLabFilter,
  };

  return (
    <TrackerContext.Provider value={value}>
      {children}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </TrackerContext.Provider>
  );
};
