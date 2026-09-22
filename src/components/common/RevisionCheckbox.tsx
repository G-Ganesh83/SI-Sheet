import React from "react";
import { RotateCcw, Check } from "lucide-react";

interface RevisionCheckboxProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
  compact?: boolean;
}

export const RevisionCheckbox: React.FC<RevisionCheckboxProps> = ({
  checked,
  onChange,
  label = "Revision",
  compact = false,
}) => {
  return (
    <button
      type="button"
      className={`revision-toggle ${checked ? "active" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      title={checked ? "Marked for revision (click to unmark)" : "Mark for revision"}
      aria-checked={checked}
      role="checkbox"
    >
      <span className="checkbox-box">
        {checked ? <Check size={11} strokeWidth={3} /> : null}
      </span>
      {!compact && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <RotateCcw size={12} style={{ opacity: checked ? 1 : 0.6 }} />
          <span>{label}</span>
        </span>
      )}
    </button>
  );
};
