import { ArrayTaskQueue, ThrottledTaskQueueHandler, ThrottledTaskQueueProcess } from '../utils/task';
import { NearestBoundarySearchSession } from './FacilityLoader';
import { LodBoundary } from './LodBoundary';
import { LodBoundaryCache } from './LodBoundaryCache';

/**
 * Results of a nearest LodBoundary search.
 */
export type NearestLodBoundarySearchResults = {
  /** The boundaries found in these search results that were not returned in the last search. */
  added: readonly LodBoundary[];

  /** The unique IDs of the boundaries returned in the last search that are not found in these search results. */
  removed: readonly number[];
}

/**
 * A nearest search session for boundaries (airspaces) in the form of LodBoundary objects.
 */
export class NearestLodBoundarySearchSession {
  /**
   * Constructor.
   * @param cache The boundary cache this search session uses.
   * @param session The nearest boundary facility search session this search session uses.
   * @param frameBudget The maximum amount of time allotted per frame to retrieve and process LodBoundary objects, in
   * milliseconds.
   */
  constructor(
    private readonly cache: LodBoundaryCache,
    private readonly session: NearestBoundarySearchSession,
    public readonly frameBudget: number,
  ) {
  }

  /**
   * Searches for the nearest boundaries around a specified location.
   * @param lat The latitude of the search center, in degrees.
   * @param lon The longitude of the search center, in degrees.
   * @param radius The radius of the search, in meters.
   * @param maxItems The maximum number of items for which to search.
   * @returns The nearest search results.
   */
  public async searchNearest(lat: number, lon: number, radius: number, maxItems: number): Promise<NearestLodBoundarySearchResults> {
    const facilityResults = await this.session.searchNearest(lat, lon, radius, maxItems);
    const results = { added: [] as LodBoundary[], removed: facilityResults.removed };

    const tasks = facilityResults.added.map((fac, index) => (): void => { results.added[index] = this.cache.get(fac); });

    await new Promise<void>(resolve => {
      const taskQueue = new ThrottledTaskQueueProcess(new ArrayTaskQueue(tasks), new NearestLodBoundarySearchTaskQueueHandler(this.frameBudget, resolve));
      taskQueue.start();
    });

    return results;
  }

  /**
   * Sets this session's boundary class filter. The new filter takes effect with the next search executed in this
   * session.
   * @param classMask A bitmask defining the boundary classes to include in the search (`0`: exclude, `1`: include).
   * The bit index for each boundary class is equal to the value of the corresponding `BoundaryType` enum.
   */
  public setFilter(classMask: number): void {
    this.session.setBoundaryFilter(classMask);
  }
}

/**
 * A throttled task queue handler for retrieving and creating new LodBoundary objects in response to a nearest search.
 */
class NearestLodBoundarySearchTaskQueueHandler implements ThrottledTaskQueueHandler {
  /**
   * Constructor.
   * @param frameBudget The maximum amount of time allotted per frame to retrieve and process LodBoundary objects, in
   * milliseconds.
   * @param resolve The Promise resolve function this handler will call when the task queue is finished.
   */
  constructor(private readonly frameBudget: number, private readonly resolve: () => void) {
  }

  /** @inheritdoc */
  public onStarted(): void {
    // noop
  }

  /** @inheritdoc */
  public canContinue(elapsedFrameCount: number, dispatchedTaskCount: number, timeElapsed: number): boolean {
    return timeElapsed < this.frameBudget;
  }

  /** @inheritdoc */
  public onPaused(): void {
    // noop
  }

  /** @inheritdoc */
  public onFinished(): void {
    this.resolve();
  }

  /** @inheritdoc */
  public onAborted(): void {
    // noop
  }
}