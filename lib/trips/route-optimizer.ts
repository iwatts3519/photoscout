/**
 * Client-side route optimization using nearest-neighbor + 2-opt
 * Uses Haversine distance for fast, API-free optimization
 */

import { calculateDistance, type Coordinates } from '@/lib/utils/geo';

// ============================================================================
// Types
// ============================================================================

export interface OptimizableStop {
  id: string;
  coordinates: Coordinates;
}

export interface OptimizationOptions {
  /** Keep the first stop in place (default: true) */
  fixFirstStop?: boolean;
  /** Keep the last stop in place (default: false) */
  fixLastStop?: boolean;
}

export interface OptimizationResult {
  /** New ordering as indices into the original array */
  newOrder: number[];
  /** Total Haversine distance of original order (meters) */
  originalDistance: number;
  /** Total Haversine distance of optimized order (meters) */
  optimizedDistance: number;
  /** Percentage improvement (0-100) */
  improvementPercent: number;
}

// ============================================================================
// Distance Matrix
// ============================================================================

/**
 * Build an NxN Haversine distance matrix from an array of coordinates.
 * matrix[i][j] = distance in meters from stop i to stop j.
 */
export function buildDistanceMatrix(stops: OptimizableStop[]): number[][] {
  const n = stops.length;
  const matrix: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dist = calculateDistance(stops[i].coordinates, stops[j].coordinates);
      matrix[i][j] = dist;
      matrix[j][i] = dist;
    }
  }

  return matrix;
}

/**
 * Calculate total route distance for a given ordering.
 */
function totalDistance(matrix: number[][], order: number[]): number {
  let total = 0;
  for (let i = 0; i < order.length - 1; i++) {
    total += matrix[order[i]][order[i + 1]];
  }
  return total;
}

// ============================================================================
// Nearest Neighbor Heuristic
// ============================================================================

/**
 * Build a route using nearest-neighbor heuristic starting from startIndex.
 * Returns an array of indices representing the visit order.
 */
export function nearestNeighborOrder(matrix: number[][], startIndex: number): number[] {
  const n = matrix.length;
  const visited = new Set<number>();
  const order: number[] = [startIndex];
  visited.add(startIndex);

  let current = startIndex;

  while (order.length < n) {
    let nearest = -1;
    let nearestDist = Infinity;

    for (let j = 0; j < n; j++) {
      if (!visited.has(j) && matrix[current][j] < nearestDist) {
        nearest = j;
        nearestDist = matrix[current][j];
      }
    }

    if (nearest === -1) break;

    order.push(nearest);
    visited.add(nearest);
    current = nearest;
  }

  return order;
}

// ============================================================================
// 2-Opt Improvement
// ============================================================================

/**
 * Improve an existing order using 2-opt swaps.
 * Iteratively reverses sub-segments to reduce total distance.
 *
 * @param matrix - Distance matrix
 * @param order - Current order (indices)
 * @param fixFirst - If true, index 0 in order is not moved
 * @param fixLast - If true, last index in order is not moved
 * @returns Improved order
 */
export function twoOptImprove(
  matrix: number[][],
  order: number[],
  fixFirst: boolean = true,
  fixLast: boolean = false,
): number[] {
  const result = [...order];
  const n = result.length;

  // Determine which indices can be swapped
  const start = fixFirst ? 1 : 0;
  const end = fixLast ? n - 1 : n;

  let improved = true;

  while (improved) {
    improved = false;

    for (let i = start; i < end - 1; i++) {
      for (let j = i + 1; j < end; j++) {
        // Calculate change in distance from reversing segment [i..j]
        const beforeI = i > 0 ? matrix[result[i - 1]][result[i]] : 0;
        const afterJ = j < n - 1 ? matrix[result[j]][result[j + 1]] : 0;
        const newBeforeI = i > 0 ? matrix[result[i - 1]][result[j]] : 0;
        const newAfterJ = j < n - 1 ? matrix[result[i]][result[j + 1]] : 0;

        const currentCost = beforeI + afterJ;
        const newCost = newBeforeI + newAfterJ;

        if (newCost < currentCost - 1e-10) {
          // Reverse the segment between i and j
          let left = i;
          let right = j;
          while (left < right) {
            const temp = result[left];
            result[left] = result[right];
            result[right] = temp;
            left++;
            right--;
          }
          improved = true;
        }
      }
    }
  }

  return result;
}

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Optimize the order of stops to minimize total Haversine travel distance.
 * Uses nearest-neighbor heuristic followed by 2-opt refinement.
 *
 * @param stops - Array of stops with id and coordinates
 * @param options - Optimization options (fixFirstStop, fixLastStop)
 * @returns Optimization result with new order and distance comparison
 */
export function optimizeStopOrder(
  stops: OptimizableStop[],
  options: OptimizationOptions = {},
): OptimizationResult {
  const { fixFirstStop = true, fixLastStop = false } = options;
  const n = stops.length;

  // Trivial cases: 0, 1, or 2 stops can't be improved
  if (n <= 2) {
    const originalOrder = Array.from({ length: n }, (_, i) => i);
    const matrix = buildDistanceMatrix(stops);
    const dist = totalDistance(matrix, originalOrder);
    return {
      newOrder: originalOrder,
      originalDistance: dist,
      optimizedDistance: dist,
      improvementPercent: 0,
    };
  }

  const matrix = buildDistanceMatrix(stops);

  // Original order
  const originalOrder = Array.from({ length: n }, (_, i) => i);
  const originalDist = totalDistance(matrix, originalOrder);

  // Start nearest-neighbor from index 0 (first stop)
  const nnOrder = nearestNeighborOrder(matrix, 0);

  // If fixLastStop, ensure the last element stays in place
  if (fixLastStop) {
    const lastIdx = n - 1;
    const pos = nnOrder.indexOf(lastIdx);
    if (pos !== nnOrder.length - 1) {
      // Move lastIdx to the end
      nnOrder.splice(pos, 1);
      nnOrder.push(lastIdx);
    }
  }

  // Refine with 2-opt
  const optimizedOrder = twoOptImprove(matrix, nnOrder, fixFirstStop, fixLastStop);
  const optimizedDist = totalDistance(matrix, optimizedOrder);

  // Calculate improvement
  const improvementPercent = originalDist > 0
    ? Math.round(((originalDist - optimizedDist) / originalDist) * 100)
    : 0;

  return {
    newOrder: optimizedOrder,
    originalDistance: originalDist,
    optimizedDistance: optimizedDist,
    improvementPercent: Math.max(0, improvementPercent),
  };
}
