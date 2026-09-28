import React, { useState } from "react";
import { useTracker } from "../../context/useTracker";
import { useAuth } from "../../context/useAuth";
import { ProblemRow } from "../problems/ProblemRow";
import { Tags, ArrowUpRight } from "lucide-react";

export const TopicsView: React.FC = () => {
  const { topicStats, problems, selectTopicFilter } = useTracker();
  const { user } = useAuth();
  const [selectedTopic, setSelectedTopic] = useState<string>(topicStats[0]?.topic || "Bit Manipulation");

  const topicProblems = problems.filter((p) => p.topics.includes(selectedTopic));
  const activeStat = topicStats.find((t) => t.topic === selectedTopic);

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="view-title-row">
          <h1 className="view-title">Algorithmic Topics</h1>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => selectTopicFilter(selectedTopic)}
            title="Open selected topic in the main problems table"
          >
            <span>Open in Problems Table</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
        <p className="view-subtitle">
          Organize and revise DSA problems by algorithmic paradigm, data structure, and concept
        </p>
      </div>

      {/* Topics Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 10,
          marginBottom: 24,
        }}
      >
        {topicStats.map((stat) => {
          const isSelected = stat.topic === selectedTopic;
          const percentage = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
          return (
            <div
              key={stat.topic}
              onClick={() => setSelectedTopic(stat.topic)}
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
                    color: isSelected ? "var(--accent-text)" : "var(--text-primary)",
                  }}
                >
                  {stat.topic}
                </span>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                  {user ? `${stat.completed} / ${stat.total}` : `${stat.total} problems`}
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

      {/* Selected Topic Problems View */}
      {selectedTopic && (
        <div key={selectedTopic} className="topic-detail-section">
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
              <Tags size={16} style={{ color: "var(--accent-text)" }} />
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
                {selectedTopic}
              </h2>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                ({topicProblems.length} {topicProblems.length === 1 ? "problem" : "problems"})
              </span>
            </div>

            {user && activeStat && (
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                {activeStat.completed} completed • {activeStat.inProgress} in progress • {activeStat.notStarted} not started
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
                {topicProblems.map((problem) => (
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
