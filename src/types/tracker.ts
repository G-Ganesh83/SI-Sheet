export type ProblemStatus = "not-started" | "in-progress" | "completed";

export type Platform = string;

export interface Problem {
  id: string;
  title: string;
  url: string;
  platform: Platform;
  topics: string[];
  labDates: string[];
}

export interface UserProblemState {
  status: ProblemStatus;
  revision: boolean;
  notes: string;
  updatedAt?: string;
}

export interface UserProgressStore {
  version: 1;
  progress: Record<string, UserProblemState>;
  theme: "dark" | "light";
}

export type ViewTab = "dashboard" | "problems" | "topics" | "labs" | "revision" | "import";

export interface FilterState {
  search: string;
  status: "all" | ProblemStatus;
  revision: "all" | "needs-revision" | "no-revision";
  topic: string;
  labDate: string;
  platform: "all" | string;
  sortBy: "name-asc" | "name-desc" | "date-asc" | "date-desc" | "status" | "topic" | "platform";
}

export interface TopicStat {
  topic: string;
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  revision: number;
}

export interface LabStat {
  date: string;
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  problems: Problem[];
}

export interface ImportHistoryEntry {
  id: string;
  timestamp: string;
  processed: number;
  added: number;
  updated: number;
  skipped: number;
}

export interface DatasetUndoState {
  operationId: string;
  timestamp: string;
  importedProblemsBefore: Problem[];
}

export interface DatasetStore {
  version: 1;
  importedProblems: Problem[];
  history: ImportHistoryEntry[];
  undo: DatasetUndoState | null;
}

export interface DatasetImportCandidate {
  id: string;
  title: string;
  url: string;
  platform: string;
  topics: string[];
  labDates: string[];
  selected: boolean;
  action: "new" | "add-lab-date" | "already-exists" | "possible-duplicate" | "invalid";
  confidence: "high" | "medium" | "low" | "needs-review";
  existingProblemId?: string;
  messages: string[];
}

export interface DatasetImportSummary {
  operationId: string;
  processed: number;
  added: number;
  updated: number;
  skipped: number;
  beforeUnique: number;
  afterUnique: number;
  beforeAssignments: number;
  afterAssignments: number;
}

export interface DatasetImportResult {
  ok: boolean;
  summary?: DatasetImportSummary;
  message?: string;
}
