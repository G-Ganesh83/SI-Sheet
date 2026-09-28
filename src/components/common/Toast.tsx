import React, { useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "error" | "success" | "info";
  message: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case "error":
        return <AlertCircle size={16} className="toast-icon-error" />;
      case "success":
        return <CheckCircle2 size={16} className="toast-icon-success" />;
      case "info":
      default:
        return <Info size={16} className="toast-icon-info" />;
    }
  };

  return (
    <aside
      className={`toast-container toast-${toast.type}`}
      role="status"
      aria-live="polite"
      aria-label={toast.message}
    >
      <div className="toast-content">
        {getIcon()}
        <span className="toast-text">{toast.message}</span>
      </div>
      <button
        type="button"
        className="toast-close-btn"
        onClick={onClose}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </aside>
  );
};
