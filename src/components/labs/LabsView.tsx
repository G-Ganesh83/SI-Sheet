import React, { useState } from "react";
import { useTracker } from "../../context/useTracker";
import { useAuth } from "../../context/useAuth";
import { ProblemRow } from "../problems/ProblemRow";
import { Calendar, ArrowUpRight } from "lucide-react";

export const LabsView: React.FC = () => {
  const { labStats, selectLabFilter } = useTracker();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(labStats[0]?.date || "03 Aug 2026");

  const activeLab = labStats.find((l) => l.date === selectedDate);

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="view-title-row">
          <div className="view-title-group">
            <h1 className="view-title">Lab Sessions</h1>
            <span className="result-count-badge">
              {labStats.length} sessions
            </span>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => selectLabFilter(selectedDate)}
            title="Open selected lab in the main problems table"
          >
            <span>Open in Problems Table</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
        <p className="view-subtitle">
          Track problem completion according to assigned college and Smart Interviews lab dates
        </p>
      </div>

      {/* Lab Dates Horizontal/Grid Selector */}
      <div className="overview-grid">
        {labStats.map((lab) => {
          const isSelected = lab.date === selectedDate;
          const percentage = lab.total > 0 ? Math.round((lab.completed / lab.total) * 100) : 0;
          const isCompleted = Boolean(user && lab.total > 0 && lab.completed === lab.total);
          return (
            <div
              key={lab.date}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              className={`overview-card ${isSelected ? "selected" : ""}`}
              onClick={() => setSelectedDate(lab.date)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedDate(lab.date);
                }
              }}
            >
              <div className="overview-card-header">
                <span className="overview-card-title mono">
                  {lab.date}
                </span>
                <span className={`overview-card-count ${isCompleted ? "completed" : ""}`}>
                  {user ? `${lab.completed} / ${lab.total}` : `${lab.total} problems`}
                </span>
              </div>

              {user && (
                <div className="mini-bar">
                  <div className="mini-bar-fill" style={{ width: `${percentage}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lab Detail Problems Table */}
      {activeLab && (
        <div key={selectedDate} className="topic-detail-section">
          <div className="detail-header-card">
            <div className="detail-header-left">
              <Calendar size={15} className="detail-header-icon" />
              <h2 className="detail-header-title mono">
                Lab — {activeLab.date}
              </h2>
              <span className="detail-header-count">
                ({activeLab.total} {activeLab.total === 1 ? "problem" : "problems"})
              </span>
            </div>

            {user && (
              <span className="detail-header-stats">
                <span className="stat-completed-val">{activeLab.completed} completed</span>
                <span className="stat-sep">•</span>
                <span>{activeLab.inProgress} in progress</span>
                <span className="stat-sep">•</span>
                <span>{activeLab.notStarted} not started</span>
              </span>
            )}
          </div>

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
                {activeLab.problems.map((problem) => (
                  <ProblemRow key={problem.id} problem={problem} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
