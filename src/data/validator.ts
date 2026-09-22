import type { Problem } from "../types/tracker";
import { canonicalUrlKey } from "./importer";
import { PROBLEMS } from "./problems";

export interface ValidationIssue {
  type: "error" | "warning";
  problemId?: string;
  field?: string;
  message: string;
}

export interface ValidationReport {
  isValid: boolean;
  totalUniqueProblems: number;
  totalLabAssignments: number;
  issues: ValidationIssue[];
  topicsCount: number;
  labDatesCount: number;
}

/**
 * Validates the DSA Problem dataset for consistency, uniqueness, and completeness.
 */
export function validateProblemDataset(problems: Problem[] = PROBLEMS): ValidationReport {
  const issues: ValidationIssue[] = [];
  const seenIds = new Set<string>();
  const seenUrls = new Map<string, string>(); // url -> id
  const seenTitles = new Map<string, string>(); // title -> id
  const labDateSet = new Set(problems.flatMap((p) => p.labDates || []));

  let totalLabAssignments = 0;
  const allTopics = new Set<string>();

  for (let i = 0; i < problems.length; i++) {
    const p = problems[i];
    const prefix = `[Problem #${i + 1} "${p.title || "UNTITLED"}"]`;

    // 1. ID Check
    if (!p.id || typeof p.id !== "string" || p.id.trim() === "") {
      issues.push({
        type: "error",
        field: "id",
        message: `${prefix} Missing or empty problem ID.`,
      });
    } else {
      if (seenIds.has(p.id)) {
        issues.push({
          type: "error",
          problemId: p.id,
          field: "id",
          message: `${prefix} Duplicate ID detected: "${p.id}". IDs must be strictly unique.`,
        });
      }
      seenIds.add(p.id);
    }

    // 2. Title Check
    if (!p.title || typeof p.title !== "string" || p.title.trim() === "") {
      issues.push({
        type: "error",
        problemId: p.id,
        field: "title",
        message: `${prefix} Missing or empty problem title.`,
      });
    } else {
      const normalizedTitle = p.title.trim().toLowerCase();
      if (seenTitles.has(normalizedTitle)) {
        issues.push({
          type: "error",
          problemId: p.id,
          field: "title",
          message: `${prefix} Duplicate problem title detected: "${p.title}" duplicates "${seenTitles.get(normalizedTitle)}". Did deduplication fail?`,
        });
      } else {
        seenTitles.set(normalizedTitle, p.id);
      }
    }

    // 3. URL Check
    if (!p.url || typeof p.url !== "string" || !p.url.startsWith("http")) {
      issues.push({
        type: "error",
        problemId: p.id,
        field: "url",
        message: `${prefix} Invalid or missing URL: "${p.url}".`,
      });
    } else {
      const normalizedUrl = canonicalUrlKey(p.url);
      if (seenUrls.has(normalizedUrl)) {
        issues.push({
          type: "error",
          problemId: p.id,
          field: "url",
          message: `${prefix} Duplicate URL detected: "${p.url}" already belongs to "${seenUrls.get(normalizedUrl)}".`,
        });
      } else {
        seenUrls.set(normalizedUrl, p.id);
      }
    }

    // 4. Topics Check
    if (!Array.isArray(p.topics) || p.topics.length === 0) {
      issues.push({
        type: "error",
        problemId: p.id,
        field: "topics",
        message: `${prefix} Every problem must have at least one topic.`,
      });
    } else {
      p.topics.forEach((topic) => {
        if (!topic || topic.trim() === "") {
          issues.push({
            type: "error",
            problemId: p.id,
            field: "topics",
            message: `${prefix} Contains blank topic string.`,
          });
        } else {
          allTopics.add(topic);
        }
      });
    }

    // 5. Lab Dates Check
    if (!Array.isArray(p.labDates) || p.labDates.length === 0) {
      issues.push({
        type: "error",
        problemId: p.id,
        field: "labDates",
        message: `${prefix} Every problem must have at least one lab date.`,
      });
    } else {
      totalLabAssignments += p.labDates.length;
      p.labDates.forEach((date) => {
        if (!labDateSet.has(date)) {
          issues.push({
            type: "warning",
            problemId: p.id,
            field: "labDates",
            message: `${prefix} Lab date "${date}" is not in LAB_DATES master list.`,
          });
        }
      });
    }

    // 6. Platform Check
    if (!p.platform || typeof p.platform !== "string" || p.platform.trim() === "") {
      issues.push({
        type: "error",
        problemId: p.id,
        field: "platform",
        message: `${prefix} Platform is required.`,
      });
    }
  }

  const isValid = issues.filter((i) => i.type === "error").length === 0;

  return {
    isValid,
    totalUniqueProblems: problems.length,
    totalLabAssignments,
    issues,
    topicsCount: allTopics.size,
    labDatesCount: labDateSet.size,
  };
}

/**
 * Runs dataset validation in dev mode and outputs a formatted console report.
 */
export function runDevDatasetValidation(): ValidationReport {
  const report = validateProblemDataset();
  if (!report.isValid) {
    console.error(
      "❌ [DSA Tracker Dataset Validation FAILED]:",
      report.issues.filter((i) => i.type === "error")
    );
  } else {
    console.log(
      `✅ [DSA Tracker Dataset Validated]: ${report.totalUniqueProblems} unique problems, ${report.totalLabAssignments} lab assignments across ${report.labDatesCount} labs, ${report.topicsCount} topics.`
    );
  }
  return report;
}
