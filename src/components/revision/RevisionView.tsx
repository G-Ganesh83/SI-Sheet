import React from "react";
import { useTracker } from "../../context/useTracker";
import { useAuth } from "../../context/useAuth";
import { ProblemRow } from "../problems/ProblemRow";
import { RotateCcw, LogIn } from "lucide-react";

export const RevisionView: React.FC = () => {
  const { revisionProblems, setActiveTab } = useTracker();
  const { user, showAuthPrompt } = useAuth();

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="view-title-row">
          <h1 className="view-title">Revision Queue</h1>
          {user ? (
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
          ) : (
            <div
              style={{
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                color: "var(--text-muted)",
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-subtle)",
                padding: "4px 10px",
                borderRadius: "var(--radius-sm)",
              }}
            >
              Personal Tracking
            </div>
          )}
        </div>
        <p className="view-subtitle">
          Problems flagged for conceptual re-evaluation, alternative approaches, or interview drills
        </p>
      </div>

      {!user ? (
        <div
          className="empty-state"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            marginTop: 8,
            padding: "36px 20px",
          }}
        >
          <RotateCcw size={28} className="empty-state-icon" style={{ color: "var(--revision-color)" }} />
          <h3 className="empty-state-title">Sign in to track revision problems</h3>
          <p className="empty-state-desc">
            Flag tricky edge cases or alternate approaches to revisit them anytime. Sign in to start your personal revision queue.
          </p>
          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: 8 }}
            onClick={showAuthPrompt}
          >
            <LogIn size={13} />
            <span>Sign In with Google</span>
          </button>
        </div>
      ) : revisionProblems.length > 0 ? (
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
            padding: "36px 20px",
          }}
        >
          <RotateCcw size={28} className="empty-state-icon" style={{ color: "var(--revision-color)" }} />
          <h3 className="empty-state-title">No problems marked for revision.</h3>
          <p className="empty-state-desc">
            Check the revision box on any problem to build your custom interview preparation queue.
          </p>
          <button
            type="button"
            className="btn-secondary"
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
