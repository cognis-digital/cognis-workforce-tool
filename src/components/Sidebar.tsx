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
  Crown
} from 'lucide-react';
import { useUserProfile } from '../store/authStore';

interface SidebarProps {
  onClose?: () => void;
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: Target, label: 'Task Center' },
  { to: '/job-roles', icon: Briefcase, label: 'Job Roles' },
  { to: '/knowledge', icon: Database, label: 'Knowledge Stack' },
  { to: '/agents', icon: Bot, label: 'AI Agents' },
  { to: '/leads', icon: Users, label: 'Lead Generation' },
  { to: '/settings', icon: Settings, label: 'Settings' }
];

export default function Sidebar({ onClose }: SidebarProps) {
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
          {navItems.map(({ to, icon: Icon, label }) => (
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
          ))}
        </ul>
      </nav>

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