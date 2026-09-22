import React, { useState, useEffect, useMemo, useCallback } from "react";
import type {
  DatasetImportCandidate,
  DatasetImportResult,
  DatasetStore,
  Problem,
  ProblemStatus,
  UserProblemState,
  UserProgressStore,
  ImportHistoryEntry,
  TopicStat,
  LabStat,
  ViewTab,
  FilterState,
} from "../types/tracker";
import { PROBLEMS } from "../data/problems";
import { runDevDatasetValidation, validateProblemDataset } from "../data/validator";
import { TrackerContext } from "./TrackerContextBase";
import { countLabAssignments, DATASET_SCHEMA_VERSION } from "../data/importer";

const STORAGE_KEY = "dsa-lab-tracker:v1";
const DATASET_STORAGE_KEY = "dsa-lab-tracker:dataset:v1";
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

  // Progress Mutations
  updateStatus: (problemId: string, status: ProblemStatus) => void;
  toggleRevision: (problemId: string) => void;
  saveNotes: (problemId: string, notes: string) => void;
  resetAllProgress: () => void;
  exportData: () => void;
  importData: (jsonData: string) => boolean;
  exportDataset: () => void;
  importHistory: ImportHistoryEntry[];
  canUndoLastImport: boolean;
  applyDatasetImport: (candidates: DatasetImportCandidate[]) => DatasetImportResult;
  undoLastImport: () => boolean;

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

function getKnownProblemIds(): Set<string> {
  try {
    return new Set(mergeProblems(PROBLEMS, readDatasetStore().importedProblems).map((problem) => problem.id));
  } catch {
    return new Set(PROBLEMS.map((problem) => problem.id));
  }
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

function normalizeProgressStore(value: unknown): UserProgressStore {
  const parsed = value && typeof value === "object" ? (value as Partial<UserProgressStore>) : {};
  const sourceProgress =
    parsed.progress && typeof parsed.progress === "object" && !Array.isArray(parsed.progress)
      ? parsed.progress
      : {};
  const progress: UserProgressStore["progress"] = {};

  for (const [problemId, state] of Object.entries(sourceProgress)) {
    if (getKnownProblemIds().has(problemId)) {
      progress[problemId] = normalizeProblemState(state);
    }
  }

  return {
    version: 1,
    progress,
    theme: parsed.theme === "light" ? "light" : "dark",
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
  // Run dataset validation once on initialization in development
  useEffect(() => {
    if (import.meta.env.DEV) {
      runDevDatasetValidation();
    }
  }, []);

  // Initialize store from localStorage
  const [store, setStore] = useState<UserProgressStore>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.version === 1) {
          return normalizeProgressStore(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to load user progress from localStorage, resetting to defaults:", e);
    }
    return {
      version: 1,
      progress: {},
      theme: "dark",
    };
  });

  // Active view tab
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

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      // Update root dataset theme attribute
      document.documentElement.setAttribute("data-theme", store.theme);
      if (store.theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch (e) {
      console.error("Failed to persist tracker state to localStorage:", e);
    }
  }, [store]);

  useEffect(() => {
    try {
      localStorage.setItem(DATASET_STORAGE_KEY, JSON.stringify(datasetStore));
    } catch (e) {
      console.error("Failed to persist imported dataset to localStorage:", e);
    }
  }, [datasetStore]);

  const toggleTheme = useCallback(() => {
    // Add transition class to enable smooth cross-fade
    document.documentElement.classList.add("is-theme-transitioning");
    setStore((prev) => ({
      ...prev,
      theme: prev.theme === "dark" ? "light" : "dark",
    }));
    // Remove transition class after animation completes (300ms + buffer)
    setTimeout(() => {
      document.documentElement.classList.remove("is-theme-transitioning");
    }, 350);
  }, []);

  const getProgress = useCallback(
    (problemId: string): UserProblemState => {
      if (!store.progress || typeof store.progress !== "object") {
        return defaultUserProgress;
      }
      const item = store.progress[problemId];
      if (!item) return defaultUserProgress;
      return normalizeProblemState(item);
    },
    [store.progress]
  );

  const updateStatus = useCallback((problemId: string, status: ProblemStatus) => {
    setStore((prev) => {
      const current = normalizeProblemState(prev.progress[problemId]);
      return {
        ...prev,
        progress: {
          ...prev.progress,
          [problemId]: {
            ...current,
            status,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  }, []);

  const toggleRevision = useCallback((problemId: string) => {
    setStore((prev) => {
      const current = normalizeProblemState(prev.progress[problemId]);
      return {
        ...prev,
        progress: {
          ...prev.progress,
          [problemId]: {
            ...current,
            revision: !current.revision,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  }, []);

  const saveNotes = useCallback((problemId: string, notes: string) => {
    setStore((prev) => {
      const current = normalizeProblemState(prev.progress[problemId]);
      return {
        ...prev,
        progress: {
          ...prev.progress,
          [problemId]: {
            ...current,
            notes,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  }, []);

  const resetAllProgress = useCallback(() => {
    if (window.confirm("Are you sure you want to reset all problem progress and notes? This cannot be undone.")) {
      setStore((prev) => ({
        ...prev,
        progress: {},
      }));
    }
  }, []);

  const exportData = useCallback(() => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(store, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `dsa-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [store]);

  const importData = useCallback((jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed && typeof parsed.progress === "object" && parsed.progress !== null && !Array.isArray(parsed.progress)) {
        setStore(normalizeProgressStore(parsed));
        return true;
      }
    } catch (e) {
      console.error("Invalid backup file", e);
    }
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

  const applyDatasetImport = useCallback(
    (candidates: DatasetImportCandidate[]): DatasetImportResult => {
      const selected = candidates.filter((candidate) => candidate.selected);
      const beforeProblems = problems;
      const beforeImported = datasetStore.importedProblems;
      const importedById = new Map(beforeImported.map((problem) => [problem.id, problem]));
      const effectiveById = new Map(beforeProblems.map((problem) => [problem.id, problem]));
      let added = 0;
      let updated = 0;
      let skipped = candidates.length - selected.length;

      try {
        for (const candidate of selected) {
          if (candidate.action === "invalid" || candidate.action === "already-exists" || candidate.action === "possible-duplicate") {
            skipped++;
            continue;
          }

          if (candidate.action === "add-lab-date") {
            const existing = effectiveById.get(candidate.existingProblemId ?? candidate.id);
            if (!existing) {
              skipped++;
              continue;
            }
            const merged: Problem = {
              ...existing,
              labDates: Array.from(new Set([...existing.labDates, ...candidate.labDates])),
            };
            importedById.set(existing.id, merged);
            effectiveById.set(existing.id, merged);
            updated++;
            continue;
          }

          const problem: Problem = {
            id: candidate.id,
            title: candidate.title,
            url: candidate.url,
            platform: candidate.platform,
            topics: candidate.topics,
            labDates: candidate.labDates,
          };
          importedById.set(problem.id, problem);
          effectiveById.set(problem.id, problem);
          added++;
        }

        const nextImported = Array.from(importedById.values());
        const nextProblems = mergeProblems(PROBLEMS, nextImported);
        const report = validateProblemDataset(nextProblems);
        if (!report.isValid) {
          return {
            ok: false,
            message: "Import failed safely. No partial changes were saved.",
          };
        }

        const operationId = `import-${Date.now()}`;
        const entry: ImportHistoryEntry = {
          id: operationId,
          timestamp: new Date().toISOString(),
          processed: candidates.length,
          added,
          updated,
          skipped,
        };

        setDatasetStore((prev) => ({
          version: DATASET_SCHEMA_VERSION,
          importedProblems: nextImported,
          history: [entry, ...prev.history].slice(0, IMPORT_HISTORY_LIMIT),
          undo: {
            operationId,
            timestamp: entry.timestamp,
            importedProblemsBefore: beforeImported,
          },
        }));

        return {
          ok: true,
          summary: {
            operationId,
            processed: candidates.length,
            added,
            updated,
            skipped,
            beforeUnique: beforeProblems.length,
            afterUnique: nextProblems.length,
            beforeAssignments: countLabAssignments(beforeProblems),
            afterAssignments: countLabAssignments(nextProblems),
          },
        };
      } catch {
        return {
          ok: false,
          message: "Import failed safely. No partial changes were saved.",
        };
      }
    },
    [datasetStore.importedProblems, problems]
  );

  const undoLastImport = useCallback((): boolean => {
    if (!datasetStore.undo) return false;
    setDatasetStore((prev) => ({
      ...prev,
      importedProblems: prev.undo?.importedProblemsBefore ?? prev.importedProblems,
      undo: null,
    }));
    return true;
  }, [datasetStore.undo]);

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

  // Compute overall counts dynamically
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
      const state = normalizeProblemState(store.progress[p.id]);
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
  }, [problems, store.progress]);

  // Compute Topic Statistics dynamically
  const topicStats: TopicStat[] = useMemo(() => {
    return allTopics.map((topic) => {
      const topicProblems = problems.filter((p) => p.topics.includes(topic));
      let completed = 0;
      let inProgress = 0;
      let notStarted = 0;
      let revision = 0;

      for (const p of topicProblems) {
      const state = normalizeProblemState(store.progress[p.id]);
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
  }, [allTopics, problems, store.progress]);

  // Compute Lab Statistics dynamically
  const labStats: LabStat[] = useMemo(() => {
    return allLabDates.map((date) => {
      const labProblems = problems.filter((p) => p.labDates.includes(date));
      let completed = 0;
      let inProgress = 0;
      let notStarted = 0;

      for (const p of labProblems) {
        const state = normalizeProblemState(store.progress[p.id]);
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
  }, [allLabDates, problems, store.progress]);

  const value: TrackerContextValue = {
    theme: store.theme,
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
    updateStatus,
    toggleRevision,
    saveNotes,
    resetAllProgress,
    exportData,
    importData,
    exportDataset,
    importHistory: datasetStore.history,
    canUndoLastImport: Boolean(datasetStore.undo),
    applyDatasetImport,
    undoLastImport,
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

  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>;
};
