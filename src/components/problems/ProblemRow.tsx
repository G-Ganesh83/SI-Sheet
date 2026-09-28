import React, { useState, useCallback } from "react";
import type { Problem, ProblemStatus } from "../../types/tracker";
import { useTracker } from "../../context/useTracker";
import { useAuth } from "../../context/useAuth";
import { StatusBadge } from "../common/StatusBadge";
import { RevisionCheckbox } from "../common/RevisionCheckbox";
import { NotesModal } from "../common/NotesPopover";
import { ExternalLink, FileEdit, FileText } from "lucide-react";

interface ProblemRowProps {
  problem: Problem;
}

export const ProblemRow: React.FC<ProblemRowProps> = ({ problem }) => {
  const {
    getProgress,
    updateStatus,
    toggleRevision,
    saveNotes,
    setSelectedProblemId,
    selectTopicFilter,
    selectLabFilter,
  } = useTracker();
  const { user, showAuthPrompt } = useAuth();

  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const progress = getProgress(problem.id);
  const hasNotes = Boolean(progress.notes && progress.notes.trim().length > 0);

  /** Wrap personal action handlers to prompt sign-in when anonymous */
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
    <>
      <tr className="problem-row">
        {/* Status Column */}
        <td className="cell-status">
          <StatusBadge
            status={progress.status}
            onChange={requireAuth((s: ProblemStatus) => updateStatus(problem.id, s))}
          />
        </td>

        {/* Problem Title & Platform */}
        <td className="cell-title">
          <div className="problem-title-cell">
            <button
              type="button"
              className="problem-title-link"
              onClick={() => setSelectedProblemId(problem.id)}
              title="View problem details and notes"
              aria-label={`View details and notes for ${problem.title}`}
            >
              {problem.title}
            </button>
            <span className={`platform-badge ${getPlatformClass(problem.platform)}`}>
              {problem.platform}
            </span>
          </div>
        </td>

        {/* Algorithmic Topics */}
        <td className="cell-topics">
          <div className="tags-container">
            {problem.topics.map((t) => (
              <button
                key={t}
                type="button"
                className="topic-tag"
                onClick={() => selectTopicFilter(t)}
                title={`Filter by ${t}`}
              >
                {t}
              </button>
            ))}
          </div>
        </td>

        {/* Lab Dates */}
        <td className="cell-labs">
          <div className="tags-container">
            {problem.labDates.map((date) => (
              <button
                key={date}
                type="button"
                className="lab-date-tag"
                onClick={() => selectLabFilter(date)}
                title={`Filter by lab date: ${date}`}
              >
                {date}
              </button>
            ))}
          </div>
        </td>

        {/* Revision Toggle */}
        <td className="cell-revision" style={{ textAlign: "center" }}>
          <RevisionCheckbox
            checked={progress.revision}
            onChange={requireAuth(() => toggleRevision(problem.id))}
            compact={true}
          />
        </td>

        {/* Notes Action */}
        <td className="cell-notes" style={{ textAlign: "center" }}>
          <button
            type="button"
            className={`btn-notes-compact ${hasNotes ? "has-notes" : ""}`}
            onClick={() => {
              if (!user) {
                showAuthPrompt();
                return;
              }
              setIsNotesOpen(true);
            }}
            title={hasNotes ? "Edit notes (Notes exist)" : "Add notes"}
            aria-label={hasNotes ? `Edit notes for ${problem.title}` : `Add notes for ${problem.title}`}
          >
            {hasNotes ? (
              <>
                <FileText size={12} className="notes-icon-active" />
                <span className="notes-text">Notes</span>
              </>
            ) : (
              <>
                <FileEdit size={12} />
                <span className="notes-text">Notes</span>
              </>
            )}
          </button>
        </td>

        {/* External Link */}
        <td className="cell-open" style={{ textAlign: "right" }}>
          <a
            href={problem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-icon"
            title={`Open problem on ${problem.platform} in new tab`}
            aria-label={`Open ${problem.title} on ${problem.platform} (opens in new tab)`}
          >
            <ExternalLink size={13} />
          </a>
        </td>
      </tr>

      {/* Inline Notes Modal */}
      <NotesModal
        key={`${problem.id}:${progress.updatedAt ?? "never"}:${isNotesOpen ? "open" : "closed"}`}
        problemTitle={problem.title}
        initialNotes={progress.notes}
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        onSave={requireAuth((newNotes) => saveNotes(problem.id, newNotes))}
      />
    </>
  );
};
