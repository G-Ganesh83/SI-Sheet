import React, { useState, useEffect, useRef } from "react";
import { useTracker } from "../../context/useTracker";
import { useAuth } from "../../context/useAuth";
import { Sidebar } from "./Sidebar";
import { ProblemDrawer } from "../common/ProblemDrawer";
import { SignOutConfirmModal } from "../auth/SignOutConfirmModal";
import type { ViewTab } from "../../types/tracker";
import {
  LayoutDashboard,
  Code2,
  Tags,
  Calendar,
  RotateCcw,
  Terminal,
  Sun,
  Moon,
  Upload,
  Users,
  MousePointerClick,
  LogOut,
  LogIn,
} from "lucide-react";

const ADMIN_TABS: ViewTab[] = ["import", "users", "footer-clicks"];

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeTab, setActiveTab, theme, toggleTheme, revisionCount } = useTracker();
  const { user, profile, signOut, showAuthPrompt } = useAuth();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const activeNavItemRef = useRef<HTMLButtonElement | null>(null);

  const isAdmin = profile?.role === "admin";

  // Auto-scroll active item into view on narrow screens
  useEffect(() => {
    if (activeNavItemRef.current) {
      activeNavItemRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "nearest",
        block: "nearest",
      });
    }
  }, [activeTab]);

  // Redirect non-admin users if currently on any admin tab
  useEffect(() => {
    if (!isAdmin && ADMIN_TABS.includes(activeTab)) {
      setActiveTab("dashboard");
    }
  }, [isAdmin, activeTab, setActiveTab]);

  const mobileNavItems: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={17} /> },
    { id: "problems", label: "Problems", icon: <Code2 size={17} /> },
    { id: "topics", label: "Topics", icon: <Tags size={17} /> },
    { id: "labs", label: "Labs", icon: <Calendar size={17} /> },
    { id: "revision", label: "Revision", icon: <RotateCcw size={17} /> },
    ...(isAdmin
      ? [
          { id: "import" as ViewTab, label: "Import", icon: <Upload size={17} /> },
          { id: "users" as ViewTab, label: "Users", icon: <Users size={17} /> },
          { id: "footer-clicks" as ViewTab, label: "Clicks", icon: <MousePointerClick size={17} /> },
        ]
      : []),
  ];

  return (
    <div className="app-container">
      {/* Desktop Sidebar */}
      <Sidebar onRequestSignOut={() => setShowSignOutConfirm(true)} />

      {/* Main Content Area */}
      <div className="main-content">
        {/* Mobile Top Header */}
        <header className="mobile-header">
          <div className="brand">
            <div className="brand-icon" aria-hidden="true">
              <Terminal size={14} strokeWidth={2.2} />
            </div>
            <span>SI Sheet</span>
          </div>
          <div className="mobile-header-actions">
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
              aria-label="Toggle color theme"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            {user ? (
              <div className="mobile-user-area">
                <div
                  className="sidebar-user-avatar mobile-avatar"
                  title={user.email || profile?.display_name || "Signed in"}
                  aria-label={user.email || profile?.display_name || "Signed in"}
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.display_name || "User"} />
                  ) : (
                    <span>{(profile?.display_name || user.email || "U").charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn-icon mobile-logout-btn"
                  onClick={() => setShowSignOutConfirm(true)}
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-icon mobile-signin-btn"
                onClick={showAuthPrompt}
                title="Sign in"
                aria-label="Sign in"
              >
                <LogIn size={15} />
              </button>
            )}
          </div>
        </header>

        {/* View Child Components */}
        {children}

        {/* Mobile Bottom Navigation */}
        <nav className="mobile-bottom-nav">
          {mobileNavItems.map((item) => (
            <button
              key={item.id}
              ref={activeTab === item.id ? activeNavItemRef : undefined}
              type="button"
              className={`mobile-nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <div className="mobile-nav-icon-wrapper">
                {item.icon}
                {item.id === "revision" && revisionCount > 0 && (
                  <span className="mobile-nav-badge-dot" />
                )}
              </div>
              <span className="mobile-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Slide-out problem inspector drawer */}
      <ProblemDrawer />

      {/* Confirmation modal before signing out */}
      <SignOutConfirmModal
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={async () => {
          setShowSignOutConfirm(false);
          await signOut();
        }}
      />
    </div>
  );
};
