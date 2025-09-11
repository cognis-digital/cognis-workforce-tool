import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CreditCard, 
  Wallet, 
  Settings, 
  Calendar, 
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  AlertTriangle,
  Copy,
  ExternalLink,
  RefreshCw,
  DollarSign
} from 'lucide-react';

import { useUserProfile } from '../store/authStore';
import { useNotificationActions } from '../store/appStore';
import { subscriptionRenewalService, RenewalSettings } from '../services/subscriptionRenewalService';
import { subscriptionPlans } from '../models/subscriptionTiers';
import { motion } from 'framer-motion';

export default function SubscriptionManagement() {
  const userProfile = useUserProfile();
  const navigate = useNavigate();
  const { addNotification } = useNotificationActions();
  
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [renewalSettings, setRenewalSettings] = useState<RenewalSettings | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  
  // Form state for renewal settings
  const [autoRenew, setAutoRenew] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [receiveReminders, setReceiveReminders] = useState(true);
  const [selectedReminderDays, setSelectedReminderDays] = useState<number[]>([1, 3, 7]);
  
  useEffect(() => {
    fetchSubscriptionData();
  }, [userProfile]);
  
  const fetchSubscriptionData = async () => {
    if (!userProfile) return;
    
    setLoading(true);
    
    try {
      // Fetch renewal settings
      const settings = await subscriptionRenewalService.getUserRenewalSettings(userProfile.user_id);
      setRenewalSettings(settings);
      
      // Update form state
      setAutoRenew(settings.autoRenew);
      setPaymentMethod(settings.paymentMethod);
      setReceiveReminders(settings.receiveRenewalReminders);
      setSelectedReminderDays(settings.reminderDays);
      
      // Fetch transaction history (simulated for demo)
      const mockTransactions = [
        {
          id: 'txn_12345',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount: getPlanPrice(userProfile.tier),
          status: 'completed',
          paymentMethod: settings.paymentMethod,
          description: `Subscription payment for ${userProfile.tier} plan`
        },
        {
          id: 'txn_12344',
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          amount: getPlanPrice(userProfile.tier),
          status: 'completed',
          paymentMethod: settings.paymentMethod,
          description: `Subscription payment for ${userProfile.tier} plan`
        }
      ];
      
      setTransactionHistory(mockTransactions);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load subscription data'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveSettings = async () => {
    if (!userProfile) return;
    
    setLoading(true);
    
    try {
      const updatedSettings: RenewalSettings = {
        autoRenew,
        paymentMethod,
        receiveRenewalReminders: receiveReminders,
        reminderDays: selectedReminderDays
      };
      
      const success = await subscriptionRenewalService.updateRenewalSettings(
        userProfile.user_id,
        updatedSettings
      );
      
      if (success) {
        addNotification({
          type: 'success',
          title: 'Settings Updated',
          message: 'Your subscription settings have been updated'
        });
        
        // Update local state
        setRenewalSettings(updatedSettings);
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to save subscription settings'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleRenewalNow = async () => {
    if (!userProfile) return;
    
    setProcessingPayment(true);
    
    try {
      const result = await subscriptionRenewalService.manualRenewal(
        userProfile.user_id,
        paymentMethod,
        userProfile.tier
      );
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Renewal Successful',
          message: `Your subscription has been renewed until ${result.newExpirationDate?.toLocaleDateString()}`
        });
        
        // Refresh the data
        fetchSubscriptionData();
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Error processing renewal:', error);
      addNotification({
        type: 'error',
        title: 'Renewal Failed',
        message: error instanceof Error ? error.message : 'Failed to process renewal payment'
      });
    } finally {
      setProcessingPayment(false);
    }
  };
  
  const handleToggleReminderDay = (day: number) => {
    if (selectedReminderDays.includes(day)) {
      setSelectedReminderDays(selectedReminderDays.filter(d => d !== day));
    } else {
      setSelectedReminderDays([...selectedReminderDays, day].sort((a, b) => a - b));
    }
  };
  
  const getPlanPrice = (tier: string): number => {
    const plan = subscriptionPlans.find(p => p.id === tier);
    return plan?.price || 0;
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };
  
  const getExpirationInfo = () => {
    if (!userProfile || !userProfile.subscription_ends_at) {
      return { date: 'N/A', daysLeft: 0, expired: false };
    }
    
    const expirationDate = new Date(userProfile.subscription_ends_at);
    const now = new Date();
    const daysLeft = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      date: expirationDate.toLocaleDateString(),
      daysLeft: Math.max(0, daysLeft),
      expired: daysLeft <= 0
    };
  };
  
  const expirationInfo = getExpirationInfo();
  const currentPlan = subscriptionPlans.find(p => p.id === userProfile?.tier) || subscriptionPlans[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Subscription Management</h1>
        <p className="text-white/60">
          Manage your subscription settings, renewal preferences, and billing history
        </p>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Current Subscription Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`bg-gradient-to-r ${
              (userProfile?.tier as string) === 'free' ? 'from-gray-700/50 to-gray-800/50 border-gray-600/30' :
              (userProfile?.tier as string) === 'basic' ? 'from-blue-700/30 to-blue-800/30 border-blue-500/30' :
              (userProfile?.tier as string) === 'pro' ? 'from-purple-700/30 to-purple-800/30 border-purple-500/30' :
              'from-amber-700/30 to-amber-800/30 border-amber-500/30'
            } backdrop-blur-xl border rounded-2xl p-6`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-3 h-3 rounded-full ${
                    expirationInfo.expired ? 'bg-red-500' : 'bg-green-500'
                  }`}></div>
                  <h2 className="text-white font-medium">Current Subscription</h2>
                </div>
                
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-white">{currentPlan.name}</h3>
                  {userProfile?.tier !== 'free' && (
                    <span className="text-white/60">
                      ({formatCurrency(getPlanPrice(userProfile?.tier || 'free'))}/month)
                    </span>
                  )}
                </div>
                
                {userProfile?.tier !== 'free' && (
                  <p className={`mt-1 text-sm ${
                    expirationInfo.expired ? 'text-red-400' : 
                    expirationInfo.daysLeft < 7 ? 'text-orange-400' :
                    'text-white/60'
                  }`}>
                    {expirationInfo.expired ? (
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Expired on {expirationInfo.date}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Expires on {expirationInfo.date} ({expirationInfo.daysLeft} days left)
                      </span>
                    )}
                  </p>
                )}
              </div>
              
              <div className="flex gap-3">
                {userProfile?.tier !== 'free' && (
                  <button
                    onClick={handleRenewalNow}
                    disabled={processingPayment}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {processingPayment ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Renew Now
                      </>
                    )}
                  </button>
                )}
                
                <button
                  onClick={() => navigate('/pricing')}
                  className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                  {userProfile?.tier === 'free' ? (
                    <>
                      <DollarSign className="w-4 h-4" />
                      Upgrade Plan
                    </>
                  ) : (
                    <>
                      <Settings className="w-4 h-4" />
                      Change Plan
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Feature list for current plan */}
            {userProfile?.tier !== 'free' && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-white/80">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>{userProfile?.tier === 'enterprise' ? 'Unlimited' : userProfile?.tier === 'pro' ? '10' : '3'} AI Agents</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>{userProfile?.tier === 'enterprise' ? 'Unlimited' : userProfile?.tier === 'pro' ? '500' : '50'} Document Uploads</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>{userProfile?.tier === 'enterprise' ? 'Unlimited' : userProfile?.tier === 'pro' ? '500' : '100'} Lead Searches</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>{userProfile?.tier === 'enterprise' ? '100GB' : userProfile?.tier === 'pro' ? '10GB' : '1GB'} Storage</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>{userProfile?.tier === 'enterprise' ? 'Priority' : userProfile?.tier === 'pro' ? 'Advanced' : 'Standard'} Support</span>
                </div>
                {userProfile?.tier === 'enterprise' && (
                  <div className="flex items-center gap-2 text-white/80">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Dedicated Account Manager</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
          
          {/* Auto-renewal Settings */}
          {userProfile?.tier !== 'free' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6"
            >
              <h2 className="text-white font-medium text-lg mb-6">Renewal Settings</h2>
              
              <div className="space-y-6">
                {/* Auto-renewal toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Auto-renewal</h3>
                    <p className="text-white/60 text-sm">
                      Automatically renew your subscription when it expires
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={autoRenew}
                      onChange={() => setAutoRenew(!autoRenew)}
                    />
                    <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
                
                {/* Payment method selection */}
                {autoRenew && (
                  <div>
                    <h3 className="text-white font-medium mb-3">Payment Method</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div 
                        className={`border rounded-xl p-4 cursor-pointer transition-colors ${
                          paymentMethod === 'stripe'
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                        }`}
                        onClick={() => setPaymentMethod('stripe')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-white font-medium">Credit Card</h4>
                            <p className="text-white/60 text-sm">via Stripe</p>
                          </div>
                          {paymentMethod === 'stripe' && (
                            <CheckCircle className="w-5 h-5 text-primary-500 ml-auto" />
                          )}
                        </div>
                      </div>
                      
                      <div 
                        className={`border rounded-xl p-4 cursor-pointer transition-colors ${
                          paymentMethod === 'wallet'
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                        }`}
                        onClick={() => setPaymentMethod('wallet')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-white font-medium">Crypto Wallet</h4>
                            <p className="text-white/60 text-sm">ETH, USDC, etc.</p>
                          </div>
                          {paymentMethod === 'wallet' && (
                            <CheckCircle className="w-5 h-5 text-primary-500 ml-auto" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Renewal reminders */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-white font-medium">Renewal Reminders</h3>
                      <p className="text-white/60 text-sm">
                        Receive notifications before your subscription expires
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={receiveReminders}
                        onChange={() => setReceiveReminders(!receiveReminders)}
                      />
                      <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                  
                  {receiveReminders && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {[1, 3, 7, 14, 30].map((day) => (
                        <button
                          key={day}
                          onClick={() => handleToggleReminderDay(day)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            selectedReminderDays.includes(day)
                              ? 'bg-primary-500 text-white'
                              : 'bg-white/10 text-white/80 hover:bg-white/20'
                          }`}
                        >
                          {day} {day === 1 ? 'day' : 'days'} before
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={handleSaveSettings}
                    disabled={loading}
                    className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Transaction History */}
          {userProfile?.tier !== 'free' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6"
            >
              <h2 className="text-white font-medium text-lg mb-6">Billing History</h2>
              
              {transactionHistory.length === 0 ? (
                <div className="bg-white/5 rounded-xl p-6 text-center">
                  <p className="text-white/60">No transactions found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-white/60 border-b border-white/10">
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Transaction ID</th>
                        <th className="pb-3 font-medium">Amount</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Payment Method</th>
                        <th className="pb-3 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactionHistory.map((transaction) => (
                        <tr key={transaction.id} className="border-b border-white/5">
                          <td className="py-4 text-white">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-1 text-white/80">
                              <span className="truncate max-w-[100px]">
                                {transaction.id}
                              </span>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(transaction.id);
                                  addNotification({
                                    type: 'success',
                                    title: 'Copied',
                                    message: 'Transaction ID copied to clipboard'
                                  });
                                }}
                                className="text-white/40 hover:text-white/80 transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="py-4 text-white">
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              transaction.status === 'completed' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {transaction.status === 'completed' ? (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              ) : (
                                <XCircle className="w-3 h-3 mr-1" />
                              )}
                              {transaction.status}
                            </span>
                          </td>
                          <td className="py-4 text-white/80">
                            {transaction.paymentMethod === 'stripe' ? 'Credit Card' : 'Crypto Wallet'}
                          </td>
                          <td className="py-4 text-white/80">
                            {transaction.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* View More Link */}
              <div className="mt-4 text-right">
                <button className="text-primary-400 hover:text-primary-300 transition-colors text-sm flex items-center gap-1 ml-auto">
                  View all transactions
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}
          
          {/* Resources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6"
          >
            <h2 className="text-white font-medium text-lg mb-6">Resources</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <a
                href="#billing-faq"
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-colors flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-blue-500/20 border border-blue-500/20 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Billing FAQ</h3>
                  <p className="text-white/60 text-sm">Common billing questions</p>
                </div>
                <ExternalLink className="w-4 h-4 text-white/40 ml-auto" />
              </a>
              
              <a
                href="#pricing-plans"
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-colors flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-green-500/20 border border-green-500/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Pricing Plans</h3>
                  <p className="text-white/60 text-sm">Compare our plans</p>
                </div>
                <ExternalLink className="w-4 h-4 text-white/40 ml-auto" />
              </a>
              
              <a
                href="#contact-support"
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-colors flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-purple-500/20 border border-purple-500/20 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Contact Support</h3>
                  <p className="text-white/60 text-sm">Get billing assistance</p>
                </div>
                <ExternalLink className="w-4 h-4 text-white/40 ml-auto" />
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
