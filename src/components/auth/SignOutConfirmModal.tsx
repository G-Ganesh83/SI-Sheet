import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { LogOut, X } from "lucide-react";

interface SignOutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const SignOutConfirmModal: React.FC<SignOutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-signout-title"
    >
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog-header">
          <div className="confirm-dialog-header-left">
            <LogOut size={15} className="confirm-dialog-icon" />
            <span id="confirm-signout-title" className="confirm-dialog-title">
              Sign out?
            </span>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={15} />
          </button>
        </div>

        <div className="confirm-dialog-body">
          <p className="confirm-dialog-message">Are you sure you want to sign out?</p>
        </div>

        <div className="confirm-dialog-footer">
          <button type="button" className="btn-secondary" onClick={onClose} autoFocus>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={onConfirm}>
            Sign out
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
