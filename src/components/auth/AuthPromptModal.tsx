import React from "react";
import { Terminal, Shield, LogIn, ArrowRight, X } from "lucide-react";
import { useAuth } from "../../context/useAuth";

interface AuthPromptModalProps {
  onClose: () => void;
}

export const AuthPromptModal: React.FC<AuthPromptModalProps> = ({ onClose }) => {
  const { signInWithGoogle, error, clearError } = useAuth();

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSignIn = async () => {
    clearError();
    await signInWithGoogle();
  };

  return (
    <div
      className="auth-prompt-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Sign in required"
    >
      <div className="auth-prompt-modal">
        {/* Close button */}
        <button
          type="button"
          className="auth-prompt-close"
          onClick={onClose}
          aria-label="Dismiss"
        >
          <X size={15} />
        </button>

        {/* Icon */}
        <div className="auth-prompt-icon">
          <Terminal size={20} />
        </div>

        {/* Content */}
        <div className="auth-prompt-content">
          <h2 className="auth-prompt-title">Sign in to track your progress</h2>
          <p className="auth-prompt-body">
            Saving problem status, revision flags, and personal notes requires a free
            Google account. All other browsing is fully public.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="auth-error-banner" role="alert" style={{ marginTop: 0 }}>
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

        {/* Action */}
        <button
          type="button"
          className="btn-google-signin"
          onClick={handleSignIn}
          id="auth-prompt-google-signin"
        >
          <LogIn size={16} />
          <span>Sign in with Google</span>
          <ArrowRight size={14} className="auth-btn-arrow" />
        </button>

        <div className="auth-prompt-footer">
          <Shield size={11} />
          <span>Your local progress is preserved during sign-in.</span>
        </div>
      </div>
    </div>
  );
};
