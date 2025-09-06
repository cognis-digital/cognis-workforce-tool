import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart, 
  Users, 
  CreditCard, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  Calendar,
  Clock
} from 'lucide-react';
import { subscriptionService } from '../services/subscriptionService';
import { walletSubscriptionService } from '../services/walletSubscriptionService';
import { database } from '../services/database';
import { SubscriptionTier, subscriptionPlans } from '../models/subscriptionTiers';
import { useNotificationActions } from '../store/appStore';
import { motion } from 'framer-motion';

// Analytics data interfaces
interface SubscriptionStats {
  activeSubscriptions: number;
  conversionRate: number;
  mrr: number; // Monthly Recurring Revenue
  churnRate: number;
  averageLTV: number; // Lifetime Value
  tierDistribution: Record<SubscriptionTier, number>;
  paymentMethods: {
    stripe: number;
    wallet: number;
  };
  revenueByDay: {
    date: string;
    revenue: number;
  }[];
}

interface GrowthMetric {
  label: string;
  value: number | string;
  change: number;
  isPositive: boolean;
  icon: React.ElementType;
}

export default function SubscriptionAnalytics() {
  const { addNotification } = useNotificationActions();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  
  // Growth metrics to highlight
  const growthMetrics: GrowthMetric[] = [
    {
      label: 'Active Subscriptions',
      value: stats?.activeSubscriptions || 0,
      change: 12.5,
      isPositive: true,
      icon: Users
    },
    {
      label: 'Monthly Revenue',
      value: `$${stats?.mrr?.toLocaleString() || 0}`,
      change: 8.2,
      isPositive: true,
      icon: TrendingUp
    },
    {
      label: 'Conversion Rate',
      value: `${stats?.conversionRate || 0}%`,
      change: 3.1,
      isPositive: true,
      icon: ArrowUpRight
    },
    {
      label: 'Churn Rate',
      value: `${stats?.churnRate || 0}%`,
      change: 0.8,
      isPositive: false,
      icon: ArrowDownRight
    }
  ];
  
  useEffect(() => {
    fetchSubscriptionStats();
  }, [selectedTimeframe]);
  
  const fetchSubscriptionStats = async () => {
    setLoading(true);
    try {
      // In a production environment, this would call an API endpoint
      // Here we're simulating the data for demonstration purposes
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate simulated subscription data
      const simulatedData: SubscriptionStats = {
        activeSubscriptions: 142 + Math.floor(Math.random() * 20),
        conversionRate: 8.3 + (Math.random() * 2),
        mrr: 7850 + Math.floor(Math.random() * 1000),
        churnRate: 4.2 + (Math.random() * 1.5),
        averageLTV: 324 + Math.floor(Math.random() * 50),
        tierDistribution: {
          free: 65,
          basic: 48,
          pro: 21,
          enterprise: 8
        },
        paymentMethods: {
          stripe: 58,
          wallet: 42
        },
        revenueByDay: Array(30).fill(0).map((_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          revenue: 200 + Math.floor(Math.random() * 300)
        }))
      };
      
      setStats(simulatedData);
    } catch (error) {
      console.error('Error fetching subscription stats:', error);
      addNotification({
        type: 'error',
        title: 'Analytics Error',
        message: 'Failed to load subscription analytics data.'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Subscription Analytics</h1>
        <p className="text-white/60">
          Track subscription performance, conversion rates, and revenue metrics
        </p>
      </div>
      
      {/* Time Range Selector */}
      <div className="flex bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-1">
        {(['7d', '30d', '90d', 'all'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setSelectedTimeframe(range)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              selectedTimeframe === range
                ? 'bg-primary-500/30 text-primary-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {range === '7d' ? 'Last 7 Days' : 
             range === '30d' ? 'Last 30 Days' : 
             range === '90d' ? 'Last 90 Days' : 'All Time'}
          </button>
        ))}
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {growthMetrics.map((metric, index) => {
          const Icon = metric.icon;
          
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-white/60 text-sm mb-1">{metric.label}</h3>
                  <div className="text-2xl font-bold text-white">{metric.value}</div>
                </div>
                <div className={`p-3 rounded-xl ${
                  metric.label.includes('Churn')
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-green-500/20 text-green-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              
              <div className="flex items-center gap-1 mt-4">
                <div className={`flex items-center gap-1 ${
                  metric.isPositive
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}>
                  {metric.isPositive ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">{metric.change}%</span>
                </div>
                <span className="text-white/60 text-xs">vs. previous period</span>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-medium text-lg">Revenue Over Time</h3>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-white/60" />
              <span className="text-white/60 text-sm">
                {selectedTimeframe === '7d' ? 'Last 7 Days' : 
                 selectedTimeframe === '30d' ? 'Last 30 Days' : 
                 selectedTimeframe === '90d' ? 'Last 90 Days' : 'All Time'}
              </span>
            </div>
          </div>
          
          <div className="h-64 relative">
            {/* Chart container - In a real app, use a charting library */}
            <div className="absolute inset-0">
              {stats && (
                <div className="flex items-end justify-between h-full w-full pt-6">
                  {stats.revenueByDay.slice(-15).map((day, index) => (
                    <div key={day.date} className="flex flex-col items-center h-full">
                      <div 
                        className="w-6 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-sm" 
                        style={{ height: `${(day.revenue / 500) * 100}%` }}
                      ></div>
                      {index % 3 === 0 && (
                        <div className="text-white/40 text-[10px] mt-2 rotate-45 origin-left">
                          {day.date.split('-')[2]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                  <div className="animate-spin w-8 h-8 border-2 border-white/10 border-t-white/80 rounded-full"></div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
        
        {/* Subscription Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6"
        >
          <h3 className="text-white font-medium text-lg mb-6">Subscription Distribution</h3>
          
          {stats && (
            <div className="space-y-4">
              {Object.entries(stats.tierDistribution).map(([tier, count]) => {
                const plan = subscriptionPlans.find(p => p.id === tier);
                const total = Object.values(stats.tierDistribution).reduce((a, b) => a + b, 0);
                const percentage = Math.round((count / total) * 100);
                
                return (
                  <div key={tier} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white">{plan?.name || tier}</span>
                      <span className="text-white/60">{percentage}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          tier === 'free' ? 'bg-gray-400' : 
                          tier === 'basic' ? 'bg-blue-400' : 
                          tier === 'pro' ? 'bg-purple-400' : 
                          'bg-amber-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Payment Methods & User Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Methods */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6"
        >
          <h3 className="text-white font-medium text-lg mb-6">Payment Methods</h3>
          
          {stats && (
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full relative flex items-center justify-center mb-4">
                  <div className="absolute inset-0 rounded-full border-8 border-white/10"></div>
                  <div 
                    className="absolute inset-0 rounded-full border-8 border-blue-400" 
                    style={{ 
                      clipPath: `polygon(0 0, 100% 0, 100% 100%, 0% 100%)`,
                      opacity: 0.8,
                      transform: `rotate(${stats.paymentMethods.stripe / 100 * 360 + 90}deg)`
                    }}
                  ></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{stats.paymentMethods.stripe}%</div>
                    <div className="text-white/60 text-xs">Stripe</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  <span className="text-white">Credit Card</span>
                </div>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full relative flex items-center justify-center mb-4">
                  <div className="absolute inset-0 rounded-full border-8 border-white/10"></div>
                  <div 
                    className="absolute inset-0 rounded-full border-8 border-purple-400" 
                    style={{ 
                      clipPath: `polygon(0 0, 100% 0, 100% 100%, 0% 100%)`,
                      opacity: 0.8,
                      transform: `rotate(${stats.paymentMethods.wallet / 100 * 360 + 90}deg)`
                    }}
                  ></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{stats.paymentMethods.wallet}%</div>
                    <div className="text-white/60 text-xs">Wallet</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-purple-400" />
                  <span className="text-white">Crypto Wallet</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
        
        {/* User Metrics */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6"
        >
          <h3 className="text-white font-medium text-lg mb-6">Lifetime Value & Retention</h3>
          
          {stats && (
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="bg-white/10 p-4 rounded-xl w-20 h-20 flex items-center justify-center">
                  <Clock className="w-10 h-10 text-green-400" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">${stats.averageLTV}</div>
                  <div className="text-white/60">Average Lifetime Value</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-xl">
                  <div className="text-xl font-bold text-white">{stats.churnRate}%</div>
                  <div className="text-white/60 text-sm">Monthly Churn</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <div className="text-xl font-bold text-white">{100 - stats.churnRate}%</div>
                  <div className="text-white/60 text-sm">Retention Rate</div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
