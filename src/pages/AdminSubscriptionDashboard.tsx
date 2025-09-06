import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { 
  Users, 
  CreditCard, 
  LineChart, 
  Settings, 
  Bell, 
  Calendar,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  ArrowUpDown,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

import { database } from '../services/database';
import { useUserProfile } from '../store/authStore';
import { useNotificationActions } from '../store/appStore';
import { scheduledJobService, ScheduledJobType } from '../services/scheduledJobService';
import SubscribersList from '../components/admin/SubscribersList';
import RevenueMetrics from '../components/admin/RevenueMetrics';
import ScheduledJobsPanel from '../components/admin/ScheduledJobsPanel';
import NotificationsPanel from '../components/admin/NotificationsPanel';

export default function AdminSubscriptionDashboard() {
  const userProfile = useUserProfile();
  const { addNotification } = useNotificationActions();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('subscribers');
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalSubscribers: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    newSubscribersThisMonth: 0,
    expiringSubscriptions: 0,
    conversionRate: 0
  });
  
  useEffect(() => {
    // Check admin permissions
    if (userProfile && userProfile.role !== 'admin') {
      addNotification({
        type: 'error',
        title: 'Access Denied',
        message: 'You do not have permission to access this page.'
      });
      // Would normally redirect here
    } else {
      loadDashboardData();
    }
  }, [userProfile]);
  
  const loadDashboardData = async () => {
    setLoading(true);
    
    try {
      // Load summary metrics
      const { data: metrics, error } = await database.rpc('get_subscription_metrics');
      
      if (error) throw error;
      
      if (metrics) {
        setDashboardMetrics({
          totalSubscribers: metrics.total_subscribers || 0,
          activeSubscriptions: metrics.active_subscriptions || 0,
          monthlyRevenue: metrics.monthly_revenue || 0,
          newSubscribersThisMonth: metrics.new_subscribers_this_month || 0,
          expiringSubscriptions: metrics.expiring_subscriptions || 0,
          conversionRate: metrics.conversion_rate || 0
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load dashboard data'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Trigger a scheduled job manually
  const triggerScheduledJob = async (jobType: ScheduledJobType) => {
    try {
      const result = await scheduledJobService.triggerJobManually(jobType);
      
      addNotification({
        type: result.success ? 'success' : 'error',
        title: result.success ? 'Job Triggered' : 'Job Failed',
        message: result.message
      });
      
      // Refresh data if job was successful
      if (result.success) {
        loadDashboardData();
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: `Failed to trigger job: ${error.message}`
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">Subscription Management</h1>
      <p className="text-white/60 mb-8">
        Admin dashboard for subscription and billing management
      </p>
      
      {/* Summary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white/60 font-medium">Total Subscribers</h3>
            <Users className="w-5 h-5 text-white/40" />
          </div>
          <div className="flex items-end gap-2">
            <p className="text-white text-3xl font-bold">{dashboardMetrics.totalSubscribers}</p>
            <p className="text-green-400 text-sm pb-1">+{dashboardMetrics.newSubscribersThisMonth} this month</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white/60 font-medium">Monthly Revenue</h3>
            <CreditCard className="w-5 h-5 text-white/40" />
          </div>
          <div className="flex items-end gap-2">
            <p className="text-white text-3xl font-bold">${dashboardMetrics.monthlyRevenue.toLocaleString()}</p>
            <p className="text-green-400 text-sm pb-1">Active: {dashboardMetrics.activeSubscriptions}</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white/60 font-medium">Conversion Rate</h3>
            <LineChart className="w-5 h-5 text-white/40" />
          </div>
          <div className="flex items-end gap-2">
            <p className="text-white text-3xl font-bold">{dashboardMetrics.conversionRate}%</p>
            <p className="text-orange-400 text-sm pb-1">{dashboardMetrics.expiringSubscriptions} expiring soon</p>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="border-b border-white/20">
          <TabsTrigger value="subscribers" className="px-4 py-2">
            <Users className="w-4 h-4 mr-2" />
            Subscribers
          </TabsTrigger>
          <TabsTrigger value="revenue" className="px-4 py-2">
            <CreditCard className="w-4 h-4 mr-2" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="jobs" className="px-4 py-2">
            <RefreshCw className="w-4 h-4 mr-2" />
            Scheduled Jobs
          </TabsTrigger>
          <TabsTrigger value="notifications" className="px-4 py-2">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>
        
        {/* Tab Content */}
        <TabsContent value="subscribers">
          <SubscribersList refreshData={loadDashboardData} />
        </TabsContent>
        
        <TabsContent value="revenue">
          <RevenueMetrics />
        </TabsContent>
        
        <TabsContent value="jobs">
          <ScheduledJobsPanel onTriggerJob={triggerScheduledJob} />
        </TabsContent>
        
        <TabsContent value="notifications">
          <NotificationsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
