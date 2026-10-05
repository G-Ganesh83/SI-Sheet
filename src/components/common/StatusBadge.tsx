import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import type { ProblemStatus } from "../../types/tracker";
import { ChevronDown, CheckCircle2, Clock, Circle } from "lucide-react";

interface StatusBadgeProps {
  status: ProblemStatus;
  onChange: (newStatus: ProblemStatus) => void;
  compact?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  onChange,
  compact = false,
  onOpenChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  // Position calculation: check if dropdown should open upward
  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownEstimatedHeight = 140;
      const spaceBelow = window.innerHeight - rect.bottom;
      // If space below is less than dropdown height and there is more space above
      const shouldOpenUp = spaceBelow < dropdownEstimatedHeight && rect.top > spaceBelow;
      setOpenUpward(shouldOpenUp);
    }
  }, []);

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  // Click outside listener
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

  // Keyboard navigation & accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
    <div
      ref={containerRef}
      className={`status-badge-container ${isOpen ? "dropdown-open" : ""}`}
      style={{
        position: "relative",
        display: "inline-block",
        zIndex: isOpen ? 50 : undefined,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        ref={buttonRef}
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
          role="listbox"
          aria-label="Select problem status"
          className={`dropdown-menu-animated status-dropdown-menu ${openUpward ? "upward" : ""}`}
          style={{
            position: "absolute",
            top: openUpward ? "auto" : "calc(100% + 4px)",
            bottom: openUpward ? "calc(100% + 4px)" : "auto",
            left: 0,
            zIndex: 60,
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {(["not-started", "in-progress", "completed"] as ProblemStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              role="option"
              aria-selected={status === s}
              className={`status-dropdown-item ${s} ${status === s ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onChange(s);
                setIsOpen(false);
                buttonRef.current?.focus();
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
