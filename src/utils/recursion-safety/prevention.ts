/**
 * Recursion Prevention Utilities
 * Tools for preventing infinite recursion in geospatial operations
 */

import { HorizontalLandRegime, SpatialQuery, SpatialBox } from '../geoSpatial/types';

/**
 * Maximum recursion depth configuration
 */
export const RECURSION_LIMITS = {
  DEFAULT_MAX_DEPTH: 20,
  SPATIAL_HIERARCHY_MAX_DEPTH: 10,
  REGION_TRAVERSAL_MAX_DEPTH: 15,
  BOX_CONTAINMENT_MAX_ITERATIONS: 500
};

/**
 * Helper for detecting visited nodes to prevent cycles
 */
export class CycleDetector<T extends string | number> {
  private visited = new Set<T>();
  
  /**
   * Check if a node has been visited and mark it as visited
   * @returns true if the node was already visited (cycle detected)
   */
  public checkAndMark(id: T): boolean {
    if (this.visited.has(id)) {
      return true; // Cycle detected
    }
    
    this.visited.add(id);
    return false;
  }
  
  /**
   * Remove a node from the visited set (for backtracking)
   */
  public unmark(id: T): void {
    this.visited.delete(id);
  }
  
  /**
   * Clear all visited marks
   */
  public reset(): void {
    this.visited.clear();
  }
  
  /**
   * Get the current number of visited nodes
   */
  public getVisitedCount(): number {
    return this.visited.size;
  }
}

/**
 * Higher-order function that adds depth limiting to recursive functions
 */
export function withDepthLimit<T, Args extends any[]>(
  fn: (depth: number, ...args: Args) => T,
  maxDepth: number = RECURSION_LIMITS.DEFAULT_MAX_DEPTH
): (...args: Args) => T {
  return (...args: Args): T => {
    const recursiveWithDepth = (currentDepth: number, ...currentArgs: Args): T => {
      if (currentDepth >= maxDepth) {
        throw new Error(`Maximum recursion depth of ${maxDepth} exceeded`);
      }
      
      return fn(currentDepth + 1, ...currentArgs);
    };
    
    return recursiveWithDepth(0, ...args);
  };
}

/**
 * Manages a safe traversal of a spatial hierarchy with cycle detection
 * and depth limiting
 */
export class SafeRegimeTraversal {
  private cycleDetector = new CycleDetector<string>();
  private maxDepth: number;
  
  constructor(maxDepth: number = RECURSION_LIMITS.SPATIAL_HIERARCHY_MAX_DEPTH) {
    this.maxDepth = maxDepth;
  }
  
  /**
   * Safely traverse a regime and its children with depth and cycle checks
   */
  public traverseRegime(
    regime: HorizontalLandRegime | null, 
    depth: number = 0,
    visitorFn: (regime: HorizontalLandRegime, depth: number) => void
  ): void {
    // Null check
    if (!regime) return;
    
    // Depth check
    if (depth > this.maxDepth) {
      console.warn(`Maximum depth ${this.maxDepth} reached for regime: ${regime.id}`);
      return;
    }
    
    // Cycle check
    if (this.cycleDetector.checkAndMark(regime.id)) {
      console.warn(`Cycle detected in regime hierarchy: ${regime.id}`);
      return;
    }
    
    try {
      // Process current regime
      visitorFn(regime, depth);
      
      // Process children
      if (regime.childIds) {
        for (const childId of regime.childIds) {
          // This would need an actual implementation to retrieve the child regime
          // const childRegime = getRegimeById(childId);
          // this.traverseRegime(childRegime, depth + 1, visitorFn);
        }
      }
    } finally {
      // Unmark for potential reuse
      this.cycleDetector.unmark(regime.id);
    }
  }
  
  /**
   * Convert a recursive operation to iterative for safety
   */
  public iterativeTraversal(
    startRegimeId: string,
    getRegimeFn: (id: string) => HorizontalLandRegime | null,
    visitorFn: (regime: HorizontalLandRegime) => void
  ): void {
    const stack: Array<{ id: string; depth: number }> = [{ id: startRegimeId, depth: 0 }];
    const visited = new Set<string>();
    let iterations = 0;
    const MAX_ITERATIONS = 10000; // Hard safety limit
    
    while (stack.length > 0 && iterations < MAX_ITERATIONS) {
      iterations++;
      
      const { id, depth } = stack.pop()!;
      
      // Skip visited nodes
      if (visited.has(id)) continue;
      visited.add(id);
      
      // Depth limit
      if (depth > this.maxDepth) continue;
      
      const regime = getRegimeFn(id);
      if (!regime) continue;
      
      // Process current regime
      visitorFn(regime);
      
      // Add children to stack (in reverse to maintain original order when popping)
      if (regime.childIds) {
        for (let i = regime.childIds.length - 1; i >= 0; i--) {
          const childId = regime.childIds[i];
          if (!visited.has(childId)) {
            stack.push({ id: childId, depth: depth + 1 });
          }
        }
      }
    }
    
    // Check if we hit the iteration limit
    if (iterations >= MAX_ITERATIONS) {
      console.warn('Maximum iteration limit reached, possible infinite recursion prevented');
    }
  }
}

/**
 * Validates spatial query parameters to prevent problematic recursive operations
 */
export function validateSpatialQuerySafety(query: SpatialQuery): boolean {
  // Check if query might cause excessive recursion or computation
  
  // Check for unreasonably large bounding boxes
  if (query.intersectsBox) {
    const box = query.intersectsBox;
    const boxSize = calculateBoxSize(box);
    
    // Prevent extremely large boxes (arbitrary threshold)
    const MAX_BOX_VOLUME = 1000000000; // 1 billion cubic units
    if (boxSize > MAX_BOX_VOLUME) {
      console.warn(`Spatial query box size (${boxSize}) exceeds safety threshold`);
      return false;
    }
  }
  
  // Check for unreasonable distance searches
  if (query.nearPoint && query.nearPoint.maxDistance) {
    const MAX_DISTANCE = 10000000; // 10,000 km in meters
    if (query.nearPoint.maxDistance > MAX_DISTANCE) {
      console.warn(`Spatial query distance (${query.nearPoint.maxDistance}) exceeds safety threshold`);
      return false;
    }
  }
  
  // Check for excessive result limits
  if (query.maxResults && query.maxResults > 10000) {
    console.warn(`Requested result count (${query.maxResults}) exceeds safety threshold, limiting to 10000`);
    query.maxResults = 10000;
  }
  
  return true;
}

/**
 * Calculate approximate volume of a spatial box
 */
function calculateBoxSize(box: SpatialBox): number {
  // Use the dimensions directly from the SpatialBox interface
  const { width, height, depth } = box.dimensions;
  
  return width * height * depth;
}
