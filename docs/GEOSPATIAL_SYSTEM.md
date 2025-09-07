# GeoSpatial System & Horizontal Land Regime Documentation

This document provides technical information about the GeoSpatial tracking system and Horizontal Land Regime framework implemented in the Cognis Workforce Tool.

## Table of Contents

1. [Overview](#overview)
2. [Core Components](#core-components)
3. [GeoSpatial Tracking](#geospatial-tracking)
4. [3D Positioning System](#3d-positioning-system)
5. [Horizontal Land Regime](#horizontal-land-regime)
6. [Integration with User System](#integration-with-user-system)
7. [Usage Examples](#usage-examples)
8. [Best Practices](#best-practices)

## Overview

The GeoSpatial system divides each end user's virtual location into a Geographic ID (GID) based on their exact position in the world. This establishes a horizontal land regime framework where users are grouped by their physical location in a 3D space.

### Key Features:

- **Precise 3D Location Tracking**: Tracks users' exact positions using GPS and device orientation sensors
- **ECEF Coordinate System**: Uses Earth-centered Earth-fixed coordinates for accurate global positioning
- **Hierarchical Land Regimes**: Organizes geographical spaces into hierarchical regimes
- **User Position Management**: Tracks user movements across regimes in real-time
- **GID Generation**: Creates unique geographical identifiers for each location
- **React Integration**: Seamless integration with React via context providers

## Core Components

### 1. GeoSpatial Tracker

Located in `/src/utils/geoSpatialTracker.ts`, this module provides:

- GPS location acquisition and tracking
- Conversion between geographic and ECEF coordinates
- GID generation and management
- Spatial box creation and positioning

### 2. Spatial Positioning System

Located in `/src/utils/spatialPositioning.ts`, this module provides:

- 3D position tracking with orientation data
- Position normalization within spatial boxes
- User proximity calculations
- Device orientation and motion tracking

### 3. Horizontal Land Regime Manager

Located in `/src/utils/horizontalLandRegime.ts`, this module provides:

- Land regime creation and management
- Hierarchical regime organization
- User-regime association
- Spatial queries and regime discovery

### 4. React Integration Components

- `GeoSpatialContext.tsx`: React context for sharing geospatial data
- `GeoSpatialDisplay.tsx`: UI component for displaying location and regime information

## GeoSpatial Tracking

### Key Concepts

- **GeoCoordinate**: Standard latitude, longitude, altitude format
- **ECEFCoordinate**: Earth-centered Earth-fixed coordinate system
- **SpatialBox**: 3D box representing a volume of space
- **GID (Geographic ID)**: Unique identifier for a spatial position

### Basic Usage

```typescript
import { geoSpatialTracker, generateGID } from '../utils/geoSpatialTracker';

// Start tracking user location
await geoSpatialTracker.startTracking();

// Listen for location changes
geoSpatialTracker.addChangeListener((gid) => {
  console.log(`User moved to: ${gid.regimeIdentifier}`);
});

// Get current location
const currentGID = geoSpatialTracker.getCurrentGID();

// Stop tracking
geoSpatialTracker.stopTracking();
```

## 3D Positioning System

The 3D positioning system tracks users within spatial boxes and provides orientation and position data.

### Key Concepts

- **SpatialPosition**: Complete 6DOF (degrees of freedom) position data
- **UserSpatialContext**: Enhanced position with regime and neighbor information
- **Quaternion**: Mathematical representation of 3D rotation

### Basic Usage

```typescript
import { spatialPositioningSystem } from '../utils/spatialPositioning';
import { geoSpatialTracker } from '../utils/geoSpatialTracker';

// Register a user with the positioning system
const gid = geoSpatialTracker.getCurrentGID();
if (gid) {
  const userContext = await spatialPositioningSystem.registerUser('user-123', gid);
  
  // Get user's position in the box
  const boxPosition = userContext.boxPosition;
  
  // Get nearby users
  const neighbors = userContext.neighbors;
  
  // Update user position when GID changes
  geoSpatialTracker.addChangeListener((newGid) => {
    spatialPositioningSystem.updateUserPosition('user-123', newGid);
  });
}
```

## Horizontal Land Regime

The horizontal land regime system organizes geographical spaces into discrete regimes.

### Key Concepts

- **RegimeType**: Different types of land regimes (geographic, administrative, etc.)
- **HorizontalLandRegime**: Structure defining a regime's properties and boundaries
- **Hierarchical Organization**: Parent-child relationships between regimes

### Basic Usage

```typescript
import { horizontalLandRegimeManager, RegimeType } from '../utils/horizontalLandRegime';
import { geoSpatialTracker } from '../utils/geoSpatialTracker';

// Register a user with a regime based on their GID
const gid = geoSpatialTracker.getCurrentGID();
if (gid) {
  const regime = horizontalLandRegimeManager.registerUserWithRegime('user-123', gid);
  
  // Get regime properties
  console.log(`User is in regime: ${regime.name}`);
  console.log(`Regime area: ${regime.area} square meters`);
  console.log(`Users in regime: ${regime.userCount}`);
  
  // Create a hierarchical grid of regimes
  const topRegimeId = horizontalLandRegimeManager.createHierarchicalGrid(
    gid.coordinate,
    10000, // 10km top level
    3,     // 3 levels deep
    4      // 4 subdivisions per level
  );
  
  // Find regimes by various criteria
  const nearbyRegimes = horizontalLandRegimeManager.findRegimes({
    nearPoint: {
      point: gid.ecefPosition,
      maxDistance: 5000 // 5km
    }
  });
}
```

## Integration with User System

The GeoSpatial system integrates with the existing user system via React Context.

### Using the GeoSpatial Context

```tsx
import { useGeoSpatial } from '../contexts/GeoSpatialContext';

function MyComponent() {
  const {
    isTracking,
    currentGID,
    currentRegime,
    spatialContext,
    nearbyUsers,
    startTracking,
    stopTracking
  } = useGeoSpatial();
  
  return (
    <div>
      <button onClick={isTracking ? stopTracking : startTracking}>
        {isTracking ? 'Stop Tracking' : 'Start Tracking'}
      </button>
      
      {currentGID && (
        <div>
          <h3>Current Location</h3>
          <p>Latitude: {currentGID.coordinate.latitude}</p>
          <p>Longitude: {currentGID.coordinate.longitude}</p>
          <p>Regime: {currentRegime?.name}</p>
        </div>
      )}
      
      {spatialContext && (
        <div>
          <h3>Nearby Users</h3>
          <ul>
            {nearbyUsers.map(user => (
              <li key={user.userId}>
                User {user.userId} - Distance: 
                {user.neighbors.find(n => n.userId === spatialContext?.userId)?.distance.toFixed(1)}m
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### Provider Setup

To enable GeoSpatial tracking in your application, wrap your components with the provider:

```tsx
import { GeoSpatialProvider } from '../contexts/GeoSpatialContext';

function App() {
  return (
    <GeoSpatialProvider>
      {/* Your app components */}
    </GeoSpatialProvider>
  );
}
```

## Usage Examples

### Example 1: Displaying User Location

```tsx
import { GeoSpatialDisplay } from '../components/GeoSpatialDisplay';

function LocationPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Your Location</h1>
      <GeoSpatialDisplay showNearbyUsers={true} />
    </div>
  );
}
```

### Example 2: Custom Regime Creation

```typescript
import { horizontalLandRegimeManager, RegimeType } from '../utils/horizontalLandRegime';
import { geoSpatialTracker, geoToECEF, createSpatialBox } from '../utils/geoSpatialTracker';

// Create a custom regime around a point of interest
function createPointOfInterestRegime(name, latitude, longitude, radiusMeters) {
  // Convert to ECEF
  const position = geoToECEF({
    latitude,
    longitude,
    altitude: 0,
    timestamp: Date.now()
  });
  
  // Create box around point
  const box = createSpatialBox(position, radiusMeters * 2);
  
  // Create regime
  return horizontalLandRegimeManager.createRegime({
    name,
    type: RegimeType.CUSTOM,
    box,
    description: `Point of interest: ${name}`
  });
}

// Example usage
const officeRegime = createPointOfInterestRegime('Office Building', 37.7749, -122.4194, 100);
```

## Best Practices

1. **Start/Stop Tracking Appropriately**: Always stop tracking when not needed to save battery
2. **Consider Privacy**: Inform users and get consent before tracking location
3. **Handle Errors Gracefully**: Location services may not be available or permissions denied
4. **Set Appropriate Precision**: Higher precision uses more resources
5. **Cache GIDs**: Store GIDs for important locations to reduce recalculation
6. **Use Hierarchical Regimes**: For large-scale applications, use hierarchical regimes for better organization
7. **Performance Considerations**: The 3D positioning system can be resource-intensive for large numbers of users

## Technical Limitations

1. **GPS Accuracy**: Consumer GPS typically has 2-10 meter accuracy
2. **Indoor Positioning**: GPS may not work well indoors
3. **Device Support**: Not all devices support orientation and motion sensors
4. **Battery Usage**: Continuous tracking can drain battery quickly
5. **Data Volume**: Tracking large numbers of users generates significant data volume

## Future Enhancements

- Integration with indoor positioning systems
- Advanced spatial indexing for more efficient queries
- Machine learning for regime boundary optimization
- Social features based on spatial proximity
- Augmented reality overlays for regime visualization
