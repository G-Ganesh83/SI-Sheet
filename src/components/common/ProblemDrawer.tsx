import React, { useState, useEffect, useCallback } from "react";
import { useTracker } from "../../context/useTracker";
import { useAuth } from "../../context/useAuth";
import { StatusBadge } from "./StatusBadge";
import { RevisionCheckbox } from "./RevisionCheckbox";
import { ExternalLink, X, Calendar, Tag, FileText, Check, Lock, Pencil } from "lucide-react";
import { EditProblemModal } from "../admin/EditProblemModal";

export const ProblemDrawer: React.FC = () => {
  const {
    selectedProblemId,
    setSelectedProblemId,
    problems,
    getProgress,
    updateStatus,
    toggleRevision,
    saveNotes,
    selectTopicFilter,
    selectLabFilter,
  } = useTracker();
  const { user, profile, showAuthPrompt } = useAuth();
  const isAdmin = profile?.role === "admin";

  const problem = problems.find((p) => p.id === selectedProblemId);
  const progress = selectedProblemId ? getProgress(selectedProblemId) : null;

  const [notes, setNotes] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    // Only reset the local draft when a DIFFERENT problem is opened.
    // Do NOT depend on progress?.notes — that would wipe unsaved edits
    // every time the stored notes change (e.g. after saving).
    if (progress) {
      setNotes(progress.notes || "");
      setIsSaved(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProblemId]);

  useEffect(() => {
    if (!selectedProblemId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedProblemId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedProblemId, setSelectedProblemId]);

  /** Wrap a personal-action handler: if no session, show auth prompt instead. */
  const requireAuth = useCallback(
    <T extends unknown[]>(fn: (...args: T) => void) =>
      (...args: T) => {
        if (!user) {
          showAuthPrompt();
          return;
        }
        fn(...args);
      },
    [user, showAuthPrompt]
  );

  if (!problem || !progress) return null;

  const handleSaveNotes = () => {
    if (!user) {
      showAuthPrompt();
      return;
    }
    saveNotes(problem.id, notes);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };


  const getPlatformClass = (platform: string) => {
    switch (platform) {
      case "LeetCode":
        return "leetcode";
      case "InterviewBit":
        return "interviewbit";
      case "HackerRank":
        return "hackerrank";
      case "Smart Interviews":
      default:
        return "smart";
    }
  };

  return (
    <div className="drawer-overlay" onClick={() => setSelectedProblemId(null)}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-handle" />
        <div className="drawer-header">
          <div className="drawer-header-content">
            <div className="drawer-meta-row">
              <span className={`platform-badge ${getPlatformClass(problem.platform)}`}>
                {problem.platform}
              </span>
              <span className="drawer-problem-id">
                ID: {problem.id}
              </span>
              {isAdmin && (
                <button
                  type="button"
                  className="btn-secondary drawer-edit-btn"
                  onClick={() => setIsEditOpen(true)}
                  title={`Edit ${problem.title}`}
                >
                  <Pencil size={11} />
                  <span>Edit</span>
                </button>
              )}
            </div>
            <h2 className="drawer-title">
              {problem.title}
            </h2>
          </div>
          <button
            type="button"
            className="btn-icon drawer-close-btn"
            onClick={() => setSelectedProblemId(null)}
            aria-label="Close inspector drawer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="drawer-body">
          {/* Status & Revision Row */}
          <div className="drawer-status-card">
            <div className="drawer-status-col">
              <span className="drawer-status-label">Status</span>
              <StatusBadge
                status={progress.status}
                onChange={requireAuth((s) => updateStatus(problem.id, s))}
              />
            </div>

            <div className="drawer-status-col right">
              <span className="drawer-status-label">Revision</span>
              <RevisionCheckbox
                checked={progress.revision}
                onChange={requireAuth(() => toggleRevision(problem.id))}
                label="Need Revision"
              />
            </div>
          </div>

          {/* External Problem Link button */}
          <a
            href={problem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary drawer-link-btn"
          >
            <span>Open Problem on {problem.platform}</span>
            <ExternalLink size={13} />
          </a>

          {/* Topics */}
          <div className="drawer-section">
            <div className="drawer-label">
              <Tag size={12} />
              <span>Algorithmic Topics</span>
            </div>
            <div className="drawer-tags-wrap">
              {problem.topics.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="topic-tag"
                  onClick={() => {
                    setSelectedProblemId(null);
                    selectTopicFilter(t);
                  }}
                  title={`Filter by ${t}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Lab Dates */}
          <div className="drawer-section">
            <div className="drawer-label">
              <Calendar size={12} />
              <span>Assigned Lab Sessions</span>
            </div>
            <div className="drawer-tags-wrap">
              {problem.labDates.map((date) => (
                <button
                  key={date}
                  type="button"
                  className="lab-date-tag"
                  onClick={() => {
                    setSelectedProblemId(null);
                    selectLabFilter(date);
                  }}
                  title={`Filter by lab: ${date}`}
                >
                  {date}
                </button>
              ))}
            </div>
            {problem.labDates.length > 1 && (
              <p className="drawer-subnote">
                Assigned across multiple lab dates; tracked as a single problem.
              </p>
            )}
          </div>

          {/* Notes Section */}
          <div className="drawer-section drawer-notes-section">
            <div className="drawer-notes-header">
              <div className="drawer-label">
                <FileText size={12} />
                <span>Personal Notes</span>
              </div>
              {isSaved && (
                <span className="drawer-notes-saved">
                  <Check size={12} /> Saved
                </span>
              )}
            </div>
            {!user ? (
              <button
                type="button"
                className="auth-notes-gate"
                onClick={showAuthPrompt}
                aria-label="Sign in to save notes"
              >
                <Lock size={14} className="auth-notes-gate-icon" />
                <span>Sign in to save personal notes</span>
              </button>
            ) : (
              <>
                <textarea
                  className="notes-textarea drawer-textarea"
                  placeholder="Record your solution intuition, complexity (O(N) / O(1)), edge cases to remember..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <div className="drawer-notes-footer">
                  <button type="button" className="btn-secondary" onClick={handleSaveNotes}>
                    <Check size={13} />
                    <span>Save Notes</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Admin Edit Problem Modal */}
      {isAdmin && isEditOpen && (
        <EditProblemModal
          problem={problem}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
        />
      )}
    </div>
  );
};
