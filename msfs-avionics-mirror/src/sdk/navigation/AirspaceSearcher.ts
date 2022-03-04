import { GeoPoint, GeoPointInterface } from '../utils/geo/GeoPoint';
import { Airspace, AirspaceType } from './Airspace';

/**
 * Airspace definition returned by Coherent.
 */
interface CoherentAirspaceDef {
  /** The type of the airspace. */
  type: AirspaceType;

  /** The type of the airspace. */
  segments: LatLong[];
}

/**
 *
 */
class CoherentAirspace implements Airspace {
  /** @inheritdoc */
  public readonly type: AirspaceType;
  /** @inheritdoc */
  public readonly name = '';
  /** This airspace's unique string ID. */
  public readonly uid: string;

  private readonly _segments: GeoPoint[] = [];

  /**
   * Constructor.
   * @param def The airspace definition to use for the new airspace.
   * @param uid A unique string ID for the new airspace.
   */
  constructor(def: CoherentAirspaceDef, uid: string) {
    this.type = def.type;
    this.uid = uid;

    const segments = def.segments;
    const len = segments.length;
    for (let i = 0; i < len; i++) {
      const point = segments[i];
      this._segments[i] = new GeoPoint(point.lat, point.long);
    }
  }

  /** @inheritdoc */
  public get segments(): readonly GeoPoint[] {
    return this._segments as readonly GeoPoint[];
  }

  /** @inheritdoc */
  public equals(other: Airspace): boolean {
    if (other instanceof CoherentAirspace) {
      return this.uid === other.uid;
    }

    return this.type === other.type
      && this.segments.length === other.segments.length
      && this.segments.every((point, index) => point.equals(other.segments[index]));
  }
}

/**
 * A searcher for airspaces.
 */
export class AirspaceSearcher {
  /** The amount of time to wait for a search to finish before it times out, in milliseconds. */
  public static readonly SEARCH_TIMEOUT = 5000;
  public static readonly DEFAULT_CACHE_SIZE = 1000;

  private cache = new Map<string, CoherentAirspace>();

  private _isBusy = false;
  private queue: (() => void)[] = [];

  /**
   * Constructor.
   * @param cacheSize The maximum size of the Airspace cache.
   */
  constructor(public readonly cacheSize = AirspaceSearcher.DEFAULT_CACHE_SIZE) {
  }

  /**
   * Checks whether this searcher is currently busy with a search.
   * @returns whether this searcher is currently busy with a search.
   */
  public isBusy(): boolean {
    return this._isBusy;
  }

  /**
   * Searches for airspaces around a geographic point. If the searcher is not busy, the search will execute
   * immediately. If the search is busy, the search will be queued. Queued searches will be executed one at a time in
   * FIFO order as searches are finished.
   * @param center The center of the search area.
   * @returns a Promise which is fulfilled with an array of airspaces when the search finishes.
   */
  public search(center: GeoPointInterface): Promise<Airspace[]> {
    return new Promise(resolve => {
      if (this._isBusy || this.queue.length > 0) {
        this.enqueueSearch(center, resolve);
      } else {
        this.doSearch(center, resolve);
      }
    });
  }

  /**
   * Enqueues a search operation.
   * @param center The center of the search area.
   * @param resolve The Promise resolve function to call with the search results.
   */
  private enqueueSearch(center: GeoPointInterface, resolve: (result: Airspace[]) => void): void {
    this.queue.push(this.doSearch.bind(this, center, resolve));
  }

  /**
   * Executes the next search operation in the queue, if one exists.
   */
  private processQueue(): void {
    const next = this.queue.shift();
    if (next) {
      next();
    }
  }

  /**
   * Executes an airspace search.
   * @param center The center of the search area.
   * @param resolve The Promise resolve function to call with the search results.
   */
  private async doSearch(center: GeoPointInterface, resolve: (result: Airspace[]) => void): Promise<void> {
    this._isBusy = true;

    try {
      const coherentDefs = await Promise.race([
        this.executeCoherentSearch(center),
        new Promise<void>((timeoutResolve, reject) => setTimeout(() => reject('Airspace search timed out.'), AirspaceSearcher.SEARCH_TIMEOUT))
      ]);
      const airspaces = this.processCoherentDefs(coherentDefs as CoherentAirspaceDef[]);
      resolve(airspaces);
    } catch (e) {
      // console.log(e);
      resolve([]);
    }

    this._isBusy = false;

    this.processQueue();
  }

  /**
   * Executes a Coherent airspace search.
   * @param center The center of the search area.
   * @returns a Promise which is fulfilled with an array of Coherent airspace definitions when the search finishes.
   */
  private async executeCoherentSearch(center: GeoPointInterface): Promise<CoherentAirspaceDef[]> {
    await Coherent.call('SET_LOAD_LATLON', center.lat, center.lon);
    return await Coherent.call('GET_NEAREST_AIRSPACES');
  }

  /**
   * Processes an array of Coherent airspace definitions into an array of Airspaces.
   * @param defs An array fo Coherent airspace definitions.
   * @returns an array of Airspaces corresponding to the supplied definitions.
   */
  private processCoherentDefs(defs: CoherentAirspaceDef[]): Airspace[] {
    const result: Airspace[] = [];

    const len = defs.length;
    for (let i = 0; i < len; i++) {
      const def = defs[i];
      if (def.type === AirspaceType.None) {
        continue;
      }

      const uid = AirspaceSearcher.generateUID(def);
      let airspace = this.cache.get(uid);
      if (!airspace) {
        airspace = new CoherentAirspace(def, uid);
        this.cacheAirspace(airspace);
      }

      result.push(airspace);
    }

    return result;
  }

  /**
   * Adds an airspace to the cache. If the cache size exceeds the maximum after the operation, airspaces will be
   * removed from the cache in FIFO order to maintain the maximum cache size.
   * @param airspace The airspace to cache.
   */
  private cacheAirspace(airspace: CoherentAirspace): void {
    this.cache.set(airspace.uid, airspace);
    if (this.cache.size > this.cacheSize) {
      this.cache.delete(this.cache.keys().next().value);
    }
  }

  /**
   * Generates a unique string ID for a Coherent airspace definition.
   * @param def The airspace definition.
   * @returns a unique string ID.
   */
  private static generateUID(def: CoherentAirspaceDef): string {
    const segments = def.segments;
    let uid = `${def.type}[${segments.length}]:`;
    // skip last vertex since it is always a repeat of the first; cap length to 10 to avoid creating super long strings
    const len = Math.min(segments.length - 1, 10);
    for (let i = 0; i < len; i++) {
      const point = segments[i];
      uid += `(${point.lat},${point.long})`;
    }

    // if vertices were skipped, grab the last (unique) vertex to decrease chance of uid collision.
    if (len < segments.length - 1) {
      const point = segments[segments.length - 2];
      uid += `(${point.lat},${point.long})`;
    }
    return uid;
  }
}