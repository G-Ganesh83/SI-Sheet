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
      <div className="overview-grid">
        {topicStats.map((stat) => {
          const isSelected = stat.topic === selectedTopic;
          const percentage = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
          return (
            <div
              key={stat.topic}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              className={`overview-card ${isSelected ? "selected" : ""}`}
              onClick={() => setSelectedTopic(stat.topic)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedTopic(stat.topic);
                }
              }}
            >
              <div className="overview-card-header">
                <span className="overview-card-title">
                  {stat.topic}
                </span>
                <span className="overview-card-count">
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
          <div className="detail-header-card">
            <div className="detail-header-left">
              <Tags size={16} className="detail-header-icon" />
              <h2 className="detail-header-title">
                {selectedTopic}
              </h2>
              <span className="detail-header-count">
                ({topicProblems.length} {topicProblems.length === 1 ? "problem" : "problems"})
              </span>
            </div>

            {user && activeStat && (
              <span className="detail-header-stats">
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
