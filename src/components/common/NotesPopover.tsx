import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FileText, X, Check } from "lucide-react";

interface NotesPopoverProps {
  problemTitle: string;
  initialNotes: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (notes: string) => void;
}

export const NotesModal: React.FC<NotesPopoverProps> = ({
  problemTitle,
  initialNotes,
  isOpen,
  onClose,
  onSave,
}) => {
  const [text, setText] = useState(initialNotes);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(text);
    onClose();
  };

  return createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notes-title"
    >
      <div className="notes-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="notes-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={15} style={{ color: "var(--accent-text)" }} />
            <span id="notes-title" className="notes-title">
              Personal Notes
            </span>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close notes dialog"
          >
            <X size={15} />
          </button>
        </div>

        <div className="notes-body">
          <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
            {problemTitle}
          </div>
          <textarea
            className="notes-textarea"
            placeholder="Key insights, edge cases, time/space complexity notes, optimal data structure..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
        </div>

        <div className="notes-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleSave}>
            <Check size={14} />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
