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
import { AuthPromptModal } from "./components/auth/AuthPromptModal";

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
  const { authPromptOpen, closeAuthPrompt } = useAuth();

  return (
    <TrackerProvider>
      <AppLayout>
        <AppContent />
      </AppLayout>
      {authPromptOpen && <AuthPromptModal onClose={closeAuthPrompt} />}
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
