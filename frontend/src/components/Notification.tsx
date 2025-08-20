import React, { useEffect, useState } from 'react';
import { eventBus } from '../services/eventBus';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export function NotificationContainer() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubscribe = eventBus.subscribe('notification', (data: Notification) => {
      const id = Math.random().toString(36).substr(2, 9);
      const notification = { ...data, id };
      setNotifications(prev => [...prev, notification]);

      // Auto-remove after duration
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, data.duration || 5000);
    });

    return () => unsubscribe();
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ${
            notification.type === 'success' ? 'bg-green-500 text-white' :
            notification.type === 'error' ? 'bg-red-500 text-white' :
            notification.type === 'warning' ? 'bg-yellow-500 text-white' :
            'bg-blue-500 text-white'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="font-medium">{notification.message}</div>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
