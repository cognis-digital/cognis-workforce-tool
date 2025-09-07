import React, { createContext, useContext, useState, useEffect } from 'react';
import { geoSpatialTracker, GeoID, getCurrentLocation } from '../utils/geoSpatialTracker';
import { 
  spatialPositioningSystem, 
  SpatialPositioningSystem,
  UserSpatialContext
} from '../utils/spatialPositioning';
import {
  horizontalLandRegimeManager,
  HorizontalLandRegime
} from '../utils/horizontalLandRegime';
import { useUserProfile } from '../store/authStore';

// Context value interface
interface GeoSpatialContextValue {
  isTracking: boolean;
  currentGID: GeoID | null;
  currentRegime: HorizontalLandRegime | null;
  spatialContext: UserSpatialContext | null;
  nearbyUsers: UserSpatialContext[];
  precision: number;
  error: Error | null;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  setPrecision: (precision: number) => void;
}

// Create context
const GeoSpatialContext = createContext<GeoSpatialContextValue | null>(null);

// Provider component
export const GeoSpatialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const userProfile = useUserProfile();
  const userId = userProfile?.id || 'anonymous';
  
  // State
  const [isTracking, setIsTracking] = useState(false);
  const [currentGID, setCurrentGID] = useState<GeoID | null>(null);
  const [currentRegime, setCurrentRegime] = useState<HorizontalLandRegime | null>(null);
  const [spatialContext, setSpatialContext] = useState<UserSpatialContext | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<UserSpatialContext[]>([]);
  const [precision, setPrecisionState] = useState(10); // 10 meter precision default
  const [error, setError] = useState<Error | null>(null);

  // Handle GID updates
  useEffect(() => {
    const handleGIDUpdate = (gid: GeoID) => {
      setCurrentGID(gid);
      
      // Update user's regime
      const regime = horizontalLandRegimeManager.registerUserWithRegime(userId, gid);
      setCurrentRegime(regime);
      
      // Update spatial context
      const context = spatialPositioningSystem.updateUserPosition(userId, gid);
      setSpatialContext(context);
      
      // Update nearby users
      const nearby = context.neighbors.map(neighbor => 
        spatialPositioningSystem.getUserContext(neighbor.userId)
      ).filter(user => user !== undefined) as UserSpatialContext[];
      
      setNearbyUsers(nearby);
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
        horizontalLandRegimeManager.unregisterUser(userId);
        spatialPositioningSystem.unregisterUser(userId);
      }
    };
  }, [isTracking, userId]);
  
  // Function to start location tracking
  const startTracking = async () => {
    try {
      setError(null);
      await geoSpatialTracker.startTracking();
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
        setSpatialContext(context);
        
        // Update nearby users
        const nearby = context.neighbors.map(neighbor => 
          spatialPositioningSystem.getUserContext(neighbor.userId)
        ).filter(user => user !== undefined) as UserSpatialContext[];
        
        setNearbyUsers(nearby);
      }
    } catch (err) {
      setError(err as Error);
      console.error("Failed to start location tracking:", err);
    }
  };
  
  // Function to stop location tracking
  const stopTracking = () => {
    geoSpatialTracker.stopTracking();
    horizontalLandRegimeManager.unregisterUser(userId);
    spatialPositioningSystem.unregisterUser(userId);
    setIsTracking(false);
  };
  
  // Function to set precision
  const setPrecision = (newPrecision: number) => {
    setPrecisionState(newPrecision);
    geoSpatialTracker.setPrecision(newPrecision);
  };
  
  // Context value
  const contextValue: GeoSpatialContextValue = {
    isTracking,
    currentGID,
    currentRegime,
    spatialContext,
    nearbyUsers,
    precision,
    error,
    startTracking,
    stopTracking,
    setPrecision
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
