import { EventBus } from '../../../data';
import { GeoPoint, GeoPointReadOnly, LatLonInterface } from '../../../geo';
import { BitFlags, UnitType, Vec2Math } from '../../../math';
import {
  Facility, FacilityLoader, FacilityRepository, FacilitySearchType, ICAO, NearestAirportSearchSession, NearestIntersectionSearchSession, NearestSearchResults,
  NearestSearchSession, NearestUserFacilitySearchSession, NearestVorSearchSession
} from '../../../navigation';
import { FSComponent, VNode } from '../../FSComponent';
import { MapLayer, MapLayerProps } from '../MapLayer';
import { MapProjection, MapProjectionChangeType } from '../MapProjection';
import { MapWaypointRenderer, MapWaypointRendererType } from '../MapWaypointRenderer';
import { MapSyncedCanvasLayer } from './MapSyncedCanvasLayer';

/**
 * Facility search types supported by MapAbstractNearestWaypointsLayer.
 */
export type MapNearestWaypointsLayerSearchTypes
  = FacilitySearchType.Airport
  | FacilitySearchType.Vor
  | FacilitySearchType.Ndb
  | FacilitySearchType.Intersection
  | FacilitySearchType.User;

/**
 * Component props for MapAbstractNearestWaypointsLayer.
 */
export interface MapAbstractNearestWaypointsLayerProps<R extends MapWaypointRenderer<any> = MapWaypointRenderer> extends MapLayerProps<any> {

  /** The event bus. */
  bus: EventBus;

  /** The waypoint renderer to use. */
  waypointRenderer: R;

  /** A function which retrieves a waypoint for a facility. */
  waypointForFacility: (facility: Facility) => MapWaypointRendererType<R>;

  /** A function which registers a waypoint with this layer's waypoint renderer. */
  registerWaypoint: (waypoint: MapWaypointRendererType<R>, renderer: R) => void;

  /** A function which deregisters a waypoint with this layer's waypoint renderer. */
  deregisterWaypoint: (waypoint: MapWaypointRendererType<R>, renderer: R) => void;

  /** A function which initializes this layer's waypoint renderer. */
  initRenderer?: (waypointRenderer: R, canvasLayer: MapSyncedCanvasLayer) => void;

  /** A function which gets the search center. If not defined, the search center defaults to the center of the map. */
  getSearchCenter?: (mapProjection: MapProjection) => LatLonInterface;

  /** A function which checks if a search should be refreshed. Defaults to `true` if not defined. */
  shouldRefreshSearch?: (searchType: MapNearestWaypointsLayerSearchTypes, center: LatLonInterface, radius: number) => boolean;

  /** A function which gets the item limit for facility searches. */
  searchItemLimit?: (searchType: MapNearestWaypointsLayerSearchTypes, center: LatLonInterface, radius: number) => number;

  /** A function which gets the radius limit for facility searches, in great-arc radians. */
  searchRadiusLimit?: (searchType: MapNearestWaypointsLayerSearchTypes, center: LatLonInterface, radius: number) => number;

  /** The debounce delay for facility searches, in milliseconds. Defaults to 500 milliseconds. */
  searchDebounceDelay?: number;

  /** A callback called when the search sessions are started. */
  onSessionsStarted?: (airportSession: NearestAirportSearchSession, vorSession: NearestVorSearchSession, ndbSession: NearestSearchSession<string, string>,
    intSession: NearestIntersectionSearchSession, userSession: NearestUserFacilitySearchSession) => void
}

/**
 * An abstract implementation of a map layer which displays waypoints (airports, navaids, and intersections) within a
 * search radius.
 */
export class MapNearestWaypointsLayer
  <
  R extends MapWaypointRenderer<any> = MapWaypointRenderer,
  P extends MapAbstractNearestWaypointsLayerProps<R> = MapAbstractNearestWaypointsLayerProps<R>
  >
  extends MapLayer<P> {

  private static readonly SEARCH_RADIUS_OVERDRAW_FACTOR = Math.SQRT2;

  private readonly canvasLayerRef = FSComponent.createRef<MapSyncedCanvasLayer>();

  private readonly searchDebounceDelay = this.props.searchDebounceDelay ?? 500;

  private readonly facLoader = new FacilityLoader(FacilityRepository.getRepository(this.props.bus), this.onFacilityLoaderInitialized.bind(this));

  private facilitySearches?: {
    /** A nearest airport search session. */
    [FacilitySearchType.Airport]: MapNearestWaypointsLayerSearch,
    /** A nearest VOR search session. */
    [FacilitySearchType.Vor]: MapNearestWaypointsLayerSearch,
    /** A nearest NDB search session. */
    [FacilitySearchType.Ndb]: MapNearestWaypointsLayerSearch,
    /** A nearest intersection search session. */
    [FacilitySearchType.Intersection]: MapNearestWaypointsLayerSearch
    /** A nearest intersection search session. */
    [FacilitySearchType.User]: MapNearestWaypointsLayerSearch
  };

  private searchRadius = 0;
  private searchMargin = 0;

  private readonly icaosToShow = new Set<string>();

  private isInit = false;

  /**
   * A callback called when the facility loaded finishes initialization.
   */
  private onFacilityLoaderInitialized(): void {
    Promise.all([
      this.facLoader.startNearestSearchSession(FacilitySearchType.Airport),
      this.facLoader.startNearestSearchSession(FacilitySearchType.Vor),
      this.facLoader.startNearestSearchSession(FacilitySearchType.Ndb),
      this.facLoader.startNearestSearchSession(FacilitySearchType.Intersection),
      this.facLoader.startNearestSearchSession(FacilitySearchType.User)
    ]).then((value: [
      NearestAirportSearchSession,
      NearestVorSearchSession,
      NearestSearchSession<string, string>,
      NearestIntersectionSearchSession,
      NearestUserFacilitySearchSession
    ]) => {
      const [airportSession, vorSession, ndbSession, intSession, userSession] = value;
      this.onSessionsStarted(airportSession, vorSession, ndbSession, intSession, userSession);
    });
  }

  /**
   * A callback called when the nearest facility search sessions have been started.
   * @param airportSession The airport search session.
   * @param vorSession The VOR search session.
   * @param ndbSession The NDB search session.
   * @param intSession The intersection search session.
   * @param userSession The user facility search session.
   */
  protected onSessionsStarted(airportSession: NearestAirportSearchSession, vorSession: NearestVorSearchSession, ndbSession: NearestSearchSession<string, string>,
    intSession: NearestIntersectionSearchSession, userSession: NearestUserFacilitySearchSession): void {
    const callback = this.processSearchResults.bind(this);
    this.facilitySearches = {
      [FacilitySearchType.Airport]: new MapNearestWaypointsLayerSearch(airportSession, callback),
      [FacilitySearchType.Vor]: new MapNearestWaypointsLayerSearch(vorSession, callback),
      [FacilitySearchType.Ndb]: new MapNearestWaypointsLayerSearch(ndbSession, callback),
      [FacilitySearchType.Intersection]: new MapNearestWaypointsLayerSearch(intSession, callback),
      [FacilitySearchType.User]: new MapNearestWaypointsLayerSearch(userSession, callback)
    };

    this.props.onSessionsStarted && this.props.onSessionsStarted(airportSession, vorSession, ndbSession, intSession, userSession);

    if (this.isInit) {
      this._tryRefreshAllSearches(this.getSearchCenter(), this.searchRadius);
    }
  }

  /** @inheritdoc */
  public onAttached(): void {
    super.onAttached();

    this.canvasLayerRef.instance.onAttached();

    this.doInit();
    this.isInit = true;
    this._tryRefreshAllSearches(this.getSearchCenter(), this.searchRadius);
  }

  /**
   * Initializes this layer.
   */
  private doInit(): void {
    this.initWaypointRenderer();
    this.updateSearchRadius();
  }

  /**
   * Gets the search center for the waypoint searches on this layer.
   * @returns The waypoint search center geo point.
   */
  private getSearchCenter(): LatLonInterface {
    return this.props.getSearchCenter ? this.props.getSearchCenter(this.props.mapProjection) : this.props.mapProjection.getCenter();
  }

  /**
   * Initializes this layer's waypoint renderer.
   */
  private initWaypointRenderer(): void {
    this.props.initRenderer && this.props.initRenderer(this.props.waypointRenderer, this.canvasLayerRef.instance);
  }

  /** @inheritdoc */
  public onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    super.onMapProjectionChanged(mapProjection, changeFlags);

    this.canvasLayerRef.instance.onMapProjectionChanged(mapProjection, changeFlags);

    if (BitFlags.isAny(changeFlags, MapProjectionChangeType.Range | MapProjectionChangeType.RangeEndpoints | MapProjectionChangeType.ProjectedSize)) {
      this.updateSearchRadius();
      this._tryRefreshAllSearches(this.getSearchCenter(), this.searchRadius);
    } else if (BitFlags.isAll(changeFlags, MapProjectionChangeType.Center)) {
      this._tryRefreshAllSearches(this.getSearchCenter(), this.searchRadius);
    }
  }

  /**
   * Updates the desired nearest facility search radius based on the current map projection.
   */
  private updateSearchRadius(): void {
    const mapHalfDiagRange = Vec2Math.abs(this.props.mapProjection.getProjectedSize()) * this.props.mapProjection.getProjectedResolution() / 2;
    this.searchRadius = mapHalfDiagRange * MapNearestWaypointsLayer.SEARCH_RADIUS_OVERDRAW_FACTOR;
    this.searchMargin = mapHalfDiagRange * (MapNearestWaypointsLayer.SEARCH_RADIUS_OVERDRAW_FACTOR - 1);
  }

  /** @inheritdoc */
  public onUpdated(time: number, elapsed: number): void {
    this.updateSearches(elapsed);
  }

  /**
   * Updates this layer's facility searches.
   * @param elapsed The elapsed time, in milliseconds, since the last update.
   */
  private updateSearches(elapsed: number): void {
    if (!this.facilitySearches) {
      return;
    }

    this.facilitySearches[FacilitySearchType.Airport].update(elapsed);
    this.facilitySearches[FacilitySearchType.Vor].update(elapsed);
    this.facilitySearches[FacilitySearchType.Ndb].update(elapsed);
    this.facilitySearches[FacilitySearchType.Intersection].update(elapsed);
    this.facilitySearches[FacilitySearchType.User].update(elapsed);
  }

  /**
   * Attempts to refresh all of the nearest facility searches. Searches will only be refreshed if the desired search
   * radius is different from the last refreshed search radius or the desired search center is outside of the margin
   * of the last refreshed search center.
   * @param center The center of the search area. Defaults to this layer's automatically calculated search center.
   * @param radius The radius of the search area, in great-arc radians. Defaults to this layer's automatically
   * calculated search radius.
   */
  public tryRefreshAllSearches(center?: LatLonInterface, radius?: number): void {
    center ??= this.getSearchCenter();
    radius ??= this.searchRadius;

    this._tryRefreshAllSearches(center, radius);
  }

  /**
   * Attempts to refresh a nearest search. The search will only be refreshed if the desired search radius is different
   * from the last refreshed search radius or the desired search center is outside of the margin of the last refreshed
   * search center.
   * @param type The type of nearest search to refresh.
   * @param center The center of the search area. Defaults to this layer's automatically calculated search center.
   * @param radius The radius of the search area, in great-arc radians. Defaults to this layer's automatically
   * calculated search radius.
   */
  public tryRefreshSearch(type: MapNearestWaypointsLayerSearchTypes, center?: LatLonInterface, radius?: number): void {
    center ??= this.getSearchCenter();
    radius ??= this.searchRadius;

    this._tryRefreshSearch(type, center, radius);
  }

  /**
   * Attempts to refresh all of the nearest facility searches.
   * @param center The center of the search area.
   * @param radius The radius of the search area, in great-arc radians.
   */
  private _tryRefreshAllSearches(center: LatLonInterface, radius: number): void {
    this._tryRefreshSearch(FacilitySearchType.Airport, center, radius);
    this._tryRefreshSearch(FacilitySearchType.Vor, center, radius);
    this._tryRefreshSearch(FacilitySearchType.Ndb, center, radius);
    this._tryRefreshSearch(FacilitySearchType.Intersection, center, radius);
    this._tryRefreshSearch(FacilitySearchType.User, center, radius);
  }

  /**
   * Attempts to refresh a nearest search. The search will only be refreshed if `this.shouldRefreshSearch()` returns
   * true and and the desired search radius is different from the last refreshed search radius or the desired search
   * center is outside of the margin of the last refreshed search center.
   * @param type The type of nearest search to refresh.
   * @param center The center of the search area.
   * @param radius The radius of the search area, in great-arc radians.
   */
  private _tryRefreshSearch(type: MapNearestWaypointsLayerSearchTypes, center: LatLonInterface, radius: number): void {
    const search = this.facilitySearches && this.facilitySearches[type];

    if (!search || !this.shouldRefreshSearch(type, center, radius)) {
      return;
    }

    if (search.lastRadius !== radius || search.lastCenter.distance(center) >= this.searchMargin) {
      this.scheduleSearchRefresh(type, search, center, radius);
    }
  }

  /**
   * Checks whether one of this layer's searches should be refreshed.
   * @param type The type of nearest search to refresh.
   * @param center The center of the search area.
   * @param radius The radius of the search area, in great-arc radians.
   * @returns Whether the search should be refreshed.
   */
  private shouldRefreshSearch(type: MapNearestWaypointsLayerSearchTypes, center: LatLonInterface, radius: number): boolean {
    return this.props.shouldRefreshSearch ? this.props.shouldRefreshSearch(type, center, radius) : true;
  }

  /**
   * Schedules a refresh of this one of this layer's searches.
   * @param type The type of nearest search to refresh.
   * @param search The search to refresh.
   * @param center The center of the search area.
   * @param radius The radius of the search area, in great-arc radians.
   */
  private scheduleSearchRefresh(
    type: MapNearestWaypointsLayerSearchTypes,
    search: MapNearestWaypointsLayerSearch,
    center: LatLonInterface,
    radius: number
  ): void {
    const itemLimit = this.props.searchItemLimit ? this.props.searchItemLimit(type, center, radius) : 100;
    const radiusLimit = this.props.searchRadiusLimit ? this.props.searchRadiusLimit(type, center, radius) : undefined;

    if (radiusLimit !== undefined && isFinite(radiusLimit)) {
      radius = Math.min(radius, Math.max(0, radiusLimit));
    }

    search.scheduleRefresh(center, radius, itemLimit, this.searchDebounceDelay);
  }

  /**
   * Processes nearest facility search results. New facilities are registered, while removed facilities are
   * deregistered.
   * @param results Nearest facility search results.
   */
  private processSearchResults(results: NearestSearchResults<string, string> | undefined): void {
    if (!results) {
      return;
    }

    const numAdded = results.added.length;
    for (let i = 0; i < numAdded; i++) {
      const icao = results.added[i];
      if (icao === undefined || icao === ICAO.emptyIcao) {
        continue;
      }

      this.registerIcao(icao);
    }

    const numRemoved = results.removed.length;
    for (let i = 0; i < numRemoved; i++) {
      const icao = results.removed[i];
      if (icao === undefined || icao === ICAO.emptyIcao) {
        continue;
      }

      this.deregisterIcao(icao);
    }
  }

  /**
   * Registers an ICAO string with this layer. Once an ICAO is registered, its corresponding facility is drawn to this
   * layer using a waypoint renderer.
   * @param icao The ICAO string to register.
   */
  private registerIcao(icao: string): void {
    this.icaosToShow.add(icao);
    this.facLoader.getFacility(ICAO.getFacilityType(icao), icao).then(facility => {
      if (!this.icaosToShow.has(icao)) {
        return;
      }

      this.registerWaypointWithRenderer(this.props.waypointRenderer, facility);
    });
  }

  /**
   * Registers a facility with this layer's waypoint renderer.
   * @param renderer This layer's waypoint renderer.
   * @param facility The facility to register.
   */
  private registerWaypointWithRenderer(renderer: R, facility: Facility): void {
    const waypoint = this.props.waypointForFacility(facility);
    this.props.registerWaypoint(waypoint, renderer);
  }

  /**
   * Deregisters an ICAO string from this layer.
   * @param icao The ICAO string to deregister.
   */
  private deregisterIcao(icao: string): void {
    this.icaosToShow.delete(icao);
    this.facLoader.getFacility(ICAO.getFacilityType(icao), icao).then(facility => {
      if (this.icaosToShow.has(icao)) {
        return;
      }

      this.deregisterWaypointWithRenderer(this.props.waypointRenderer, facility);
    });
  }

  /**
   * Deregisters a facility from this layer's waypoint renderer.
   * @param renderer This layer's waypoint renderer.
   * @param facility The facility to deregister.
   */
  private deregisterWaypointWithRenderer(renderer: R, facility: Facility): void {
    const waypoint = this.props.waypointForFacility(facility);
    this.props.deregisterWaypoint(waypoint, renderer);
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <MapSyncedCanvasLayer ref={this.canvasLayerRef} model={this.props.model} mapProjection={this.props.mapProjection} />
    );
  }
}

/**
 * A nearest facility search for MapAbstractNearestWaypointsLayer.
 */
export class MapNearestWaypointsLayerSearch<S extends NearestSearchSession<string, string> = NearestSearchSession<string, string>> {
  private readonly _lastCenter = new GeoPoint(0, 0);
  private _lastRadius = 0;

  private maxItemCount = 0;

  private refreshDebounceTimer = 0;
  private isRefreshScheduled = false;

  // eslint-disable-next-line jsdoc/require-returns
  /**
   * The center of this search's last refresh.
   */
  public get lastCenter(): GeoPointReadOnly {
    return this._lastCenter.readonly;
  }

  // eslint-disable-next-line jsdoc/require-returns
  /**
   * The radius of this search's last refresh, in great-arc radians.
   */
  public get lastRadius(): number {
    return this._lastRadius;
  }

  /**
   * Constructor.
   * @param session The session used by this search.
   * @param refreshCallback A callback which is called every time the search refreshes.
   */
  constructor(
    private readonly session: S,
    private readonly refreshCallback: (results: NearestSearchResults<string, string>) => void
  ) {
  }

  /**
   * Schedules a refresh of this search.  If a refresh was previously scheduled but not yet executed, this new
   * scheduled refresh will replace the old one.
   * @param center The center of the search area.
   * @param radius The radius of the search area, in great-arc radians.
   * @param maxItemCount The maximum number of results returned by the refresh.
   * @param delay The delay, in milliseconds, before the refresh is executed.
   */
  public scheduleRefresh(center: LatLonInterface, radius: number, maxItemCount: number, delay: number): void {
    this._lastCenter.set(center);
    this._lastRadius = radius;
    this.maxItemCount = maxItemCount;

    this.refreshDebounceTimer = delay;
    this.isRefreshScheduled = true;
  }

  /**
   * Updates this search. Executes any pending refreshes if their delay timers have expired.
   * @param elapsed The elapsed time, in milliseconds, since the last update.
   */
  public update(elapsed: number): void {
    if (!this.isRefreshScheduled) {
      return;
    }

    this.refreshDebounceTimer = Math.max(0, this.refreshDebounceTimer - elapsed);
    if (this.refreshDebounceTimer === 0) {
      this.refresh();
      this.isRefreshScheduled = false;
    }
  }

  /**
   * Refreshes this search.
   * @returns a Promise which is fulfilled when the refresh completes.
   */
  private async refresh(): Promise<void> {
    const results = await this.session.searchNearest(
      this._lastCenter.lat,
      this._lastCenter.lon,
      UnitType.GA_RADIAN.convertTo(this._lastRadius, UnitType.METER),
      this.maxItemCount
    );

    this.refreshCallback(results);
  }
}