import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  ChevronRight, 
  ChevronLeft, 
  Edit, 
  Clock, 
  UserCog,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { database } from '../../services/database';
import { subscriptionRenewalService } from '../../services/subscriptionRenewalService';
import { SubscriptionTier } from '../../models/subscriptionTiers';
import { useNotificationActions } from '../../store/appStore';

interface SubscriberData {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  tier: SubscriptionTier;
  subscription_started: string;
  subscription_ends_at: string | null;
  billing_status: 'active' | 'expired' | 'canceled' | 'trial';
  payment_method: 'stripe' | 'wallet' | string;
  auto_renew: boolean;
}

interface SubscribersListProps {
  refreshData: () => void;
}

export default function SubscribersList({ refreshData }: SubscribersListProps) {
  const { addNotification } = useNotificationActions();
  const [subscribers, setSubscribers] = useState<SubscriberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof SubscriberData>('subscription_ends_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<SubscriberData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  
  const pageSize = 10;
  
  useEffect(() => {
    fetchSubscribers();
  }, [currentPage, sortField, sortDirection, searchQuery]);
  
  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      // Calculate pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      
      // Simplify query structure for compatibility
      let query = database.from('user_profiles');
      
      // Fetch with basic parameters
      const { data, error } = await query.select(`
        id, 
        user_id, 
        display_name, 
        email, 
        tier, 
        subscription_started:created_at,
        subscription_ends_at,
        subscription_settings:subscription_settings(auto_renew, payment_method)
      `);
      
      // Filter results in memory for demo purposes
      // In production, you would use proper database filtering
      const filtered = data ? data.filter(item => {
        // Filter by tier
        if (item.tier === 'free') return false;
        
        // Filter by search
        if (searchQuery && !item.display_name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        
        return true;
      }) : [];
      
      // Apply sorting in memory
      const sorted = [...filtered].sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
      
      // Apply pagination in memory
      const paginated = sorted.slice(from, from + pageSize);
      
      // Approximate count for pagination
      const totalRecords = data ? data.length : 0;
      const count = Math.max(totalRecords * 5, 50); // Approximation for demo
      
      if (error) throw error;
      
      if (paginated && count !== null) {
        const formattedData = paginated.map(item => ({
          id: item.id,
          user_id: item.user_id,
          display_name: item.display_name,
          email: item.email,
          tier: item.tier,
          subscription_started: item.subscription_started,
          subscription_ends_at: item.subscription_ends_at,
          billing_status: getBillingStatus(item),
          payment_method: item.subscription_settings?.[0]?.payment_method || 'stripe',
          auto_renew: item.subscription_settings?.[0]?.auto_renew || false
        }));
        
        setSubscribers(formattedData);
        setTotalPages(Math.ceil(count / pageSize));
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load subscribers'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const getBillingStatus = (user: any): 'active' | 'expired' | 'canceled' | 'trial' => {
    const now = new Date();
    const endDate = user.subscription_ends_at ? new Date(user.subscription_ends_at) : null;
    
    if (!endDate) return 'canceled';
    
    if (endDate < now) {
      return 'expired';
    }
    
    // Check if still in trial period (30 days from start)
    const startDate = new Date(user.subscription_started);
    const trialEnd = new Date(startDate);
    trialEnd.setDate(trialEnd.getDate() + 30);
    
    if (now < trialEnd) {
      return 'trial';
    }
    
    return 'active';
  };
  
  const handleSort = (field: keyof SubscriberData) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const handleEditUser = (user: SubscriberData) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };
  
  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  const handleProcessRenewal = async (userId: string) => {
    setProcessingUser(userId);
    
    try {
      const user = subscribers.find(s => s.user_id === userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      const result = await subscriptionRenewalService.manualRenewal(
        userId,
        user.payment_method,
        user.tier
      );
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Subscription Renewed',
          message: `Subscription renewed until ${result.newExpirationDate?.toLocaleDateString()}`
        });
        
        // Refresh the data
        fetchSubscribers();
        refreshData();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Renewal Failed',
        message: error.message || 'Failed to process renewal'
      });
    } finally {
      setProcessingUser(null);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'trial': return 'bg-blue-500/20 text-blue-400';
      case 'expired': return 'bg-red-500/20 text-red-400';
      case 'canceled': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-white/20 text-white/60';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'trial': return <Clock className="w-4 h-4" />;
      case 'expired': return <AlertTriangle className="w-4 h-4" />;
      case 'canceled': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
          <input
            type="text"
            placeholder="Search subscribers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-80 bg-white/5 border border-white/20 rounded-lg py-2 pl-10 pr-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        </div>
        
        <button 
          onClick={() => fetchSubscribers()}
          className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>
      
      <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th 
                  className="p-4 text-white/60 font-medium cursor-pointer"
                  onClick={() => handleSort('display_name')}
                >
                  <div className="flex items-center gap-1">
                    Subscriber
                    {sortField === 'display_name' && (
                      <ArrowUpDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="p-4 text-white/60 font-medium cursor-pointer"
                  onClick={() => handleSort('tier')}
                >
                  <div className="flex items-center gap-1">
                    Plan
                    {sortField === 'tier' && (
                      <ArrowUpDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="p-4 text-white/60 font-medium cursor-pointer"
                  onClick={() => handleSort('subscription_ends_at')}
                >
                  <div className="flex items-center gap-1">
                    Expiration
                    {sortField === 'subscription_ends_at' && (
                      <ArrowUpDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="p-4 text-white/60 font-medium cursor-pointer"
                  onClick={() => handleSort('billing_status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    {sortField === 'billing_status' && (
                      <ArrowUpDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="p-4 text-white/60 font-medium cursor-pointer"
                  onClick={() => handleSort('payment_method')}
                >
                  <div className="flex items-center gap-1">
                    Payment
                    {sortField === 'payment_method' && (
                      <ArrowUpDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="p-4 text-white/60 font-medium text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-white/60">
                    <div className="flex justify-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                    </div>
                  </td>
                </tr>
              ) : subscribers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-white/60">
                    No subscribers found
                  </td>
                </tr>
              ) : (
                subscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4">
                      <div>
                        <p className="text-white font-medium">{subscriber.display_name}</p>
                        <p className="text-white/60 text-sm">{subscriber.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="capitalize text-white">{subscriber.tier}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-white">{formatDate(subscriber.subscription_ends_at)}</span>
                        {subscriber.auto_renew && (
                          <span className="text-green-400 text-xs flex items-center gap-1 mt-1">
                            <RefreshCw className="w-3 h-3" /> Auto-renews
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 w-fit ${getStatusColor(subscriber.billing_status)}`}>
                        {getStatusIcon(subscriber.billing_status)}
                        {subscriber.billing_status.charAt(0).toUpperCase() + subscriber.billing_status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-white capitalize">
                        {subscriber.payment_method === 'stripe' ? 'Credit Card' : subscriber.payment_method}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEditUser(subscriber)}
                          className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors"
                          title="Edit Subscriber"
                        >
                          <UserCog className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleProcessRenewal(subscriber.user_id)}
                          disabled={processingUser === subscriber.user_id}
                          className="bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 p-2 rounded-lg transition-colors disabled:opacity-50"
                          title="Process Renewal"
                        >
                          {processingUser === subscriber.user_id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </button>
                      </div>
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
      
      {/* User edit modal would be implemented here */}
      {/* {showEditModal && selectedUser && (
        <EditSubscriberModal
          user={selectedUser}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            setShowEditModal(false);
            fetchSubscribers();
          }}
        />
      )} */}
    </div>
  );
}
