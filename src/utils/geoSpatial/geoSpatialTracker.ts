import {
  GeoCoordinate,
  ECEFCoordinate,
  SpatialBox,
  GID,
  Quaternion
} from './types';

/**
 * Earth constants for calculations
 */
const EARTH = {
  // WGS84 ellipsoid parameters
  a: 6378137.0,              // semi-major axis in meters
  f: 1/298.257223563,        // flattening
  b: 6356752.314245,         // semi-minor axis in meters
  e2: 0.006694379990141,     // first eccentricity squared
};

/**
 * Event types for the geo spatial tracker
 */
type EventType = 'location-change' | 'error' | 'start' | 'stop';
type EventCallback = (data: any) => void;

/**
 * Class to track geospatial location and convert between coordinate systems
 */
class GeoSpatialTracker {
  private watchId: number | null = null;
  private currentGID: GID | null = null;
  private lastPosition: GeolocationPosition | null = null;
  private readonly eventListeners: Map<EventType, Set<EventCallback>> = new Map();
  
  /**
   * Convert geographic coordinates to ECEF coordinates
   * @param geo Geographic coordinates
   * @returns ECEF coordinates
   */
  public geoToECEF(geo: GeoCoordinate): ECEFCoordinate {
    const { latitude, longitude, altitude = 0 } = geo;
    
    // Convert degrees to radians
    const lat = latitude * Math.PI / 180;
    const lon = longitude * Math.PI / 180;
    
    // Calculate N (radius of curvature in the prime vertical)
    const N = EARTH.a / Math.sqrt(1 - EARTH.e2 * Math.sin(lat) * Math.sin(lat));
    
    // Calculate ECEF coordinates
    const x = (N + altitude) * Math.cos(lat) * Math.cos(lon);
    const y = (N + altitude) * Math.cos(lat) * Math.sin(lon);
    const z = ((1 - EARTH.e2) * N + altitude) * Math.sin(lat);
    
    return { x, y, z };
  }
  
  /**
   * Convert ECEF coordinates to geographic coordinates
   * @param ecef ECEF coordinates
   * @returns Geographic coordinates
   */
  public ecefToGeo(ecef: ECEFCoordinate): GeoCoordinate {
    const { x, y, z } = ecef;
    
    // Longitude is straightforward
    const longitude = Math.atan2(y, x) * 180 / Math.PI;
    
    // For latitude and altitude, we use an iterative approach
    // Auxiliary values
    const p = Math.sqrt(x * x + y * y);
    const theta = Math.atan2(z * EARTH.a, p * EARTH.b);
    
    // Initial latitude guess
    let lat = Math.atan2(
      z + EARTH.e2 * EARTH.b * Math.sin(theta) * Math.sin(theta) * Math.sin(theta),
      p - EARTH.e2 * EARTH.a * Math.cos(theta) * Math.cos(theta) * Math.cos(theta)
    );
    
    // Iterative improvement (usually converges very quickly)
    for (let i = 0; i < 5; i++) {
      const sinLat = Math.sin(lat);
      const N = EARTH.a / Math.sqrt(1 - EARTH.e2 * sinLat * sinLat);
      const altitude = p / Math.cos(lat) - N;
      const newLat = Math.atan2(z, p * (1 - EARTH.e2 * N / (N + altitude)));
      
      if (Math.abs(newLat - lat) < 1e-9) {
        // Converged
        const latitude = lat * 180 / Math.PI;
        return {
          latitude,
          longitude,
          altitude,
          timestamp: Date.now()
        };
      }
      
      lat = newLat;
    }
    
    // Final calculation after iterations
    const sinLat = Math.sin(lat);
    const N = EARTH.a / Math.sqrt(1 - EARTH.e2 * sinLat * sinLat);
    const altitude = p / Math.cos(lat) - N;
    const latitude = lat * 180 / Math.PI;
    
    return {
      latitude,
      longitude,
      altitude,
      timestamp: Date.now()
    };
  }
  
  /**
   * Calculate distance between two ECEF points
   * @param a First ECEF point
   * @param b Second ECEF point
   * @returns Distance in meters
   */
  public distanceECEF(a: ECEFCoordinate, b: ECEFCoordinate): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  /**
   * Calculate great-circle distance between two geographic points
   * @param a First geographic point
   * @param b Second geographic point
   * @returns Distance in meters
   */
  public distanceGeo(a: GeoCoordinate, b: GeoCoordinate): number {
    // Haversine formula
    const R = 6371000; // Earth's mean radius in meters
    const lat1 = a.latitude * Math.PI / 180;
    const lat2 = b.latitude * Math.PI / 180;
    const dLat = (b.latitude - a.latitude) * Math.PI / 180;
    const dLon = (b.longitude - a.longitude) * Math.PI / 180;
    
    const a1 = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a1), Math.sqrt(1 - a1));
    
    // Base distance on Earth's surface
    let distance = R * c;
    
    // Add altitude difference if available
    if (a.altitude !== undefined && b.altitude !== undefined) {
      const dAlt = Math.abs(b.altitude - a.altitude);
      distance = Math.sqrt(distance * distance + dAlt * dAlt);
    }
    
    return distance;
  }
  
  /**
   * Create a spatial box centered at a point with given dimensions
   * @param center Center of the box in ECEF coordinates
   * @param size Size of the box in meters (cube)
   * @returns Spatial box
   */
  public createSpatialBox(center: ECEFCoordinate, size: number): SpatialBox {
    return {
      center,
      dimensions: {
        width: size,
        height: size,
        depth: size
      },
      rotation: { x: 0, y: 0, z: 0, w: 1 } // Identity quaternion (no rotation)
    };
  }
  
  /**
   * Create a rotated spatial box
   * @param center Center of the box
   * @param width Box width in meters
   * @param height Box height in meters
   * @param depth Box depth in meters
   * @param rotation Box rotation quaternion
   * @returns Spatial box
   */
  public createRotatedSpatialBox(
    center: ECEFCoordinate,
    width: number,
    height: number,
    depth: number,
    rotation: Quaternion
  ): SpatialBox {
    return {
      center,
      dimensions: {
        width,
        height,
        depth
      },
      rotation
    };
  }
  
  /**
   * Generate a GID for a geographic location
   * @param coordinate Geographic coordinate
   * @returns GID
   */
  public generateGID(coordinate: GeoCoordinate): GID {
    const ecefPosition = this.geoToECEF(coordinate);
    
    // Generate a regime identifier based on position
    // This is a simplified implementation - in a real system,
    // this would likely involve a hierarchical spatial index
    
    // Round coordinates to a grid (e.g., 100m grid cells)
    const gridSize = 100;
    const gridX = Math.floor(ecefPosition.x / gridSize);
    const gridY = Math.floor(ecefPosition.y / gridSize);
    const gridZ = Math.floor(ecefPosition.z / gridSize);
    
    // Create identifiers
    const regimeIdentifier = `regime-${gridX}-${gridY}-${gridZ}`;
    const spatialBoxId = `box-${gridX}-${gridY}-${gridZ}`;
    
    return {
      coordinate,
      ecefPosition,
      regimeIdentifier,
      spatialBoxId,
      timestamp: coordinate.timestamp
    };
  }
  
  /**
   * Start tracking user's geographic position
   */
  public async startTracking(): Promise<boolean> {
    // Check if geolocation is available
    if (!navigator.geolocation) {
      this.emit('error', new Error('Geolocation is not supported by this browser'));
      return false;
    }
    
    try {
      // Get current position first
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      // Process initial position
      this.processPosition(position);
      
      // Start watching position
      this.watchId = navigator.geolocation.watchPosition(
        this.processPosition.bind(this),
        this.handleError.bind(this),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
      
      this.emit('start', { timestamp: Date.now() });
      return true;
    } catch (error) {
      this.handleError(error as GeolocationPositionError);
      return false;
    }
  }
  
  /**
   * Stop tracking user's geographic position
   */
  public stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.emit('stop', { timestamp: Date.now() });
    }
  }
  
  /**
   * Check if tracking is active
   */
  public isTracking(): boolean {
    return this.watchId !== null;
  }
  
  /**
   * Get the current GID
   */
  public getCurrentGID(): GID | null {
    return this.currentGID;
  }
  
  /**
   * Get the last known position
   */
  public getLastPosition(): GeolocationPosition | null {
    return this.lastPosition;
  }
  
  /**
   * Add an event listener
   * @param eventType Event type
   * @param callback Event callback
   */
  public addEventListener(eventType: EventType, callback: EventCallback): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)?.add(callback);
  }
  
  /**
   * Remove an event listener
   * @param eventType Event type
   * @param callback Event callback
   */
  public removeEventListener(eventType: EventType, callback: EventCallback): void {
    this.eventListeners.get(eventType)?.delete(callback);
  }
  
  /**
   * Add a listener for location changes
   * @param callback Callback function receiving the new GID
   */
  public addChangeListener(callback: (gid: GID) => void): void {
    this.addEventListener('location-change', callback);
  }
  
  /**
   * Process a new position
   * @param position Browser geolocation position
   */
  private processPosition(position: GeolocationPosition): void {
    // Update last position
    this.lastPosition = position;
    
    // Convert to our coordinate format
    const coordinate: GeoCoordinate = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      altitude: position.coords.altitude ?? undefined,
      accuracy: position.coords.accuracy,
      altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
      heading: position.coords.heading ?? undefined,
      speed: position.coords.speed ?? undefined,
      timestamp: position.timestamp
    };
    
    // Generate GID
    const gid = this.generateGID(coordinate);
    
    // Check if GID has changed
    const hasChanged = !this.currentGID || 
                      this.currentGID.regimeIdentifier !== gid.regimeIdentifier;
    
    // Update current GID
    this.currentGID = gid;
    
    // Emit change event if needed
    if (hasChanged) {
      this.emit('location-change', gid);
    }
  }
  
  /**
   * Handle geolocation errors
   * @param error Geolocation error
   */
  private handleError(error: GeolocationPositionError): void {
    let message: string;
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'User denied the request for geolocation';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Location information is unavailable';
        break;
      case error.TIMEOUT:
        message = 'The request to get user location timed out';
        break;
      default:
        message = 'An unknown error occurred';
    }
    
    this.emit('error', new Error(message));
  }
  
  /**
   * Emit an event to all listeners
   * @param eventType Event type
   * @param data Event data
   */
  private emit(eventType: EventType, data: any): void {
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
export const geoSpatialTracker = new GeoSpatialTracker();

// Export helper functions directly for convenience
export const geoToECEF = geoSpatialTracker.geoToECEF.bind(geoSpatialTracker);
export const ecefToGeo = geoSpatialTracker.ecefToGeo.bind(geoSpatialTracker);
export const distanceECEF = geoSpatialTracker.distanceECEF.bind(geoSpatialTracker);
export const distanceGeo = geoSpatialTracker.distanceGeo.bind(geoSpatialTracker);
export const createSpatialBox = geoSpatialTracker.createSpatialBox.bind(geoSpatialTracker);
export const generateGID = geoSpatialTracker.generateGID.bind(geoSpatialTracker);
