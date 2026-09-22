import React from "react";
import { useTracker } from "../../context/useTracker";
import {
  ArrowRight,
  BookOpen,
  RotateCcw,
  Tags,
  CheckCircle2,
  Clock,
  Circle,
} from "lucide-react";

export const DashboardView: React.FC = () => {
  const {
    totalProblems,
    completedCount,
    inProgressCount,
    notStartedCount,
    revisionCount,
    completionPercentage,
    inProgressProblems,
    recentWorkedProblems,
    revisionProblems,
    topicStats,
    setSelectedProblemId,
    setActiveTab,
    selectTopicFilter,
    getProgress,
  } = useTracker();

  // Combine in-progress and recent worked for Continue Learning (deduplicated by id)
  const continueLearningProblems = React.useMemo(() => {
    const list = [...inProgressProblems];
    for (const p of recentWorkedProblems) {
      if (!list.some((item) => item.id === p.id)) {
        list.push(p);
      }
    }
    return list.slice(0, 5);
  }, [inProgressProblems, recentWorkedProblems]);

  return (
    <div className="view-container">
      {/* Top Header */}
      <div className="view-header">
        <div className="view-title-row">
          <h1 className="view-title">Dashboard</h1>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setActiveTab("problems")}
          >
            <span>All Problems</span>
            <ArrowRight size={13} />
          </button>
        </div>
        <p className="view-subtitle">
          Personal DSA lab problem tracker & revision manager
        </p>
      </div>

      {/* High-Level Compact Statistics Banner */}
      <div className="stats-banner">
        <div className="stats-row">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.05em",
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
              }}
            >
              SI SHEET
            </span>
            <span style={{ color: "var(--border-strong)" }}>•</span>
            <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>
              {totalProblems} PROBLEMS
            </span>
          </div>

          <div className="stats-meta">
            <div className="stat-chip" title="Completed problems">
              <span className="stat-dot completed" />
              <span className="stat-chip-count">{completedCount}</span>
              <span>Completed</span>
            </div>

            <div className="stat-chip" title="Problems in progress">
              <span className="stat-dot in-progress" />
              <span className="stat-chip-count">{inProgressCount}</span>
              <span>In Progress</span>
            </div>

            <div className="stat-chip" title="Problems not yet started">
              <span className="stat-dot not-started" />
              <span className="stat-chip-count">{notStartedCount}</span>
              <span>Not Started</span>
            </div>

            <div className="stat-chip" title="Problems marked for revision">
              <span className="stat-dot revision" />
              <span className="stat-chip-count">{revisionCount}</span>
              <span>Need Revision</span>
            </div>
          </div>
        </div>

        {/* Dynamic Subtle Progress Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div className="progress-track">
              <div
                className="progress-fill completed"
                style={{ width: `${totalProblems > 0 ? (completedCount / totalProblems) * 100 : 0}%` }}
                title={`Completed: ${completionPercentage}%`}
              />
              <div
                className="progress-fill in-progress"
                style={{ width: `${totalProblems > 0 ? (inProgressCount / totalProblems) * 100 : 0}%` }}
                title={`In Progress: ${totalProblems > 0 ? Math.round((inProgressCount / totalProblems) * 100) : 0}%`}
              />
            </div>
          </div>
          <span
            style={{
              fontSize: "11.5px",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              color: "var(--text-primary)",
              minWidth: "36px",
              textAlign: "right",
            }}
          >
            {completionPercentage}%
          </span>
        </div>
      </div>

      {/* Dashboard Sections Grid */}
      <div className="dashboard-grid">
        {/* Continue Learning */}
        <section className="dashboard-section">
          <div className="section-title-row">
            <h2 className="section-title">
              <BookOpen size={13} style={{ color: "var(--status-in-progress)" }} />
              <span>Continue Learning</span>
            </h2>
            {continueLearningProblems.length > 0 && (
              <span style={{ fontSize: "10.5px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                {continueLearningProblems.length} Active
              </span>
            )}
          </div>

          {continueLearningProblems.length > 0 ? (
            <div className="compact-list">
              {continueLearningProblems.map((p) => {
                const progress = getProgress(p.id);
                return (
                  <div
                    key={p.id}
                    className="compact-item"
                    onClick={() => setSelectedProblemId(p.id)}
                    title="Click to view details & notes"
                  >
                    <div className="compact-item-left">
                      {progress.status === "completed" ? (
                        <CheckCircle2 size={13} style={{ color: "var(--status-completed)", flexShrink: 0 }} />
                      ) : progress.status === "in-progress" ? (
                        <Clock size={13} style={{ color: "var(--status-in-progress)", flexShrink: 0 }} />
                      ) : (
                        <Circle size={13} style={{ color: "var(--status-not-started)", flexShrink: 0 }} />
                      )}
                      <span className="compact-item-title">{p.title}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className="compact-item-tag">{p.topics[0]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: "20px 10px" }}>
              <span className="empty-state-title" style={{ fontSize: "12.5px" }}>
                No active problems
              </span>
              <p className="empty-state-desc" style={{ fontSize: "11.5px" }}>
                Mark any problem as <strong>In Progress</strong> to track your focus here.
              </p>
            </div>
          )}
        </section>

        {/* Revision Queue */}
        <section className="dashboard-section">
          <div className="section-title-row">
            <h2 className="section-title">
              <RotateCcw size={13} style={{ color: "var(--revision-color)" }} />
              <span>Revision Queue</span>
            </h2>
            {revisionProblems.length > 0 && (
              <button
                type="button"
                className="section-action"
                onClick={() => setActiveTab("revision")}
              >
                <span>View all ({revisionProblems.length})</span>
                <ArrowRight size={11} />
              </button>
            )}
          </div>

          {revisionProblems.length > 0 ? (
            <div className="compact-list">
              {revisionProblems.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="compact-item"
                  onClick={() => setSelectedProblemId(p.id)}
                  title="Click to inspect problem & notes"
                >
                  <div className="compact-item-left">
                    <RotateCcw size={12} style={{ color: "var(--revision-color)", flexShrink: 0 }} />
                    <span className="compact-item-title">{p.title}</span>
                  </div>
                  <span className="compact-item-tag">{p.topics[0]}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: "20px 10px" }}>
              <span className="empty-state-title" style={{ fontSize: "12.5px" }}>
                No problems marked for revision
              </span>
              <p className="empty-state-desc" style={{ fontSize: "11.5px" }}>
                Check <strong>Need Revision</strong> on tricky problems to revisit them later.
              </p>
            </div>
          )}
        </section>

        {/* Topic Progress (High information density list) */}
        <section className="dashboard-section" style={{ gridColumn: "1 / -1" }}>
          <div className="section-title-row">
            <h2 className="section-title">
              <Tags size={13} style={{ color: "var(--text-secondary)" }} />
              <span>Topic Progress</span>
            </h2>
            <button
              type="button"
              className="section-action"
              onClick={() => setActiveTab("topics")}
            >
              <span>Explore All ({topicStats.length})</span>
              <ArrowRight size={11} />
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 8,
            }}
          >
            {topicStats.slice(0, 8).map((t) => {
              const pct = t.total > 0 ? Math.round((t.completed / t.total) * 100) : 0;
              return (
                <div
                  key={t.topic}
                  className="topic-progress-item"
                  style={{
                    backgroundColor: "var(--bg-app)",
                    border: "1px solid var(--border-subtle)",
                    padding: "8px 10px",
                  }}
                  onClick={() => selectTopicFilter(t.topic)}
                  title={`Filter problems by ${t.topic}`}
                >
                  <div className="topic-progress-header">
                    <span className="topic-progress-name">{t.topic}</span>
                    <span className="topic-progress-count">
                      {t.completed} / {t.total}
                    </span>
                  </div>
                  <div className="mini-bar">
                    <div className="mini-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
