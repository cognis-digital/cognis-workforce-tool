import React, { createContext, useContext, useState, useEffect } from 'react';
import { geoSpatialTracker } from '../utils/geoSpatial/geoSpatialTracker';
import { 
  spatialPositioningSystem,
  UserSpatialContext
} from '../utils/geoSpatial/spatialPositioning';
import {
  horizontalLandRegimeManager,
  HorizontalLandRegime,
  RegimeType
} from '../utils/geoSpatial/horizontalLandRegime';
import {
  GID,
  GeoCoordinate,
  ECEFCoordinate
} from '../utils/geoSpatial/types';
import { useUserProfile } from '../store/authStore';

// Import Evolution Architecture components
import { useTimeSeriesStore } from '../evolution/core/time-series-store';
import { useEvolutionState } from '../evolution/core/evolution-state';

// Context value interface
interface GeoSpatialContextValue {
  isTracking: boolean;
  currentGID: GID | null;
  currentRegime: HorizontalLandRegime | null;
  spatialContext: UserSpatialContext | null;
  nearbyUsers: UserSpatialContext[];
  error: Error | null;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  createSnapshot: (name: string) => void;
  loadSnapshot: (name: string) => boolean;
  trackingHistory: GeoHistoryEntry[];
}

// Create context
const GeoSpatialContext = createContext<GeoSpatialContextValue | null>(null);

// Define geo history entry for Evolution Architecture integration
interface GeoHistoryEntry {
  timestamp: number;
  gid: GID | null;
  regime: HorizontalLandRegime | null;
  nearbyUserCount: number;
}

// Provider component
export const GeoSpatialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const userProfile = useUserProfile();
  const userId = userProfile?.id || 'anonymous';
  
  // Initialize time-series state store from Evolution Architecture
  const timeSeriesStore = useTimeSeriesStore<{
    geoHistory: GeoHistoryEntry[];
    currentGID: GID | null;
    currentRegime: HorizontalLandRegime | null;
  }>({
    geoHistory: [],
    currentGID: null,
    currentRegime: null
  });
  
  // Evolution state for adaptive behavior
  const evolutionState = useEvolutionState({
    precision: 'medium',
    trackingFrequency: 'normal',
    prefetchRegimes: false
  });

  // State
  const [isTracking, setIsTracking] = useState(false);
  const [currentGID, setCurrentGID] = useState<GID | null>(null);
  const [currentRegime, setCurrentRegime] = useState<HorizontalLandRegime | null>(null);
  const [spatialContext, setSpatialContext] = useState<UserSpatialContext | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<UserSpatialContext[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // Handle GID updates
  useEffect(() => {
    const handleGIDUpdate = async (gid: GID) => {
      // Update local state
      setCurrentGID(gid);
      
      // Update user's regime
      const regime = horizontalLandRegimeManager.registerUserWithRegime(userId, gid);
      setCurrentRegime(regime);
      
      // Update spatial context
      const context = await spatialPositioningSystem.updateUserPosition(userId, gid);
      if (context) {
        setSpatialContext(context);
        
        // Update nearby users
        const nearby = spatialPositioningSystem.getNearbyUsers(userId);
        setNearbyUsers(nearby);
      }
      
      // Record in time-series store for Evolution Architecture integration
      const historyEntry: GeoHistoryEntry = {
        timestamp: Date.now(),
        gid,
        regime,
        nearbyUserCount: nearbyUsers.length
      };
      
      // Update time-series store
      timeSeriesStore.updateState(prev => ({
        ...prev,
        geoHistory: [...prev.geoHistory, historyEntry],
        currentGID: gid,
        currentRegime: regime
      }));
    };
    
    // Add listener for GID updates
    geoSpatialTracker.addChangeListener(handleGIDUpdate);
    
    // Remove listener when component unmounts
    return () => {
      geoSpatialTracker.removeChangeListener(handleGIDUpdate);
    };
  }, [userId]);
  
  // Clean up when user leaves
  useEffect(() => {
    return () => {
      if (isTracking) {
        geoSpatialTracker.stopTracking();
        // Note: Our implementation doesn't have explicit unregister methods
        // We'll handle cleanup differently
      }
    };
  }, [isTracking, userId]);
  
  // Function to start location tracking
  const startTracking = async () => {
    try {
      setError(null);
      const success = await geoSpatialTracker.startTracking();
      
      if (success) {
        setIsTracking(true);
        
        // Get initial GID
        const initialGID = geoSpatialTracker.getCurrentGID();
        if (initialGID) {
          setCurrentGID(initialGID);
          
          // Register with regime system
          const regime = horizontalLandRegimeManager.registerUserWithRegime(userId, initialGID);
          setCurrentRegime(regime);
          
          // Register with positioning system
          const context = await spatialPositioningSystem.registerUser(userId, initialGID);
          if (context) {
            setSpatialContext(context);
            
            // Update nearby users
            const nearby = spatialPositioningSystem.getNearbyUsers(userId);
            setNearbyUsers(nearby);
            
            // Create initial history entry
            const historyEntry: GeoHistoryEntry = {
              timestamp: Date.now(),
              gid: initialGID,
              regime,
              nearbyUserCount: nearby.length
            };
            
            // Update time-series store
            timeSeriesStore.updateState(prev => ({
              ...prev,
              geoHistory: [...prev.geoHistory, historyEntry],
              currentGID: initialGID,
              currentRegime: regime
            }));
          }
        }
        
        // Apply evolution state to adapt behavior
        applyEvolutionState();
      } else {
        throw new Error("Failed to start location tracking");
      }
    } catch (err) {
      setError(err as Error);
      console.error("Failed to start location tracking:", err);
    }
  };
  
  // Apply evolution state to adapt behavior
  const applyEvolutionState = () => {
    // Adaptive behavior based on evolution state
    if (evolutionState.state.precision === 'high') {
      // Enable high-precision tracking if evolution state suggests it
      spatialPositioningSystem.registerForOrientation(userId);
    }
  };
  
  // Function to stop location tracking
  const stopTracking = () => {
    geoSpatialTracker.stopTracking();
    setIsTracking(false);
  };
  
  // Create a named snapshot of the current state
  const createSnapshot = (name: string) => {
    timeSeriesStore.createSnapshot(name);
  };
  
  // Load a named snapshot
  const loadSnapshot = (name: string): boolean => {
    const success = timeSeriesStore.loadSnapshot(name);
    
    if (success) {
      // Update local state from time-series store
      const state = timeSeriesStore.getState();
      setCurrentGID(state.currentGID);
      setCurrentRegime(state.currentRegime);
    }
    
    return success;
  };
  
  // Context value
  const contextValue: GeoSpatialContextValue = {
    isTracking,
    currentGID,
    currentRegime,
    spatialContext,
    nearbyUsers,
    error,
    startTracking,
    stopTracking,
    createSnapshot,
    loadSnapshot,
    trackingHistory: timeSeriesStore.getState().geoHistory
  };
  
  return (
    <GeoSpatialContext.Provider value={contextValue}>
      {children}
    </GeoSpatialContext.Provider>
  );
};

// Custom hook to use the context
export const useGeoSpatial = () => {
  const context = useContext(GeoSpatialContext);
  
  if (!context) {
    throw new Error("useGeoSpatial must be used within a GeoSpatialProvider");
  }
  
  return context;
};

export default GeoSpatialContext;
