import { EventBus } from '../../../data';
import { LegDefinition } from '../../../flightplan';
import { ClippedPathStream, NullPathStream } from '../../../graphics/path';
import { VecNSubject } from '../../../math';
import { DefaultFacilityWaypointCache, Facility, FacilityLoader, FacilityRepository, FlightPathWaypoint, ICAO, LegType, Waypoint } from '../../../navigation';
import { FSComponent, VNode } from '../../FSComponent';
import { GeoProjectionPathStreamStack } from '../../map/GeoProjectionPathStreamStack';
import { MapCachedCanvasLayer } from '../../map/layers/MapCachedCanvasLayer';
import { MapSyncedCanvasLayer } from '../../map/layers/MapSyncedCanvasLayer';
import { MapLayer, MapLayerProps } from '../../map/MapLayer';
import { MapProjection } from '../../map/MapProjection';
import { MapSystemKeys } from '../MapSystemKeys';
import { MapSystemPlanRenderer } from '../MapSystemPlanRenderer';
import { MapSystemWaypointRoles } from '../MapSystemWaypointRoles';
import { MapSystemIconFactory, MapSystemLabelFactory, MapSystemWaypointsRenderer } from '../MapSystemWaypointsRenderer';
import { MapFlightPlanModule } from '../modules/MapFlightPlanModule';

/**
 * Modules required by MapSystemFlightPlanLayer.
 */
export interface MapSystemFlightPlanLayerModules {
  /** Flight plan module. */
  [MapSystemKeys.FlightPlan]: MapFlightPlanModule;
}

/** Props on the MapSystemFlightPlanLayer component. */
export interface MapSystemFlightPlanLayerProps extends MapLayerProps<MapSystemFlightPlanLayerModules> {
  /** An instance of the event bus. */
  bus: EventBus

  /** The waypoint renderer to use with this instance. */
  waypointRenderer: MapSystemWaypointsRenderer;

  /** The icon factory to use with this instance. */
  iconFactory: MapSystemIconFactory;

  /** The label factory to use with this instance. */
  labelFactory: MapSystemLabelFactory;

  /** The flight plan renderer to use with this instance. */
  flightPathRenderer: MapSystemPlanRenderer;

  /** The flight plan index to display. */
  planIndex: number;
}

/**
 * A map system layer that draws the flight plan.
 */
export class MapSystemFlightPlanLayer extends MapLayer<MapSystemFlightPlanLayerProps> {
  private static readonly CLIP_BOUNDS_BUFFER = 10;

  protected readonly flightPathLayerRef = FSComponent.createRef<MapCachedCanvasLayer>();
  protected readonly waypointLayerRef = FSComponent.createRef<MapSyncedCanvasLayer>();

  protected readonly defaultRoleId = this.props.waypointRenderer.getRoleFromName(MapSystemWaypointRoles.FlightPlan) ?? 0;
  protected readonly planModule = this.props.model.getModule(MapSystemKeys.FlightPlan);

  protected readonly legWaypoints = new Map<LegDefinition, [Waypoint, number]>();
  protected waypointsUpdating = false;

  protected readonly facLoader = new FacilityLoader(FacilityRepository.getRepository(this.props.bus));
  protected readonly facWaypointCache = DefaultFacilityWaypointCache.getCache(this.props.bus);

  protected readonly clipBounds = VecNSubject.create(new Float64Array(4));
  protected readonly clippedPathStream = new ClippedPathStream(NullPathStream.INSTANCE, this.clipBounds);
  protected readonly pathStreamStack = new GeoProjectionPathStreamStack(NullPathStream.INSTANCE, this.props.mapProjection.getGeoProjection(), Math.PI / 12, 0.25, 8);

  protected updateScheduled = false;

  /** @inheritdoc */
  public onAttached(): void {
    this.flightPathLayerRef.instance.onAttached();
    this.waypointLayerRef.instance.onAttached();

    this.pathStreamStack.pushPostProjected(this.clippedPathStream);
    this.pathStreamStack.setConsumer(this.flightPathLayerRef.instance.display.context);

    this.initWaypointRenderer();

    this.planModule.getPlanSubjects(this.props.planIndex).flightPlan.sub(() => this.updateScheduled = true);
    this.planModule.getPlanSubjects(this.props.planIndex).planCalculated.on(() => this.updateScheduled = true);
    this.planModule.getPlanSubjects(this.props.planIndex).planChanged.on(() => this.updateScheduled = true);
    this.planModule.getPlanSubjects(this.props.planIndex).activeLeg.sub(() => this.updateScheduled = true);
    this.props.waypointRenderer.onRolesAdded.on(() => this.initWaypointRenderer());

    super.onAttached();
  }

  /**
   * Initializes the waypoint renderer for this layer.
   */
  protected initWaypointRenderer(): void {
    let hasDefaultRole = false;
    const flightPlanRoles = this.props.waypointRenderer.getRoleNamesByGroup(`${MapSystemWaypointRoles.FlightPlan}_${this.props.planIndex}`);

    for (let i = 0; i < flightPlanRoles.length; i++) {
      const roleId = this.props.waypointRenderer.getRoleFromName(flightPlanRoles[i]);

      if (roleId !== undefined) {
        this.props.waypointRenderer.setCanvasContext(roleId, this.waypointLayerRef.instance.display.context);
        this.props.waypointRenderer.setIconFactory(roleId, this.props.iconFactory);
        this.props.waypointRenderer.setLabelFactory(roleId, this.props.labelFactory);

        if (!hasDefaultRole) {
          this.props.flightPathRenderer.defaultRoleId = roleId;
          hasDefaultRole = true;
        }
      }
    }
  }

  /** @inheritdoc */
  public onUpdated(time: number, elapsed: number): void {
    this.flightPathLayerRef.instance.onUpdated(time, elapsed);
    this.waypointLayerRef.instance.onUpdated(time, elapsed);

    if (this.isVisible()) {
      const display = this.flightPathLayerRef.instance.display;
      if (display.isInvalid) {
        display.clear();
        display.syncWithMapProjection(this.props.mapProjection);

        this.updateScheduled = true;
      }

      if (this.updateScheduled) {
        if (!this.waypointsUpdating) {
          this.updateWaypoints();
        }

        const context = display.context;
        display.clear();

        const plan = this.planModule.getPlanSubjects(this.props.planIndex).flightPlan.get();
        if (plan !== undefined) {
          this.pathStreamStack.setProjection(display.geoProjection);
          this.props.flightPathRenderer.render(plan, undefined, undefined, context, this.pathStreamStack);
        }

        this.updateScheduled = false;
      }
    }
  }

  /** @inheritdoc */
  public onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    this.flightPathLayerRef.instance.onMapProjectionChanged(mapProjection, changeFlags);
    this.waypointLayerRef.instance.onMapProjectionChanged(mapProjection, changeFlags);

    const size = this.flightPathLayerRef.instance.getSize();
    this.clipBounds.set(
      -MapSystemFlightPlanLayer.CLIP_BOUNDS_BUFFER,
      -MapSystemFlightPlanLayer.CLIP_BOUNDS_BUFFER,
      size + MapSystemFlightPlanLayer.CLIP_BOUNDS_BUFFER,
      size + MapSystemFlightPlanLayer.CLIP_BOUNDS_BUFFER
    );
  }

  /** @inheritdoc */
  public setVisible(val: boolean): void {
    super.setVisible(val);

    this.waypointLayerRef.instance.setVisible(val);
    this.flightPathLayerRef.instance.setVisible(val);
  }

  /**
   * Updates waypoints for the flight plan.
   * @throws An error if the waypoints are already updating.
   */
  protected async updateWaypoints(): Promise<void> {
    if (this.waypointsUpdating) {
      throw new Error('A flight plan waypoint update is already in progress.');
    }

    this.waypointsUpdating = true;
    const flightPlan = this.planModule.getPlanSubjects(this.props.planIndex).flightPlan.get();
    const activeLegIndex = this.planModule.getPlanSubjects(this.props.planIndex).activeLeg.get();

    if (flightPlan === undefined) {
      for (const legWaypoint of this.legWaypoints.values()) {
        const [waypoint, roleId] = legWaypoint;
        this.props.waypointRenderer.deregister(waypoint, roleId, MapSystemWaypointRoles.FlightPlan);
      }

      this.legWaypoints.clear();
      this.waypointsUpdating = false;

      return;
    }

    const activeLeg = flightPlan.tryGetLeg(activeLegIndex);
    const legsToDisplay = new Map<LegDefinition, number>();

    let legIndex = 0;
    for (const leg of flightPlan.legs()) {
      let roleId = this.defaultRoleId;
      const handler = this.props.flightPathRenderer.legWaypointHandlers.get(this.props.planIndex);
      if (handler !== undefined) {
        roleId = handler(flightPlan, leg, activeLeg, legIndex, activeLegIndex);
      }

      if (roleId !== 0) {
        legsToDisplay.set(leg, roleId);
      }

      legIndex++;
    }

    // Remove records of legs that are no longer in the set of legs to display.
    for (const leg of this.legWaypoints) {
      const [legDefinition, legWaypoint] = leg;
      const [waypoint, roleId] = legWaypoint;

      if (!legsToDisplay.has(legDefinition)) {
        this.props.waypointRenderer.deregister(waypoint, roleId, MapSystemWaypointRoles.FlightPlan);
        this.legWaypoints.delete(legDefinition);
      }
    }

    const waypointRefreshes: Promise<void>[] = [];

    // Create or refresh waypoints to display
    for (const leg of legsToDisplay) {
      waypointRefreshes.push(this.buildPlanWaypoint(leg[0], leg[1]));
    }

    await Promise.all(waypointRefreshes);
    this.waypointsUpdating = false;
  }

  /**
   * Builds or refreshes a flight plan waypoint.
   * @param leg The leg to build the waypoint for.
   * @param roleId The role ID to assign to the waypoint.
   */
  protected async buildPlanWaypoint(leg: LegDefinition, roleId: number): Promise<void> {
    switch (leg.leg.type) {
      case LegType.CD:
      case LegType.VD:
      case LegType.CR:
      case LegType.VR:
      case LegType.FC:
      case LegType.FD:
      case LegType.FA:
      case LegType.CA:
      case LegType.VA:
      case LegType.FM:
      case LegType.VM:
      case LegType.CI:
      case LegType.VI:
        await this.buildTerminatorWaypoint(leg, roleId);
        break;
      case LegType.Discontinuity:
      case LegType.ThruDiscontinuity:
        break;
      default:
        await this.buildFixWaypoint(leg, roleId);
        break;
    }
  }

  /**
   * Builds a flight path terminator based waypoint.
   * @param leg The leg to build the waypoint for.
   * @param roleId The role ID to assign to the waypoint.
   */
  protected async buildTerminatorWaypoint(leg: LegDefinition, roleId: number): Promise<void> {
    const currentLeg = this.legWaypoints.get(leg);
    if (currentLeg !== undefined) {
      const [waypoint, currentRoleId] = currentLeg;

      const lastVector = leg.calculated?.flightPath[leg.calculated?.flightPath.length - 1];
      if (lastVector !== undefined) {
        if (!waypoint.location.get().equals(lastVector.endLat, lastVector.endLon)) {
          this.props.waypointRenderer.deregister(waypoint, currentRoleId, MapSystemWaypointRoles.FlightPlan);
          const newWaypoint = new FlightPathWaypoint(lastVector.endLat, lastVector.endLon, leg.name ?? '');

          this.legWaypoints.set(leg, [newWaypoint, roleId]);
          this.props.waypointRenderer.register(newWaypoint, roleId, MapSystemWaypointRoles.FlightPlan);
        } else if (currentRoleId !== roleId) {
          this.props.waypointRenderer.deregister(waypoint, currentRoleId, MapSystemWaypointRoles.FlightPlan);
          this.props.waypointRenderer.register(waypoint, roleId, MapSystemWaypointRoles.FlightPlan);

          this.legWaypoints.set(leg, [waypoint, roleId]);
        }
      } else {
        this.props.waypointRenderer.deregister(waypoint, currentRoleId, MapSystemWaypointRoles.FlightPlan);
      }
    } else {
      const lastVector = leg.calculated?.flightPath[leg.calculated?.flightPath.length - 1];
      if (lastVector !== undefined) {
        const newWaypoint = new FlightPathWaypoint(lastVector.endLat, lastVector.endLon, leg.name ?? '');

        this.legWaypoints.set(leg, [newWaypoint, roleId]);
        this.props.waypointRenderer.register(newWaypoint, roleId, MapSystemWaypointRoles.FlightPlan);
      }
    }
  }

  /**
   * Builds a standard facility fix waypoint for flight plan waypoint display.
   * @param leg The leg to build the waypoint for.
   * @param roleId The role ID to assign to the waypoint.
   */
  protected async buildFixWaypoint(leg: LegDefinition, roleId: number): Promise<void> {
    const legWaypoint = this.legWaypoints.get(leg);
    if (legWaypoint === undefined) {
      const facIcao = leg.leg.fixIcao;
      let facility: Facility | undefined;
      try {
        facility = await this.facLoader.getFacility(ICAO.getFacilityType(facIcao), facIcao);
      } catch (err) {
        /* continue */
      }

      if (facility !== undefined) {
        const waypoint = this.facWaypointCache.get(facility);
        this.props.waypointRenderer.register(waypoint, roleId, MapSystemWaypointRoles.FlightPlan);
        this.legWaypoints.set(leg, [waypoint, roleId]);
      }
    } else {
      const [waypoint, currentRoleId] = legWaypoint;
      if (currentRoleId !== roleId) {
        this.props.waypointRenderer.deregister(waypoint, currentRoleId, MapSystemWaypointRoles.FlightPlan);
        this.props.waypointRenderer.register(waypoint, roleId, MapSystemWaypointRoles.FlightPlan);

        this.legWaypoints.set(leg, [waypoint, roleId]);
      }
    }
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <>
        <MapCachedCanvasLayer ref={this.flightPathLayerRef} model={this.props.model} mapProjection={this.props.mapProjection}
          useBuffer={true} overdrawFactor={Math.SQRT2} />
        <MapSyncedCanvasLayer ref={this.waypointLayerRef} model={this.props.model} mapProjection={this.props.mapProjection} />
      </>
    );
  }
}
