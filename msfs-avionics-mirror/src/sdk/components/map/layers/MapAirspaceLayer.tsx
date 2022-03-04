import { BitFlags, ClippedPathStream, FSComponent, GeoPoint, NumberUnitInterface, Subscribable, ThrottledTaskQueueProcess, UnitFamily, UnitType, VecNSubject, VNode } from '../../..';
import { EventBus } from '../../../data';
import { FacilityLoader, FacilityRespository, FacilitySearchType, LodBoundary, LodBoundaryCache, NearestLodBoundarySearchSession } from '../../../navigation';
import { MapAirspaceRenderManager } from '../MapAirspaceRenderManager';
import { MapLayer, MapLayerProps } from '../MapLayer';
import { MapProjection, MapProjectionChangeType } from '../MapProjection';
import { MapAirspaceModule, MapAirspaceShowTypes } from '../modules/MapAirspaceModule';
import { MapCachedCanvasLayer, MapCachedCanvasLayerCanvasInstance } from './MapCachedCanvasLayer';

/**
 * Modules required by MapAirspaceLayer.
 */
export interface MapAirspaceLayerModules {
  /** Airspace module. */
  airspace: MapAirspaceModule<MapAirspaceShowTypes>;
}

/**
 * Component props for MapAirspaceLayer.
 */
export interface MapAirspaceLayerProps extends MapLayerProps<MapAirspaceLayerModules> {
  /** The event bus. */
  bus: EventBus;

  /** A cache of LodBoundary objects to use to cache airspace search results. */
  lodBoundaryCache: LodBoundaryCache;

  /** The airspace render manager to use to render airspaces. */
  airspaceRenderManager: MapAirspaceRenderManager;

  /** A subscribable which provides the maximum airspace search radius. */
  maxSearchRadius: Subscribable<NumberUnitInterface<UnitFamily.Distance>>;

  /** A subscribable which provides the maximum number of items to return per airspace search. */
  maxSearchItemCount: Subscribable<number>;

  /** The debounce delay, in milliseconds, for airspace searches. Defaults to 500. */
  searchDebounceDelay?: number;

  /** The maximum amount of time, in milliseconds, allotted per frame for rendering airspaces. Defaults to 0.2. */
  renderTimeBudget?: number;
}

/**
 * A layer which draws airspaces.
 */
export class MapAirspaceLayer extends MapLayer<MapAirspaceLayerProps> {
  private static readonly DEFAULT_SEARCH_DEBOUNCE_DELAY = 500; // milliseconds
  private static readonly DEFAULT_RENDER_TIME_BUDGET = 0.2; // milliseconds per frame
  private static readonly BACKGROUND_RENDER_MARGIN_THRESHOLD = 0.1; // relative to total margin
  private static readonly CLIP_BOUNDS_BUFFER = 10; // number of pixels from edge of canvas to extend the clipping bounds, in pixels

  private static readonly geoPointCache = [new GeoPoint(0, 0)];
  private static readonly vec2Cache = [new Float64Array(2)];

  private readonly canvasLayerRef = FSComponent.createRef<MapCachedCanvasLayer>();

  private clippedPathStream?: ClippedPathStream;
  private readonly clipBoundsSub = VecNSubject.createFromVector(new Float64Array(4));

  private readonly facLoader = new FacilityLoader(FacilityRespository.getRepository(this.props.bus), async () => {
    this.searchSession = new NearestLodBoundarySearchSession(this.props.lodBoundaryCache, await this.facLoader.startNearestSearchSession(FacilitySearchType.Boundary), 0.5);

    this.isAttached && this.scheduleSearch(0, true);
  });

  private searchSession?: NearestLodBoundarySearchSession;
  private readonly searchedAirspaces = new Map<number, LodBoundary>();

  private readonly searchDebounceDelay = this.props.searchDebounceDelay ?? MapAirspaceLayer.DEFAULT_SEARCH_DEBOUNCE_DELAY;
  private readonly renderTimeBudget = this.props.renderTimeBudget ?? MapAirspaceLayer.DEFAULT_RENDER_TIME_BUDGET;

  private activeRenderProcess: ThrottledTaskQueueProcess | null = null;
  private readonly renderTaskQueueHandler = {
    renderTimeBudget: this.renderTimeBudget,

    // eslint-disable-next-line jsdoc/require-jsdoc
    onStarted(): void {
      // noop
    },

    // eslint-disable-next-line jsdoc/require-jsdoc
    canContinue(elapsedFrameCount: number, dispatchedTaskCount: number, timeElapsed: number): boolean {
      return timeElapsed < this.renderTimeBudget;
    },

    // eslint-disable-next-line jsdoc/require-jsdoc
    onPaused: this.onRenderPaused.bind(this),

    // eslint-disable-next-line jsdoc/require-jsdoc
    onFinished: this.onRenderFinished.bind(this),

    // eslint-disable-next-line jsdoc/require-jsdoc
    onAborted: this.onRenderAborted.bind(this)
  };

  private searchDebounceTimer = 0;
  private isSearchScheduled = false;
  private needRefilter = false;
  private isSearchBusy = false;

  private lastDesiredSearchRadius = 0; // meters
  private lastSearchRadius = 0; // meters

  private isRenderScheduled = false;
  private isBackgroundRenderScheduled = false;

  private isDisplayInvalidated = true;

  private isAttached = false;

  /** @inheritdoc */
  public onAttached(): void {
    this.canvasLayerRef.instance.onAttached();

    this.updateClipBounds();

    this.clippedPathStream = new ClippedPathStream(this.canvasLayerRef.instance.buffer.context, this.clipBoundsSub);

    this.props.maxSearchRadius.sub(radius => {
      const radiusMeters = radius.asUnit(UnitType.METER);
      if (radiusMeters < this.lastSearchRadius || radiusMeters > this.lastDesiredSearchRadius) {
        this.scheduleSearch(0, false);
      }
    });
    this.props.maxSearchItemCount.sub(() => { this.scheduleSearch(0, false); });

    this.initModuleListeners();
    this.isAttached = true;
    this.searchSession && this.scheduleSearch(0, true);
  }

  /**
   * Initializes this layer's airspace module property listeners.
   */
  private initModuleListeners(): void {
    const airspaceModule = this.props.model.getModule('airspace');
    for (const type of Object.values(airspaceModule.show)) {
      type.sub(this.onAirspaceTypeShowChanged.bind(this));
    }
  }

  /** @inheritdoc */
  public onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    this.canvasLayerRef.instance.onMapProjectionChanged(mapProjection, changeFlags);

    if (BitFlags.isAll(changeFlags, MapProjectionChangeType.ProjectedSize)) {
      this.updateClipBounds();
    }
  }

  /**
   * Updates this layer's canvas clipping bounds.
   */
  private updateClipBounds(): void {
    const size = this.canvasLayerRef.instance.getSize();
    this.clipBoundsSub.set(
      -MapAirspaceLayer.CLIP_BOUNDS_BUFFER,
      -MapAirspaceLayer.CLIP_BOUNDS_BUFFER,
      size + MapAirspaceLayer.CLIP_BOUNDS_BUFFER,
      size + MapAirspaceLayer.CLIP_BOUNDS_BUFFER
    );
  }

  /**
   * Schedules a search. If a search was previously scheduled but not yet executed, this new scheduled search will
   * replace the old one.
   * @param delay The delay, in milliseconds, before the search is executed.
   * @param refilter Whether to update the search's boundary class filter.
   */
  private scheduleSearch(delay: number, refilter: boolean): void {
    if (!this.searchSession) {
      return;
    }

    this.searchDebounceTimer = delay;
    this.isSearchScheduled = true;
    this.needRefilter ||= refilter;
  }

  /**
   * Schedules a render to be executed during the next update cycle.
   */
  private scheduleRender(): void {
    this.isRenderScheduled = true;
  }

  /**
   * Searches for airspaces around the map center. After the search is complete, the list of search results is filtered
   * and, if necessary, rendered.
   * @param refilter Whether to update the search's boundary class filter.
   */
  private async searchAirspaces(refilter: boolean): Promise<void> {
    this.isSearchBusy = true;

    const center = this.props.mapProjection.getCenter();
    const drawableDiag = this.canvasLayerRef.instance.display.canvas.width * Math.SQRT2;

    this.lastDesiredSearchRadius = UnitType.GA_RADIAN.convertTo(this.props.mapProjection.getProjectedResolution() * drawableDiag / 2, UnitType.METER);
    this.lastSearchRadius = Math.min(
      this.props.maxSearchRadius.get().asUnit(UnitType.METER),
      this.lastDesiredSearchRadius
    );

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const session = this.searchSession!;

    refilter && session.setFilter(this.getBoundaryFilter());
    const results = await session.searchNearest(center.lat, center.lon, this.lastSearchRadius, this.props.maxSearchItemCount.get());

    for (let i = 0; i < results.added.length; i++) {
      const airspace = results.added[i];
      this.searchedAirspaces.set(airspace.facility.id, airspace);
    }
    for (let i = 0; i < results.removed.length; i++) {
      this.searchedAirspaces.delete(results.removed[i]);
    }

    this.isSearchBusy = false;

    this.scheduleRender();
  }

  /**
   * Gets the boundary class filter based on the current airspace type visibility settings.
   * @returns The boundary class filter based on the current airspace type visibility settings.
   */
  private getBoundaryFilter(): number {
    const module = this.props.model.getModule('airspace');
    const show = module.show;

    let filter = 0;
    for (const type in show) {
      if (show[type].get()) {
        filter |= module.showTypes[type];
      }
    }
    return filter;
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onUpdated(time: number, elapsed: number): void {
    this.canvasLayerRef.instance.onUpdated(time, elapsed);

    this.updateFromInvalidation();
    this.updateScheduledRender();
    this.updateScheduledSearch(elapsed);
  }

  /**
   * Checks if the display and buffer canvases have been invalidated, and if so, clears them and schedules a render.
   */
  private updateFromInvalidation(): void {
    const canvasLayer = this.canvasLayerRef.instance;
    const display = canvasLayer.display;
    const buffer = canvasLayer.buffer;

    const needBackgroundRender = !this.isBackgroundRenderScheduled
      && !this.activeRenderProcess
      && (display.transform.marginRemaining / display.transform.margin <= MapAirspaceLayer.BACKGROUND_RENDER_MARGIN_THRESHOLD);

    const shouldScheduleSearch = needBackgroundRender
      || display.isInvalid
      || (buffer.isInvalid && this.activeRenderProcess);

    this.isBackgroundRenderScheduled ||= needBackgroundRender;

    if (display.isInvalid) {
      this.isDisplayInvalidated = true;
      this.isBackgroundRenderScheduled = false;
      display.clear();
      display.syncWithMapProjection(this.props.mapProjection);
    }
    if (buffer.isInvalid) {
      if (this.activeRenderProcess) {
        this.activeRenderProcess.abort();
        this.cleanUpRender();
      }
      buffer.clear();
      buffer.syncWithMapProjection(this.props.mapProjection);
    }

    if (shouldScheduleSearch) {
      this.scheduleSearch(this.searchDebounceDelay, false);
    }
  }

  /**
   * If a search is scheduled, decrements the delay timer and if necessary, executes the search.
   * @param elapsed The time elapsed, in milliseconds, since the last update.
   */
  private updateScheduledSearch(elapsed: number): void {
    if (!this.isSearchScheduled) {
      return;
    }

    this.searchDebounceTimer = Math.max(0, this.searchDebounceTimer - elapsed);
    if (this.searchDebounceTimer === 0 && !this.isSearchBusy) {
      this.searchAirspaces(this.needRefilter);
      this.isSearchScheduled = false;
      this.needRefilter = false;
    }
  }

  /**
   * Executes a render if one is scheduled.
   */
  private updateScheduledRender(): void {
    if (!this.isRenderScheduled) {
      return;
    }

    this.startRenderProcess();
    this.isRenderScheduled = false;
    this.isBackgroundRenderScheduled = false;
  }

  /**
   * Syncs this layer's display canvas instance with the current map projection and renders this layer's airspaces to
   * the display.
   */
  protected startRenderProcess(): void {
    const canvasLayer = this.canvasLayerRef.instance;

    if (this.activeRenderProcess) {
      this.activeRenderProcess.abort();
    }

    const buffer = canvasLayer.buffer;
    buffer.clear();
    buffer.syncWithMapProjection(this.props.mapProjection);

    this.props.airspaceRenderManager.clearRegisteredAirspaces();
    for (const airspace of this.searchedAirspaces.values()) {
      if (this.isAirspaceInBounds(airspace, buffer)) {
        this.props.airspaceRenderManager.registerAirspace(airspace);
      }
    }

    const lod = this.selectLod(this.props.mapProjection.getProjectedResolution());

    this.activeRenderProcess = this.props.airspaceRenderManager.prepareRenderProcess(
      buffer.geoProjection, buffer.context, this.renderTaskQueueHandler, lod, this.clippedPathStream
    );
    this.activeRenderProcess.start();
  }

  /**
   * Checks whether an airspace is within the projected bounds of a cached canvas instance.
   * @param airspace An airspace.
   * @param canvas A cached canvas instance.
   * @returns Whether the airspace is within the projected bounds of the cached canvas instance.
   */
  private isAirspaceInBounds(airspace: LodBoundary, canvas: MapCachedCanvasLayerCanvasInstance): boolean {
    const corner = MapAirspaceLayer.geoPointCache[0];
    const cornerProjected = MapAirspaceLayer.vec2Cache[0];

    let minX, maxX, minY, maxY;

    canvas.geoProjection.project(corner.set(airspace.facility.topLeft.lat, airspace.facility.topLeft.long), cornerProjected);

    minX = maxX = cornerProjected[0];
    minY = maxY = cornerProjected[1];

    canvas.geoProjection.project(corner.set(airspace.facility.topLeft.lat, airspace.facility.bottomRight.long), cornerProjected);
    minX = Math.min(minX, cornerProjected[0]);
    maxX = Math.max(maxX, cornerProjected[0]);
    minY = Math.min(minY, cornerProjected[1]);
    maxY = Math.max(maxY, cornerProjected[1]);

    canvas.geoProjection.project(corner.set(airspace.facility.bottomRight.lat, airspace.facility.bottomRight.long), cornerProjected);
    minX = Math.min(minX, cornerProjected[0]);
    maxX = Math.max(maxX, cornerProjected[0]);
    minY = Math.min(minY, cornerProjected[1]);
    maxY = Math.max(maxY, cornerProjected[1]);

    canvas.geoProjection.project(corner.set(airspace.facility.bottomRight.lat, airspace.facility.topLeft.long), cornerProjected);
    minX = Math.min(minX, cornerProjected[0]);
    maxX = Math.max(maxX, cornerProjected[0]);
    minY = Math.min(minY, cornerProjected[1]);
    maxY = Math.max(maxY, cornerProjected[1]);

    const width = canvas.canvas.width;
    const height = canvas.canvas.height;
    return minX < width
      && maxX > 0
      && minY < height
      && maxY > 0;
  }

  /**
   * Selects an LOD level based on projected map resolution.
   * @param resolution A projected map resolution, in great-arc radians per pixel.
   * @returns An LOD level based on the projected map resolution.
   */
  private selectLod(resolution: number): number {
    const thresholds = this.props.lodBoundaryCache.lodDistanceThresholds;

    let i = thresholds.length - 1;
    while (i >= 0) {
      if (resolution * 2 >= thresholds[i]) {
        break;
      }
      i--;
    }
    return i;
  }

  /**
   * Cleans up the active render process.
   */
  private cleanUpRender(): void {
    this.canvasLayerRef.instance.buffer.reset();
    this.activeRenderProcess = null;
  }

  /**
   * Renders airspaces from the buffer to the display.
   */
  private renderAirspacesToDisplay(): void {
    const display = this.canvasLayerRef.instance.display;
    const buffer = this.canvasLayerRef.instance.buffer;

    display.clear();
    display.syncWithCanvasInstance(buffer);
    this.canvasLayerRef.instance.copyBufferToDisplay();
  }

  /**
   * This method is called when the airspace render process pauses.
   */
  private onRenderPaused(): void {
    if (this.isDisplayInvalidated) {
      this.renderAirspacesToDisplay();
    }
  }

  /**
   * This method is called when the airspace render process finishes.
   */
  private onRenderFinished(): void {
    this.renderAirspacesToDisplay();
    this.cleanUpRender();
    this.isDisplayInvalidated = false;
  }

  /**
   * This method is called when the airspace render process is aborted.
   */
  private onRenderAborted(): void {
    this.cleanUpRender();
  }

  /**
   * This method is called when an airspace show property changes.
   */
  private onAirspaceTypeShowChanged(): void {
    this.scheduleSearch(0, true);
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <MapCachedCanvasLayer
        ref={this.canvasLayerRef}
        model={this.props.model} mapProjection={this.props.mapProjection}
        useBuffer={true} overdrawFactor={Math.SQRT2}
      />
    );
  }
}