import React from "react";
import { useTracker } from "../../context/useTracker";
import { useAuth } from "../../context/useAuth";
import { Sidebar } from "./Sidebar";
import { ProblemDrawer } from "../common/ProblemDrawer";
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
  LogOut,
} from "lucide-react";

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeTab, setActiveTab, theme, toggleTheme, revisionCount } = useTracker();
  const { signOut } = useAuth();

  const mobileNavItems: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={17} /> },
    { id: "problems", label: "Problems", icon: <Code2 size={17} /> },
    { id: "topics", label: "Topics", icon: <Tags size={17} /> },
    { id: "labs", label: "Labs", icon: <Calendar size={17} /> },
    { id: "revision", label: "Revision", icon: <RotateCcw size={17} /> },
    { id: "import", label: "Import", icon: <Upload size={17} /> },
  ];

  return (
    <div className="app-container">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="main-content">
        {/* Mobile Top Header */}
        <header className="mobile-header">
          <div className="brand">
            <div className="brand-icon">
              <Terminal size={14} />
            </div>
            <span>SI Sheet</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              type="button"
              className="btn-icon"
              onClick={toggleTheme}
              aria-label="Toggle color theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              type="button"
              className="btn-icon"
              onClick={signOut}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* View Child Components */}
        {children}

        {/* Mobile Bottom Navigation */}
        <nav className="mobile-bottom-nav">
          {mobileNavItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`mobile-nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <div style={{ position: "relative" }}>
                {item.icon}
                {item.id === "revision" && revisionCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -3,
                      right: -6,
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      backgroundColor: "var(--revision-color)",
                    }}
                  />
                )}
              </div>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Slide-out problem inspector drawer */}
      <ProblemDrawer />
    </div>
  );
};
