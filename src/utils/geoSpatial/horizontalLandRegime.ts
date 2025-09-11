import {
  HorizontalLandRegime,
  RegimeType,
  SpatialBox,
  ECEFCoordinate,
  GeoCoordinate,
  SpatialQuery,
  GID
} from './types';
import { 
  distanceECEF, 
  createSpatialBox, 
  geoToECEF 
} from './geoSpatialTracker';

/**
 * Manager for horizontal land regimes
 */
class HorizontalLandRegimeManager {
  // Map of regime ID to regime
  private regimes: Map<string, HorizontalLandRegime> = new Map();
  // Map of user ID to regime ID
  private userRegimes: Map<string, string> = new Map();
  // Event listeners
  private eventListeners: Map<string, Set<Function>> = new Map();
  
  /**
   * Create a new horizontal land regime
   * @param options Regime options
   * @returns Regime ID
   */
  public createRegime(options: {
    name: string;
    type: RegimeType;
    box: SpatialBox;
    parentId?: string;
    description?: string;
    metadata?: Record<string, any>;
  }): string {
    // Generate ID
    const id = `regime-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Create regime
    const regime: HorizontalLandRegime = {
      id,
      name: options.name,
      type: options.type,
      box: options.box,
      parentId: options.parentId,
      childIds: [],
      userIds: [],
      metadata: {
        description: options.description || '',
        ...(options.metadata || {})
      },
      createdAt: Date.now(),
      area: this.calculateBoxArea(options.box),
      userCount: 0
    };
    
    // Store regime
    this.regimes.set(id, regime);
    
    // Update parent if specified
    if (options.parentId) {
      const parent = this.regimes.get(options.parentId);
      if (parent) {
        parent.childIds.push(id);
      }
    }
    
    // Emit event
    this.emit('regime-created', { id, name: options.name, type: options.type });
    
    return id;
  }
  
  /**
   * Get a regime by ID
   * @param id Regime ID
   * @returns Regime or null if not found
   */
  public getRegime(id: string): HorizontalLandRegime | null {
    return this.regimes.get(id) || null;
  }
  
  /**
   * Get all regimes
   * @returns Array of all regimes
   */
  public getAllRegimes(): HorizontalLandRegime[] {
    return Array.from(this.regimes.values());
  }
  
  /**
   * Create a hierarchical grid of regimes
   * @param center Center coordinate
   * @param topLevelSize Size of top level in meters
   * @param levels Number of levels
   * @param subdivisions Number of subdivisions per level
   * @returns ID of the top-level regime
   */
  public createHierarchicalGrid(
    center: GeoCoordinate,
    topLevelSize: number,
    levels: number = 3,
    subdivisions: number = 4
  ): string {
    // Convert center to ECEF
    const ecefCenter = geoToECEF(center);
    
    // Create top-level box
    const topBox = createSpatialBox(ecefCenter, topLevelSize);
    
    // Create top-level regime
    const topId = this.createRegime({
      name: `Grid L0`,
      type: RegimeType.GEOGRAPHIC,
      box: topBox,
      description: 'Top level grid regime',
      metadata: {
        level: 0,
        gridIndex: [0, 0, 0]
      }
    });
    
    // Create hierarchical levels
    this.createGridLevel(
      topId,
      topBox,
      1,
      levels,
      subdivisions
    );
    
    return topId;
  }
  
  /**
   * Recursively create grid levels
   * @param parentId Parent regime ID
   * @param parentBox Parent box
   * @param level Current level
   * @param maxLevels Maximum number of levels
   * @param subdivisions Number of subdivisions per dimension
   */
  private createGridLevel(
    parentId: string,
    parentBox: SpatialBox,
    level: number,
    maxLevels: number,
    subdivisions: number
  ): void {
    if (level > maxLevels) return;
    
    const { center, dimensions } = parentBox;
    const childSize = dimensions.width / subdivisions;
    
    // Calculate the starting corner for the grid
    const startX = center.x - (dimensions.width / 2) + (childSize / 2);
    const startY = center.y - (dimensions.height / 2) + (childSize / 2);
    const startZ = center.z - (dimensions.depth / 2) + (childSize / 2);
    
    // Create grid of child boxes
    for (let i = 0; i < subdivisions; i++) {
      for (let j = 0; j < subdivisions; j++) {
        for (let k = 0; k < subdivisions; k++) {
          // Calculate child center
          const childCenter: ECEFCoordinate = {
            x: startX + i * childSize,
            y: startY + j * childSize,
            z: startZ + k * childSize
          };
          
          // Create child box
          const childBox = createSpatialBox(childCenter, childSize);
          
          // Create child regime
          const childId = this.createRegime({
            name: `Grid L${level}-${i}-${j}-${k}`,
            type: RegimeType.GEOGRAPHIC,
            box: childBox,
            parentId,
            description: `Level ${level} grid regime`,
            metadata: {
              level,
              gridIndex: [i, j, k]
            }
          });
          
          // Recursively create next level
          if (level < maxLevels) {
            this.createGridLevel(
              childId,
              childBox,
              level + 1,
              maxLevels,
              subdivisions
            );
          }
        }
      }
    }
  }
  
  /**
   * Register a user with a regime based on their GID
   * @param userId User identifier
   * @param gid Geographic ID
   * @returns The regime the user was registered with
   */
  public registerUserWithRegime(
    userId: string,
    gid: GID
  ): HorizontalLandRegime | null {
    // Find the smallest regime that contains the user's position
    const containingRegimes = this.findRegimes({
      containsPoint: gid.ecefPosition
    });
    
    // Sort by area (smallest first)
    containingRegimes.sort((a, b) => a.area - b.area);
    
    // Get the smallest regime
    const regime = containingRegimes[0];
    if (!regime) {
      return null;
    }
    
    // Check if user is already in this regime
    const currentRegimeId = this.userRegimes.get(userId);
    if (currentRegimeId === regime.id) {
      return regime;
    }
    
    // Remove from previous regime if any
    if (currentRegimeId) {
      const prevRegime = this.regimes.get(currentRegimeId);
      if (prevRegime) {
        prevRegime.userIds = prevRegime.userIds.filter(id => id !== userId);
        prevRegime.userCount = Math.max(0, prevRegime.userCount - 1);
      }
    }
    
    // Add to new regime
    regime.userIds.push(userId);
    regime.userCount++;
    this.userRegimes.set(userId, regime.id);
    
    // Emit event
    this.emit('user-regime-change', {
      userId,
      regimeId: regime.id,
      previousRegimeId: currentRegimeId
    });
    
    return regime;
  }
  
  /**
   * Find regimes based on query criteria
   * @param query Spatial query
   * @returns Array of matching regimes
   */
  public findRegimes(query: SpatialQuery): HorizontalLandRegime[] {
    let results = Array.from(this.regimes.values());
    
    // Filter by parent ID
    if (query.parentId) {
      results = results.filter(regime => regime.parentId === query.parentId);
    }
    
    // Filter by type
    if (query.type) {
      results = results.filter(regime => regime.type === query.type);
    }
    
    // Filter by spatial criteria
    if (query.nearPoint) {
      const { point, maxDistance } = query.nearPoint;
      results = results.filter(regime => {
        return distanceECEF(point, regime.box.center) <= maxDistance;
      });
    }
    
    if (query.containsPoint) {
      results = results.filter(regime => {
        return this.boxContainsPoint(regime.box, query.containsPoint!);
      });
    }
    
    if (query.intersectsBox) {
      results = results.filter(regime => {
        return this.boxesIntersect(regime.box, query.intersectsBox!);
      });
    }
    
    // Limit results if specified
    if (query.maxResults && results.length > query.maxResults) {
      results = results.slice(0, query.maxResults);
    }
    
    return results;
  }
  
  /**
   * Get users in a regime
   * @param regimeId Regime ID
   * @returns Array of user IDs
   */
  public getUsersInRegime(regimeId: string): string[] {
    const regime = this.regimes.get(regimeId);
    return regime ? [...regime.userIds] : [];
  }
  
  /**
   * Get a user's current regime
   * @param userId User identifier
   * @returns Regime or null if not found
   */
  public getUserRegime(userId: string): HorizontalLandRegime | null {
    const regimeId = this.userRegimes.get(userId);
    return regimeId ? this.regimes.get(regimeId) || null : null;
  }
  
  /**
   * Calculate the approximate area of a box
   * @param box Spatial box
   * @returns Area in square meters
   */
  private calculateBoxArea(box: SpatialBox): number {
    return box.dimensions.width * box.dimensions.height;
  }
  
  /**
   * Check if a box contains a point
   * @param box Spatial box
   * @param point ECEF coordinate
   * @returns True if the box contains the point
   */
  private boxContainsPoint(box: SpatialBox, point: ECEFCoordinate): boolean {
    // For simplicity, we assume an axis-aligned box
    // A more accurate implementation would account for rotation
    
    const halfWidth = box.dimensions.width / 2;
    const halfHeight = box.dimensions.height / 2;
    const halfDepth = box.dimensions.depth / 2;
    
    return (
      point.x >= box.center.x - halfWidth &&
      point.x <= box.center.x + halfWidth &&
      point.y >= box.center.y - halfHeight &&
      point.y <= box.center.y + halfHeight &&
      point.z >= box.center.z - halfDepth &&
      point.z <= box.center.z + halfDepth
    );
  }
  
  /**
   * Check if two boxes intersect
   * @param boxA First spatial box
   * @param boxB Second spatial box
   * @returns True if the boxes intersect
   */
  private boxesIntersect(boxA: SpatialBox, boxB: SpatialBox): boolean {
    // For simplicity, we assume axis-aligned boxes
    // A more accurate implementation would account for rotation
    
    const halfWidthA = boxA.dimensions.width / 2;
    const halfHeightA = boxA.dimensions.height / 2;
    const halfDepthA = boxA.dimensions.depth / 2;
    
    const halfWidthB = boxB.dimensions.width / 2;
    const halfHeightB = boxB.dimensions.height / 2;
    const halfDepthB = boxB.dimensions.depth / 2;
    
    return (
      Math.abs(boxA.center.x - boxB.center.x) <= (halfWidthA + halfWidthB) &&
      Math.abs(boxA.center.y - boxB.center.y) <= (halfHeightA + halfHeightB) &&
      Math.abs(boxA.center.z - boxB.center.z) <= (halfDepthA + halfDepthB)
    );
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
export const horizontalLandRegimeManager = new HorizontalLandRegimeManager();
