import React, { useMemo } from "react";
import { useTracker } from "../../context/useTracker";
import { FilterBar } from "./FilterBar";
import { ProblemRow } from "./ProblemRow";
import type { Problem } from "../../types/tracker";
import { SearchX } from "lucide-react";

export const ProblemsView: React.FC = () => {
  const { problems, getProgress, filters, resetFilters, totalProblems, completedCount, allLabDates } =
    useTracker();

  // Filter and sort problems
  const filteredProblems = useMemo(() => {
    return problems
      .filter((p) => {
        const progress = getProgress(p.id);

        // 1. Search Query filter (matches title, topics, platform, lab dates)
        if (filters.search.trim()) {
          const q = filters.search.toLowerCase().trim();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchTopic = p.topics.some((t) => t.toLowerCase().includes(q));
          const matchPlatform = p.platform.toLowerCase().includes(q);
          const matchLab = p.labDates.some((d) => d.toLowerCase().includes(q));
          if (!matchTitle && !matchTopic && !matchPlatform && !matchLab) {
            return false;
          }
        }

        // 2. Status filter
        if (filters.status !== "all" && progress.status !== filters.status) {
          return false;
        }

        // 3. Revision filter
        if (filters.revision === "needs-revision" && !progress.revision) {
          return false;
        }
        if (filters.revision === "no-revision" && progress.revision) {
          return false;
        }

        // 4. Topic filter
        if (filters.topic !== "all" && !p.topics.includes(filters.topic)) {
          return false;
        }

        // 5. Lab Date filter
        if (filters.labDate !== "all" && !p.labDates.includes(filters.labDate)) {
          return false;
        }

        // 6. Platform filter
        if (filters.platform !== "all" && p.platform !== filters.platform) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sorting strategy
        switch (filters.sortBy) {
          case "name-asc":
            return a.title.localeCompare(b.title);
          case "name-desc":
            return b.title.localeCompare(a.title);
          case "date-desc": {
            const dateAIdx = allLabDates.indexOf(a.labDates[0] || "");
            const dateBIdx = allLabDates.indexOf(b.labDates[0] || "");
            return dateBIdx - dateAIdx;
          }
          case "status": {
            const statusOrder = { completed: 0, "in-progress": 1, "not-started": 2 };
            const progA = getProgress(a.id).status;
            const progB = getProgress(b.id).status;
            return statusOrder[progA] - statusOrder[progB];
          }
          case "topic":
            return (a.topics[0] || "").localeCompare(b.topics[0] || "") || a.title.localeCompare(b.title);
          case "platform":
            return a.platform.localeCompare(b.platform);
          case "date-asc":
          default: {
            const dateAIdx = allLabDates.indexOf(a.labDates[0] || "");
            const dateBIdx = allLabDates.indexOf(b.labDates[0] || "");
            if (dateAIdx !== dateBIdx) return dateAIdx - dateBIdx;
            return a.title.localeCompare(b.title);
          }
        }
      });
  }, [problems, getProgress, filters, allLabDates]);

  const isFiltered = filteredProblems.length !== totalProblems;
  const countLabel = isFiltered
    ? `${filteredProblems.length} of ${totalProblems} problems`
    : `${totalProblems} problems`;

  return (
    <div className="view-container">
      {/* View Header */}
      <div className="view-header">
        <div className="view-title-row">
          <h1 className="view-title">Problems</h1>
          <div className="result-count-badge">
            <span>{countLabel}</span>
            {completedCount > 0 && (
              <span className="result-count-completed">
                · {completedCount} completed
              </span>
            )}
          </div>
        </div>
        <p className="view-subtitle">
          All Smart Interviews and LeetCode problems curated across scheduled labs
        </p>
      </div>

      {/* Filter and Search Bar */}
      <FilterBar />

      {/* Problem Table / List */}
      {filteredProblems.length > 0 ? (
        <div className="problem-table-container">
          <table className="problem-table">
            <thead>
              <tr>
                <th style={{ width: "130px" }}>Status</th>
                <th>Problem</th>
                <th style={{ minWidth: "160px" }}>Topics</th>
                <th style={{ width: "130px" }}>Lab Dates</th>
                <th style={{ width: "80px", textAlign: "center" }}>Revision</th>
                <th style={{ width: "80px", textAlign: "center" }}>Notes</th>
                <th style={{ width: "50px", textAlign: "right" }}>Open</th>
              </tr>
            </thead>
            <tbody>
              {filteredProblems.map((problem: Problem) => (
                <ProblemRow key={problem.id} problem={problem} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className="empty-state"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            marginTop: 8,
          }}
        >
          <SearchX size={32} className="empty-state-icon" />
          <h3 className="empty-state-title">No problems found</h3>
          <p className="empty-state-desc">
            No problems match your current search and filter settings. Try adjusting or clearing your filters.
          </p>
          <button
            type="button"
            className="btn-secondary"
            style={{ marginTop: 8 }}
            onClick={resetFilters}
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
};
