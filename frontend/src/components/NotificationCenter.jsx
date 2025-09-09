import React, { useState, useEffect, useCallback } from 'react';
import { tasksAPI, webSocketService } from '../services/api';

const NotificationCenter = ({ showSuccess }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const handleNewNotification = useCallback((newNotification) => {
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const handleNotificationRead = useCallback(({ id }) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const handleAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  useEffect(() => {
    webSocketService.connect();
    webSocketService.onMessage((message) => {
      if (message.type === 'new_notification') {
        handleNewNotification(message.payload);
      } else if (message.type === 'notification_read') {
        handleNotificationRead(message.payload);
      } else if (message.type === 'all_notifications_read') {
        handleAllNotificationsRead();
      }
    });

    return () => {
      webSocketService.disconnect();
    };
  }, [handleNewNotification, handleNotificationRead, handleAllNotificationsRead]);

  const fetchNotifications = async () => {
    try {
      // The backend endpoint for notifications is on the tasks route
      // This is inconsistent, but I'm following the existing pattern.
      const response = await tasksAPI.getNotifications();
      setNotifications(response.data);
    } catch (err) {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await tasksAPI.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err) {
      // Silent fail for individual notification marking
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await tasksAPI.markAllNotificationsAsRead();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      showSuccess('All notifications marked as read');
    } catch (err) {
      setError('Failed to mark all notifications as read');
    }
  };

  const handleArchiveAll = async () => {
    try {
      await tasksAPI.archiveAllNotifications();
      setNotifications([]);
      showSuccess('All notifications cleared and archived');
    } catch (err) {
      setError('Failed to archive notifications');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'auto_scheduling_completed':
        return '✅';
      case 'auto_scheduling_error':
        return '⚠️';
      case 'weather_conflict':
        return '🌦️';
      case 'calendar_conflict':
        return '📅';
      case 'task_reminder':
        return '⏰';
      case 'goal_completed':
        return '🏆';
      case 'milestone_completed':
        return '🏅';
      case 'new_message':
        return '💬';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'auto_scheduling_completed':
      case 'goal_completed':
      case 'milestone_completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'auto_scheduling_error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'weather_conflict':
      case 'task_reminder':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'calendar_conflict':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'new_message':
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
        >
          <span className="text-xl">🔔</span>
          <div className="animate-pulse">
            <div className="h-2 w-2 bg-gray-400 rounded-full absolute -top-1 -right-1"></div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          )}

          <div className="p-2">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <span className="text-2xl">📭</span>
                <p className="mt-2">No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 mb-2 rounded-lg border ${getNotificationColor(notification.notification_type)} ${
                    !notification.read ? 'ring-2 ring-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <span className="text-lg">{getNotificationIcon(notification.notification_type)}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium mb-1">
                          {notification.title || 'Notification'}
                        </h4>
                        <p className="text-sm opacity-90 mb-2">
                          {notification.message}
                        </p>
                        {notification.details && typeof notification.details === 'object' && (
                          <p className="text-xs opacity-75">
                            {JSON.stringify(notification.details)}
                          </p>
                        )}
                        <p className="text-xs opacity-60 mt-2">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 ml-2"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <button
                onClick={handleArchiveAll}
                className="text-sm text-gray-600 hover:text-red-700"
              >
                Clear & Archive All
              </button>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
};

export default NotificationCenter; 