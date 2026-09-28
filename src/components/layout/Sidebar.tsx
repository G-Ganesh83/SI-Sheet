import React from "react";
import { useTracker } from "../../context/useTracker";
import { useAuth } from "../../context/useAuth";
import type { ViewTab } from "../../types/tracker";
import {
  LayoutDashboard,
  Code2,
  Tags,
  Calendar,
  RotateCcw,
  Sun,
  Moon,
  Download,
  Terminal,
  RotateCw,
  Upload,
  LogOut,
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    theme,
    toggleTheme,
    totalProblems,
    revisionCount,
    exportData,
    resetAllProgress,
  } = useTracker();
  const { user, profile, signOut } = useAuth();

  const navItems: { id: ViewTab; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={16} />,
    },
    {
      id: "problems",
      label: "Problems",
      icon: <Code2 size={16} />,
      badge: totalProblems,
    },
    {
      id: "topics",
      label: "Topics",
      icon: <Tags size={16} />,
    },
    {
      id: "labs",
      label: "Labs",
      icon: <Calendar size={16} />,
    },
    {
      id: "revision",
      label: "Revision",
      icon: <RotateCcw size={16} />,
      badge: revisionCount > 0 ? revisionCount : undefined,
    },
    {
      id: "import",
      label: "Import",
      icon: <Upload size={16} />,
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-icon">
            <Terminal size={14} />
          </div>
          <span>SI Sheet</span>
        </div>
        <button
          type="button"
          className="btn-icon"
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          aria-label="Toggle color theme"
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge !== undefined && <span className="nav-badge">{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      {user && (
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name || "User"} />
            ) : (
              <span>{(profile?.display_name || user.email || "U").charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">
              {profile?.display_name || user.email?.split("@")[0] || "User"}
            </span>
            <span className="sidebar-user-email" title={user.email}>
              {user.email}
            </span>
          </div>
          <button
            type="button"
            className="btn-icon sidebar-user-logout"
            onClick={signOut}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      )}

      <div className="sidebar-footer">
        <div style={{ display: "flex", gap: 4 }}>
          <button
            type="button"
            className="btn-icon"
            onClick={exportData}
            title="Export local progress backup JSON"
          >
            <Download size={14} />
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={resetAllProgress}
            title="Reset progress"
          >
            <RotateCw size={14} />
          </button>
        </div>
        <span style={{ fontSize: "11px", color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>
          v1.0 Local
        </span>
      </div>
    </aside>
  );
};
