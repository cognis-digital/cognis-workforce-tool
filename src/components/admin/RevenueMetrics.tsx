import React, { useState, useEffect } from 'react';
import { 
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Wallet,
  CreditCard,
  DollarSign,
  Users,
  ArrowUpDown,
  Download
} from 'lucide-react';
import { database } from '../../services/database';
import { useNotificationActions } from '../../store/appStore';
import { SubscriptionTier } from '../../models/subscriptionTiers';

interface RevenueData {
  date: string;
  revenue: number;
  subscriptions: number;
}

interface TierDistribution {
  name: string;
  value: number;
  color: string;
}

interface PaymentMethodDistribution {
  name: string;
  value: number;
  color: string;
}

export default function RevenueMetrics() {
  const { addNotification } = useNotificationActions();
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7days' | '30days' | '90days' | '12months'>('30days');
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [revenueMetrics, setRevenueMetrics] = useState({
    totalRevenue: 0,
    averageRevenue: 0,
    growthRate: 0,
    conversionRate: 0,
    churnRate: 0,
    lifetime: 0 // in months
  });
  const [tierDistribution, setTierDistribution] = useState<TierDistribution[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodDistribution[]>([]);
  
  useEffect(() => {
    fetchRevenueData();
  }, [timeframe]);
  
  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      // Fetch revenue time series data
      const { data: timeSeriesData, error: timeSeriesError } = await database.rpc(
        'get_revenue_timeseries',
        { timeframe }
      );
      
      if (timeSeriesError) throw timeSeriesError;
      
      if (timeSeriesData) {
        setRevenueData(timeSeriesData);
      }
      
      // Fetch revenue summary metrics
      const { data: metricsData, error: metricsError } = await database.rpc(
        'get_revenue_metrics',
        { timeframe }
      );
      
      if (metricsError) throw metricsError;
      
      if (metricsData) {
        setRevenueMetrics({
          totalRevenue: metricsData.total_revenue || 0,
          averageRevenue: metricsData.average_revenue || 0,
          growthRate: metricsData.growth_rate || 0,
          conversionRate: metricsData.conversion_rate || 0,
          churnRate: metricsData.churn_rate || 0,
          lifetime: metricsData.average_lifetime || 0
        });
      }
      
      // Fetch subscription tier distribution
      const { data: tierData, error: tierError } = await database.rpc(
        'get_subscription_tiers_distribution'
      );
      
      if (tierError) throw tierError;
      
      if (tierData) {
        const tierColors: Record<SubscriptionTier, string> = {
          free: '#6B7280', // gray-500
          basic: '#3B82F6', // blue-500
          pro: '#8B5CF6', // purple-500
          enterprise: '#F59E0B' // amber-500
        };
        
        const formattedTierData = Object.entries(tierData).map(([tier, count]) => ({
          name: tier.charAt(0).toUpperCase() + tier.slice(1),
          value: count as number,
          color: tierColors[tier as SubscriptionTier] || '#6B7280'
        }));
        
        setTierDistribution(formattedTierData);
      }
      
      // Fetch payment method distribution
      const { data: paymentData, error: paymentError } = await database.rpc(
        'get_payment_methods_distribution'
      );
      
      if (paymentError) throw paymentError;
      
      if (paymentData) {
        const paymentColors: Record<string, string> = {
          stripe: '#4F46E5', // indigo-600
          wallet: '#EC4899', // pink-500
          other: '#6B7280' // gray-500
        };
        
        const formattedPaymentData = Object.entries(paymentData).map(([method, count]) => ({
          name: method === 'stripe' ? 'Credit Card' : method.charAt(0).toUpperCase() + method.slice(1),
          value: count as number,
          color: paymentColors[method] || paymentColors.other
        }));
        
        setPaymentMethods(formattedPaymentData);
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load revenue data'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`;
  };
  
  const handleDownloadReport = () => {
    // This would generate a CSV or PDF report
    // Simplified implementation for demo
    addNotification({
      type: 'info',
      title: 'Report Download',
      message: 'Generating revenue report...'
    });
    
    // After a delay, show success
    setTimeout(() => {
      addNotification({
        type: 'success',
        title: 'Report Ready',
        message: 'Revenue report has been generated'
      });
    }, 2000);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl flex overflow-hidden">
          <button
            onClick={() => setTimeframe('7days')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              timeframe === '7days' 
                ? 'bg-primary-500 text-white' 
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeframe('30days')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              timeframe === '30days' 
                ? 'bg-primary-500 text-white' 
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeframe('90days')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              timeframe === '90days' 
                ? 'bg-primary-500 text-white' 
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            90 Days
          </button>
          <button
            onClick={() => setTimeframe('12months')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              timeframe === '12months' 
                ? 'bg-primary-500 text-white' 
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            12 Months
          </button>
        </div>
        
        <button
          onClick={handleDownloadReport}
          className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>
      
      {/* Summary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-white/60 text-sm">Total Revenue</h3>
            <DollarSign className="w-4 h-4 text-white/40" />
          </div>
          <p className="text-white text-2xl font-bold">{formatCurrency(revenueMetrics.totalRevenue)}</p>
          <div className={`flex items-center gap-1 mt-1 text-xs ${
            revenueMetrics.growthRate >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {revenueMetrics.growthRate >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(revenueMetrics.growthRate)}% from previous period
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-white/60 text-sm">Avg Monthly Revenue</h3>
            <Wallet className="w-4 h-4 text-white/40" />
          </div>
          <p className="text-white text-2xl font-bold">{formatCurrency(revenueMetrics.averageRevenue)}</p>
          <p className="text-white/60 text-xs mt-1">
            per subscriber
          </p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-white/60 text-sm">Subscriber Lifetime</h3>
            <Calendar className="w-4 h-4 text-white/40" />
          </div>
          <p className="text-white text-2xl font-bold">{revenueMetrics.lifetime.toFixed(1)} months</p>
          <p className="text-white/60 text-xs mt-1">
            Average subscription duration
          </p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-white/60 text-sm">Conversion Rate</h3>
            <TrendingUp className="w-4 h-4 text-white/40" />
          </div>
          <p className="text-white text-2xl font-bold">{revenueMetrics.conversionRate.toFixed(1)}%</p>
          <p className="text-white/60 text-xs mt-1">
            Free to paid conversion
          </p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-white/60 text-sm">Churn Rate</h3>
            <Users className="w-4 h-4 text-white/40" />
          </div>
          <p className="text-white text-2xl font-bold">{revenueMetrics.churnRate.toFixed(1)}%</p>
          <p className="text-white/60 text-xs mt-1">
            Monthly subscriber loss
          </p>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue over time chart */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-4">
          <h3 className="text-white font-medium mb-4">Revenue Over Time</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={revenueData}
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                <XAxis 
                  dataKey="date"
                  tick={{ fill: '#A0AEC0' }}
                  stroke="#4A5568"
                />
                <YAxis 
                  tickFormatter={formatCurrency}
                  tick={{ fill: '#A0AEC0' }}
                  stroke="#4A5568"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1A202C', 
                    border: '1px solid #2D3748',
                    borderRadius: '0.5rem',
                    color: '#FFFFFF'
                  }}
                  formatter={(value) => [`${formatCurrency(value as number)}`, 'Revenue']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#4F46E5"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="subscriptions"
                  name="Subscriptions"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  yAxisId={1}
                  hide={true} // Toggle this for showing subscriber count
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Distribution charts */}
        <div className="space-y-6">
          {/* Subscription tier chart */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-4">
            <h3 className="text-white font-medium mb-3">Subscription Tiers</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tierDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {tierDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#1A202C', 
                      border: '1px solid #2D3748',
                      borderRadius: '0.5rem',
                      color: '#FFFFFF'
                    }}
                    formatter={(value) => [`${value} subscribers`, 'Count']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Payment method chart */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-4">
            <h3 className="text-white font-medium mb-3">Payment Methods</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethods}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {paymentMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#1A202C', 
                      border: '1px solid #2D3748',
                      borderRadius: '0.5rem',
                      color: '#FFFFFF'
                    }}
                    formatter={(value) => [`${value} subscribers`, 'Count']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
