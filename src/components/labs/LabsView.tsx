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
          <h1 className="view-title">Lab Sessions</h1>
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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 10,
          marginBottom: 24,
        }}
      >
        {labStats.map((lab) => {
          const isSelected = lab.date === selectedDate;
          const percentage = lab.total > 0 ? Math.round((lab.completed / lab.total) * 100) : 0;
          return (
            <div
              key={lab.date}
              onClick={() => setSelectedDate(lab.date)}
              style={{
                backgroundColor: isSelected ? "var(--bg-card-hover)" : "var(--bg-card)",
                border: `1px solid ${isSelected ? "var(--accent)" : "var(--border-subtle)"}`,
                borderRadius: "var(--radius-md)",
                padding: "12px 14px",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: "13px",
                    fontFamily: "var(--font-mono)",
                    color: isSelected ? "var(--accent-text)" : "var(--text-primary)",
                  }}
                >
                  {lab.date}
                </span>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              backgroundColor: "var(--bg-card)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Calendar size={16} style={{ color: "var(--accent-text)" }} />
              <h2
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-primary)",
                }}
              >
                Lab — {activeLab.date}
              </h2>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                ({activeLab.total} {activeLab.total === 1 ? "problem" : "problems"})
              </span>
            </div>

            {user && (
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                {activeLab.completed} completed • {activeLab.inProgress} in progress • {activeLab.notStarted} not started
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
