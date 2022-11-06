import { LodBoundaryCache } from './LodBoundaryCache';

/**
 * A cache for LodBoundary objects.
 */
export class DefaultLodBoundaryCache {
  public static readonly SIZE = 500;
  public static readonly DISTANCE_THRESHOLDS: readonly number[] = [0, 0.00003, 0.0001, 0.0003];
  public static readonly VECTOR_COUNT_TARGETS: readonly number[] = [500, 300, 200, 100];

  private static INSTANCE?: LodBoundaryCache;

  /**
   * Gets an instance of DefaultLodBoundaryCache.
   * @returns An instance of DefaultLodBoundaryCache.
   */
  public static getCache(): LodBoundaryCache {
    return DefaultLodBoundaryCache.INSTANCE ??=
      new LodBoundaryCache(DefaultLodBoundaryCache.SIZE, DefaultLodBoundaryCache.DISTANCE_THRESHOLDS, DefaultLodBoundaryCache.VECTOR_COUNT_TARGETS);
  }
}