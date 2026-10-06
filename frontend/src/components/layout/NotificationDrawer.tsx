import React from 'react';
import { IconBell, IconX, IconTriangleAlert, IconLock, IconCheck, IconCode } from '../common/Icons';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type?: string;
  is_read?: boolean;
  created_at?: string;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead?: (id: string) => void;
  onSelectFileByPath?: (path: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onSelectFileByPath
}) => {
  if (!isOpen) return null;

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'IMPACT':
      case 'high':
        return <IconTriangleAlert size={16} color="var(--color-danger)" />;
      case 'ACCESS_REQUEST':
        return <IconLock size={16} color="var(--color-warning)" />;
      case 'TEST':
        return <IconCheck size={16} color="var(--color-success)" />;
      default:
        return <IconBell size={16} color="var(--color-primary)" />;
    }
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-title-row">
            <IconBell size={17} color="var(--color-primary)" />
            <h3 className="drawer-title">Notifications</h3>
            {notifications.length > 0 && (
              <span className="badge badge-primary">{notifications.length}</span>
            )}
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close drawer">
            <IconX size={16} />
          </button>
        </div>

        <div className="drawer-body">
          {notifications.length === 0 ? (
            <div className="empty-state">
              <IconBell size={32} color="var(--text-muted)" />
              <div className="empty-state-title">No notifications</div>
              <p className="empty-state-desc">You are all caught up! Targeted artifact notifications will appear here when dependencies change.</p>
            </div>
          ) : (
            <div className="notification-list">
              {notifications.map((n) => (
                <div key={n.id} className={`notification-card ${n.is_read ? 'read' : 'unread'}`}>
                  <div className="notif-icon-col">{getNotificationIcon(n.type)}</div>
                  <div className="notif-content-col">
                    <div className="notif-card-title">{n.title}</div>
                    <p className="notif-card-msg">{n.message}</p>
                    <div className="notif-card-footer">
                      {n.created_at && (
                        <span className="notif-time">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {onMarkRead && !n.is_read && (
                        <button className="notif-action-link" onClick={() => onMarkRead(n.id)}>
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
