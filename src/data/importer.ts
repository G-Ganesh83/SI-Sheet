import type { DatasetImportCandidate, Problem } from "../types/tracker";

export const DATASET_SCHEMA_VERSION = 1;

const MONTHS = new Map([
  ["jan", "Jan"],
  ["january", "Jan"],
  ["feb", "Feb"],
  ["february", "Feb"],
  ["mar", "Mar"],
  ["march", "Mar"],
  ["apr", "Apr"],
  ["april", "Apr"],
  ["may", "May"],
  ["jun", "Jun"],
  ["june", "Jun"],
  ["jul", "Jul"],
  ["july", "Jul"],
  ["aug", "Aug"],
  ["august", "Aug"],
  ["sep", "Sep"],
  ["sept", "Sep"],
  ["september", "Sep"],
  ["oct", "Oct"],
  ["october", "Oct"],
  ["nov", "Nov"],
  ["november", "Nov"],
  ["dec", "Dec"],
  ["december", "Dec"],
]);

const PLATFORM_BY_HOST: { pattern: RegExp; platform: string }[] = [
  { pattern: /(^|\.)leetcode\.com$/i, platform: "LeetCode" },
  { pattern: /(^|\.)hive\.smartinterviews\.in$/i, platform: "Smart Interviews" },
  { pattern: /(^|\.)smartinterviews\.in$/i, platform: "Smart Interviews" },
  { pattern: /(^|\.)hackerrank\.com$/i, platform: "HackerRank" },
  { pattern: /(^|\.)interviewbit\.com$/i, platform: "InterviewBit" },
];

const TOPIC_RULES: { pattern: RegExp; topics: string[] }[] = [
  { pattern: /\b(maximum xor|xor)\b/i, topics: ["Bit Manipulation", "Trie"] },
  { pattern: /\b(daily temperatures|next greater|histogram|monotonic)\b/i, topics: ["Stack", "Monotonic Stack"] },
  { pattern: /\b(n-queens|queens|backtracking)\b/i, topics: ["Backtracking"] },
  { pattern: /\b(kmp)\b/i, topics: ["Strings", "String Matching", "KMP"] },
  { pattern: /\b(rabin|karp)\b/i, topics: ["Strings", "String Matching", "Rabin-Karp"] },
  { pattern: /\b(subset|subsequence)\b/i, topics: ["Recursion", "Dynamic Programming"] },
  { pattern: /\b(linked list|lru cache)\b/i, topics: ["Linked List", "Data Structures"] },
  { pattern: /\b(trie|rhyming)\b/i, topics: ["Trie", "Strings"] },
  { pattern: /\b(binary search)\b/i, topics: ["Binary Search"] },
  { pattern: /\b(sliding window|window)\b/i, topics: ["Sliding Window"] },
  { pattern: /\b(prime|sieve)\b/i, topics: ["Number Theory", "Prime / Sieve"] },
  { pattern: /\b(game)\b/i, topics: ["Game Theory"] },
  { pattern: /\b(prefix sum)\b/i, topics: ["Prefix Sum", "Arrays"] },
  { pattern: /\b(array|subarray)\b/i, topics: ["Arrays"] },
  { pattern: /\b(string|substring|palindrome)\b/i, topics: ["Strings"] },
  { pattern: /\b(stack|parentheses)\b/i, topics: ["Stack"] },
  { pattern: /\b(queue|deque)\b/i, topics: ["Queue / Deque"] },
  { pattern: /\b(greedy)\b/i, topics: ["Greedy"] },
  { pattern: /\b(hash)\b/i, topics: ["Hashing"] },
  { pattern: /\b(dp|dynamic programming)\b/i, topics: ["Dynamic Programming"] },
];

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeTitle(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function normalizePlatform(value: string): string {
  const cleaned = value.trim();
  const normalized = cleaned.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (!cleaned) return "Unknown";
  if (normalized === "leetcode") return "LeetCode";
  if (normalized === "smartinterviews" || normalized === "hivesmartinterviews") return "Smart Interviews";
  if (normalized === "hackerrank") return "HackerRank";
  if (normalized === "interviewbit") return "InterviewBit";
  if (normalized === "unknown") return "Unknown";
  return cleaned;
}

export function detectPlatform(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./i, "");
    return PLATFORM_BY_HOST.find((entry) => entry.pattern.test(host))?.platform ?? "Unknown";
  } catch {
    return "Unknown";
  }
}

export function normalizeUrl(value: string): string {
  const parsed = new URL(value.trim());
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Please enter a valid HTTP/HTTPS URL.");
  }

  parsed.hash = "";
  const removablePrefixes = ["utm_", "fbclid", "gclid", "yclid"];
  for (const key of Array.from(parsed.searchParams.keys())) {
    if (removablePrefixes.some((prefix) => key.toLowerCase().startsWith(prefix))) {
      parsed.searchParams.delete(key);
    }
  }

  if (parsed.hostname.includes("leetcode.com") && parsed.pathname.startsWith("/problems/")) {
    const [, , slug] = parsed.pathname.split("/");
    parsed.pathname = `/problems/${slug}/`;
    parsed.search = "";
  }

  parsed.hostname = parsed.hostname.toLowerCase();
  return parsed.toString();
}

export function canonicalUrlKey(value: string): string {
  try {
    const parsed = new URL(normalizeUrl(value));
    parsed.search = "";
    parsed.hash = "";
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
    return parsed.toString().toLowerCase();
  } catch {
    return value.trim().toLowerCase();
  }
}

export function titleFromUrl(value: string): string {
  try {
    const parsed = new URL(value);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const problemIndex = parts.findIndex((part) => part.toLowerCase() === "problems");
    const slug = problemIndex >= 0 ? parts[problemIndex + 1] : parts[parts.length - 1];
    if (!slug) return "";
    return slug
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .replace(/\bXor\b/g, "XOR")
      .replace(/\bKmp\b/g, "KMP")
      .replace(/\bLru\b/g, "LRU");
  } catch {
    return "";
  }
}

export function normalizeLabDate(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  const match = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (!match) return "";
  const day = match[1].padStart(2, "0");
  const month = MONTHS.get(match[2].toLowerCase());
  const year = match[3];
  return month ? `${day} ${month} ${year}` : "";
}

export function normalizeTopics(rawTopics: string[], knownTopics: string[]): string[] {
  const known = new Map(knownTopics.map((topic) => [topic.toLowerCase(), topic]));
  const normalized: string[] = [];

  for (const raw of rawTopics) {
    const cleaned = raw.trim().replace(/\s+/g, " ");
    if (!cleaned) continue;
    const resolved = known.get(cleaned.toLowerCase()) ?? cleaned;
    if (!normalized.some((topic) => topic.toLowerCase() === resolved.toLowerCase())) {
      normalized.push(resolved);
    }
  }

  return normalized;
}

export function classifyTopics(source: string, knownTopics: string[]): string[] {
  const matches: string[] = [];
  for (const rule of TOPIC_RULES) {
    if (rule.pattern.test(source)) {
      matches.push(...rule.topics);
    }
  }
  return normalizeTopics(matches, knownTopics);
}

export function extractUrls(value: string): string[] {
  return Array.from(new Set((value.match(/https?:\/\/[^\s,]+/gi) ?? []).map((url) => url.trim())));
}

export function parseProblemText(value: string): Partial<Problem> {
  const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const urls = extractUrls(value);
  const labelled = (label: string) => {
    const line = lines.find((entry) => entry.toLowerCase().startsWith(`${label.toLowerCase()}:`));
    return line?.split(":").slice(1).join(":").trim() ?? "";
  };

  return {
    title: labelled("title") || lines.find((line) => !line.startsWith("http")) || "",
    url: labelled("url") || urls[0] || "",
    platform: labelled("platform") || "",
    topics: (labelled("topics") || labelled("topic"))
      .split(",")
      .map((topic) => topic.trim())
      .filter(Boolean),
    labDates: [labelled("lab date") || labelled("lab")].filter(Boolean),
  };
}

function createId(title: string, platform: string, existingIds: Set<string>): string {
  const base = slugify(title) || "imported-problem";
  const platformSlug = platform && platform !== "Unknown" ? slugify(platform) : "";
  const candidates = [base, platformSlug ? `${base}-${platformSlug}` : ""].filter(Boolean);
  for (const candidate of candidates) {
    if (!existingIds.has(candidate)) return candidate;
  }
  let i = 2;
  while (existingIds.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

function titleSimilarity(a: string, b: string): number {
  const left = new Set(normalizeTitle(a).split(/\s+/).filter(Boolean));
  const right = new Set(normalizeTitle(b).split(/\s+/).filter(Boolean));
  if (left.size === 0 || right.size === 0) return 0;
  const intersection = Array.from(left).filter((token) => right.has(token)).length;
  return intersection / Math.max(left.size, right.size);
}

export function buildImportCandidate(
  input: Partial<Problem>,
  labDateInput: string,
  existingProblems: Problem[],
  knownTopics: string[]
): DatasetImportCandidate {
  const messages: string[] = [];
  const existingIds = new Set(existingProblems.map((problem) => problem.id));
  const normalizedLab = normalizeLabDate(input.labDates?.[0] || labDateInput);
  const rawUrl = input.url?.trim() ?? "";
  let url = rawUrl;
  let urlValid = false;

  try {
    url = normalizeUrl(rawUrl);
    urlValid = true;
  } catch {
    messages.push("Please enter a valid HTTP/HTTPS URL.");
  }

  const title = (input.title?.trim() || titleFromUrl(url)).replace(/\s+/g, " ");
  const platform = normalizePlatform(input.platform || (urlValid ? detectPlatform(url) : ""));
  const topics = normalizeTopics(input.topics ?? [], knownTopics);
  const classifiedTopics = topics.length > 0 ? topics : classifyTopics(`${title} ${url}`, knownTopics);
  const canonical = urlValid ? canonicalUrlKey(url) : "";

  if (!title) messages.push("Problem title could not be determined. Please enter it manually.");
  if (!normalizedLab) messages.push("Lab date is required.");
  if (classifiedTopics.length === 0) messages.push("Topic needs review.");
  if (platform === "Unknown") messages.push("Platform needs review.");

  const byUrl = canonical
    ? existingProblems.find((problem) => canonicalUrlKey(problem.url) === canonical)
    : undefined;
  const byPlatformTitle = existingProblems.find(
    (problem) =>
      normalizePlatform(problem.platform) === platform &&
      normalizeTitle(problem.title) === normalizeTitle(title)
  );
  const byTitle = existingProblems.find((problem) => normalizeTitle(problem.title) === normalizeTitle(title));
  const possible = existingProblems.find((problem) => titleSimilarity(problem.title, title) >= 0.75);
  const existing = byUrl ?? byPlatformTitle ?? byTitle;
  const alreadyHasLab = existing?.labDates.includes(normalizedLab);

  let action: DatasetImportCandidate["action"] = "new";
  if (messages.some((message) => message.includes("valid HTTP/HTTPS") || message.includes("title") || message.includes("Lab date"))) {
    action = "invalid";
  } else if (existing && alreadyHasLab) {
    action = "already-exists";
    messages.push("This problem is already assigned to this lab date.");
  } else if (existing) {
    action = "add-lab-date";
    messages.push("Existing problem found. Import will add the lab date only.");
  } else if (possible) {
    action = "possible-duplicate";
    messages.push(`Possible duplicate: ${possible.title}. Review before importing as new.`);
  } else if (classifiedTopics.length === 0 || platform === "Unknown") {
    action = "invalid";
  }

  const id = existing?.id ?? createId(title, platform, existingIds);

  return {
    id,
    title,
    url,
    platform,
    topics: classifiedTopics,
    labDates: normalizedLab ? [normalizedLab] : [],
    selected: action === "new" || action === "add-lab-date",
    action,
    confidence: messages.length === 0 ? "high" : action === "possible-duplicate" ? "low" : "needs-review",
    existingProblemId: existing?.id,
    messages,
  };
}

export function countLabAssignments(problems: Problem[]): number {
  return problems.reduce((total, problem) => total + problem.labDates.length, 0);
}
