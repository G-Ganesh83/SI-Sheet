import React, { useState } from "react";
import { Terminal, Shield, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/useAuth";

export const LoginView: React.FC = () => {
  const { signInWithGoogle, error, clearError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } finally {
      // Browser redirects away during OAuth, but in case of instant error:
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <main className="auth-card">
        {/* Header Branding */}
        <div className="auth-header">
          <div className="auth-logo-badge" aria-hidden="true">
            <Terminal size={20} strokeWidth={2.2} />
          </div>
          <h1 className="auth-title">SI Sheet</h1>
          <p className="auth-subtitle">
            Smart Interviews Curated DSA Problem Tracker &amp; Lab Milestones
          </p>
        </div>

        {/* Short useful benefit message */}
        <p className="auth-benefit-message">
          Track problem status, build your revision queue, and keep notes synchronized across all your devices.
        </p>

        {/* Error Alert if any */}
        {error && (
          <div className="auth-error-banner" role="alert">
            <AlertCircle size={15} className="auth-error-icon" />
            <span className="auth-error-message">{error}</span>
            <button
              type="button"
              className="auth-error-dismiss"
              onClick={clearError}
              aria-label="Dismiss error"
            >
              &times;
            </button>
          </div>
        )}

        {/* Sign In Action Area */}
        <div className="auth-action-area">
          <button
            type="button"
            className="btn-google-signin"
            onClick={handleSignIn}
            disabled={isSubmitting}
            id="google-signin-button"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <span className="auth-btn-spinner" aria-hidden="true" />
            ) : (
              <svg
                className="google-svg-icon"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>{isSubmitting ? "Connecting…" : "Continue with Google"}</span>
          </button>

          <p className="auth-supporting-text">
            Sync progress, notes, and revision state across devices.
          </p>
        </div>

        {/* Security / Info Footer */}
        <div className="auth-footer">
          <Shield size={12} className="auth-shield-icon" aria-hidden="true" />
          <span>Secured with Supabase Authentication</span>
        </div>
      </main>
    </div>
  );
};
