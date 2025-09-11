/**
 * GeoSpatial types for the Cognis Workforce Tool
 */

/**
 * Geographic coordinate
 */
export interface GeoCoordinate {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

/**
 * Earth-Centered Earth-Fixed (ECEF) coordinate
 */
export interface ECEFCoordinate {
  x: number;
  y: number;
  z: number;
}

/**
 * 3D spatial box representing a volume of space
 */
export interface SpatialBox {
  center: ECEFCoordinate;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  rotation: Quaternion;
}

/**
 * Geographic ID for a specific location
 */
export interface GID {
  coordinate: GeoCoordinate;
  ecefPosition: ECEFCoordinate;
  regimeIdentifier: string;
  spatialBoxId: string;
  timestamp: number;
}

/**
 * 3D orientation using quaternions
 */
export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

/**
 * Complete 6DOF (degrees of freedom) position data
 */
export interface SpatialPosition {
  position: ECEFCoordinate;
  orientation: Quaternion;
  velocity?: {
    linear: { x: number; y: number; z: number };
    angular: { x: number; y: number; z: number };
  };
  timestamp: number;
}

/**
 * User position within a spatial box
 */
export interface BoxPosition {
  normalized: {
    x: number; // 0-1 within box
    y: number; // 0-1 within box
    z: number; // 0-1 within box
  };
  orientation: Quaternion;
}

/**
 * User relationship to another user
 */
export interface UserNeighbor {
  userId: string;
  distance: number;
  direction: ECEFCoordinate; // Unit vector pointing to the neighbor
  lastUpdate: number;
}

/**
 * User's spatial context including position and neighbors
 */
export interface UserSpatialContext {
  userId: string;
  gid: GID;
  boxPosition: BoxPosition;
  neighbors: UserNeighbor[];
  timestamp: number;
}

/**
 * Types of land regimes
 */
export enum RegimeType {
  GEOGRAPHIC = 'geographic',
  ADMINISTRATIVE = 'administrative',
  CUSTOM = 'custom',
  VIRTUAL = 'virtual'
}

/**
 * Horizontal land regime properties
 */
export interface HorizontalLandRegime {
  id: string;
  name: string;
  type: RegimeType;
  box: SpatialBox;
  parentId?: string;
  childIds: string[];
  userIds: string[];
  metadata: Record<string, any>;
  createdAt: number;
  area: number; // Square meters
  userCount: number;
}

/**
 * Spatial query options
 */
export interface SpatialQuery {
  nearPoint?: {
    point: ECEFCoordinate;
    maxDistance: number;
  };
  containsPoint?: ECEFCoordinate;
  intersectsBox?: SpatialBox;
  parentId?: string;
  type?: RegimeType;
  maxResults?: number;
}
