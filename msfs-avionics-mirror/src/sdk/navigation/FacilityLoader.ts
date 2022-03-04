/// <reference types="msfstypes/JS/common" />
/// <reference types="msfstypes/JS/Simplane" />

import { NdbFacility, UserFacility, VorFacility } from '.';
import {
  Facility, FacilityType, NearestSearchResults, FacilitySearchType, BoundaryFacility, FacilityTypeMap, AirportFacility,
  IntersectionFacility, AirwaySegment, ICAO, Metar
} from './Facilities';
import { FacilityRespository } from './FacilityRespository';
import { RunwayUtils } from './RunwayUtils';

/**
 * A facility loader request for the request queue.
 */
type FacilityRequest = {
  /** The promise for the request. */
  promise: Promise<Facility>;

  /** The time of this request. */
  timeStamp: number;

  /** The promise resolution. */
  resolve: (facility: Facility) => void;

  /** The promise rejection. */
  reject: (message: string) => void;
}

/**
 * A nearest facilities search request for the request queue.
 */
type SearchRequest<TAdded, TRemoved> = {
  /** The promise for the request. */
  promise: Promise<NearestSearchResults<TAdded, TRemoved>>;

  /** The promise resolution. */
  resolve: (results: NearestSearchResults<TAdded, TRemoved>) => void;
}

/**
 * A type map of search type to concrete search session type.
 */
export type SessionTypeMap = {
  /** Plain search session. */
  [FacilitySearchType.None]: NearestSearchSession<any, any>,

  /** Airport search session. */
  [FacilitySearchType.Airport]: NearestAirportSearchSession,

  /** Intersection search session. */
  [FacilitySearchType.Intersection]: NearestIntersectionSearchSession,

  /** VOR search session. */
  [FacilitySearchType.Vor]: NearestVorSearchSession,

  /** NDB search session. */
  [FacilitySearchType.Ndb]: NearestSearchSession<string, string>,

  /** Boundary search session. */
  [FacilitySearchType.Boundary]: NearestBoundarySearchSession,

  /** Nearest user facility search session. */
  [FacilitySearchType.User]: NearestSearchSession<string, string>
}

/**
 * A type map of search type to concrete search session type.
 */
export type SearchTypeMap = {
  /** Plain search session. */
  [FacilitySearchType.None]: Facility,

  /** Airport search session. */
  [FacilitySearchType.Airport]: AirportFacility,

  /** Intersection search session. */
  [FacilitySearchType.Intersection]: IntersectionFacility,

  /** VOR search session. */
  [FacilitySearchType.Vor]: VorFacility,

  /** NDB search session. */
  [FacilitySearchType.Ndb]: NdbFacility,

  /** Boundary search session. */
  [FacilitySearchType.Boundary]: BoundaryFacility,

  /** Nearest user facility search session. */
  [FacilitySearchType.User]: UserFacility
}

/**
 * A type map of facility type to facility search type.
 */
export const FacilityTypeSearchType = {
  /** Airport facility type. */
  [FacilityType.Airport]: FacilitySearchType.Airport,

  /** Intersection facility type. */
  [FacilityType.Intersection]: FacilitySearchType.Intersection,

  /** NDB facility type. */
  [FacilityType.NDB]: FacilitySearchType.Ndb,

  /** VOR facility type. */
  [FacilityType.VOR]: FacilitySearchType.Vor,

  /** USR facility type. */
  [FacilityType.USR]: FacilitySearchType.User
};

/**
 * A class that handles loading facility data from the simulator.
 */
export class FacilityLoader {
  private static readonly MAX_FACILITY_CACHE_ITEMS = 1000;
  private static readonly MAX_AIRWAY_CACHE_ITEMS = 1000;

  private static facilityListener: ViewListener.ViewListener;

  private static readonly requestQueue = new Map<string, FacilityRequest>();
  private static readonly mismatchRequestQueue = new Map<string, FacilityRequest>();

  private static readonly facCache: Map<string, Facility> = new Map();
  private static readonly typeMismatchFacCache: Map<string, Facility> = new Map();
  private static readonly airwayCache: Map<string, AirwayObject> = new Map();

  private static readonly searchSessions = new Map<number, NearestSearchSession<any, any>>();
  private static readonly facRepositorySearchTypes = [FacilityType.USR];

  /**
   * Creates an instance of the FacilityLoader.
   * @param facilityRepo A local facility repository.
   * @param onInitialized A callback to call when the facility loader has completed initialization.
   */
  constructor(
    private readonly facilityRepo: FacilityRespository,
    public readonly onInitialized = (): void => { }
  ) {
    if (FacilityLoader.facilityListener === undefined) {
      FacilityLoader.facilityListener = RegisterViewListener('JS_LISTENER_FACILITY', () => {
        FacilityLoader.facilityListener.on('SendAirport', FacilityLoader.onFacilityReceived);
        FacilityLoader.facilityListener.on('SendIntersection', FacilityLoader.onFacilityReceived);
        FacilityLoader.facilityListener.on('SendVor', FacilityLoader.onFacilityReceived);
        FacilityLoader.facilityListener.on('SendNdb', FacilityLoader.onFacilityReceived);
        FacilityLoader.facilityListener.on('NearestSearchCompleted', FacilityLoader.onNearestSearchCompleted);

        setTimeout(() => this.onInitialized(), 2000);
      }, true);
    } else {
      setTimeout(() => this.onInitialized(), 2000);
    }
  }

  /**
   * Retrieves a facility.
   * @param type The type of facility to retrieve.
   * @param icao The ICAO of the facility to retrieve.
   * @returns A Promise which will be fulfilled with the requested facility, or rejected if the facility could not be
   * retrieved.
   */
  public getFacility<T extends FacilityType>(type: T, icao: string): Promise<FacilityTypeMap[T]> {
    switch (type) {
      case FacilityType.USR:
      case FacilityType.RWY:
      case FacilityType.VIS:
        return this.getFacilityFromRepo(type, icao);
      default:
        return this.getFacilityFromCoherent(type, icao);
    }
  }

  // eslint-disable-next-line jsdoc/require-throws
  /**
   * Retrieves a facility from the local facility repository.
   * @param type The type of facility to retrieve.
   * @param icao The ICAO of the facility to retrieve.
   * @returns A Promise which will be fulfilled with the requested facility, or rejected if the facility could not be
   * retrieved.
   */
  private async getFacilityFromRepo<T extends FacilityType>(type: T, icao: string): Promise<FacilityTypeMap[T]> {
    const fac = this.facilityRepo.get(icao);
    if (fac) {
      return fac as FacilityTypeMap[T];
    } else if (type === FacilityType.RWY) {
      try {
        const airport = await this.getFacility(FacilityType.Airport, `A      ${icao.substr(3, 4)} `);
        const runway = RunwayUtils.matchOneWayRunwayFromIdent(airport, ICAO.getIdent(icao));
        if (runway) {
          const runwayFac = RunwayUtils.createRunwayFacility(airport, runway);
          this.facilityRepo.add(runwayFac);
          return runwayFac as FacilityTypeMap[T];
        }
      } catch (e) {
        // noop
      }
    }

    throw `Facility ${icao} could not be found.`;
  }

  /**
   * Retrieves a facility from Coherent.
   * @param type The type of facility to retrieve.
   * @param icao The ICAO of the facility to retrieve.
   * @returns A Promise which will be fulfilled with the requested facility, or rejected if the facility could not be
   * retrieved.
   */
  private getFacilityFromCoherent<T extends FacilityType>(type: T, icao: string): Promise<FacilityTypeMap[T]> {
    const isMismatch = ICAO.getFacilityType(icao) !== type;
    const currentTime = Date.now();

    let queue = FacilityLoader.requestQueue;
    let cache = FacilityLoader.facCache;
    if (isMismatch) {
      queue = FacilityLoader.mismatchRequestQueue;
      cache = FacilityLoader.typeMismatchFacCache;
    }

    let request = queue.get(icao);
    if (request === undefined || currentTime - request.timeStamp > 10000) {
      let resolve: ((facility: Facility) => void) | undefined = undefined;
      let reject: ((message: string) => void) | undefined = undefined;

      const promise = new Promise<FacilityTypeMap[T]>((resolution, rejection) => {
        resolve = resolution as (facility: Facility) => void;
        reject = rejection;

        const cachedFac = cache.get(icao);

        if (cachedFac === undefined) {
          Coherent.call(type, icao).then((isValid: boolean) => {
            if (!isValid) {
              rejection(`Facility ${icao} could not be found.`);
              FacilityLoader.requestQueue.delete(icao);
            }
          });
        } else {
          resolve(cachedFac as FacilityTypeMap[T]);
        }
      });
      if (request) {
        request.reject(`Facility request for ${icao} has timed out.`);
      }

      request = { promise, timeStamp: currentTime, resolve: resolve as any, reject: reject as any };
      FacilityLoader.requestQueue.set(icao, request);
    }

    return request.promise as Promise<FacilityTypeMap[T]>;
  }

  /**
   * Gets airway data from the sim.
   * @param airwayName The airway name.
   * @param airwayType The airway type.
   * @param icao The 12 character FS ICAO of at least one intersection in the airway.
   * @returns The retrieved airway.
   * @throws an error if no airway is returned
   */
  public async getAirway(airwayName: string, airwayType: number, icao: string): Promise<AirwayObject> {
    if (FacilityLoader.airwayCache.has(airwayName)) {
      const cachedAirway = FacilityLoader.airwayCache.get(airwayName);
      const match = cachedAirway?.waypoints.find((w) => {
        w.icao === icao;
      });
      if (match !== undefined && cachedAirway !== undefined) {
        return cachedAirway;
      }
    }
    const fac = await this.getFacility(FacilityType.Intersection, icao);
    const route = fac.routes.find((r) => r.name === airwayName);
    if (route !== undefined) {
      const airwayBuilder = new AirwayBuilder(fac, route, this);
      const status = await airwayBuilder.startBuild();
      if (status === AirwayStatus.COMPLETE) {
        const waypoints = airwayBuilder.waypoints;
        if (waypoints !== null) {
          const airway = new AirwayObject(airwayName, airwayType);
          airway.waypoints = [...waypoints];
          FacilityLoader.addToAirwayCache(airway);
          return airway;
        }
      }
    }
    throw new Error('Airway could not be found.');
  }

  /**
   * Starts a nearest facilities search session.
   * @param type The type of facilities to search for.
   * @returns The new nearest search session.
   */
  public async startNearestSearchSession<T extends FacilitySearchType>(type: T): Promise<SessionTypeMap[T]> {
    const sessionId = await Coherent.call('START_NEAREST_SEARCH_SESSION', type);
    let session: SessionTypeMap[T];

    switch (type) {
      case FacilitySearchType.Airport:
        session = new NearestAirportSearchSession(sessionId) as SessionTypeMap[T];
        break;
      case FacilitySearchType.Intersection:
        session = new NearestIntersectionSearchSession(sessionId) as SessionTypeMap[T];
        break;
      case FacilitySearchType.Vor:
        session = new NearestIntersectionSearchSession(sessionId) as SessionTypeMap[T];
        break;
      case FacilitySearchType.Boundary:
        session = new NearestBoundarySearchSession(sessionId) as SessionTypeMap[T];
        break;
      default:
        session = new NearestSearchSession(sessionId) as SessionTypeMap[T];
        break;
    }

    FacilityLoader.searchSessions.set(sessionId, session);
    return session;
  }

  /**
   * Gets a METAR for an airport.
   * @param airport An airport.
   * @returns The METAR for the airport, or undefined if none could be obtained.
   */
  public async getMetar(airport: AirportFacility): Promise<Metar | undefined>;
  /**
   * Gets a METAR for an airport.
   * @param ident An airport ident.
   * @returns The METAR for the airport, or undefined if none could be obtained.
   */
  public async getMetar(ident: string): Promise<Metar | undefined>;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public async getMetar(arg: string | AirportFacility): Promise<Metar | undefined> {
    const ident = typeof arg === 'string' ? arg : ICAO.getIdent(arg.icao);
    const metar = await Coherent.call('GET_METAR_BY_IDENT', ident);
    return FacilityLoader.cleanMetar(metar);
  }

  /**
   * Searches for the METAR issued for the closest airport to a given location.
   * @param lat The latitude of the center of the search, in degrees.
   * @param lon The longitude of the center of the search, in degrees.
   * @returns The METAR issued for the closest airport to the given location, or undefined if none could be found.
   */
  public async searchMetar(lat: number, lon: number): Promise<Metar | undefined> {
    const metar = await Coherent.call('GET_METAR_BY_LATLON', lat, lon);
    return FacilityLoader.cleanMetar(metar);
  }

  /**
   * Cleans up a raw METAR object.
   * @param raw A raw METAR object.
   * @returns A cleaned version of the raw METAR object, or undefined if the raw METAR is empty.
   */
  private static cleanMetar(raw: any): Metar | undefined {
    if (raw.icao === '') {
      return undefined;
    }

    raw.gust < 0 && delete raw.gust;
    raw.vertVis < 0 && delete raw.vertVis;
    isNaN(raw.altimeterA) && delete raw.altimeterA;
    raw.altimeterQ < 0 && delete raw.altimeterQ;
    isNaN(raw.slp) && delete raw.slp;

    return raw;
  }

  /**
   * Searches for ICAOs by their ident portion only.
   * @param filter The type of facility to filter by. Selecting NONE will search all facility type ICAOs.
   * @param ident The partial or complete ident to search for.
   * @param maxItems The max number of matches to return.
   * @returns A collection of matched ICAOs.
   */
  public async searchByIdent(filter: FacilitySearchType, ident: string, maxItems = 40): Promise<string[]> {
    const results = await Coherent.call('SEARCH_BY_IDENT', ident, filter, maxItems) as Array<string>;

    if (filter === FacilitySearchType.User || filter === FacilitySearchType.None) {
      this.facilityRepo.forEach(fac => {
        const facIdent = ICAO.getIdent(fac.icao);

        if (facIdent === ident) {
          results.unshift(fac.icao);
        } else if (facIdent.startsWith(ident)) {
          results.push(fac.icao);
        }
      }, FacilityLoader.facRepositorySearchTypes);
    }

    return results;
  }

  /**
   * A callback called when a facility is received from the simulator.
   * @param facility The received facility.
   */
  private static onFacilityReceived(facility: Facility): void {
    const request = FacilityLoader.requestQueue.get(facility.icao);
    if (request !== undefined) {
      request.resolve(facility);
      FacilityLoader.addToFacilityCache(facility, (facility as any)['__Type'] === 'JS_FacilityIntersection' && facility.icao[0] !== 'W');
      FacilityLoader.requestQueue.delete(facility.icao);
    }
  }

  /**
   * A callback called when a search completes.
   * @param results The results of the search.
   */
  private static onNearestSearchCompleted(results: NearestSearchResults<any, any>): void {
    const session = FacilityLoader.searchSessions.get(results.sessionId);
    if (session !== undefined) {
      session.onSearchCompleted(results);
    }
  }

  /**
   * Adds a facility to the cache.
   * @param fac The facility to add.
   * @param isTypeMismatch Whether to add the facility to the type mismatch cache.
   */
  private static addToFacilityCache(fac: Facility, isTypeMismatch: boolean): void {
    const cache = isTypeMismatch ? FacilityLoader.typeMismatchFacCache : FacilityLoader.facCache;
    cache.set(fac.icao, fac);
    if (cache.size > FacilityLoader.MAX_FACILITY_CACHE_ITEMS) {
      cache.delete(cache.keys().next().value);
    }
  }

  /**
   * Adds an airway to the airway cache.
   * @param airway The airway to add.
   */
  private static addToAirwayCache(airway: AirwayObject): void {
    FacilityLoader.airwayCache.set(airway.name, airway);
    if (FacilityLoader.airwayCache.size > FacilityLoader.MAX_AIRWAY_CACHE_ITEMS) {
      FacilityLoader.airwayCache.delete(FacilityLoader.airwayCache.keys().next().value);
    }
  }
}

/**
 * A session for searching for nearest facilities.
 */
export class NearestSearchSession<TAdded, TRemoved> {

  private readonly searchQueue = new Map<number, SearchRequest<TAdded, TRemoved>>();

  /**
   * Creates an instance of a NearestSearchSession.
   * @param sessionId The ID of the session.
   */
  constructor(protected readonly sessionId: number) { }

  /**
   * Searches for nearest facilities from the specified point.
   * @param lat The latitude, in degrees.
   * @param lon The longitude, in degrees.
   * @param radius The radius around the point to search, in meters.
   * @param maxItems The maximum number of items.
   * @returns The nearest search results.
   */
  public searchNearest(lat: number, lon: number, radius: number, maxItems: number): Promise<NearestSearchResults<TAdded, TRemoved>> {

    const promise = new Promise<NearestSearchResults<TAdded, TRemoved>>((resolve) => {
      Coherent.call('SEARCH_NEAREST', this.sessionId, lat, lon, radius, maxItems)
        .then((searchId: number) => {
          this.searchQueue.set(searchId, { promise, resolve });
        });
    });

    return promise;
  }

  /**
   * A callback called by the facility loader when a nearest search has completed.
   * @param results The search results.
   */
  public onSearchCompleted(results: NearestSearchResults<TAdded, TRemoved>): void {
    const request = this.searchQueue.get(results.searchId);
    if (request !== undefined) {
      request.resolve(results);
      this.searchQueue.delete(results.searchId);
    }
  }
}

/**
 * A session for searching for nearest airports.
 */
export class NearestAirportSearchSession extends NearestSearchSession<string, string> {
  /**
   * Sets the filter for the airport nearest search.
   * @param showClosed Whether or not to show closed airports.
   * @param classMask A bitmask to determine which JS airport classes to show.
   */
  public setAirportFilter(showClosed: boolean, classMask: number): void {
    Coherent.call('SET_NEAREST_AIRPORT_FILTER', this.sessionId, showClosed ? 1 : 0, classMask);
  }
}

/**
 * A session for searching for nearest intersections.
 */
export class NearestIntersectionSearchSession extends NearestSearchSession<string, string> {
  /**
   * Sets the filter for the intersection nearest search.
   * @param typeMask A bitmask to determine which JS intersection types to show.
   */
  public setIntersectionFilter(typeMask: number): void {
    Coherent.call('SET_NEAREST_INTERSECTION_FILTER', this.sessionId, typeMask);
  }
}

/**
 * A session for searching for nearest VORs.
 */
export class NearestVorSearchSession extends NearestSearchSession<string, string> {
  /**
   * Sets the filter for the VOR nearest search.
   * @param classMask A bitmask to determine which JS VOR classes to show.
   * @param typeMask A bitmask to determine which JS VOR types to show.
   */
  public setVorFilter(classMask: number, typeMask: number): void {
    Coherent.call('SET_NEAREST_VOR_FILTER', this.sessionId, classMask, typeMask);
  }
}

/**
 * A session for searching for nearest airspace boundaries.
 */
export class NearestBoundarySearchSession extends NearestSearchSession<BoundaryFacility, number> {
  /**
   * Sets the filter for the boundary nearest search.
   * @param classMask A bitmask to determine which boundary classes to show.
   */
  public setBoundaryFilter(classMask: number): void {
    Coherent.call('SET_NEAREST_BOUNDARY_FILTER', this.sessionId, classMask);
  }
}

/**
 * An airway.
 */
export class AirwayObject {
  private _name: string;
  private _type: number;
  private _waypoints: IntersectionFacility[] = [];

  /** Builds a Airway
   * @param name - the name of the new airway.
   * @param type - the type of the new airway.
   */
  constructor(name: string, type: number) {
    this._name = name;
    this._type = type;
  }

  /**
   * Gets the name of the airway
   * @returns the airway name
   */
  get name(): string {
    return this._name;
  }

  /**
   * Gets the type of the airway
   * @returns the airway type
   */
  get type(): number {
    return this._type;
  }

  /**
   * Gets the waypoints of this airway.
   * @returns the waypoints of this airway.
   */
  get waypoints(): IntersectionFacility[] {
    return this._waypoints;
  }

  /**
   * Sets the waypoints of this airway.
   * @param waypoints is the array of waypoints.
   */
  set waypoints(waypoints: IntersectionFacility[]) {
    this._waypoints = waypoints;
  }
}

/**
 * WT Airway Status Enum
 */
export enum AirwayStatus {
  /**
   * @readonly
   * @property {number} INCOMPLETE - indicates waypoints have not been loaded yet.
   */
  INCOMPLETE = 0,
  /**
   * @readonly
   * @property {number} COMPLETE - indicates all waypoints have been successfully loaded.
   */
  COMPLETE = 1,
  /**
   * @readonly
   * @property {number} PARTIAL - indicates some, but not all, waypoints have been successfully loaded.
   */
  PARTIAL = 2
}


/**
 * The Airway Builder.
 */
export class AirwayBuilder {
  private _waypointsArray: IntersectionFacility[] = [];
  private _hasStarted = false;
  private _isDone = false;

  /** Creates an instance of the AirwayBuilder
   * @param _initialWaypoint is the initial intersection facility
   * @param _initialData is the intersection route to build from
   * @param facilityLoader is an instance of the facility loader
   */
  constructor(private _initialWaypoint: IntersectionFacility, private _initialData: AirwaySegment, private facilityLoader: FacilityLoader) {
  }
  // constructor(private _initialWaypoint: IntersectionFacility, private _requestEntry: (entry: string) => Promise<IntersectionFacility>) {
  // }

  /**
   * Get whether this builder has started loading waypoints
   * @returns whether this builder has started
   */
  get hasStarted(): boolean {
    return this._hasStarted;
  }

  /**
   * Get whether this builder is done loading waypoints
   * @returns whether this builder is done loading waypoints
   */
  get isDone(): boolean {
    return this._isDone;
  }

  /**
   * Get the airway waypoints
   * @returns the airway waypoints, or null
   */
  get waypoints(): IntersectionFacility[] | null {
    return this._waypointsArray;
  }

  /** Steps through the airway waypoints
   * @param stepForward is the direction to step; true = forward, false = backward
   * @param arrayInsertFunc is the arrayInsertFunc
   */
  async _step(stepForward: boolean, arrayInsertFunc: (wpt: IntersectionFacility) => void): Promise<void> {
    let isDone = false;
    let current: AirwaySegment = this._initialData;
    while (!isDone && current) {
      const nextICAO = stepForward ? current.nextIcao : current.prevIcao;
      if (nextICAO && nextICAO.length > 0 && nextICAO[0] != ' ' && this._waypointsArray !== null
        && !this._waypointsArray.find(waypoint => waypoint.icao === nextICAO)) {
        const fac = await this.facilityLoader.getFacility(FacilityType.Intersection, nextICAO);
        arrayInsertFunc(fac);
        const next = fac.routes.find((route: AirwaySegment) => route.name === current.name);
        if (next !== undefined) {
          current = next;
        } else {
          isDone = true;
        }
      } else {
        isDone = true;
      }
    }
  }

  /** Steps Forward through the airway waypoints
   * @returns the step forward function
   */
  async _stepForward(): Promise<void> {
    if (this._waypointsArray !== null) {
      return this._step(true, this._waypointsArray.push.bind(this._waypointsArray));
    }
  }

  /** Steps Backward through the airway waypoints
   * @returns the step backward function
   */
  async _stepBackward(): Promise<void> {
    if (this._waypointsArray !== null) {
      return this._step(false, this._waypointsArray.unshift.bind(this._waypointsArray));
    }
  }

  /**
   * Sets the array into which this builder will load waypoints.
   * @param array is the array into which the builder will load waypoints
   */
  setWaypointsArray(array: IntersectionFacility[]): void {
    this._waypointsArray = array;
  }

  /**
   * Begins loading waypoints for this builder's parent airway.
   * @returns a Promise to return a status code corresponding to Airway.Status when this builder has
   * finished loading waypoints.
   */
  startBuild(): Promise<AirwayStatus> {
    if (this.hasStarted) {
      return Promise.reject(new Error('Airway builder has already started building.'));
    }
    return new Promise(resolve => {
      this._hasStarted = true;
      if (this._waypointsArray !== null) {
        this._waypointsArray.push(this._initialWaypoint);
        Promise.all([
          this._stepForward(),
          this._stepBackward()
        ]).then(() => {
          this._isDone = true;
          resolve(AirwayStatus.COMPLETE);
        }).catch(() => {
          this._isDone = true;
          resolve(AirwayStatus.PARTIAL);
        });
      }
    });
  }
}
