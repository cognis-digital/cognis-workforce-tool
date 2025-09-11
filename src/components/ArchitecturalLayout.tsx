import React from 'react';
import { useStateSafe as useState, useEffectSafe as useEffect } from '../hooks/useReactHooks';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import ConnectionStatus from './ConnectionStatus';
import UpgradeModal from './modals/UpgradeModal';
import { useAppStore } from '../store/appStore';

export default function ArchitecturalLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeModal = useAppStore(state => state.activeModal);
  const setActiveModal = useAppStore(state => state.setActiveModal);
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'degraded' | 'local'>('online'); // Default to online for self-hosted

  // Simulating local server status check
  useEffect(() => {
    const checkLocalServerStatus = () => {
      // In a self-hosted environment, this would check local server health
      // For now, we'll simulate an online status
      setServerStatus('online');
    };
    
    // Check initially
    checkLocalServerStatus();
    
    // Set up interval to check periodically
    const intervalId = setInterval(checkLocalServerStatus, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex h-screen bg-gradient-to-b from-indigo-900 to-indigo-950">
      {/* Desktop Sidebar with architectural design */}
      <motion.div 
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
        className="hidden lg:flex lg:w-72 lg:flex-col border-r border-indigo-800"
      >
        <Sidebar serverStatus={serverStatus} />
      </motion.div>

      {/* Mobile Sidebar Overlay with elegant transitions */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setSidebarOpen(false)}
          />
          <motion.div 
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-72 h-full"
          >
            <Sidebar onClose={() => setSidebarOpen(false)} serverStatus={serverStatus} />
          </motion.div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
          serverStatus={serverStatus}
        />
        
        {/* Content area with architectural grid system */}
        <main className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-12 gap-4 p-4 lg:p-8 h-full">
            <div className="col-span-12">
              <ConnectionStatus status={serverStatus} />
            </div>
            <div className="col-span-12">
              <Outlet />
            </div>
          </div>
        </main>

        {/* Mobile Navigation */}
        <div className="lg:hidden">
          <MobileNav />
        </div>
      </div>

      {/* Global Modals */}
      {activeModal === 'upgrade' && (
        <UpgradeModal 
          isOpen={true}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
