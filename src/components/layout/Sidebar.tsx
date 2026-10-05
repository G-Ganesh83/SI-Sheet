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
  Terminal,
  Upload,
  Users,
  MousePointerClick,
  LogOut,
  LogIn,
} from "lucide-react";
import { recordFooterClick } from "../../services/adminService";

interface SidebarProps {
  onRequestSignOut?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onRequestSignOut }) => {
  const {
    activeTab,
    setActiveTab,
    theme,
    toggleTheme,
    totalProblems,
    revisionCount,
  } = useTracker();
  const { user, profile, signOut, showAuthPrompt } = useAuth();

  const isAdmin = profile?.role === "admin";

  const baseNavItems: { id: ViewTab; label: string; icon: React.ReactNode; badge?: number | string }[] = [
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
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-icon" aria-hidden="true">
            <Terminal size={14} strokeWidth={2.2} />
          </div>
          <span>SI Sheet</span>
        </div>
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          aria-label="Toggle color theme"
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {baseNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge !== undefined && <span className="nav-badge">{item.badge}</span>}
            </button>
          );
        })}

        {isAdmin && (
          <div className="sidebar-admin-section">
            <div className="sidebar-section-divider" role="separator" />
            <div className="sidebar-section-header">
              <span>Admin</span>
            </div>
            <button
              type="button"
              className={`nav-item ${activeTab === "import" ? "active" : ""}`}
              onClick={() => setActiveTab("import")}
            >
              <span className="nav-icon"><Upload size={16} /></span>
              <span>Import</span>
            </button>
            <button
              type="button"
              className={`nav-item ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              <span className="nav-icon"><Users size={16} /></span>
              <span>Users</span>
            </button>
            <button
              type="button"
              className={`nav-item ${activeTab === "footer-clicks" ? "active" : ""}`}
              onClick={() => setActiveTab("footer-clicks")}
            >
              <span className="nav-icon"><MousePointerClick size={16} /></span>
              <span>Footer Clicks</span>
            </button>
          </div>
        )}
      </nav>

      {user ? (
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
            className="sidebar-user-logout"
            onClick={onRequestSignOut ?? signOut}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      ) : (
        <div className="sidebar-signin-wrapper">
          <button
            type="button"
            className="sidebar-signin-btn"
            onClick={showAuthPrompt}
            title="Sign in with Google to save progress"
          >
            <LogIn size={14} />
            <span>Sign in</span>
          </button>
        </div>
      )}

      <footer className="sidebar-footer">
        <span className="creator-credit">
          Built with <span className="creator-heart" aria-hidden="true">♥</span> by{" "}
          <a
            href="https://github.com/G-Ganesh83"
            target="_blank"
            rel="noreferrer"
            className="creator-link"
            title="Ganesh on GitHub"
            aria-label="Ganesh on GitHub (opens in new tab)"
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                showAuthPrompt();
                return;
              }
              void recordFooterClick();
            }}
          >
            Ganesh
          </a>{" "}
          · v2.0
        </span>
      </footer>
    </aside>
  );
};
