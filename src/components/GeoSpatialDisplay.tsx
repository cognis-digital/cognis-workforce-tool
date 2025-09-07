import React, { useState } from 'react';
import { MapPin, Globe, Users, Layers, Settings } from 'lucide-react';
import { useGeoSpatial } from '../contexts/GeoSpatialContext';

interface GeoSpatialDisplayProps {
  showControls?: boolean;
  showNearbyUsers?: boolean;
  compact?: boolean;
}

const GeoSpatialDisplay: React.FC<GeoSpatialDisplayProps> = ({
  showControls = true,
  showNearbyUsers = true,
  compact = false
}) => {
  const {
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
  } = useGeoSpatial();

  const [expanded, setExpanded] = useState(!compact);

  // Render error state
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-500">
        <h3 className="font-bold flex items-center gap-2">
          <Globe className="w-5 h-5" />
          GeoSpatial Error
        </h3>
        <p className="text-sm mt-2">{error.message}</p>
      </div>
    );
  }

  // Render loading state or inactive state
  if (!isTracking || !currentGID) {
    return (
      <div className="glass-panel p-4 rounded-lg">
        <h3 className="font-bold flex items-center gap-2">
          <Globe className="w-5 h-5" />
          GeoSpatial Tracking
        </h3>
        <p className="text-sm opacity-70 mt-2">
          {isTracking ? 'Acquiring location...' : 'Location tracking is disabled'}
        </p>
        {showControls && (
          <button
            onClick={isTracking ? stopTracking : startTracking}
            className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium ${
              isTracking ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
            }`}
          >
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </button>
        )}
      </div>
    );
  }

  // Format coordinates for display
  const formatCoordinate = (value: number): string => {
    return value.toFixed(6);
  };

  return (
    <div className="glass-panel rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-white/5 p-4 flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <Globe className="w-5 h-5" />
          {compact ? 'GeoSpatial Position' : 'Horizontal Land Regime'}
        </h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          {expanded ? (
            <span className="text-xs">▲</span>
          ) : (
            <span className="text-xs">▼</span>
          )}
        </button>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-4">
          {/* Location Information */}
          <div className="mb-4">
            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4" />
              Current Location
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs bg-white/5 p-2 rounded-lg">
              <div>
                <span className="opacity-70">Latitude:</span>
                <span className="ml-2 font-mono">
                  {formatCoordinate(currentGID.coordinate.latitude)}°
                </span>
              </div>
              <div>
                <span className="opacity-70">Longitude:</span>
                <span className="ml-2 font-mono">
                  {formatCoordinate(currentGID.coordinate.longitude)}°
                </span>
              </div>
              <div>
                <span className="opacity-70">Altitude:</span>
                <span className="ml-2 font-mono">
                  {formatCoordinate(currentGID.coordinate.altitude)} m
                </span>
              </div>
              <div>
                <span className="opacity-70">Accuracy:</span>
                <span className="ml-2 font-mono">
                  {currentGID.coordinate.accuracy?.toFixed(1) || 'unknown'} m
                </span>
              </div>
            </div>
          </div>

          {/* Regime Information */}
          {currentRegime && (
            <div className="mb-4">
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4" />
                Land Regime
              </h4>
              <div className="bg-white/5 p-2 rounded-lg text-xs">
                <div className="mb-1">
                  <span className="opacity-70">Regime:</span>
                  <span className="ml-2 font-semibold">{currentRegime.name}</span>
                </div>
                <div className="mb-1">
                  <span className="opacity-70">Type:</span>
                  <span className="ml-2">{currentRegime.type}</span>
                </div>
                <div className="mb-1">
                  <span className="opacity-70">Area:</span>
                  <span className="ml-2">
                    {(currentRegime.area / 1000000).toFixed(2)} km²
                  </span>
                </div>
                <div>
                  <span className="opacity-70">Users:</span>
                  <span className="ml-2">{currentRegime.userCount}</span>
                </div>
              </div>
            </div>
          )}

          {/* Spatial Context (Position in Box) */}
          {spatialContext && (
            <div className="mb-4">
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4" />
                Box Position
              </h4>
              <div className="bg-white/5 p-2 rounded-lg">
                <div className="flex justify-between text-xs">
                  <div>
                    <span className="opacity-70">X:</span>
                    <span className="ml-1 font-mono">
                      {spatialContext.boxPosition.x.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="opacity-70">Y:</span>
                    <span className="ml-1 font-mono">
                      {spatialContext.boxPosition.y.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="opacity-70">Z:</span>
                    <span className="ml-1 font-mono">
                      {spatialContext.boxPosition.z.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {/* Visual representation of position in box */}
                <div className="relative h-24 mt-2 border border-white/20 rounded-lg overflow-hidden">
                  <div 
                    className="absolute w-3 h-3 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${spatialContext.boxPosition.x * 100}%`,
                      top: `${spatialContext.boxPosition.y * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Nearby Users */}
          {showNearbyUsers && nearbyUsers.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Users className="w-4 h-4" />
                Nearby Users
              </h4>
              <div className="bg-white/5 p-2 rounded-lg text-xs max-h-32 overflow-y-auto">
                <ul className="divide-y divide-white/10">
                  {nearbyUsers.map((user) => (
                    <li key={user.userId} className="py-1">
                      <div className="flex justify-between">
                        <span>{user.userId.substring(0, 8)}...</span>
                        <span className="opacity-70">
                          {user.neighbors.find(n => n.userId === spatialContext?.userId)?.distance.toFixed(1)}m
                        </span>
                      </div>
                      {user.neighbors.find(n => n.userId === spatialContext?.userId)?.inSameRegime && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-1 py-0.5 rounded inline-block mt-1">
                          Same Regime
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Controls */}
          {showControls && (
            <div>
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4" />
                Settings
              </h4>
              
              <div className="bg-white/5 p-3 rounded-lg">
                <div>
                  <label className="text-xs opacity-70 block mb-1">Precision (meters)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="range"
                      min="1"
                      max="100"
                      value={precision}
                      onChange={(e) => setPrecision(Number(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-xs font-mono">{precision}m</span>
                  </div>
                </div>
                
                <div className="mt-3 flex justify-between">
                  <button
                    onClick={stopTracking}
                    className="px-3 py-1 rounded bg-red-500/20 text-red-400 text-xs font-medium"
                  >
                    Stop Tracking
                  </button>
                  
                  <button
                    onClick={() => setPrecision(10)}
                    className="px-3 py-1 rounded bg-white/10 text-xs font-medium"
                  >
                    Reset Precision
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GeoSpatialDisplay;
