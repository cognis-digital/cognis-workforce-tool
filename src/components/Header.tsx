import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, User, Zap } from 'lucide-react';
import { useUserProfile } from '../store/authStore';
import { useWallet } from '../contexts/WalletContext';
import WalletStatus from './WalletStatus';
import NetworkSwitcher from './NetworkSwitcher';
import UsageIndicator from './UsageIndicator';
import ConnectWalletButton from './ConnectWalletButton';

interface HeaderProps {
  onMenuClick: () => void;
  serverStatus?: 'online' | 'offline' | 'degraded' | 'local';
}

export default function Header({ onMenuClick, serverStatus = 'online' }: HeaderProps) {
  const navigate = useNavigate();
  const userProfile = useUserProfile();
  const { isConnected } = useWallet();

  return (
    <header className="glass-panel border-b sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 lg:px-8 h-16">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <Menu className="w-5 h-5 text-text-heading" />
          </button>
          
          <div className="hidden lg:flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-text-heading font-semibold text-lg">Cognis Digital</h1>
              <p className="text-text-muted text-xs">AI Workforce Platform</p>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Usage Indicator */}
          <UsageIndicator />
          
          {/* Server Status */}
          <div 
            className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
              serverStatus === 'online' ? 'bg-green-500/20 text-green-400' :
              serverStatus === 'offline' ? 'bg-red-500/20 text-red-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-green-400' : serverStatus === 'offline' ? 'bg-red-400' : 'bg-yellow-400'}`}></div>
            <span className="text-xs font-medium">{serverStatus === 'online' ? 'Self-hosted' : serverStatus === 'offline' ? 'Offline' : 'Degraded'}</span>
          </div>
          
          {/* Network Status */}
          <NetworkSwitcher />
          
          {/* Wallet Status */}
          {isConnected ? <WalletStatus /> : <ConnectWalletButton />}
          
          {/* User Profile */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button 
              onClick={() => {
                // In a real app, this would open a notifications panel
                console.log('Opening notifications...');
              }}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors relative"
            >
              <Bell className="w-5 h-5 text-text-heading" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full"></span>
            </button>

            {/* Profile */}
            <div 
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 cursor-pointer hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-text-heading text-sm font-medium">{userProfile?.display_name}</p>
                <p className="text-text-muted text-xs capitalize">{userProfile?.tier} Plan</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}