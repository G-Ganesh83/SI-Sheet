import React from "react";
import { TrackerProvider } from "./context/TrackerContext";
import { useTracker } from "./context/useTracker";
import { AppLayout } from "./components/layout/AppLayout";
import { DashboardView } from "./components/dashboard/DashboardView";
import { ProblemsView } from "./components/problems/ProblemsView";
import { TopicsView } from "./components/topics/TopicsView";
import { LabsView } from "./components/labs/LabsView";
import { RevisionView } from "./components/revision/RevisionView";
import { ImportView } from "./components/import/ImportView";

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

export default function App() {
  return (
    <TrackerProvider>
      <AppLayout>
        <AppContent />
      </AppLayout>
    </TrackerProvider>
  );
}
