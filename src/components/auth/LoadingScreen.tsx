import React from "react";
import { Terminal } from "lucide-react";

interface LoadingScreenProps {
  isExiting?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isExiting = false }) => {
  return (
    <div
      className={`startup-screen ${isExiting ? "startup-screen--exiting" : ""}`}
      role="status"
      aria-live="polite"
      id="startup-loading-screen"
    >
      <span className="startup-sr-only">Initializing SI Sheet...</span>
      <div className="startup-brand" aria-hidden="true">
        <div className="startup-brand-icon">
          <Terminal size={22} strokeWidth={2.2} />
        </div>
        <span className="startup-wordmark">SI SHEET</span>
      </div>
    </div>
  );
};
