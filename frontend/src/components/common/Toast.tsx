import React, { useEffect } from 'react';
import { IconCheck, IconTriangleAlert, IconX, IconSparkles } from './Icons';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const duration = toast.duration || (toast.type === 'error' ? 6000 : 4000);
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const renderIcon = () => {
    switch (toast.type) {
      case 'success':
        return <IconCheck size={16} color="var(--color-success)" />;
      case 'error':
        return <IconTriangleAlert size={16} color="var(--color-danger)" />;
      case 'warning':
        return <IconTriangleAlert size={16} color="var(--color-warning)" />;
      case 'info':
      default:
        return <IconSparkles size={16} color="var(--color-primary)" />;
    }
  };

  return (
    <div className={`toast-card toast-${toast.type}`}>
      <div className="toast-icon-wrap">{renderIcon()}</div>
      <div className="toast-body">
        <div className="toast-title">{toast.title}</div>
        {toast.message && <div className="toast-message">{toast.message}</div>}
        {toast.actionLabel && toast.onAction && (
          <button
            className="toast-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              toast.onAction!();
              onDismiss();
            }}
          >
            {toast.actionLabel}
          </button>
        )}
      </div>
      <button className="toast-close-btn" onClick={onDismiss} aria-label="Dismiss toast">
        <IconX size={13} />
      </button>
    </div>
  );
};
