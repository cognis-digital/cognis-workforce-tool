/**
 * Spatial Positioning System
 * 
 * Advanced 3D positioning system that tracks users within spatial boxes
 * and provides detailed spatial awareness for horizontal land regime management
 */

import { 
  ECEFCoordinate, 
  GeoCoordinate, 
  SpatialBox, 
  GeoID,
  geoToECEF,
  ecefToGeo,
  ecefDistance
} from './geoSpatialTracker';

/**
 * Quaternion representing 3D rotation
 */
export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

/**
 * Spatial position with full 6DOF (Degrees of Freedom) data
 */
export interface SpatialPosition {
  ecefPosition: ECEFCoordinate;
  geoPosition: GeoCoordinate;
  orientation: Quaternion;
  velocity?: ECEFCoordinate;
  accuracy: {
    position: number;  // Position accuracy in meters
    orientation: number;  // Orientation accuracy in degrees
  };
  timestamp: number;
}

/**
 * Enhanced user position with regime information
 */
export interface UserSpatialContext {
  userId: string;
  position: SpatialPosition;
  gid: GeoID;
  boxPosition: {  // Normalized position within the spatial box (0-1 for each axis)
    x: number;
    y: number;
    z: number;
  };
  neighbors: UserProximity[];
  lastUpdated: number;
}

/**
 * Information about a nearby user
 */
export interface UserProximity {
  userId: string;
  distance: number;  // Distance in meters
  direction: ECEFCoordinate;  // Unit vector pointing toward the user
  inSameRegime: boolean;
}

/**
 * Convert device orientation to quaternion
 * 
 * @param alpha rotation around z-axis
 * @param beta rotation around x-axis
 * @param gamma rotation around y-axis
 * @returns Quaternion representing the orientation
 */
export function orientationToQuaternion(alpha: number, beta: number, gamma: number): Quaternion {
  // Convert angles to radians
  const alphaRad = (alpha * Math.PI) / 180;
  const betaRad = (beta * Math.PI) / 180;
  const gammaRad = (gamma * Math.PI) / 180;

  // Calculate half angles
  const ca = Math.cos(alphaRad / 2);
  const cb = Math.cos(betaRad / 2);
  const cg = Math.cos(gammaRad / 2);
  const sa = Math.sin(alphaRad / 2);
  const sb = Math.sin(betaRad / 2);
  const sg = Math.sin(gammaRad / 2);

  // Calculate quaternion components
  const w = ca * cb * cg - sa * sb * sg;
  const x = sa * cb * cg - ca * sb * sg;
  const y = ca * sb * cg + sa * cb * sg;
  const z = ca * cb * sg + sa * sb * cg;

  return { x, y, z, w };
}

/**
 * Calculate normalized position within a spatial box
 * 
 * @param point ECEF coordinates of the point
 * @param box Spatial box to normalize against
 * @returns Normalized position (0-1 on each axis)
 */
export function normalizePositionInBox(point: ECEFCoordinate, box: SpatialBox): { x: number, y: number, z: number } {
  return {
    x: (point.x - box.minX) / (box.maxX - box.minX),
    y: (point.y - box.minY) / (box.maxY - box.minY),
    z: (point.z - box.minZ) / (box.maxZ - box.minZ),
  };
}

/**
 * Calculate the unit direction vector from one point to another
 * 
 * @param from Starting ECEF position
 * @param to Ending ECEF position
 * @returns Unit vector in ECEF coordinates
 */
export function calculateDirectionVector(from: ECEFCoordinate, to: ECEFCoordinate): ECEFCoordinate {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dz = to.z - from.z;
  
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  
  if (distance === 0) {
    return { x: 0, y: 0, z: 0 };
  }
  
  return {
    x: dx / distance,
    y: dy / distance,
    z: dz / distance
  };
}

/**
 * Class to manage 3D spatial positioning of users
 */
export class SpatialPositioningSystem {
  private userPositions: Map<string, UserSpatialContext> = new Map();
  private deviceOrientationSupported: boolean = false;
  private motionSupported: boolean = false;
  
  constructor() {
    this.checkSensors();
  }
  
  /**
   * Check if the device supports required sensors
   */
  private checkSensors(): void {
    // Check for device orientation support
    this.deviceOrientationSupported = 'DeviceOrientationEvent' in window;
    
    // Check for motion support
    this.motionSupported = 'DeviceMotionEvent' in window;
    
    console.log(`Device sensors: Orientation: ${this.deviceOrientationSupported}, Motion: ${this.motionSupported}`);
  }
  
  /**
   * Register a user with the positioning system
   * 
   * @param userId Unique identifier for the user
   * @param gid User's geographical ID
   * @returns Promise resolving to the user's spatial context
   */
  public async registerUser(userId: string, gid: GeoID): Promise<UserSpatialContext> {
    // Create initial position from GID
    const position: SpatialPosition = {
      ecefPosition: gid.ecefPosition,
      geoPosition: gid.coordinate,
      orientation: { x: 0, y: 0, z: 0, w: 1 },  // Default to identity quaternion
      accuracy: {
        position: gid.coordinate.accuracy || 10,
        orientation: 45  // Default to high uncertainty
      },
      timestamp: Date.now()
    };
    
    // Create user context
    const userContext: UserSpatialContext = {
      userId,
      position,
      gid,
      boxPosition: normalizePositionInBox(gid.ecefPosition, gid.box),
      neighbors: [],
      lastUpdated: Date.now()
    };
    
    // Store user context
    this.userPositions.set(userId, userContext);
    
    // Start tracking detailed position if possible
    if (this.deviceOrientationSupported) {
      this.startOrientationTracking(userId);
    }
    
    if (this.motionSupported) {
      this.startMotionTracking(userId);
    }
    
    // Update neighbors for all users
    this.updateAllNeighbors();
    
    return userContext;
  }
  
  /**
   * Start tracking device orientation for a user
   * 
   * @param userId User identifier
   */
  private startOrientationTracking(userId: string): void {
    window.addEventListener('deviceorientation', (event) => {
      const user = this.userPositions.get(userId);
      if (!user) return;
      
      // Get orientation angles
      const alpha = event.alpha || 0;
      const beta = event.beta || 0;
      const gamma = event.gamma || 0;
      
      // Convert to quaternion
      const orientation = orientationToQuaternion(alpha, beta, gamma);
      
      // Update user position
      user.position.orientation = orientation;
      user.position.timestamp = Date.now();
      user.lastUpdated = Date.now();
      
      // Store updated context
      this.userPositions.set(userId, user);
    });
  }
  
  /**
   * Start tracking device motion for a user
   * 
   * @param userId User identifier
   */
  private startMotionTracking(userId: string): void {
    window.addEventListener('devicemotion', (event) => {
      const user = this.userPositions.get(userId);
      if (!user) return;
      
      // Check if we have acceleration data
      if (event.acceleration) {
        // Could use acceleration to estimate velocity, but this is complex
        // and requires integration over time. Simplified for this example.
      }
      
      // Update timestamp
      user.position.timestamp = Date.now();
      user.lastUpdated = Date.now();
      
      // Store updated context
      this.userPositions.set(userId, user);
    });
  }
  
  /**
   * Update a user's position based on new GID
   * 
   * @param userId User identifier
   * @param gid New geographical ID
   * @returns Updated user spatial context
   */
  public updateUserPosition(userId: string, gid: GeoID): UserSpatialContext {
    const user = this.userPositions.get(userId);
    
    if (!user) {
      // User not found, register them
      return this.registerUser(userId, gid);
    }
    
    // Preserve orientation but update position
    user.position.ecefPosition = gid.ecefPosition;
    user.position.geoPosition = gid.coordinate;
    user.position.timestamp = Date.now();
    user.gid = gid;
    user.boxPosition = normalizePositionInBox(gid.ecefPosition, gid.box);
    user.lastUpdated = Date.now();
    
    // Store updated context
    this.userPositions.set(userId, user);
    
    // Update neighbors for all users
    this.updateAllNeighbors();
    
    return user;
  }
  
  /**
   * Get a user's current spatial context
   * 
   * @param userId User identifier
   * @returns User spatial context or undefined if not found
   */
  public getUserContext(userId: string): UserSpatialContext | undefined {
    return this.userPositions.get(userId);
  }
  
  /**
   * Update neighbor information for all users
   */
  private updateAllNeighbors(): void {
    const users = Array.from(this.userPositions.values());
    
    // For each user, find their neighbors
    for (const user of users) {
      const userId = user.userId;
      const neighbors: UserProximity[] = [];
      
      // Compare with all other users
      for (const other of users) {
        // Skip self
        if (other.userId === userId) {
          continue;
        }
        
        // Calculate distance
        const distance = ecefDistance(user.position.ecefPosition, other.position.ecefPosition);
        
        // Calculate direction
        const direction = calculateDirectionVector(
          user.position.ecefPosition,
          other.position.ecefPosition
        );
        
        // Determine if in same regime
        const inSameRegime = user.gid.box.regimeId === other.gid.box.regimeId;
        
        // Add to neighbors
        neighbors.push({
          userId: other.userId,
          distance,
          direction,
          inSameRegime
        });
      }
      
      // Sort neighbors by distance
      neighbors.sort((a, b) => a.distance - b.distance);
      
      // Update user context with neighbors
      user.neighbors = neighbors;
      this.userPositions.set(userId, user);
    }
  }
  
  /**
   * Get all users in a specific horizontal land regime
   * 
   * @param regimeId Identifier for the regime
   * @returns Array of user spatial contexts in the regime
   */
  public getUsersInRegime(regimeId: string): UserSpatialContext[] {
    const users = Array.from(this.userPositions.values());
    return users.filter(user => user.gid.box.regimeId === regimeId);
  }
  
  /**
   * Get all registered users
   * 
   * @returns Array of all user spatial contexts
   */
  public getAllUsers(): UserSpatialContext[] {
    return Array.from(this.userPositions.values());
  }
  
  /**
   * Unregister a user from the positioning system
   * 
   * @param userId User identifier to unregister
   */
  public unregisterUser(userId: string): void {
    this.userPositions.delete(userId);
    // Update neighbors for remaining users
    this.updateAllNeighbors();
  }
}

// Export singleton instance
export const spatialPositioningSystem = new SpatialPositioningSystem();
