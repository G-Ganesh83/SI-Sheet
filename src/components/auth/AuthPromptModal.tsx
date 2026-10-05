import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Terminal, X, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/useAuth";

interface AuthPromptModalProps {
  onClose: () => void;
}

export const AuthPromptModal: React.FC<AuthPromptModalProps> = ({ onClose }) => {
  const { signInWithGoogle, error, clearError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isSubmitting]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  const handleSignIn = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    clearError();
    try {
      await signInWithGoogle();
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="modal-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-prompt-title"
    >
      <div className="confirm-dialog auth-prompt-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header with terminal brand mark, title, and close button */}
        <div className="confirm-dialog-header">
          <div className="confirm-dialog-header-left">
            <div className="auth-prompt-brand-icon" aria-hidden="true">
              <Terminal size={14} strokeWidth={2.2} />
            </div>
            <span id="auth-prompt-title" className="confirm-dialog-title">
              Sign in to SI Sheet
            </span>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
          >
            <X size={15} />
          </button>
        </div>

        {/* Dialog Body */}
        <div className="confirm-dialog-body auth-prompt-body-content">
          <p className="confirm-dialog-message">
            Browsing the problem catalog and lab milestones is fully public. Sign in with Google to save your problem status, manage your revision queue, and keep notes synchronized across devices.
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
        </div>

        {/* Footer Actions */}
        <div className="confirm-dialog-footer auth-prompt-footer-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary auth-prompt-submit-btn"
            onClick={handleSignIn}
            disabled={isSubmitting}
            id="auth-prompt-google-signin"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <span className="auth-btn-spinner-sm" aria-hidden="true" />
            ) : (
              <svg
                className="google-svg-icon"
                viewBox="0 0 24 24"
                width="14"
                height="14"
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
        </div>
      </div>
    </div>,
    document.body
  );
};
