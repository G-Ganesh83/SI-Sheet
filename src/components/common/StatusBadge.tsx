import React, { useState, useRef, useEffect } from "react";
import type { ProblemStatus } from "../../types/tracker";
import { ChevronDown, CheckCircle2, Clock, Circle } from "lucide-react";

interface StatusBadgeProps {
  status: ProblemStatus;
  onChange: (newStatus: ProblemStatus) => void;
  compact?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, onChange, compact = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getStatusLabel = (s: ProblemStatus) => {
    switch (s) {
      case "completed":
        return "Completed";
      case "in-progress":
        return "In Progress";
      case "not-started":
      default:
        return "Not Started";
    }
  };

  const getStatusIcon = (s: ProblemStatus) => {
    switch (s) {
      case "completed":
        return <CheckCircle2 size={13} />;
      case "in-progress":
        return <Clock size={13} />;
      case "not-started":
      default:
        return <Circle size={13} />;
    }
  };

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        className={`status-badge ${status}`}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        title={`Change status (Current: ${getStatusLabel(status)})`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {getStatusIcon(status)}
        {!compact && <span>{getStatusLabel(status)}</span>}
        <ChevronDown size={11} style={{ opacity: 0.7, marginLeft: 2 }} />
      </button>

      {isOpen && (
        <div
          className="dropdown-menu-animated"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 40,
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-md)",
            padding: "4px",
            minWidth: "140px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {(["not-started", "in-progress", "completed"] as ProblemStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              className={`status-badge ${s}`}
              style={{
                width: "100%",
                justifyContent: "flex-start",
                padding: "6px 8px",
                border: "none",
                borderRadius: "var(--radius-sm)",
                backgroundColor: status === s ? undefined : "transparent",
              }}
              onClick={() => {
                onChange(s);
                setIsOpen(false);
              }}
            >
              {getStatusIcon(s)}
              <span>{getStatusLabel(s)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
