import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Database, Bot, Users, Target, Briefcase, Settings } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: Target, label: 'Tasks' },
  { to: '/job-roles', icon: Briefcase, label: 'Roles' },
  { to: '/knowledge', icon: Database, label: 'Knowledge' },
  { to: '/agents', icon: Bot, label: 'Agents' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/settings', icon: Settings, label: 'Settings' }
];

export default function MobileNav() {
  return (
    <nav className="glass-panel border-t p-2">
      <div className="flex items-center justify-around">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                isActive
                  ? 'text-primary-400 bg-primary-600/20'
                  : 'text-text-body hover:text-text-heading'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}