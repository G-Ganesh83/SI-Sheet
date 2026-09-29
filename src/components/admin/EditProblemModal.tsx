import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Pencil, X, AlertCircle, Loader2 } from "lucide-react";
import type { Problem } from "../../types/tracker";
import { resolveDbProblemId } from "../../services/progressService";
import { adminEditProblem } from "../../services/adminEditService";
import { useTracker } from "../../context/useTracker";

interface EditProblemModalProps {
  problem: Problem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PLATFORM_OPTIONS = ["LeetCode", "Smart Interviews", "InterviewBit", "HackerRank"];

interface EditProblemModalInnerProps {
  problem: Problem;
  onClose: () => void;
  onSuccess?: () => void;
}

const EditProblemModalInner: React.FC<EditProblemModalInnerProps> = ({
  problem,
  onClose,
  onSuccess,
}) => {
  const { refreshImportedProblems, showToast } = useTracker();

  const [title, setTitle] = useState(problem.title);
  const [url, setUrl] = useState(problem.url);
  const [platform, setPlatform] = useState(problem.platform || "LeetCode");
  const [topicsInput, setTopicsInput] = useState(problem.topics.join(", "));
  const [labDatesInput, setLabDatesInput] = useState(problem.labDates.join(", "));
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedTitle = title.trim();
    const trimmedUrl = url.trim();
    const trimmedPlatform = platform.trim();

    if (!trimmedTitle) {
      setErrorMessage("Problem title cannot be empty.");
      return;
    }

    if (!trimmedUrl) {
      setErrorMessage("Problem URL cannot be empty.");
      return;
    }

    if (!/^https?:\/\/[^\s]+$/i.test(trimmedUrl)) {
      setErrorMessage("Please enter a valid HTTP/HTTPS URL.");
      return;
    }

    if (!trimmedPlatform) {
      setErrorMessage("Please select or enter a platform.");
      return;
    }

    const topics = topicsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const labDates = labDatesInput
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);

    if (labDates.length === 0) {
      setErrorMessage("At least one lab date assignment is required (e.g. '21 Sep 2026').");
      return;
    }

    setIsSaving(true);
    try {
      // Resolve the actual database UUID to guarantee uuid-preservation
      const dbProblemId = await resolveDbProblemId(problem.id, problem.url, problem.title);

      await adminEditProblem({
        problemId: dbProblemId || undefined,
        originalUrl: problem.url,
        title: trimmedTitle,
        url: trimmedUrl,
        platform: trimmedPlatform,
        topics,
        labDates,
      });

      // Refresh catalog in memory
      await refreshImportedProblems();

      showToast("Problem updated successfully.", "success");
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div
      className="modal-overlay"
      onClick={() => {
        if (!isSaving) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-problem-dialog-title"
    >
      <div
        className="confirm-dialog"
        style={{ maxWidth: "480px", width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="confirm-dialog-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Pencil size={15} style={{ color: "var(--accent-text)" }} />
            <span id="edit-problem-dialog-title" className="confirm-dialog-title">
              Edit Catalog Problem
            </span>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close dialog"
          >
            <X size={15} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: 1 }}>
          <div
            className="confirm-dialog-body"
            style={{
              overflowY: "auto",
              padding: "16px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {errorMessage && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.35)",
                  color: "#ef4444",
                  fontSize: "12px",
                  lineHeight: 1.4,
                }}
                role="alert"
              >
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Title */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Title
              </label>
              <input
                type="text"
                className="search-input"
                style={{ height: "34px", padding: "0 10px" }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Problem title"
                disabled={isSaving}
                required
              />
            </div>

            {/* URL */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Problem URL
              </label>
              <input
                type="url"
                className="search-input"
                style={{ height: "34px", padding: "0 10px" }}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://leetcode.com/problems/..."
                disabled={isSaving}
                required
              />
            </div>

            {/* Platform */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Platform
              </label>
              <select
                className="filter-select"
                style={{ height: "34px", width: "100%", paddingLeft: "10px" }}
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                disabled={isSaving}
              >
                {PLATFORM_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
                {!PLATFORM_OPTIONS.includes(platform) && platform && (
                  <option value={platform}>{platform}</option>
                )}
              </select>
            </div>

            {/* Topics */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Topics (comma-separated)
              </label>
              <input
                type="text"
                className="search-input"
                style={{ height: "34px", padding: "0 10px" }}
                value={topicsInput}
                onChange={(e) => setTopicsInput(e.target.value)}
                placeholder="Arrays, Binary Search, Dynamic Programming"
                disabled={isSaving}
              />
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Add or remove topics separated by commas. Existing topics will be linked and removed topics unlinked.
              </span>
            </div>

            {/* Lab Dates */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Lab Dates (comma-separated)
              </label>
              <input
                type="text"
                className="search-input"
                style={{ height: "34px", padding: "0 10px" }}
                value={labDatesInput}
                onChange={(e) => setLabDatesInput(e.target.value)}
                placeholder="21 Sep 2026, 04 Aug 2026"
                disabled={isSaving}
                required
              />
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Format: <code style={{ fontFamily: "var(--font-mono)" }}>DD Mon YYYY</code> (e.g. 21 Sep 2026). At least one date required.
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="confirm-dialog-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSaving}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              {isSaving && <Loader2 size={13} className="animate-spin" />}
              <span>{isSaving ? "Saving Changes..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export const EditProblemModal: React.FC<EditProblemModalProps> = ({
  problem,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !problem) return null;

  return (
    <EditProblemModalInner
      key={`${problem.id}:${problem.title}:${problem.url}:${problem.platform}`}
      problem={problem}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};
