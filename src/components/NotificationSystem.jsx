import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Check, Trash2 } from 'lucide-react';
import './NotificationSystem.css';

// Notification context/store
let notificationStore = [];
let listeners = [];

const addNotification = (notification) => {
  const newNotification = {
    id: Date.now() + Math.random(),
    ...notification,
    timestamp: new Date(),
    read: false
  };
  notificationStore = [newNotification, ...notificationStore];
  listeners.forEach(listener => listener([...notificationStore]));
  // Persist to localStorage
  localStorage.setItem('notifications', JSON.stringify(notificationStore));
};

const markAsRead = (id) => {
  if (id === 'all') {
    notificationStore = notificationStore.map(n => ({ ...n, read: true }));
  } else {
    notificationStore = notificationStore.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
  }
  listeners.forEach(listener => listener([...notificationStore]));
  localStorage.setItem('notifications', JSON.stringify(notificationStore));
};

const deleteNotification = (id) => {
  if (id === 'all') {
    notificationStore = [];
  } else {
    notificationStore = notificationStore.filter(n => n.id !== id);
  }
  listeners.forEach(listener => listener([...notificationStore]));
  localStorage.setItem('notifications', JSON.stringify(notificationStore));
};

const useNotifications = () => {
  const [notifications, setNotifications] = useState(() => {
    // Load from localStorage
    const stored = localStorage.getItem('notifications');
    if (stored) {
      try {
        notificationStore = JSON.parse(stored).map(n => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        return [...notificationStore];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    const listener = (newNotifications) => {
      setNotifications([...newNotifications]);
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  return { notifications, addNotification, markAsRead, deleteNotification };
};

const NotificationSystem = () => {
  const { notifications, markAsRead, deleteNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: buttonRect.bottom + 8,
        right: window.innerWidth - buttonRect.right
      });
    }
  }, [isOpen]);

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return time.toLocaleDateString();
  };

  return (
    <>
      <div className="notification-system">
        <button
          ref={buttonRef}
          className="notification-icon-button"
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          aria-label="Notifications"
        >
          <MessageSquare size={20} />
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
        </button>
      </div>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="notification-dropdown"
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`,
            zIndex: 10000
          }}
        >
          <div className="notification-header">
            <h3 className="notification-title">Notifications</h3>
            <div className="notification-actions">
              {notifications.length > 0 && (
                <>
                  {unreadCount > 0 && (
                    <button
                      className="notification-action-btn"
                      onClick={() => markAsRead('all')}
                      type="button"
                      title="Mark all as read"
                    >
                      <Check size={14} />
                      <span>Mark all read</span>
                    </button>
                  )}
                  <button
                    className="notification-action-btn delete-all"
                    onClick={() => deleteNotification('all')}
                    type="button"
                    title="Delete all"
                  >
                    <Trash2 size={14} />
                    <span>Delete all</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <MessageSquare size={32} />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                >
                  <div className="notification-content">
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">{formatTime(notification.timestamp)}</div>
                  </div>
                  <div className="notification-item-actions">
                    {!notification.read && (
                      <button
                        className="notification-mark-read"
                        onClick={() => markAsRead(notification.id)}
                        type="button"
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      className="notification-delete"
                      onClick={() => deleteNotification(notification.id)}
                      type="button"
                      title="Delete"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};

// Export the hook and addNotification function for use in other components
export { useNotifications, addNotification };
export default NotificationSystem;

