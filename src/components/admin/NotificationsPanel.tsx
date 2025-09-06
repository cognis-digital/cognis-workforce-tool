import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  CheckCircle, 
  XCircle, 
  Send,
  RefreshCw,
  Filter,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { database } from '../../services/database';
import { notificationService, NotificationType } from '../../services/notificationService';
import { emailTemplateGenerator } from '../../models/emailTemplates';
import { useNotificationActions } from '../../store/appStore';

interface NotificationRecord {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  channel: 'email' | 'in_app' | 'push';
  status: 'sent' | 'pending' | 'failed';
  created_at: string;
  data: Record<string, any>;
  user_name?: string;
  user_email?: string;
}

export default function NotificationsPanel() {
  const { addNotification } = useNotificationActions();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'email' | 'in_app'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [selectedNotificationType, setSelectedNotificationType] = useState<NotificationType | null>(null);
  const [sendingNotification, setSendingNotification] = useState(false);
  
  const pageSize = 10;
  
  useEffect(() => {
    fetchNotifications();
  }, [currentPage, filter, searchQuery]);
  
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Calculate pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      
      // Build query
      let query = database
        .from('notifications')
        .select(`
          id, 
          user_id, 
          type, 
          title, 
          message, 
          channel,
          status,
          created_at,
          data,
          users:user_profiles(display_name, email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      
      // Apply channel filter
      if (filter !== 'all') {
        query = query.eq('channel', filter);
      }
      
      // Apply search if provided
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,message.ilike.%${searchQuery}%`);
      }
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      if (data && count !== null) {
        const formattedData = data.map(item => ({
          id: item.id,
          user_id: item.user_id,
          type: item.type as NotificationType,
          title: item.title,
          message: item.message,
          channel: item.channel as 'email' | 'in_app' | 'push',
          status: item.status as 'sent' | 'pending' | 'failed',
          created_at: item.created_at,
          data: item.data,
          user_name: item.users?.display_name,
          user_email: item.users?.email
        }));
        
        setNotifications(formattedData);
        setTotalPages(Math.ceil(count / pageSize));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load notifications'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };
  
  const getNotificationTypeLabel = (type: NotificationType): string => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Send className="w-4 h-4" />;
      case 'in_app':
        return <Bell className="w-4 h-4" />;
      case 'push':
        return <Bell className="w-4 h-4" />;
      default:
        return null;
    }
  };
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
        return 'bg-blue-500/20 text-blue-400';
      case 'failed':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-white/20 text-white/60';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <RefreshCw className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };
  
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Available notification types for broadcasting
  const broadcastNotificationTypes: NotificationType[] = [
    'subscription_expiring_soon',
    'payment_successful',
    'feature_access_denied',
    'usage_limit_approaching'
  ];
  
  const handleSendBroadcast = async (notificationType: NotificationType) => {
    setSelectedNotificationType(notificationType);
    setShowComposeModal(true);
  };
  
  const handleComposeSubmit = async (formData: { 
    subject: string; 
    message: string; 
    userType: 'all' | 'pro' | 'enterprise'; 
  }) => {
    if (!selectedNotificationType) return;
    
    setSendingNotification(true);
    
    try {
      // This would normally call a server function to send to multiple users
      // Simulated here for demo purposes
      
      // Get target users
      const { data: users, error } = await database
        .from('user_profiles')
        .select('user_id, display_name, email')
        .neq('user_id', 'system');
        
      if (error) throw error;
      
      if (!users || users.length === 0) {
        throw new Error('No users found to send notification');
      }
      
      // Send to each user (would be batched in production)
      let sentCount = 0;
      
      for (const user of users) {
        // In real implementation, this would be a batch operation
        await notificationService.sendEmailNotification(
          user.user_id,
          selectedNotificationType,
          {
            userName: user.display_name,
            userEmail: user.email,
            // Add any other template data as needed
          }
        );
        
        sentCount++;
      }
      
      addNotification({
        type: 'success',
        title: 'Notifications Sent',
        message: `Successfully sent ${sentCount} notifications`
      });
      
      setShowComposeModal(false);
      fetchNotifications();
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Send Failed',
        message: error.message || 'Failed to send notifications'
      });
    } finally {
      setSendingNotification(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 bg-white/5 border border-white/20 rounded-lg py-2 pl-10 pr-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-lg flex items-center p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                filter === 'all' 
                  ? 'bg-primary-500 text-white' 
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('email')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                filter === 'email' 
                  ? 'bg-primary-500 text-white' 
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              Email
            </button>
            <button
              onClick={() => setFilter('in_app')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                filter === 'in_app' 
                  ? 'bg-primary-500 text-white' 
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              In-App
            </button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => fetchNotifications()}
            className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          
          <div className="relative group">
            <button
              className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Send className="w-4 h-4" />
              Send Notification
            </button>
            
            <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-white/20 rounded-lg shadow-lg overflow-hidden w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              {broadcastNotificationTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => handleSendBroadcast(type)}
                  className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center justify-between"
                >
                  {getNotificationTypeLabel(type)}
                  <ChevronRight className="w-4 h-4 text-white/60" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Notifications table */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="p-4 text-white/60 font-medium">Recipient</th>
                <th className="p-4 text-white/60 font-medium">Type</th>
                <th className="p-4 text-white/60 font-medium">Title</th>
                <th className="p-4 text-white/60 font-medium">Channel</th>
                <th className="p-4 text-white/60 font-medium">Status</th>
                <th className="p-4 text-white/60 font-medium">Sent</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center">
                    <div className="flex justify-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                    </div>
                  </td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-white/60">
                    No notifications found
                  </td>
                </tr>
              ) : (
                notifications.map((notification) => (
                  <tr key={notification.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4">
                      <div>
                        <p className="text-white font-medium">{notification.user_name || 'Unknown User'}</p>
                        <p className="text-white/60 text-sm">{notification.user_email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-white">{getNotificationTypeLabel(notification.type)}</span>
                    </td>
                    <td className="p-4 max-w-[200px]">
                      <div className="truncate">
                        <p className="text-white truncate">{notification.title}</p>
                        <p className="text-white/60 text-sm truncate">{notification.message}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 w-fit ${
                        notification.channel === 'email' 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {getChannelIcon(notification.channel)}
                        {notification.channel === 'email' ? 'Email' : 'In-App'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 w-fit ${getStatusClass(notification.status)}`}>
                        {getStatusIcon(notification.status)}
                        {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 text-white/70">
                      {formatDateTime(notification.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center p-4 border-t border-white/10">
            <span className="text-white/60 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Compose Modal would be implemented here */}
      {/* {showComposeModal && selectedNotificationType && (
        <ComposeNotificationModal
          isOpen={showComposeModal}
          onClose={() => setShowComposeModal(false)}
          notificationType={selectedNotificationType}
          onSubmit={handleComposeSubmit}
          isSending={sendingNotification}
        />
      )} */}
    </div>
  );
}
