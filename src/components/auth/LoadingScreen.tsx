import React from "react";
import { Terminal } from "lucide-react";

export const LoadingScreen: React.FC = () => {
  return (
    <div className="auth-loading-container">
      <div className="auth-loading-card">
        <div className="auth-loading-icon">
          <Terminal size={24} />
        </div>
        <div className="auth-loading-spinner" />
        <span className="auth-loading-text">Authenticating session...</span>
      </div>
    </div>
  );
};
