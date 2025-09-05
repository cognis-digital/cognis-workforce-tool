import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useNotifications, useNotificationActions } from '../../store/appStore';

export function Toaster() {
  const notifications = useNotifications();
  const { markNotificationRead } = useNotificationActions();
  const visibleNotifications = notifications.filter(n => !n.read).slice(0, 5);

  useEffect(() => {
    // Auto-dismiss notifications after 5 seconds
    const timers = visibleNotifications.map(notification => {
      return setTimeout(() => {
        markNotificationRead(notification.id);
      }, 5000);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [visibleNotifications, markNotificationRead]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'error': return XCircle;
      case 'warning': return AlertTriangle;
      default: return Info;
    }
  };

  const getColors = (type: string) => {
    switch (type) {
      case 'success': return 'bg-success-500/20 border-success-500/30 text-success-400';
      case 'error': return 'bg-error-500/20 border-error-500/30 text-error-400';
      case 'warning': return 'bg-warning-500/20 border-warning-500/30 text-warning-400';
      default: return 'bg-primary-600/20 border-primary-600/30 text-primary-400';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      <AnimatePresence>
        {visibleNotifications.map((notification) => {
          const Icon = getIcon(notification.type);
          const colors = getColors(notification.type);
          
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.3 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.5 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
              className={`${colors} border backdrop-blur-xl rounded-xl p-4 shadow-lg`}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-text-heading mb-1">{notification.title}</h4>
                  <p className="text-sm text-text-body">{notification.message}</p>
                </div>
                <button
                  onClick={() => markNotificationRead(notification.id)}
                  className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}