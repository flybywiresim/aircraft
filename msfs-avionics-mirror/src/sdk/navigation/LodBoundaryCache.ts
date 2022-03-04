import { BoundaryFacility } from './Facilities';
import { LodBoundary } from './LodBoundary';

/**
 * A cache of LodBoundary objects.
 */
export class LodBoundaryCache {
  private readonly cache = new Map<number, LodBoundary>();

  /**
   * Constructor.
   * @param size The maximum size of this cache.
   * @param lodDistanceThresholds The Douglas-Peucker distance thresholds, in great-arc radians, for each LOD level
   * used by this cache's LodBoundary objects.
   * @param lodVectorCountTargets The vector count targets for each LOD level used by this cache's LodBoundary objects.
   */
  constructor(public readonly size: number, public readonly lodDistanceThresholds: readonly number[], public readonly lodVectorCountTargets: readonly number[]) {
  }

  /**
   * Retrieves a LodBoundary from this cache corresponding to a boundary facility. If the requested LodBoundary does
   * not exist, it will be created and added to this cache.
   * @param facility A boundary facility.
   * @returns The LodBoundary corresponding to `facility`.
   */
  public get(facility: BoundaryFacility): LodBoundary {
    const existing = this.cache.get(facility.id);
    if (existing) {
      return existing;
    }

    return this.create(facility);
  }

  /**
   * Creates a new LodBoundary and adds it to this cache.
   * @param facility The facility from which to create the new LodBoundary.
   * @returns The newly created LodBoundary.
   */
  private create(facility: BoundaryFacility): LodBoundary {
    const boundary = new LodBoundary(facility, this.lodDistanceThresholds, this.lodVectorCountTargets);
    this.cache.set(facility.id, boundary);
    if (this.cache.size > this.size) {
      this.cache.delete(this.cache.keys().next().value);
    }
    return boundary;
  }
}