import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';

/**
 * Custom hook to initialize the application state
 * This handles authentication initialization and data loading
 */
export function useInitializeApp() {
  const initializeAuth = useAuthStore(state => state.initialize);
  const syncData = useAppStore(state => state.syncData);
  const processOfflineQueue = useAppStore(state => state.processOfflineQueue);
  const isAuthenticated = useAuthStore(state => !!state.user);
  const loading = useAuthStore(state => state.loading);

  useEffect(() => {
    // Initialize authentication on app start
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    // When user becomes authenticated, sync data and process offline queue
    if (isAuthenticated && !loading) {
      const initializeData = async () => {
        try {
          await processOfflineQueue();
          await syncData();
        } catch (error) {
          console.error('Failed to initialize app data:', error);
        }
      };

      initializeData();
    }
  }, [isAuthenticated, loading, syncData, processOfflineQueue]);

  useEffect(() => {
    // Set up periodic sync when online
    if (isAuthenticated) {
      const syncInterval = setInterval(() => {
        if (navigator.onLine) {
          syncData();
        }
      }, 5 * 60 * 1000); // Sync every 5 minutes

      return () => clearInterval(syncInterval);
    }
  }, [isAuthenticated, syncData]);

  useEffect(() => {
    // Handle online/offline events
    const handleOnline = () => {
      if (isAuthenticated) {
        processOfflineQueue();
        syncData();
      }
    };

    const handleOffline = () => {
      console.log('App is now offline. Actions will be queued for later sync.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isAuthenticated, processOfflineQueue, syncData]);

  return {
    isAuthenticated,
    loading
  };
}