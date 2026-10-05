import React from "react";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import { TrackerProvider } from "./context/TrackerContext";
import { useTracker } from "./context/useTracker";
import { AppLayout } from "./components/layout/AppLayout";
import { DashboardView } from "./components/dashboard/DashboardView";
import { ProblemsView } from "./components/problems/ProblemsView";
import { TopicsView } from "./components/topics/TopicsView";
import { LabsView } from "./components/labs/LabsView";
import { RevisionView } from "./components/revision/RevisionView";
import { ImportView } from "./components/import/ImportView";
import { UsersView } from "./components/admin/UsersView";
import { FooterClicksView } from "./components/admin/FooterClicksView";
import { AuthPromptModal } from "./components/auth/AuthPromptModal";
import { LoadingScreen } from "./components/auth/LoadingScreen";

const AppContent: React.FC = () => {
  const { activeTab } = useTracker();

  const renderView = () => {
    switch (activeTab) {
      case "problems":
        return <ProblemsView />;
      case "topics":
        return <TopicsView />;
      case "labs":
        return <LabsView />;
      case "revision":
        return <RevisionView />;
      case "import":
        return <ImportView />;
      case "users":
        return <UsersView />;
      case "footer-clicks":
        return <FooterClicksView />;
      case "dashboard":
      default:
        return <DashboardView />;
    }
  };

  return (
    <div key={activeTab} className="view-animated-wrapper">
      {renderView()}
    </div>
  );
};

const AppRoot: React.FC = () => {
  const { authPromptOpen, closeAuthPrompt, isLoading } = useAuth();
  const [showStartup, setShowStartup] = React.useState<boolean>(isLoading);
  const [isExiting, setIsExiting] = React.useState<boolean>(false);
  const startupStartTimeRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (startupStartTimeRef.current === null) {
      startupStartTimeRef.current = Date.now();
    }
  }, []);

  React.useEffect(() => {
    if (!isLoading && showStartup) {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

      // For users requesting reduced motion: do not force 1000ms minimum display
      if (prefersReducedMotion) {
        const timer = window.setTimeout(() => {
          setShowStartup(false);
        }, 0);
        return () => window.clearTimeout(timer);
      }

      // Ensure at least 1000ms visual presence before beginning the 260ms exit transition
      const startTime = startupStartTimeRef.current ?? Date.now();
      const elapsed = Date.now() - startTime;
      const remainingMinTime = Math.max(0, 1000 - elapsed);

      const exitTimer = window.setTimeout(() => {
        setIsExiting(true);
      }, remainingMinTime);

      const unmountTimer = window.setTimeout(() => {
        setShowStartup(false);
      }, remainingMinTime + 260);

      return () => {
        window.clearTimeout(exitTimer);
        window.clearTimeout(unmountTimer);
      };
    }
  }, [isLoading, showStartup]);

  return (
    <TrackerProvider>
      <AppLayout>
        <AppContent />
      </AppLayout>
      {authPromptOpen && <AuthPromptModal onClose={closeAuthPrompt} />}
      {showStartup && <LoadingScreen isExiting={isExiting} />}
    </TrackerProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppRoot />
      <Analytics />
    </AuthProvider>
  );
}
