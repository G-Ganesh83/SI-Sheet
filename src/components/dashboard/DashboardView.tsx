import React, { useMemo } from "react";
import { useTracker } from "../../context/useTracker";
import { useAuth } from "../../context/useAuth";
import { StatusBadge } from "../common/StatusBadge";
import { RevisionCheckbox } from "../common/RevisionCheckbox";
import type { ProblemStatus } from "../../types/tracker";
import {
  ArrowRight,
  BookOpen,
  RotateCcw,
  Tags,
  Circle,
  ExternalLink,
  Sparkles,
  LogIn,
} from "lucide-react";

export const DashboardView: React.FC = () => {
  const { user, profile, signInWithGoogle, showAuthPrompt } = useAuth();
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
    problems,
    setSelectedProblemId,
    setActiveTab,
    selectTopicFilter,
    getProgress,
    updateStatus,
    toggleRevision,
    allTopics,
    allLabDates,
  } = useTracker();

  // Time-of-day greeting for authenticated users
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    const name =
      profile?.display_name?.split(" ")[0] ||
      (user?.user_metadata?.full_name as string)?.split(" ")[0] ||
      (user?.user_metadata?.name as string)?.split(" ")[0] ||
      "";
    return name ? `${timeOfDay}, ${name}` : timeOfDay;
  }, [profile, user]);

  const isNewUser = Boolean(
    user && completedCount === 0 && inProgressCount === 0 && revisionCount === 0
  );

  // Combine in-progress, recently worked, or initial problems for Continue Learning
  const continueLearningProblems = useMemo(() => {
    if (!user) {
      // Anonymous users see the first 4 problems of the catalog to explore
      return problems.slice(0, 4);
    }

    const list = [...inProgressProblems];
    for (const p of recentWorkedProblems) {
      if (!list.some((item) => item.id === p.id)) {
        list.push(p);
      }
    }

    // If new user or no active/recent problems, suggest first few not-started problems
    if (list.length === 0) {
      for (const p of problems) {
        const prog = getProgress(p.id);
        if (prog.status === "not-started") {
          list.push(p);
          if (list.length >= 4) break;
        }
      }
    }

    return list.slice(0, 5);
  }, [user, inProgressProblems, recentWorkedProblems, problems, getProgress]);

  const handleStatusChange = (problemId: string, status: ProblemStatus) => {
    if (!user) {
      showAuthPrompt();
      return;
    }
    updateStatus(problemId, status);
  };

  const handleRevisionToggle = (problemId: string) => {
    if (!user) {
      showAuthPrompt();
      return;
    }
    toggleRevision(problemId);
  };

  return (
    <div className="view-container">
      {/* Top Header */}
      <div className="view-header">
        <div className="view-title-row">
          <h1 className="view-title">{user ? greeting : "Dashboard"}</h1>
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
          {user
            ? "Keep building your DSA consistency."
            : "Personal DSA lab problem tracker & revision manager"}
        </p>
      </div>

      {/* Anonymous Catalog Overview & Sign-In Callout */}
      {!user && (
        <div className="stats-banner banner-callout">
          <div className="stats-row">
            <div>
              <div className="stats-tag-row" style={{ marginBottom: 4 }}>
                <span className="stats-section-label">DSA CATALOG</span>
                <span style={{ color: "var(--border-strong)" }}>•</span>
                <span className="stats-count-label">{totalProblems} PROBLEMS</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
                Sign in with Google to track your solved problems, save personal notes, and build your revision queue.
              </p>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => void signInWithGoogle()}
            >
              <LogIn size={13} />
              <span>Sign in with Google</span>
            </button>
          </div>

          <div className="stats-meta" style={{ paddingTop: 4 }}>
            <div className="stat-chip">
              <span className="stat-chip-count">{totalProblems}</span>
              <span>Curated Problems</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip-count">{allTopics.length}</span>
              <span>Topics</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip-count">{allLabDates.length}</span>
              <span>Lab Sessions</span>
            </div>
          </div>
        </div>
      )}

      {/* New User Encouraging Welcome State */}
      {user && isNewUser && (
        <div className="stats-banner banner-callout">
          <div className="stats-row">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Sparkles size={14} style={{ color: "var(--accent)" }} />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                  Start your DSA journey
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
                Choose a problem and mark your progress as you go. Your status and notes will sync automatically.
              </p>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => setActiveTab("problems")}
            >
              <span>Browse Problems</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="stats-meta" style={{ paddingTop: 4 }}>
            <div className="stat-chip">
              <span className="stat-chip-count">{totalProblems}</span>
              <span>Total Problems</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip-count">{allTopics.length}</span>
              <span>Topics</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip-count">{allLabDates.length}</span>
              <span>Labs</span>
            </div>
          </div>
        </div>
      )}

      {/* Authenticated Progress Overview Banner */}
      {user && (
        <div className="stats-banner">
          <div className="stats-row">
            <div className="stats-tag-row">
              <span className="stats-section-label">SI SHEET</span>
              <span style={{ color: "var(--border-strong)" }}>•</span>
              <span className="stats-count-label">{totalProblems} PROBLEMS</span>
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

          {/* Dynamic Progress Bar */}
          <div className="progress-track-wrapper">
            <div className="progress-track">
              <div
                className="progress-fill completed"
                style={{
                  width: `${totalProblems > 0 ? (completedCount / totalProblems) * 100 : 0}%`,
                }}
                title={`Completed: ${completionPercentage}%`}
              />
              <div
                className="progress-fill in-progress"
                style={{
                  width: `${totalProblems > 0 ? (inProgressCount / totalProblems) * 100 : 0}%`,
                }}
                title={`In Progress: ${
                  totalProblems > 0 ? Math.round((inProgressCount / totalProblems) * 100) : 0
                }%`}
              />
            </div>
            <span className="progress-percentage">
              {completionPercentage}%
            </span>
          </div>
        </div>
      )}

      {/* Dashboard Sections Grid */}
      <div className="dashboard-grid">
        {/* Continue Learning */}
        <section className="dashboard-section">
          <div className="section-title-row">
            <h2 className="section-title">
              <BookOpen size={13} style={{ color: "var(--status-in-progress)" }} />
              <span>{user && !isNewUser ? "Continue Learning" : "Suggested to Start"}</span>
            </h2>
            {continueLearningProblems.length > 0 && user && (
              <span className="section-count-badge">
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedProblemId(p.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    title="Click to view details & notes"
                  >
                    <div className="compact-item-left">
                      {user ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <StatusBadge
                            status={progress.status}
                            onChange={(s) => handleStatusChange(p.id, s)}
                            compact={true}
                          />
                        </div>
                      ) : (
                        <Circle size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                      )}
                      <span className="compact-item-title">{p.title}</span>
                    </div>

                    <div className="compact-item-right" onClick={(e) => e.stopPropagation()}>
                      <span className="compact-item-tag">{p.topics[0]}</span>
                      {user && (
                        <RevisionCheckbox
                          checked={progress.revision}
                          onChange={() => handleRevisionToggle(p.id)}
                          compact={true}
                        />
                      )}
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-icon"
                        title={`Open on ${p.platform}`}
                        aria-label={`Open ${p.title} on ${p.platform}`}
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-state-title">
                No active problems
              </span>
              <p className="empty-state-desc">
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
            {revisionProblems.length > 0 && user && (
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

          {user && revisionProblems.length > 0 ? (
            <div className="compact-list">
              {revisionProblems.slice(0, 5).map((p) => {
                const progress = getProgress(p.id);
                return (
                  <div
                    key={p.id}
                    className="compact-item"
                    onClick={() => setSelectedProblemId(p.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedProblemId(p.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    title="Click to inspect problem & notes"
                  >
                    <div className="compact-item-left">
                      <div onClick={(e) => e.stopPropagation()}>
                        <StatusBadge
                          status={progress.status}
                          onChange={(s) => handleStatusChange(p.id, s)}
                          compact={true}
                        />
                      </div>
                      <span className="compact-item-title">{p.title}</span>
                    </div>

                    <div className="compact-item-right" onClick={(e) => e.stopPropagation()}>
                      <span className="compact-item-tag">{p.topics[0]}</span>
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-icon"
                        title={`Open on ${p.platform}`}
                        aria-label={`Open ${p.title} on ${p.platform}`}
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-state-title">
                {user ? "You're clear — no problems marked for revision." : "No revision queue yet"}
              </span>
              <p className="empty-state-desc">
                {user
                  ? "Check Need Revision on tricky problems to revisit them later."
                  : "Sign in with Google to bookmark challenging problems for your interview drill list."}
              </p>
            </div>
          )}
        </section>

        {/* Topic Progress */}
        <section className="dashboard-section dashboard-section-wide">
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

          <div className="topic-progress-grid">
            {topicStats.slice(0, 8).map((t) => {
              const pct = t.total > 0 ? Math.round((t.completed / t.total) * 100) : 0;
              return (
                <div
                  key={t.topic}
                  className="topic-progress-item"
                  onClick={() => selectTopicFilter(t.topic)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectTopicFilter(t.topic);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  title={`Filter problems by ${t.topic}`}
                >
                  <div className="topic-progress-header">
                    <span className="topic-progress-name">{t.topic}</span>
                    <span className="topic-progress-count">
                      {user ? `${t.completed} / ${t.total}` : `${t.total} problems`}
                    </span>
                  </div>
                  {user && (
                    <div className="mini-bar">
                      <div className="mini-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
