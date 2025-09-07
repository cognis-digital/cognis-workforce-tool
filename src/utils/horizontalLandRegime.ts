/**
 * Horizontal Land Regime Mapping System
 * 
 * Organizes geographical spaces into discrete horizontal regimes
 * and manages user associations with these regimes.
 */

import { 
  GeoID, 
  SpatialBox, 
  ECEFCoordinate,
  GeoCoordinate,
  geoToECEF,
  ecefToGeo
} from './geoSpatialTracker';

import {
  UserSpatialContext,
  spatialPositioningSystem
} from './spatialPositioning';

/**
 * Land regime types defining different spatial organization models
 */
export enum RegimeType {
  GEOGRAPHIC = 'geographic',  // Based on geographic grid (lat/lon)
  ADMINISTRATIVE = 'administrative',  // Based on administrative boundaries
  CUSTOM = 'custom',  // Custom-defined boundaries
  DYNAMIC = 'dynamic'  // Dynamically adjusted based on user density
}

/**
 * Structure defining a horizontal land regime
 */
export interface HorizontalLandRegime {
  id: string;  // Unique identifier
  name: string;  // Human-readable name
  description?: string;  // Description of the regime
  type: RegimeType;  // Type of regime
  box: SpatialBox;  // 3D box defining the regime
  center: GeoCoordinate;  // Geographic center
  area: number;  // Area in square meters
  parentRegimeId?: string;  // ID of parent regime (for hierarchical organization)
  childRegimeIds: string[];  // IDs of child regimes
  properties: Map<string, any>;  // Additional properties
  userCount: number;  // Number of users currently in this regime
  createdAt: number;  // Timestamp when created
  updatedAt: number;  // Timestamp when last updated
}

/**
 * Parameters for creating a land regime
 */
export interface RegimeParams {
  name: string;
  type: RegimeType;
  box: SpatialBox;
  description?: string;
  parentRegimeId?: string;
  properties?: Map<string, any>;
}

/**
 * Filter options for querying regimes
 */
export interface RegimeFilter {
  type?: RegimeType;
  parentRegimeId?: string;
  minArea?: number;
  maxArea?: number;
  containsPoint?: ECEFCoordinate;
  nearPoint?: {
    point: ECEFCoordinate;
    maxDistance: number;
  };
}

/**
 * Result of a regime query
 */
export interface RegimeQueryResult {
  regimes: HorizontalLandRegime[];
  totalCount: number;
  hasMore: boolean;
}

/**
 * Class that manages horizontal land regimes
 */
export class HorizontalLandRegimeManager {
  private regimes: Map<string, HorizontalLandRegime> = new Map();
  private userRegimes: Map<string, string> = new Map(); // userId -> regimeId
  
  /**
   * Create a new horizontal land regime
   * 
   * @param params Parameters for the new regime
   * @returns The created regime
   */
  public createRegime(params: RegimeParams): HorizontalLandRegime {
    // Create a new regime ID if not part of the box already
    const regimeId = params.box.regimeId || `regime-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Calculate center in geo coordinates
    const centerECEF: ECEFCoordinate = {
      x: (params.box.minX + params.box.maxX) / 2,
      y: (params.box.minY + params.box.maxY) / 2,
      z: (params.box.minZ + params.box.maxZ) / 2
    };
    const center = ecefToGeo(centerECEF);
    
    // Calculate approximate area (simplified as rectangular projection)
    const boxWidth = params.box.maxX - params.box.minX;
    const boxDepth = params.box.maxY - params.box.minY;
    const area = boxWidth * boxDepth;
    
    // Create the regime
    const regime: HorizontalLandRegime = {
      id: regimeId,
      name: params.name,
      description: params.description || "",
      type: params.type,
      box: { ...params.box, regimeId }, // Ensure regimeId is set in box
      center,
      area,
      parentRegimeId: params.parentRegimeId,
      childRegimeIds: [],
      properties: params.properties || new Map(),
      userCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Store the regime
    this.regimes.set(regimeId, regime);
    
    // If it has a parent, update the parent's child list
    if (params.parentRegimeId) {
      const parent = this.regimes.get(params.parentRegimeId);
      if (parent) {
        parent.childRegimeIds.push(regimeId);
        parent.updatedAt = Date.now();
        this.regimes.set(params.parentRegimeId, parent);
      }
    }
    
    console.log(`Created regime: ${regime.name} (${regime.id})`);
    return regime;
  }
  
  /**
   * Update an existing regime
   * 
   * @param regimeId ID of regime to update
   * @param updates Partial updates to apply
   * @returns Updated regime or undefined if not found
   */
  public updateRegime(
    regimeId: string, 
    updates: Partial<Pick<HorizontalLandRegime, 'name' | 'description' | 'properties'>>
  ): HorizontalLandRegime | undefined {
    const regime = this.regimes.get(regimeId);
    if (!regime) {
      return undefined;
    }
    
    // Apply updates
    if (updates.name) regime.name = updates.name;
    if (updates.description) regime.description = updates.description;
    if (updates.properties) {
      // Merge properties
      updates.properties.forEach((value, key) => {
        regime.properties.set(key, value);
      });
    }
    
    regime.updatedAt = Date.now();
    
    // Store updated regime
    this.regimes.set(regimeId, regime);
    
    return regime;
  }
  
  /**
   * Get a regime by ID
   * 
   * @param regimeId ID of regime to retrieve
   * @returns Regime or undefined if not found
   */
  public getRegime(regimeId: string): HorizontalLandRegime | undefined {
    return this.regimes.get(regimeId);
  }
  
  /**
   * Delete a regime
   * 
   * @param regimeId ID of regime to delete
   * @returns True if deleted, false if not found
   */
  public deleteRegime(regimeId: string): boolean {
    const regime = this.regimes.get(regimeId);
    if (!regime) {
      return false;
    }
    
    // Cannot delete regime with users in it
    if (regime.userCount > 0) {
      console.error(`Cannot delete regime ${regimeId} with ${regime.userCount} users`);
      return false;
    }
    
    // Remove from parent's child list if it has a parent
    if (regime.parentRegimeId) {
      const parent = this.regimes.get(regime.parentRegimeId);
      if (parent) {
        parent.childRegimeIds = parent.childRegimeIds.filter(id => id !== regimeId);
        parent.updatedAt = Date.now();
        this.regimes.set(regime.parentRegimeId, parent);
      }
    }
    
    // Delete the regime
    this.regimes.delete(regimeId);
    console.log(`Deleted regime: ${regime.name} (${regime.id})`);
    
    return true;
  }
  
  /**
   * Find regimes matching the given filter
   * 
   * @param filter Filter criteria
   * @param limit Maximum number of results to return
   * @param offset Offset for pagination
   * @returns Query result with matching regimes
   */
  public findRegimes(
    filter: RegimeFilter = {}, 
    limit: number = 100, 
    offset: number = 0
  ): RegimeQueryResult {
    let regimes = Array.from(this.regimes.values());
    
    // Apply filters
    if (filter.type) {
      regimes = regimes.filter(r => r.type === filter.type);
    }
    
    if (filter.parentRegimeId) {
      regimes = regimes.filter(r => r.parentRegimeId === filter.parentRegimeId);
    }
    
    if (filter.minArea !== undefined) {
      regimes = regimes.filter(r => r.area >= filter.minArea!);
    }
    
    if (filter.maxArea !== undefined) {
      regimes = regimes.filter(r => r.area <= filter.maxArea!);
    }
    
    if (filter.containsPoint) {
      regimes = regimes.filter(r => this.isPointInRegime(filter.containsPoint!, r.id));
    }
    
    if (filter.nearPoint) {
      regimes = regimes.filter(r => {
        const centerECEF: ECEFCoordinate = {
          x: (r.box.minX + r.box.maxX) / 2,
          y: (r.box.minY + r.box.maxY) / 2,
          z: (r.box.minZ + r.box.maxZ) / 2
        };
        
        // Calculate distance
        const dx = centerECEF.x - filter.nearPoint!.point.x;
        const dy = centerECEF.y - filter.nearPoint!.point.y;
        const dz = centerECEF.z - filter.nearPoint!.point.z;
        const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        return distance <= filter.nearPoint!.maxDistance;
      });
    }
    
    // Sort by creation time (newest first)
    regimes = regimes.sort((a, b) => b.createdAt - a.createdAt);
    
    // Apply pagination
    const totalCount = regimes.length;
    const paginatedRegimes = regimes.slice(offset, offset + limit);
    
    return {
      regimes: paginatedRegimes,
      totalCount,
      hasMore: offset + limit < totalCount
    };
  }
  
  /**
   * Check if a point is within a specific regime
   * 
   * @param point ECEF coordinate to check
   * @param regimeId ID of regime to check against
   * @returns True if the point is within the regime
   */
  public isPointInRegime(point: ECEFCoordinate, regimeId: string): boolean {
    const regime = this.regimes.get(regimeId);
    if (!regime) {
      return false;
    }
    
    // Check if point is within box
    return (
      point.x >= regime.box.minX && point.x <= regime.box.maxX &&
      point.y >= regime.box.minY && point.y <= regime.box.maxY &&
      point.z >= regime.box.minZ && point.z <= regime.box.maxZ
    );
  }
  
  /**
   * Find the regime containing a specific point
   * 
   * @param point ECEF coordinate to find regime for
   * @returns The containing regime or undefined if none found
   */
  public findContainingRegime(point: ECEFCoordinate): HorizontalLandRegime | undefined {
    // This could be optimized with spatial indexing, but for simplicity we'll search all regimes
    for (const regime of this.regimes.values()) {
      if (this.isPointInRegime(point, regime.id)) {
        return regime;
      }
    }
    
    return undefined;
  }
  
  /**
   * Register a user with a regime based on their GID
   * 
   * @param userId User identifier
   * @param gid User's geographical ID
   * @returns The regime the user is registered with
   */
  public registerUserWithRegime(userId: string, gid: GeoID): HorizontalLandRegime {
    // Find or create regime based on GID
    let regime = this.findContainingRegime(gid.ecefPosition);
    
    // If no existing regime contains this point, create one based on GID's box
    if (!regime) {
      regime = this.createRegime({
        name: gid.regimeIdentifier,
        type: RegimeType.GEOGRAPHIC,
        box: gid.box,
        description: `Auto-generated regime for location ${gid.coordinate.latitude.toFixed(6)}, ${gid.coordinate.longitude.toFixed(6)}`
      });
    }
    
    // Check if user is already in a regime
    const currentRegimeId = this.userRegimes.get(userId);
    if (currentRegimeId) {
      const currentRegime = this.regimes.get(currentRegimeId);
      if (currentRegime && currentRegimeId !== regime.id) {
        // User is moving to a new regime, update counts
        currentRegime.userCount--;
        this.regimes.set(currentRegimeId, currentRegime);
      }
    }
    
    // Register user with new regime
    this.userRegimes.set(userId, regime.id);
    
    // Update regime user count
    regime.userCount++;
    regime.updatedAt = Date.now();
    this.regimes.set(regime.id, regime);
    
    return regime;
  }
  
  /**
   * Update a user's regime based on new GID
   * 
   * @param userId User identifier
   * @param gid New geographical ID
   * @returns The new regime or undefined if no change
   */
  public updateUserRegime(userId: string, gid: GeoID): HorizontalLandRegime | undefined {
    const currentRegimeId = this.userRegimes.get(userId);
    
    // Find the containing regime for the new position
    const containingRegime = this.findContainingRegime(gid.ecefPosition);
    
    // If user is already in the correct regime or no containing regime exists, no change needed
    if ((currentRegimeId && containingRegime && currentRegimeId === containingRegime.id) ||
        (!currentRegimeId && !containingRegime)) {
      return undefined;
    }
    
    // Register with the new regime (this will handle all the updates)
    return this.registerUserWithRegime(userId, gid);
  }
  
  /**
   * Get the regime a user is currently in
   * 
   * @param userId User identifier
   * @returns The user's current regime or undefined if not registered
   */
  public getUserRegime(userId: string): HorizontalLandRegime | undefined {
    const regimeId = this.userRegimes.get(userId);
    if (!regimeId) {
      return undefined;
    }
    
    return this.regimes.get(regimeId);
  }
  
  /**
   * Get all users in a specific regime
   * 
   * @param regimeId Regime identifier
   * @returns Array of user identifiers in the regime
   */
  public getUsersInRegime(regimeId: string): string[] {
    const users: string[] = [];
    
    for (const [userId, userRegimeId] of this.userRegimes.entries()) {
      if (userRegimeId === regimeId) {
        users.push(userId);
      }
    }
    
    return users;
  }
  
  /**
   * Unregister a user from their current regime
   * 
   * @param userId User identifier
   * @returns True if successfully unregistered
   */
  public unregisterUser(userId: string): boolean {
    const regimeId = this.userRegimes.get(userId);
    if (!regimeId) {
      return false;
    }
    
    // Update regime user count
    const regime = this.regimes.get(regimeId);
    if (regime) {
      regime.userCount--;
      regime.updatedAt = Date.now();
      this.regimes.set(regimeId, regime);
    }
    
    // Remove user from registry
    this.userRegimes.delete(userId);
    
    return true;
  }
  
  /**
   * Create a hierarchical organization of regimes based on a grid
   * 
   * @param centerCoord Center coordinate for the grid
   * @param topLevelSize Size of the top level square in meters
   * @param depth Number of hierarchical levels
   * @param subdivisions Number of subdivisions per level
   * @returns ID of the top-level regime
   */
  public createHierarchicalGrid(
    centerCoord: GeoCoordinate,
    topLevelSize: number,
    depth: number = 3,
    subdivisions: number = 4
  ): string {
    // Convert center to ECEF
    const centerECEF = geoToECEF(centerCoord);
    
    // Create top level box
    const halfSize = topLevelSize / 2;
    const topBox: SpatialBox = {
      minX: centerECEF.x - halfSize,
      maxX: centerECEF.x + halfSize,
      minY: centerECEF.y - halfSize,
      maxY: centerECEF.y + halfSize,
      minZ: centerECEF.z - halfSize,
      maxZ: centerECEF.z + halfSize,
      regimeId: `grid-${Date.now()}`
    };
    
    // Create top level regime
    const topRegime = this.createRegime({
      name: `Grid ${centerCoord.latitude.toFixed(3)}, ${centerCoord.longitude.toFixed(3)}`,
      type: RegimeType.GEOGRAPHIC,
      box: topBox,
      description: `Top-level grid centered at ${centerCoord.latitude.toFixed(6)}, ${centerCoord.longitude.toFixed(6)}`
    });
    
    // Recursively create subgrids
    if (depth > 1) {
      this.createSubgrids(topRegime.id, topBox, depth - 1, subdivisions);
    }
    
    return topRegime.id;
  }
  
  /**
   * Recursively create subgrids for a hierarchical grid
   * 
   * @param parentId ID of parent regime
   * @param parentBox Box of parent regime
   * @param remainingDepth Remaining depth levels to create
   * @param subdivisions Number of subdivisions per dimension
   */
  private createSubgrids(
    parentId: string, 
    parentBox: SpatialBox, 
    remainingDepth: number,
    subdivisions: number
  ): void {
    if (remainingDepth <= 0) {
      return;
    }
    
    const xSize = (parentBox.maxX - parentBox.minX) / subdivisions;
    const ySize = (parentBox.maxY - parentBox.minY) / subdivisions;
    const zSize = (parentBox.maxZ - parentBox.minZ) / subdivisions;
    
    // Create a grid of subregimes
    for (let i = 0; i < subdivisions; i++) {
      for (let j = 0; j < subdivisions; j++) {
        // For simplicity, we'll just do a 2D grid (ignoring z dimension)
        const subBox: SpatialBox = {
          minX: parentBox.minX + (i * xSize),
          maxX: parentBox.minX + ((i + 1) * xSize),
          minY: parentBox.minY + (j * ySize),
          maxY: parentBox.minY + ((j + 1) * ySize),
          minZ: parentBox.minZ,
          maxZ: parentBox.maxZ,
          regimeId: `${parentId}-sub-${i}-${j}`
        };
        
        // Convert center to geo for naming
        const centerECEF: ECEFCoordinate = {
          x: (subBox.minX + subBox.maxX) / 2,
          y: (subBox.minY + subBox.maxY) / 2,
          z: (subBox.minZ + subBox.maxZ) / 2
        };
        const centerGeo = ecefToGeo(centerECEF);
        
        // Create subregime
        const subRegime = this.createRegime({
          name: `Subgrid ${centerGeo.latitude.toFixed(4)}, ${centerGeo.longitude.toFixed(4)}`,
          type: RegimeType.GEOGRAPHIC,
          box: subBox,
          parentRegimeId: parentId,
          description: `Level ${4 - remainingDepth} subgrid at ${centerGeo.latitude.toFixed(6)}, ${centerGeo.longitude.toFixed(6)}`
        });
        
        // Recursively create further subgrids if needed
        if (remainingDepth > 1) {
          this.createSubgrids(subRegime.id, subBox, remainingDepth - 1, subdivisions);
        }
      }
    }
  }
}

// Export singleton instance
export const horizontalLandRegimeManager = new HorizontalLandRegimeManager();
