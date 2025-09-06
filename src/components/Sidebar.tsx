import React from 'react';
import { NavLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Database, 
  Bot, 
  Users, 
  Target,
  Briefcase,
  Settings, 
  X,
  Zap,
  ChevronRight,
  Crown,
  Image,
  Search,
  BookOpen,
  Lightbulb,
  BarChart3,
  DollarSign
} from 'lucide-react';
import { useUserProfile } from '../store/authStore';

interface SidebarProps {
  onClose?: () => void;
  serverStatus?: 'online' | 'offline' | 'degraded' | 'local';
}

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: Target, label: 'Task Center' },
  { to: '/job-roles', icon: Briefcase, label: 'Job Roles' },
  { to: '/knowledge', icon: Database, label: 'Knowledge Stack' },
  { to: '/agents', icon: Bot, label: 'AI Agents' },
  { to: '/leads', icon: Users, label: 'Lead Generation' },
  { to: '/image-generator', icon: Image, label: 'Create Image' },
  { to: '/pricing', icon: DollarSign, label: 'Pricing Plans' },
  { to: '/subscription-analytics', icon: BarChart3, label: 'Subscription Analytics', adminOnly: true },
  { to: '/settings', icon: Settings, label: 'Settings' }
];

export default function Sidebar({ onClose, serverStatus = 'online' }: SidebarProps) {
  const navigate = useNavigate();
  const userProfile = useUserProfile();

  return (
    <div className="glass-panel border-r h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Cognis</h2>
            <p className="text-text-muted text-xs">AI Workforce</p>
          </div>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors lg:hidden"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map(({ to, icon: Icon, label, adminOnly }) => {
            // Skip adminOnly items for non-admin users
            if (adminOnly && userProfile?.role !== 'admin') {
              return null;
            }
            
            return (
            <li key={to}>
              <NavLink
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-600/30 to-primary-700/20 text-text-heading border border-primary-600/40'
                      : 'text-text-body hover:text-text-heading hover:bg-white/5'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium flex-1">{label}</span>
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </NavLink>
            </li>
          );
          })}
        </ul>
      </nav>

      {/* Server Status for Self-Hosted */}
      <div className="p-4 border-t border-white/10">
        <div className={`${serverStatus === 'online' ? 'bg-gradient-to-r from-green-600/20 to-green-700/20 border-green-600/30' : 
                         serverStatus === 'offline' ? 'bg-gradient-to-r from-red-600/20 to-red-700/20 border-red-600/30' : 
                         'bg-gradient-to-r from-yellow-600/20 to-yellow-700/20 border-yellow-600/30'} 
                         p-4 rounded-xl border`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-text-heading font-medium text-sm">Self-Hosted Instance</h3>
            <div className={`h-2 w-2 rounded-full ${serverStatus === 'online' ? 'bg-green-400' : 
                            serverStatus === 'offline' ? 'bg-red-400' : 'bg-yellow-400'}`}></div>
          </div>
          <p className="text-text-body text-xs mb-3">
            {serverStatus === 'online' ? 'Your local server is running properly' : 
             serverStatus === 'offline' ? 'Server is offline. Check connection.' : 
             'Limited connectivity detected'}
          </p>
          <div className="flex justify-between">
            <button onClick={() => navigate('/settings')} className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors">
              Settings
            </button>
            <button onClick={() => window.location.reload()} className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors">
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      {/* Upgrade Banner */}
      {userProfile?.tier === 'free' && (
        <div className="p-4 border-t border-white/10">
          <div className="bg-gradient-to-r from-primary-600/20 to-primary-700/20 p-4 rounded-xl border border-primary-600/30">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-primary-400" />
              <h3 className="text-text-heading font-medium text-sm">Upgrade to Pro</h3>
            </div>
            <p className="text-text-body text-xs mb-3">
              Unlock unlimited AI agents and advanced features
            </p>
            <button onClick={() => navigate('/settings')} className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white px-3 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              Upgrade Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}