import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  CreditCard, 
  Bell, 
  Shield, 
  Eye,
  Headphones,
  Loader2,
  Zap,
  Crown,
  Check,
  AlertTriangle,
  Key,
  Save,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { useUserProfile, useAuthActions } from '../store/authStore';
import { useNotificationActions } from '../store/appStore';
import { stripeService } from '../services/stripe';

export default function Settings() {
  const userProfile = useUserProfile();
  const { signOut } = useAuthActions();
  const { addNotification } = useNotificationActions();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    stripe: '',
    cognisAI: localStorage.getItem('cognis_ai_api_key') || ''
  });
  const [cognisConfig, setCognisConfig] = useState({
    model: localStorage.getItem('cognis_ai_model') || 'Cognis-Zenith-4.0',
    temperature: parseFloat(localStorage.getItem('cognis_ai_temperature') || '0.7'),
    visionCapabilities: localStorage.getItem('cognis_vision_enabled') === 'true',
    audioProcessing: localStorage.getItem('cognis_audio_enabled') === 'true'
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'AI Configuration', icon: SettingsIcon },
    { id: 'account', label: 'Account Security', icon: Shield }
  ];

  const plans = [
    {
      name: 'Free',
      price: 0,
      features: ['1 AI Agent', '100 Tasks/month', 'Basic Support', 'Standard Knowledge Base']
    },
    {
      name: 'Pro',
      price: 49,
      features: ['5 AI Agents', '1,000 Tasks/month', 'Priority Support', 'Advanced Knowledge Base', 'Custom Integrations']
    },
    {
      name: 'Enterprise',
      price: 199,
      features: ['Unlimited AI Agents', 'Unlimited Tasks', 'Dedicated Support', 'Enterprise Knowledge Base', 'Custom Integrations', 'SLA Guarantee']
    }
  ];

  const handleUpgrade = async (planName: string) => {
    setLoading(true);
    
    try {
      const priceId = planName === 'Pro' 
        ? stripeService.PRICE_IDS.PRO_MONTHLY 
        : stripeService.PRICE_IDS.ENTERPRISE_MONTHLY;
      
      const { url } = await stripeService.createCheckoutSession({
        priceId,
        successUrl: `${window.location.origin}/settings?success=true`,
        cancelUrl: `${window.location.origin}/settings?canceled=true`
      });
      
      window.location.href = url;
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Upgrade Failed',
        message: 'Failed to start upgrade process. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKeys = () => {
    // In a real implementation, these would be saved securely
    localStorage.setItem('openai_api_key', apiKeys.openai);
    localStorage.setItem('stripe_api_key', apiKeys.stripe);
    localStorage.setItem('cognis_ai_api_key', apiKeys.cognisAI);
    localStorage.setItem('cognis_ai_model', cognisConfig.model);
    localStorage.setItem('cognis_ai_temperature', cognisConfig.temperature.toString());
    localStorage.setItem('cognis_vision_enabled', cognisConfig.visionCapabilities.toString());
    localStorage.setItem('cognis_audio_enabled', cognisConfig.audioProcessing.toString());
    
    addNotification({
      type: 'success',
      title: 'API Keys Saved',
      message: 'Your AI configuration has been saved securely.'
    });
  };

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 2000));
      addNotification({
        type: 'success',
        title: 'Connection Successful',
        message: 'Cognis Digital AI Engine is responding correctly.'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Connection Failed',
        message: 'Unable to connect to Cognis Digital AI Engine.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <SettingsIcon className="w-8 h-8" />
          Settings
        </h1>
        <p className="text-white/60">
          Manage your account, billing, and preferences.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-1 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all whitespace-nowrap ${
              activeTab === id
                ? 'bg-blue-500/30 text-blue-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        <>
        {activeTab === 'profile' && (
          <div className="lg:col-span-3">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
                  <h2 className="text-xl font-bold text-white mb-6">Profile Information</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                        <User className="w-12 h-12 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{userProfile?.display_name}</h3>
                        <p className="text-white/60">{userProfile?.role}</p>
                        <button 
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                addNotification({
                                  type: 'success',
                                  title: 'Avatar Updated',
                                  message: `Profile picture has been updated with ${file.name}.`
                                });
                              }
                            };
                            input.click();
                          }}
                          className="mt-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
                        >
                          Change Avatar
                        </button>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/60 text-sm mb-2">Display Name</label>
                        <input
                          type="text"
                          defaultValue={userProfile?.display_name}
                          className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-2">Role</label>
                        <div className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white/60">
                          {userProfile?.role || 'Member'} (Cannot be changed)
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/60 text-sm mb-2">Organization</label>
                      <input
                        type="text"
                        defaultValue="My Organization"
                        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button 
                        onClick={() => {
                          addNotification({
                            type: 'success',
                            title: 'Profile Updated',
                            message: 'Your profile has been successfully updated.'
                          });
                        }}
                        className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </button>
                      <button className="bg-white/10 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Account Status</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Current Plan</span>
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        userProfile?.tier === 'free' 
                          ? 'bg-gray-500/20 text-gray-400'
                          : userProfile?.tier === 'pro'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {userProfile?.tier?.charAt(0).toUpperCase() + userProfile?.tier?.slice(1)}
                      </span>
                    </div>
                    
                    {userProfile?.tier === 'free' && (
                      <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Crown className="w-4 h-4 text-orange-400" />
                          <h4 className="text-orange-400 font-medium">Upgrade Available</h4>
                        </div>
                        <p className="text-white/70 text-sm mb-3">
                          Unlock unlimited AI agents and advanced features with Pro.
                        </p>
                        <button 
                          onClick={() => handleUpgrade('Pro')}
                          disabled={loading}
                          className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                          {loading ? 'Processing...' : 'Upgrade Now'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                  
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 hover:bg-white/5 rounded-lg transition-colors">
                      <p className="text-white font-medium">Download Data</p>
                      <p className="text-white/60 text-sm">Export your account data</p>
                    </button>
                    <button 
                      onClick={signOut}
                      className="w-full text-left p-3 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <p className="text-red-400 font-medium">Sign Out</p>
                      <p className="text-white/60 text-sm">Sign out of your account</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="lg:col-span-3">
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-6">Billing & Subscription</h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan.name}
                    className={`border rounded-2xl p-6 relative ${
                      userProfile?.tier === plan.name.toLowerCase()
                        ? 'border-blue-500/50 bg-blue-500/10'
                        : 'border-white/20 bg-white/5'
                    }`}
                  >
                    {plan.name === 'Pro' && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-3 py-1 rounded-full text-xs font-medium">
                          Popular
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-3xl font-bold text-white">${plan.price}</span>
                        <span className="text-white/60">/month</span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-400" />
                          <span className="text-white/80 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleUpgrade(plan.name)}
                      disabled={userProfile?.tier === plan.name.toLowerCase() || loading}
                      className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${
                        userProfile?.tier === plan.name.toLowerCase()
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:opacity-90'
                      }`}
                    >
                      {userProfile?.tier === plan.name.toLowerCase() ? 'Current Plan' : 'Upgrade'}
                    </button>
                  </div>
                ))}
              </div>

              {userProfile?.tier !== 'free' && (
                <div className="mt-8 p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <h3 className="text-red-400 font-medium">Cancel Subscription</h3>
                  </div>
                  <p className="text-white/70 text-sm mb-4">
                    Your subscription will remain active until the end of the current billing period.
                  </p>
                  <button className="bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors">
                    Cancel Subscription
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="lg:col-span-3">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
                  <h2 className="text-xl font-bold text-white mb-6">Notification Preferences</h2>
                  
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white">Email Notifications</h3>
                      
                      {[
                        'Task completions',
                        'New leads generated',
                        'Agent status changes',
                        'Weekly performance reports',
                        'Billing and subscription updates'
                      ].map((notification) => (
                        <div key={notification} className="flex items-center justify-between">
                          <span className="text-white/70">{notification}</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                          </label>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4 pt-6 border-t border-white/10">
                      <h3 className="text-lg font-medium text-white">In-App Notifications</h3>
                      
                      {[
                        'Real-time task updates',
                        'Agent recommendations',
                        'System maintenance alerts'
                      ].map((notification) => (
                        <div key={notification} className="flex items-center justify-between">
                          <span className="text-white/70">{notification}</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6">
                    <button 
                      onClick={() => {
                        addNotification({
                          type: 'success',
                          title: 'Preferences Saved',
                          message: 'Your notification preferences have been updated.'
                        });
                      }}
                      className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
                    >
                      Save Preferences
                    </button>
                    <button className="bg-white/10 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors">
                      Reset to Default
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Notification Summary</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Email Notifications</span>
                      <span className="text-green-400">5 Enabled</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">In-App Notifications</span>
                      <span className="text-green-400">3 Enabled</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Last Updated</span>
                      <span className="text-white/60">Never</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="lg:col-span-3">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5" />
                    Cognis Digital AI Engine
                  </h2>
                  <p className="text-white/60 mb-6">Configure your AI model provider (powered by OpenAI)</p>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-white/60 text-sm mb-2">API Key</label>
                      <input
                        type="password"
                        value={apiKeys.cognisAI}
                        onChange={(e) => setApiKeys(prev => ({ ...prev, cognisAI: e.target.value }))}
                        placeholder="sk-..."
                        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-white/60 text-sm mb-2">Cognis AI Model</label>
                      <select
                        value={cognisConfig.model}
                        onChange={(e) => setCognisConfig(prev => ({ ...prev, model: e.target.value }))}
                        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        <option value="Cognis-Zenith-4.0">Cognis-Zenith-4.0 (Latest)</option>
                        <option value="Cognis-Apex-3.5">Cognis-Apex-3.5</option>
                        <option value="Cognis-Vertex-4.0">Cognis-Vertex-4.0</option>
                        <option value="Cognis-Nova-3.0">Cognis-Nova-3.0</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-white/60 text-sm mb-2">Temperature: {cognisConfig.temperature}</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={cognisConfig.temperature}
                        onChange={(e) => setCognisConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-white/60 mt-1">
                        <span>Focused</span>
                        <span>Creative</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cognisConfig.visionCapabilities}
                          onChange={(e) => setCognisConfig(prev => ({ ...prev, visionCapabilities: e.target.checked }))}
                          className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50"
                        />
                        <Eye className="w-4 h-4 text-white/60" />
                        <span className="text-white">Vision Capabilities</span>
                      </label>
                      
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cognisConfig.audioProcessing}
                          onChange={(e) => setCognisConfig(prev => ({ ...prev, audioProcessing: e.target.checked }))}
                          className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50"
                        />
                        <Headphones className="w-4 h-4 text-white/60" />
                        <span className="text-white">Audio Processing</span>
                      </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button 
                        onClick={handleTestConnection}
                        disabled={loading}
                        className="bg-green-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Test Connection
                      </button>
                      <button 
                        onClick={handleSaveApiKeys}
                        className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save Configuration
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">AI Engine Status</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Current Model</span>
                      <span className="text-blue-400">{cognisConfig.model}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Temperature</span>
                      <span className="text-white">{cognisConfig.temperature}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Vision Enabled</span>
                      <span className={cognisConfig.visionCapabilities ? 'text-green-400' : 'text-red-400'}>
                        {cognisConfig.visionCapabilities ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Audio Enabled</span>
                      <span className={cognisConfig.audioProcessing ? 'text-green-400' : 'text-red-400'}>
                        {cognisConfig.audioProcessing ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'account' && (
          <div className="lg:col-span-3">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
                  <h2 className="text-xl font-bold text-white mb-6">Security Settings</h2>
                  
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Password</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-white/60 text-sm mb-2">Current Password</label>
                          <input
                            type="password"
                            className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                        </div>
                        <div>
                          <label className="block text-white/60 text-sm mb-2">New Password</label>
                          <input
                            type="password"
                            className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                        </div>
                        <div>
                          <label className="block text-white/60 text-sm mb-2">Confirm New Password</label>
                          <input
                            type="password"
                            className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                        </div>
                        <button 
                          onClick={() => {
                            addNotification({
                              type: 'success',
                              title: 'Password Updated',
                              message: 'Your password has been successfully changed.'
                            });
                          }}
                          className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
                        >
                          Update Password
                        </button>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/10">
                      <h3 className="text-lg font-medium text-white mb-4">Two-Factor Authentication</h3>
                      <div className="bg-white/5 border border-white/20 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-white font-medium">Authenticator App</h4>
                            <p className="text-white/60 text-sm">Use an authenticator app for additional security</p>
                          </div>
                          <button className="bg-gradient-to-r from-green-500 to-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                            Enable
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/10">
                      <h3 className="text-lg font-medium text-white mb-4">Active Sessions</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between bg-white/5 border border-white/20 rounded-xl p-4">
                          <div>
                            <p className="text-white font-medium">Current Session</p>
                            <p className="text-white/60 text-sm">Chrome on macOS • San Francisco, CA</p>
                          </div>
                          <span className="text-green-400 text-sm">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Security Status</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Password Strength</span>
                      <span className="text-green-400">Strong</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Two-Factor Auth</span>
                      <span className="text-red-400">Disabled</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Last Login</span>
                      <span className="text-white/60">2 hours ago</span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-orange-500/20 border border-orange-500/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-orange-400" />
                      <h4 className="text-orange-400 font-medium">Security Recommendation</h4>
                    </div>
                    <p className="text-white/70 text-sm">
                      Enable two-factor authentication to secure your account.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </>
      </div>
    </div>
  );
}