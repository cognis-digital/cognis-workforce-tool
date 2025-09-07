/**
 * GeoSpatialTracker Module
 * 
 * Provides functionality for tracking user's precise geographical location in 3D space,
 * establishing horizontal land regimes, and generating Geographical IDs (GIDs).
 */

import { v4 as uuidv4 } from 'uuid';

// 3D Coordinate interface representing position in Earth-centered Earth-fixed (ECEF) coordinates
export interface ECEFCoordinate {
  x: number;  // X coordinate in meters
  y: number;  // Y coordinate in meters
  z: number;  // Z coordinate in meters
}

// Geographic coordinate (latitude, longitude, altitude)
export interface GeoCoordinate {
  latitude: number;   // Latitude in decimal degrees
  longitude: number;  // Longitude in decimal degrees
  altitude: number;   // Altitude in meters above sea level
  accuracy?: number;  // Accuracy of the measurement in meters
  timestamp: number;  // Timestamp of the measurement
}

// 3D Box representing a volume of space
export interface SpatialBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
  regimeId: string;  // Identifier for the horizontal land regime
}

// Geographical ID (GID) representing a user's location
export interface GeoID {
  id: string;                // Unique identifier
  coordinate: GeoCoordinate; // Geographic coordinates
  ecefPosition: ECEFCoordinate; // ECEF coordinates
  box: SpatialBox;           // 3D box containing the user
  regimeIdentifier: string;  // Human-readable identifier for the regime
  precision: number;         // Precision level of the GID
  timestamp: number;         // When this GID was generated
}

/**
 * Constants for Earth calculations
 */
const EARTH_RADIUS_METERS = 6371000; // Mean Earth radius in meters
const WGS84_SEMI_MAJOR_AXIS = 6378137.0; // WGS84 semi-major axis in meters
const WGS84_SEMI_MINOR_AXIS = 6356752.314245; // WGS84 semi-minor axis in meters
const WGS84_ECCENTRICITY_SQ = 6.69437999014e-3; // WGS84 eccentricity squared

/**
 * Convert geographic coordinates to Earth-centered Earth-fixed (ECEF) coordinates
 * 
 * @param geoCoord Geographic coordinates (latitude, longitude, altitude)
 * @returns ECEF coordinates (x, y, z) in meters
 */
export function geoToECEF(geoCoord: GeoCoordinate): ECEFCoordinate {
  const { latitude, longitude, altitude } = geoCoord;
  
  // Convert latitude and longitude to radians
  const latRad = (latitude * Math.PI) / 180.0;
  const lonRad = (longitude * Math.PI) / 180.0;

  // Calculate N, the radius of curvature in the prime vertical
  const N = WGS84_SEMI_MAJOR_AXIS / 
    Math.sqrt(1 - WGS84_ECCENTRICITY_SQ * Math.pow(Math.sin(latRad), 2));

  // Calculate ECEF coordinates
  const x = (N + altitude) * Math.cos(latRad) * Math.cos(lonRad);
  const y = (N + altitude) * Math.cos(latRad) * Math.sin(lonRad);
  const z = (N * (1 - WGS84_ECCENTRICITY_SQ) + altitude) * Math.sin(latRad);

  return { x, y, z };
}

/**
 * Convert ECEF coordinates to geographic coordinates
 * 
 * @param ecef ECEF coordinates (x, y, z) in meters
 * @returns Geographic coordinates (latitude, longitude, altitude)
 */
export function ecefToGeo(ecef: ECEFCoordinate): GeoCoordinate {
  const { x, y, z } = ecef;
  
  // Calculate auxiliary values
  const p = Math.sqrt(x * x + y * y);
  const theta = Math.atan2(z * WGS84_SEMI_MAJOR_AXIS, p * WGS84_SEMI_MINOR_AXIS);
  
  // Calculate longitude
  const longitude = Math.atan2(y, x);
  
  // Calculate latitude
  const latFirst = Math.atan2(
    z + WGS84_ECCENTRICITY_SQ * WGS84_SEMI_MINOR_AXIS * Math.pow(Math.sin(theta), 3),
    p - WGS84_ECCENTRICITY_SQ * WGS84_SEMI_MAJOR_AXIS * Math.pow(Math.cos(theta), 3)
  );
  
  // Calculate N
  const N = WGS84_SEMI_MAJOR_AXIS / 
    Math.sqrt(1 - WGS84_ECCENTRICITY_SQ * Math.pow(Math.sin(latFirst), 2));
  
  // Calculate altitude
  const altitude = p / Math.cos(latFirst) - N;
  
  // Convert radians to degrees
  const latitude = (latFirst * 180.0) / Math.PI;
  const longitudeDeg = (longitude * 180.0) / Math.PI;
  
  return {
    latitude,
    longitude: longitudeDeg,
    altitude,
    timestamp: Date.now()
  };
}

/**
 * Create a 3D box around a geographical position based on precision level
 * 
 * @param ecef ECEF coordinates representing the center of the box
 * @param precision Precision level in meters
 * @returns A SpatialBox encompassing the given position
 */
export function createSpatialBox(ecef: ECEFCoordinate, precision: number): SpatialBox {
  // Create a box centered on the ECEF coordinates with size based on precision
  const halfSize = precision / 2;
  
  const box: SpatialBox = {
    minX: ecef.x - halfSize,
    maxX: ecef.x + halfSize,
    minY: ecef.y - halfSize,
    maxY: ecef.y + halfSize,
    minZ: ecef.z - halfSize,
    maxZ: ecef.z + halfSize,
    regimeId: generateRegimeId(ecef, precision)
  };
  
  return box;
}

/**
 * Generate a regime ID based on ECEF coordinates and precision
 * 
 * @param ecef ECEF coordinates
 * @param precision Precision level in meters
 * @returns A unique identifier for the horizontal land regime
 */
function generateRegimeId(ecef: ECEFCoordinate, precision: number): string {
  // Calculate grid cell coordinates based on precision
  const gridX = Math.floor(ecef.x / precision);
  const gridY = Math.floor(ecef.y / precision);
  const gridZ = Math.floor(ecef.z / precision);
  
  // Generate regime ID combining grid coordinates
  return `R-${gridX}-${gridY}-${gridZ}-${precision}`;
}

/**
 * Generate a human-readable identifier for a horizontal land regime
 * 
 * @param box SpatialBox defining the regime
 * @returns A human-readable identifier
 */
export function generateRegimeIdentifier(box: SpatialBox): string {
  // Convert center of box back to geo coordinates for human-readable reference
  const centerEcef = {
    x: (box.minX + box.maxX) / 2,
    y: (box.minY + box.maxY) / 2,
    z: (box.minZ + box.maxZ) / 2
  };
  
  const centerGeo = ecefToGeo(centerEcef);
  
  // Calculate box size
  const sizeX = box.maxX - box.minX;
  
  // Create identifier with geo reference and size
  const latStr = centerGeo.latitude.toFixed(6);
  const lonStr = centerGeo.longitude.toFixed(6);
  const altStr = centerGeo.altitude.toFixed(1);
  
  return `Zone-${latStr}-${lonStr}-${altStr}-${sizeX.toFixed(1)}m`;
}

/**
 * Generate a Geographical ID (GID) for a user based on their current position
 * 
 * @param geoCoord User's geographical coordinates
 * @param precision Precision level in meters
 * @returns A complete GID object
 */
export function generateGID(geoCoord: GeoCoordinate, precision: number = 10): GeoID {
  // Convert geographic coordinates to ECEF
  const ecefPosition = geoToECEF(geoCoord);
  
  // Create spatial box around position
  const box = createSpatialBox(ecefPosition, precision);
  
  // Generate human-readable regime identifier
  const regimeIdentifier = generateRegimeIdentifier(box);
  
  // Generate unique ID
  const id = `GID-${uuidv4()}`;
  
  // Create and return GID object
  return {
    id,
    coordinate: geoCoord,
    ecefPosition,
    box,
    regimeIdentifier,
    precision,
    timestamp: Date.now()
  };
}

/**
 * Get the current geolocation of the user
 * 
 * @returns Promise resolving to GeoCoordinate
 */
export function getCurrentLocation(): Promise<GeoCoordinate> {
  return new Promise((resolve, reject) => {
    if (!navigator || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude || 0,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Check if a point in ECEF coordinates is within a specific spatial box
 * 
 * @param point ECEF coordinates of the point
 * @param box SpatialBox to check against
 * @returns Boolean indicating if the point is inside the box
 */
export function isPointInBox(point: ECEFCoordinate, box: SpatialBox): boolean {
  return (
    point.x >= box.minX && point.x <= box.maxX &&
    point.y >= box.minY && point.y <= box.maxY &&
    point.z >= box.minZ && point.z <= box.maxZ
  );
}

/**
 * Calculate the distance between two points in ECEF coordinates
 * 
 * @param point1 First ECEF coordinate
 * @param point2 Second ECEF coordinate
 * @returns Distance in meters
 */
export function ecefDistance(point1: ECEFCoordinate, point2: ECEFCoordinate): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  const dz = point2.z - point1.z;
  
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Main class for tracking a user's geographical position and managing GIDs
 */
export class GeoSpatialTracker {
  private currentGID: GeoID | null = null;
  private watchId: number | null = null;
  private listeners: ((gid: GeoID) => void)[] = [];
  private precision: number;
  
  constructor(precision: number = 10) {
    this.precision = precision;
  }
  
  /**
   * Start tracking the user's location
   * 
   * @returns Promise resolving when tracking begins
   */
  public async startTracking(): Promise<void> {
    if (!navigator || !navigator.geolocation) {
      throw new Error("Geolocation is not supported by this browser");
    }
    
    // First get initial position
    try {
      const initialPosition = await getCurrentLocation();
      this.updateGID(initialPosition);
      
      // Then start watching for position changes
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const geoCoord: GeoCoordinate = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude || 0,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          this.updateGID(geoCoord);
        },
        (error) => {
          console.error("Error watching position:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } catch (error) {
      throw new Error(`Failed to start location tracking: ${error.message}`);
    }
  }
  
  /**
   * Stop tracking the user's location
   */
  public stopTracking(): void {
    if (this.watchId !== null && navigator && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
  
  /**
   * Update the GID based on a new geographic position
   * 
   * @param geoCoord New geographic coordinates
   */
  private updateGID(geoCoord: GeoCoordinate): void {
    const newGID = generateGID(geoCoord, this.precision);
    
    // Check if user has moved to a new regime/box
    if (
      !this.currentGID ||
      this.currentGID.box.regimeId !== newGID.box.regimeId
    ) {
      console.log(`User entered new spatial regime: ${newGID.regimeIdentifier}`);
      // Fire all listeners with the new GID
      this.listeners.forEach((listener) => listener(newGID));
    }
    
    this.currentGID = newGID;
  }
  
  /**
   * Get the current GID
   * 
   * @returns Current GID or null if tracking hasn't started
   */
  public getCurrentGID(): GeoID | null {
    return this.currentGID;
  }
  
  /**
   * Set the precision level for the tracker
   * 
   * @param precision Precision in meters
   */
  public setPrecision(precision: number): void {
    this.precision = precision;
    
    // Update current GID with new precision if available
    if (this.currentGID) {
      this.updateGID(this.currentGID.coordinate);
    }
  }
  
  /**
   * Add a listener for GID changes
   * 
   * @param listener Function to call when GID changes
   */
  public addChangeListener(listener: (gid: GeoID) => void): void {
    this.listeners.push(listener);
  }
  
  /**
   * Remove a GID change listener
   * 
   * @param listener Listener to remove
   */
  public removeChangeListener(listener: (gid: GeoID) => void): void {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }
}

// Export a singleton instance
export const geoSpatialTracker = new GeoSpatialTracker();
