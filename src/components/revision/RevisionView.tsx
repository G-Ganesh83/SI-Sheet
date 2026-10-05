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
          <div className="view-title-group">
            <h1 className="view-title">Revision Queue</h1>
            {user ? (
              <div className="revision-pill-badge">
                <RotateCcw size={11} />
                <span>
                  {revisionProblems.length} {revisionProblems.length === 1 ? "problem" : "problems"} marked
                </span>
              </div>
            ) : (
              <div className="revision-pill-badge muted">
                <span>Personal Tracking</span>
              </div>
            )}
          </div>
        </div>
        <p className="view-subtitle">
          These are the problems I specifically want to revisit — flagged for conceptual re-evaluation, alternative approaches, or interview drills
        </p>
      </div>

      {!user ? (
        <div className="empty-state empty-state-card">
          <div className="empty-state-icon-box revision-accent">
            <RotateCcw size={18} />
          </div>
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
        <div className="empty-state empty-state-card">
          <div className="empty-state-icon-box revision-accent">
            <RotateCcw size={18} />
          </div>
          <h3 className="empty-state-title">No problems marked for revision</h3>
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
