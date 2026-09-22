import React from "react";
import { useTracker } from "../../context/useTracker";
import { ProblemRow } from "../problems/ProblemRow";
import { RotateCcw } from "lucide-react";

export const RevisionView: React.FC = () => {
  const { revisionProblems, setActiveTab } = useTracker();

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="view-title-row">
          <h1 className="view-title">Revision Queue</h1>
          <div
            style={{
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              color: "var(--revision-color)",
              background: "var(--revision-bg)",
              border: "1px solid var(--revision-border)",
              padding: "4px 10px",
              borderRadius: "var(--radius-sm)",
            }}
          >
            {revisionProblems.length} {revisionProblems.length === 1 ? "problem" : "problems"} marked for revision
          </div>
        </div>
        <p className="view-subtitle">
          Problems flagged for conceptual re-evaluation, alternative approaches, or interview drills
        </p>
      </div>

      {revisionProblems.length > 0 ? (
        <div className="problem-table-container">
          <table className="problem-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Problem</th>
                <th>Topics</th>
                <th>Lab Dates</th>
                <th>Revision</th>
                <th>Notes</th>
                <th style={{ textAlign: "right" }}>Open</th>
              </tr>
            </thead>
            <tbody>
              {revisionProblems.map((problem) => (
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
          <RotateCcw size={32} className="empty-state-icon" style={{ color: "var(--revision-color)" }} />
          <h3 className="empty-state-title">No revision problems yet</h3>
          <p className="empty-state-desc">
            Mark problems for revision whenever you want to revisit tricky edge cases, alternate trie/bitmask solutions, or optimize complexity.
          </p>
          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: 8 }}
            onClick={() => setActiveTab("problems")}
          >
            Explore Problems
          </button>
        </div>
      )}
    </div>
  );
};
