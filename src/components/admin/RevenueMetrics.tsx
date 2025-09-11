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
// Use mock data instead of actual database calls
// import { database } from '../../services/database';
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
  
  // Helper function for random variations
  const variation = (base: number, percent: number): number => {
    return base * (1 + (Math.random() * percent - percent/2));
  };

  // Generate mock revenue time series data based on timeframe
  const generateMockRevenueData = (): RevenueData[] => {
    const days = timeframe === '7days' ? 7 : 
                timeframe === '30days' ? 30 : 
                timeframe === '90days' ? 90 : 12;
    
    const mockData: RevenueData[] = [];
    const baseDate = new Date();
    
    if (timeframe === '12months') {
      baseDate.setMonth(baseDate.getMonth() - days + 1);
      baseDate.setDate(1); // Start from the 1st of the month
    } else {
      baseDate.setDate(baseDate.getDate() - days + 1);
    }
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(baseDate);
      
      if (timeframe === '12months') {
        currentDate.setMonth(currentDate.getMonth() + i);
      } else {
        currentDate.setDate(currentDate.getDate() + i);
      }
      
      // Format date based on timeframe
      let dateStr;
      if (timeframe === '12months') {
        dateStr = currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } else {
        dateStr = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      const revenue = Math.floor(5000 + Math.random() * 10000);
      const subscriptions = Math.floor(50 + Math.random() * 100);
      
      mockData.push({
        date: dateStr,
        revenue,
        subscriptions
      });
    }
    
    return mockData;
  };
  
  // Generate mock revenue metrics data
  const generateMockMetricsData = () => {
    // Base values that look reasonable
    const baseRevenue = timeframe === '7days' ? 35000 : 
                        timeframe === '30days' ? 150000 : 
                        timeframe === '90days' ? 450000 : 1800000;
    
    const growthMultiplier = timeframe === '7days' ? 0.5 : 
                            timeframe === '30days' ? 1 : 
                            timeframe === '90days' ? 2 : 3;
    
    return {
      total_revenue: variation(baseRevenue, 0.1),
      average_revenue: variation(75, 0.2),
      growth_rate: variation(5, 0.5) * growthMultiplier,
      conversion_rate: variation(8, 0.3),
      churn_rate: variation(4, 0.4),
      average_lifetime: variation(6, 0.2)
    };
  };
  
  // Generate mock tier distribution data
  const generateMockTierData = () => {
    return {
      free: Math.round(variation(120, 0.2)),
      basic: Math.round(variation(80, 0.15)),
      pro: Math.round(variation(40, 0.25)),
      enterprise: Math.round(variation(10, 0.3))
    };
  };
  
  // Generate mock payment method distribution
  const generateMockPaymentData = () => {
    return {
      stripe: Math.round(variation(160, 0.15)),
      wallet: Math.round(variation(70, 0.2)),
      other: Math.round(variation(20, 0.4))
    };
  };
  
  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Generate mock time series data
      const timeSeriesData = generateMockRevenueData();
      setRevenueData(timeSeriesData);
      
      // Generate mock metrics data
      const metricsData = generateMockMetricsData();
      setRevenueMetrics({
        totalRevenue: metricsData.total_revenue || 0,
        averageRevenue: metricsData.average_revenue || 0,
        growthRate: metricsData.growth_rate || 0,
        conversionRate: metricsData.conversion_rate || 0,
        churnRate: metricsData.churn_rate || 0,
        lifetime: metricsData.average_lifetime || 0
      });
      
      // Generate mock tier distribution data
      const tierData = generateMockTierData();
      const tierColors: Record<string, string> = {
        free: '#6B7280',    // gray-500
        basic: '#3B82F6',   // blue-500
        pro: '#8B5CF6',     // purple-500
        enterprise: '#F59E0B' // amber-500
      };
      
      const tierDistributionData: TierDistribution[] = [
        { name: 'Free', value: tierData.free, color: tierColors.free },
        { name: 'Basic', value: tierData.basic, color: tierColors.basic },
        { name: 'Pro', value: tierData.pro, color: tierColors.pro },
        { name: 'Enterprise', value: tierData.enterprise, color: tierColors.enterprise }
      ];
      
      setTierDistribution(tierDistributionData);
      
      // Generate mock payment method distribution data
      const paymentData = generateMockPaymentData();
      const paymentMethodColors: Record<string, string> = {
        stripe: '#4F46E5',  // indigo-600
        wallet: '#10B981',  // emerald-500
        other: '#9CA3AF'    // gray-400
      };
      
      const paymentMethodData: PaymentMethodDistribution[] = [
        { name: 'Credit Card', value: paymentData.stripe, color: paymentMethodColors.stripe },
        { name: 'Wallet', value: paymentData.wallet, color: paymentMethodColors.wallet },
        { name: 'Other', value: paymentData.other, color: paymentMethodColors.other }
      ];
      
      setPaymentMethods(paymentMethodData);
    } catch (error: any) {
      console.error('Error fetching revenue data:', error);
      if (addNotification) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: error.message || 'Failed to load revenue data'
        });
      }
      
      // Provide fallback mock data on error
      provideFallbackData();
    } finally {
      setLoading(false);
    }
  };
  
  // Provide fallback data in case of errors
  const provideFallbackData = () => {
    // Generate basic mock data for UI
    const timeSeriesData = generateMockRevenueData();
    setRevenueData(timeSeriesData);
    
    const metricsData = generateMockMetricsData();
    setRevenueMetrics({
      totalRevenue: metricsData.total_revenue || 0,
      averageRevenue: metricsData.average_revenue || 0,
      growthRate: metricsData.growth_rate || 0,
      conversionRate: metricsData.conversion_rate || 0,
      churnRate: metricsData.churn_rate || 0,
      lifetime: metricsData.average_lifetime || 0
    });
    
    // Generate tier distribution
    const tierData = generateMockTierData();
    const colors = {
      free: '#6B7280',    // gray-500
      basic: '#3B82F6',   // blue-500
      pro: '#8B5CF6',     // purple-500
      enterprise: '#F59E0B' // amber-500
    };
    
    setTierDistribution([
      { name: 'Free', value: tierData.free, color: colors.free },
      { name: 'Basic', value: tierData.basic, color: colors.basic },
      { name: 'Pro', value: tierData.pro, color: colors.pro },
      { name: 'Enterprise', value: tierData.enterprise, color: colors.enterprise }
    ]);
    
    // Generate payment methods
    const paymentData = generateMockPaymentData();
    setPaymentMethods([
      { name: 'Credit Card', value: paymentData.stripe, color: '#4F46E5' },
      { name: 'Wallet', value: paymentData.wallet, color: '#10B981' },
      { name: 'Other', value: paymentData.other, color: '#9CA3AF' }
    ]);
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };
  
  const getGrowthIcon = (value: number) => {
    return value >= 0 ? 
      <TrendingUp className="w-5 h-5 text-green-500" /> : 
      <TrendingDown className="w-5 h-5 text-red-500" />;
  };
  
  const handleTimeframeChange = (newTimeframe: '7days' | '30days' | '90days' | '12months') => {
    setTimeframe(newTimeframe);
  };
  
  const getActiveButtonClass = (buttonTimeframe: string) => {
    return timeframe === buttonTimeframe
      ? 'bg-primary-500 text-white'
      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white';
  };
  
  return (
    <div className="space-y-8">
      {/* Timeframe selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Revenue Analytics</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => handleTimeframeChange('7days')}
            className={`px-3 py-1.5 rounded-md transition-colors ${getActiveButtonClass('7days')}`}
          >
            7 Days
          </button>
          <button 
            onClick={() => handleTimeframeChange('30days')}
            className={`px-3 py-1.5 rounded-md transition-colors ${getActiveButtonClass('30days')}`}
          >
            30 Days
          </button>
          <button 
            onClick={() => handleTimeframeChange('90days')}
            className={`px-3 py-1.5 rounded-md transition-colors ${getActiveButtonClass('90days')}`}
          >
            90 Days
          </button>
          <button 
            onClick={() => handleTimeframeChange('12months')}
            className={`px-3 py-1.5 rounded-md transition-colors ${getActiveButtonClass('12months')}`}
          >
            12 Months
          </button>
        </div>
      </div>
      
      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/20">
          <div className="flex justify-between">
            <p className="text-white/70">Total Revenue</p>
            <DollarSign className="w-5 h-5 text-primary-500" />
          </div>
          <p className="text-2xl font-semibold text-white mt-2">{formatCurrency(revenueMetrics.totalRevenue)}</p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/20">
          <div className="flex justify-between">
            <p className="text-white/70">Growth Rate</p>
            {getGrowthIcon(revenueMetrics.growthRate)}
          </div>
          <p className="text-2xl font-semibold text-white mt-2">{formatPercentage(revenueMetrics.growthRate)}</p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/20">
          <div className="flex justify-between">
            <p className="text-white/70">Average Revenue</p>
            <Users className="w-5 h-5 text-primary-500" />
          </div>
          <p className="text-2xl font-semibold text-white mt-2">{formatCurrency(revenueMetrics.averageRevenue)}/user</p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/20">
          <div className="flex justify-between">
            <p className="text-white/70">Conversion Rate</p>
            <ArrowUpDown className="w-5 h-5 text-primary-500" />
          </div>
          <p className="text-2xl font-semibold text-white mt-2">{formatPercentage(revenueMetrics.conversionRate)}</p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/20">
          <div className="flex justify-between">
            <p className="text-white/70">Churn Rate</p>
            <ArrowUpDown className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-semibold text-white mt-2">{formatPercentage(revenueMetrics.churnRate)}</p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/20">
          <div className="flex justify-between">
            <p className="text-white/70">Customer Lifetime</p>
            <Calendar className="w-5 h-5 text-primary-500" />
          </div>
          <p className="text-2xl font-semibold text-white mt-2">{revenueMetrics.lifetime.toFixed(1)} months</p>
        </div>
      </div>
      
      {/* Revenue chart */}
      <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/20">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">Revenue Trend</h3>
          <button className="text-white/70 hover:text-white flex items-center gap-1 text-sm">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
        
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'rgba(255,255,255,0.7)' }} 
                  axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                />
                <YAxis 
                  tick={{ fill: 'rgba(255,255,255,0.7)' }} 
                  axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '0.5rem' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value: any) => [`$${value}`, 'Revenue']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Revenue" 
                  stroke="#8B5CF6" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      
      {/* Distribution charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subscription tiers */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/20">
          <h3 className="text-lg font-medium text-white mb-4">Subscription Tiers</h3>
          
          {loading ? (
            <div className="h-60 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tierDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {tierDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [value, 'Users']}
                    contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '0.5rem' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        
        {/* Payment methods */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/20">
          <h3 className="text-lg font-medium text-white mb-4">Payment Methods</h3>
          
          {loading ? (
            <div className="h-60 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentMethods} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    type="number" 
                    tick={{ fill: 'rgba(255,255,255,0.7)' }} 
                    axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fill: 'rgba(255,255,255,0.7)' }} 
                    axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  />
                  <Tooltip 
                    formatter={(value: any) => [value, 'Subscribers']}
                    contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '0.5rem' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="value" name="Subscribers">
                    {paymentMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
