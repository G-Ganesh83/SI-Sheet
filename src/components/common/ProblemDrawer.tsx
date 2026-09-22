import React, { useState, useEffect } from "react";
import { useTracker } from "../../context/useTracker";
import { StatusBadge } from "./StatusBadge";
import { RevisionCheckbox } from "./RevisionCheckbox";
import { ExternalLink, X, Calendar, Tag, FileText, Check } from "lucide-react";

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

  const problem = problems.find((p) => p.id === selectedProblemId);
  const progress = selectedProblemId ? getProgress(selectedProblemId) : null;

  const [notes, setNotes] = useState("");
  const [isSaved, setIsSaved] = useState(false);

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

  if (!problem || !progress) return null;

  const handleSaveNotes = () => {
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
        <div className="drawer-header">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, paddingRight: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className={`platform-badge ${getPlatformClass(problem.platform)}`}>
                {problem.platform}
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                ID: {problem.id}
              </span>
            </div>
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>
              {problem.title}
            </h2>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setSelectedProblemId(null)}
            aria-label="Close inspector drawer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          {/* Status & Quick Action row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              backgroundColor: "var(--bg-app)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                Status
              </span>
              <StatusBadge status={progress.status} onChange={(s) => updateStatus(problem.id, s)} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                Revision
              </span>
              <RevisionCheckbox checked={progress.revision} onChange={() => toggleRevision(problem.id)} label="Need Revision" />
            </div>
          </div>

          {/* External Problem Link button */}
          <a
            href={problem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ width: "100%", padding: "10px 14px", textDecoration: "none" }}
          >
            <span>Open Problem on {problem.platform}</span>
            <ExternalLink size={14} />
          </a>

          {/* Topics */}
          <div className="drawer-section">
            <div className="drawer-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Tag size={12} />
              <span>Algorithmic Topics</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
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
            <div className="drawer-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Calendar size={12} />
              <span>Assigned Lab Sessions</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
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
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: 2 }}>
                ℹ️ Assigned across multiple lab dates; deduplicated as one unique tracking item.
              </p>
            )}
          </div>

          {/* Notes Section */}
          <div className="drawer-section" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <div className="drawer-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <FileText size={12} />
                <span>Personal Notes</span>
              </div>
              {isSaved && (
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--status-completed)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Check size={12} /> Saved
                </span>
              )}
            </div>
            <textarea
              className="notes-textarea"
              style={{ flex: 1, minHeight: "140px" }}
              placeholder="Record your solution intuition, complexity (O(N) / O(1)), edge cases to remember..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <button type="button" className="btn-secondary" onClick={handleSaveNotes}>
                <Check size={13} />
                <span>Save Notes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
