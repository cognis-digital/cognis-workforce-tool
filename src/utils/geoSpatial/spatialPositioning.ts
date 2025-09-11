import {
  SpatialPosition,
  BoxPosition,
  UserNeighbor,
  UserSpatialContext,
  GID,
  ECEFCoordinate,
  Quaternion
} from './types';
import { distanceECEF } from './geoSpatialTracker';

/**
 * System for tracking user positions within spatial boxes
 */
class SpatialPositioningSystem {
  // Map of user ID to user context
  private userContexts: Map<string, UserSpatialContext> = new Map();
  // Map of spatial box ID to set of user IDs
  private spatialBoxUsers: Map<string, Set<string>> = new Map();
  // Event listeners
  private eventListeners: Map<string, Set<Function>> = new Map();
  
  /**
   * Register or update a user's position
   * @param userId User identifier
   * @param gid Geographic ID
   * @returns User's spatial context
   */
  public async registerUser(
    userId: string,
    gid: GID
  ): Promise<UserSpatialContext> {
    // Calculate box position
    const boxPosition = this.calculateBoxPosition(gid);
    
    // Get previous context if it exists
    const previousBoxId = this.userContexts.get(userId)?.gid.spatialBoxId;
    
    // Create new context
    const context: UserSpatialContext = {
      userId,
      gid,
      boxPosition,
      neighbors: [],
      timestamp: Date.now()
    };
    
    // Store user context
    this.userContexts.set(userId, context);
    
    // Update spatial box user mappings
    if (previousBoxId && previousBoxId !== gid.spatialBoxId) {
      // Remove from previous box
      this.spatialBoxUsers.get(previousBoxId)?.delete(userId);
    }
    
    // Add to new box
    if (!this.spatialBoxUsers.has(gid.spatialBoxId)) {
      this.spatialBoxUsers.set(gid.spatialBoxId, new Set());
    }
    this.spatialBoxUsers.get(gid.spatialBoxId)?.add(userId);
    
    // Update neighbors
    this.updateNeighbors(userId);
    
    // Emit events
    this.emit('user-update', {
      userId,
      boxId: gid.spatialBoxId,
      previousBoxId
    });
    
    return context;
  }
  
  /**
   * Update a user's position
   * @param userId User identifier
   * @param gid New geographic ID
   */
  public async updateUserPosition(
    userId: string,
    gid: GID
  ): Promise<UserSpatialContext | null> {
    // Check if user exists
    if (!this.userContexts.has(userId)) {
      return null;
    }
    
    // Register with new position
    return this.registerUser(userId, gid);
  }
  
  /**
   * Get a user's spatial context
   * @param userId User identifier
   * @returns User's spatial context or null if not found
   */
  public getUserContext(userId: string): UserSpatialContext | null {
    return this.userContexts.get(userId) || null;
  }
  
  /**
   * Get users in a spatial box
   * @param boxId Spatial box identifier
   * @returns Array of user IDs
   */
  public getUsersInBox(boxId: string): string[] {
    return Array.from(this.spatialBoxUsers.get(boxId) || []);
  }
  
  /**
   * Get nearby users
   * @param userId User identifier
   * @param maxDistance Maximum distance in meters
   * @param maxCount Maximum number of users to return
   * @returns Array of nearby users
   */
  public getNearbyUsers(
    userId: string,
    maxDistance: number = 1000,
    maxCount: number = 10
  ): UserSpatialContext[] {
    const userContext = this.userContexts.get(userId);
    if (!userContext) return [];
    
    // Get users in the same box first
    const userIds = this.getUsersInBox(userContext.gid.spatialBoxId);
    
    // Filter out the user themselves and calculate distances
    const nearby = userIds
      .filter(id => id !== userId)
      .map(id => {
        const context = this.userContexts.get(id);
        if (!context) return null;
        
        const distance = distanceECEF(
          userContext.gid.ecefPosition,
          context.gid.ecefPosition
        );
        
        return { context, distance };
      })
      .filter((item): item is { context: UserSpatialContext, distance: number } => 
        item !== null && item.distance <= maxDistance
      )
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxCount);
    
    return nearby.map(item => item.context);
  }
  
  /**
   * Calculate box position from geographic ID
   * @param gid Geographic ID
   * @returns Box position
   */
  private calculateBoxPosition(gid: GID): BoxPosition {
    // In a real implementation, this would calculate the position within the box
    // based on the ECEF coordinates and the box geometry
    // For simplicity, we'll use a placeholder implementation
    
    // Parse box ID to get grid coordinates
    const match = gid.spatialBoxId.match(/box-(-?\d+)-(-?\d+)-(-?\d+)/);
    if (!match) {
      // Default to center of box if we can't parse the ID
      return {
        normalized: { x: 0.5, y: 0.5, z: 0.5 },
        orientation: { x: 0, y: 0, z: 0, w: 1 } // Identity quaternion
      };
    }
    
    // Extract grid coordinates
    const gridX = parseInt(match[1], 10);
    const gridY = parseInt(match[2], 10);
    const gridZ = parseInt(match[3], 10);
    
    // Grid size used in GID generation
    const gridSize = 100;
    
    // Calculate position within grid cell
    const x = (gid.ecefPosition.x - gridX * gridSize) / gridSize;
    const y = (gid.ecefPosition.y - gridY * gridSize) / gridSize;
    const z = (gid.ecefPosition.z - gridZ * gridSize) / gridSize;
    
    return {
      normalized: {
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y)),
        z: Math.max(0, Math.min(1, z))
      },
      orientation: { x: 0, y: 0, z: 0, w: 1 } // Identity quaternion
    };
  }
  
  /**
   * Update a user's neighbors
   * @param userId User identifier
   */
  private updateNeighbors(userId: string): void {
    const context = this.userContexts.get(userId);
    if (!context) return;
    
    // Get users in the same box
    const userIds = this.getUsersInBox(context.gid.spatialBoxId);
    
    // Calculate neighbors
    const neighbors: UserNeighbor[] = userIds
      .filter(id => id !== userId)
      .map(id => {
        const neighborContext = this.userContexts.get(id);
        if (!neighborContext) return null;
        
        const distance = distanceECEF(
          context.gid.ecefPosition,
          neighborContext.gid.ecefPosition
        );
        
        // Calculate direction (unit vector)
        const dx = neighborContext.gid.ecefPosition.x - context.gid.ecefPosition.x;
        const dy = neighborContext.gid.ecefPosition.y - context.gid.ecefPosition.y;
        const dz = neighborContext.gid.ecefPosition.z - context.gid.ecefPosition.z;
        const mag = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        const direction: ECEFCoordinate = {
          x: dx / (mag || 1),
          y: dy / (mag || 1),
          z: dz / (mag || 1)
        };
        
        return {
          userId: id,
          distance,
          direction,
          lastUpdate: Date.now()
        };
      })
      .filter((n): n is UserNeighbor => n !== null);
    
    // Update context
    context.neighbors = neighbors;
    
    // Emit event
    this.emit('neighbors-update', {
      userId,
      neighborCount: neighbors.length
    });
  }
  
  /**
   * Register for device orientation events
   * @param userId User identifier
   * @returns Promise resolving to true if orientation is available
   */
  public async registerForOrientation(userId: string): Promise<boolean> {
    // Check if device orientation is available
    if (!window.DeviceOrientationEvent) {
      return false;
    }
    
    try {
      // Request permission if needed (iOS 13+)
      if (
        typeof DeviceOrientationEvent !== 'undefined' && 
        typeof (DeviceOrientationEvent as any).requestPermission === 'function'
      ) {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState !== 'granted') {
          return false;
        }
      }
      
      // Add event listener
      window.addEventListener('deviceorientation', (event) => {
        this.handleOrientationEvent(userId, event);
      });
      
      return true;
    } catch (error) {
      console.error('Error registering for orientation events:', error);
      return false;
    }
  }
  
  /**
   * Handle device orientation event
   * @param userId User identifier
   * @param event Device orientation event
   */
  private handleOrientationEvent(
    userId: string,
    event: DeviceOrientationEvent
  ): void {
    const context = this.userContexts.get(userId);
    if (!context) return;
    
    // Convert Euler angles to quaternion
    const alpha = (event.alpha || 0) * Math.PI / 180;
    const beta = (event.beta || 0) * Math.PI / 180;
    const gamma = (event.gamma || 0) * Math.PI / 180;
    
    const orientation = this.eulerToQuaternion(alpha, beta, gamma);
    
    // Update context
    context.boxPosition.orientation = orientation;
    
    // Emit event
    this.emit('orientation-update', {
      userId,
      orientation
    });
  }
  
  /**
   * Convert Euler angles to quaternion
   * @param alpha Alpha angle (z-axis rotation)
   * @param beta Beta angle (x-axis rotation)
   * @param gamma Gamma angle (y-axis rotation)
   * @returns Quaternion
   */
  private eulerToQuaternion(
    alpha: number,
    beta: number,
    gamma: number
  ): Quaternion {
    // Calculate half angles
    const ca = Math.cos(alpha / 2);
    const sa = Math.sin(alpha / 2);
    const cb = Math.cos(beta / 2);
    const sb = Math.sin(beta / 2);
    const cg = Math.cos(gamma / 2);
    const sg = Math.sin(gamma / 2);
    
    // Calculate quaternion components
    const w = ca * cb * cg + sa * sb * sg;
    const x = sa * cb * cg - ca * sb * sg;
    const y = ca * sb * cg + sa * cb * sg;
    const z = ca * cb * sg - sa * sb * cg;
    
    return { x, y, z, w };
  }
  
  /**
   * Add event listener
   * @param eventType Event type
   * @param callback Callback function
   */
  public addEventListener(eventType: string, callback: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    
    this.eventListeners.get(eventType)?.add(callback);
  }
  
  /**
   * Remove event listener
   * @param eventType Event type
   * @param callback Callback function
   */
  public removeEventListener(eventType: string, callback: Function): void {
    this.eventListeners.get(eventType)?.delete(callback);
  }
  
  /**
   * Emit event
   * @param eventType Event type
   * @param data Event data
   */
  private emit(eventType: string, data: any): void {
    this.eventListeners.get(eventType)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${eventType} event listener:`, error);
      }
    });
  }
}

// Create and export singleton instance
export const spatialPositioningSystem = new SpatialPositioningSystem();
