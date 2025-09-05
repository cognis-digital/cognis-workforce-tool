import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import UpgradeModal from './modals/UpgradeModal';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeModal = useAppStore(state => state.activeModal);
  const setActiveModal = useAppStore(state => state.setActiveModal);

  return (
    <div className="flex h-screen bg-gradient-primary">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-64">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8">
            <Outlet />
          </div>
        </main>

        {/* Mobile Navigation */}
        <div className="lg:hidden">
          <MobileNav />
        </div>
      </div>

      {/* Global Modals */}
      <UpgradeModal
        isOpen={activeModal === 'upgrade'}
        onClose={() => setActiveModal(null)}
        reason="You have reached your free download limit. Upgrade to Pro for unlimited downloads."
      />
    </div>
  );
}