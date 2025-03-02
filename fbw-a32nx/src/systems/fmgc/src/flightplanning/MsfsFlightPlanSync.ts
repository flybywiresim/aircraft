import { Approach, ApproachType, Arrival, Departure, isMsfs2024 } from '@flybywiresim/fbw-sdk';
import { EventBus, MappedSubject, Subject, Wait } from '@microsoft/msfs-sdk';
import {
  JS_ApproachIdentifier,
  JS_FlightPlanRoute,
} from '../../../../../../fbw-common/src/systems/navdata/client/backends/Msfs/FsTypes';
import { FlightPlanRpcClient } from '@fmgc/flightplanning/rpc/FlightPlanRpcClient';
import { A320FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { NavigationDatabaseService } from '@fmgc/flightplanning/NavigationDatabaseService';

export class MsfsFlightPlanSync {
  private static readonly FBW_APPROACH_TO_MSFS_APPROACH: Record<ApproachType, string> = {
    [ApproachType.Unknown]: '',
    [ApproachType.LocBackcourse]: 'BLOC',
    [ApproachType.VorDme]: 'VDM',
    [ApproachType.Fms]: '',
    [ApproachType.Igs]: '',
    [ApproachType.Ils]: 'ILS',
    [ApproachType.Gls]: ' ',
    [ApproachType.Loc]: 'LOC',
    [ApproachType.Mls]: '',
    [ApproachType.Ndb]: 'NDB',
    [ApproachType.Gps]: 'GPS',
    [ApproachType.NdbDme]: 'NDBDME',
    [ApproachType.Rnav]: 'RNAV',
    [ApproachType.Vortac]: '',
    [ApproachType.Tacan]: '',
    [ApproachType.Sdf]: '',
    [ApproachType.Vor]: 'VOR',
    [ApproachType.MlsTypeA]: '',
    [ApproachType.Lda]: 'LDA',
    [ApproachType.MlsTypeBC]: '',
  };

  private readonly listener: ViewListener.ViewListener;

  private readonly rpcClient: FlightPlanRpcClient<A320FlightPlanPerformanceData>;

  private readonly listenerReady = Subject.create(false);

  private readonly fmsRpcClientReady = Subject.create(false);

  private readonly isReady = MappedSubject.create(([a, b]) => a && b, this.listenerReady, this.fmsRpcClientReady);

  constructor(private readonly bus: EventBus) {
    if (!isMsfs2024()) {
      throw new Error('[MsfsFlightPlanSync] Cannot be instantiated in MSFS 2020');
    }

    this.listener = RegisterViewListener('JS_LISTENER_PLANNEDROUTE', () => {
      this.listenerReady.set(true);
    });

    this.rpcClient = new FlightPlanRpcClient(bus, new A320FlightPlanPerformanceData());

    Wait.awaitCondition(() => this.rpcClient.hasActive, 2_000).then(() => {
      this.fmsRpcClientReady.set(true);
    });

    Wait.awaitSubscribable(this.isReady).then(() => {
      this.loadSimRoute();
    });
  }

  public async loadSimRoute(): Promise<void> {
    const route = await this.getSimRoute();

    const db = NavigationDatabaseService.activeDatabase;

    await this.rpcClient.newCityPair(
      route.departureAirport.ident,
      route.destinationAirport.ident,
      null,
      FlightPlanIndex.Uplink,
    );

    if (route.departureRunway.number != '') {
      await this.rpcClient.setOriginRunway(
        `${route.departureAirport.ident}${route.departureRunway.number}${route.departureRunway.designator}`,
        FlightPlanIndex.Uplink,
      );
    }

    if (route.destinationRunway.number != '') {
      await this.rpcClient.setDestinationRunway(
        `${route.destinationAirport.ident}${route.destinationRunway.number}${route.destinationRunway.designator}`,
        FlightPlanIndex.Uplink,
      );
    }

    let departure: Departure | null;
    if (route.departure != '') {
      const departures = await db.backendDatabase.getDepartures(route.departureAirport.ident);
      departure = departures.find((it) => it.ident == route.departure);

      if (departure) {
        await this.rpcClient.setDepartureProcedure(departure.databaseId, FlightPlanIndex.Uplink);
      }
    }

    if (route.departureTransition != '' && departure) {
      const transition = departure.enrouteTransitions.find((it) => it.ident === route.departureTransition);

      if (transition) {
        await this.rpcClient.setDepartureEnrouteTransition(transition.databaseId, FlightPlanIndex.Uplink);
      }
    }

    let insertHead = 0;

    insertHead += this.rpcClient.uplink.originSegment.allLegs.length;
    insertHead += this.rpcClient.uplink.departureRunwayTransitionSegment.allLegs.length;
    insertHead += this.rpcClient.uplink.departureSegment.allLegs.length;
    insertHead += this.rpcClient.uplink.departureEnrouteTransitionSegment.allLegs.length;
    insertHead -= 1;

    for (const leg of route.enroute) {
      if (leg.isPpos) {
        continue;
      }

      if (leg.hasLatLon) {
        // TODO support
        continue;
      }

      if (leg.hasPointBearingDistance) {
        // TODO support
        continue;
      }

      const fixes = await NavigationDatabaseService.activeDatabase.searchAllFix(leg.fixIcao.ident);
      const matchingFix = fixes.find((it) => it.icaoCode === leg.fixIcao.region);

      if (!matchingFix) {
        console.error(`[MsfsFlightPlanSync](loadSimRoute) Cannot find matching fix for '${leg.fixIcao.ident}'`);
        continue;
      }

      await this.rpcClient.nextWaypoint(insertHead++, matchingFix, FlightPlanIndex.Uplink, false);
    }

    let approach: Approach | null = null;
    if (route.approach.type !== '') {
      const approaches = await db.backendDatabase.getApproaches(route.destinationAirport.ident);
      approach = approaches.find((it) =>
        this.fbwApproachMatchesMsfsSdkApproach(route.destinationAirport.ident, it, route.approach),
      );

      if (approach) {
        await this.rpcClient.setApproach(approach.databaseId, FlightPlanIndex.Uplink);
      }
    }

    if (route.approachTransition !== '' && approach) {
      const transition = approach.transitions.find((it) => it.ident === route.approachTransition);

      if (transition) {
        await this.rpcClient.setApproachVia(transition.databaseId, FlightPlanIndex.Uplink);
      }
    }

    let arrival: Arrival | null = null;
    if (route.arrival != '') {
      const arrivals = await db.backendDatabase.getArrivals(route.destinationAirport.ident);
      arrival = arrivals.find((it) => it.ident == route.arrival);

      await this.rpcClient.setArrival(arrival.databaseId, FlightPlanIndex.Uplink);
    }

    if (route.arrivalTransition != '' && arrival) {
      const transition = arrival.enrouteTransitions.find((it) => it.ident === route.arrivalTransition);

      if (transition) {
        await this.rpcClient.setArrivalEnrouteTransition(transition.databaseId, FlightPlanIndex.Uplink);
      }
    }

    await this.rpcClient.uplinkInsert();
  }

  private fbwApproachMatchesMsfsSdkApproach(
    airportIdent: string,
    fbwApproach: Approach,
    msfsSdkApproach: JS_ApproachIdentifier,
  ): boolean {
    const typeMatches = MsfsFlightPlanSync.FBW_APPROACH_TO_MSFS_APPROACH[fbwApproach.type] == msfsSdkApproach.type;

    if (!typeMatches) {
      return false;
    }

    const runwayMatches =
      (fbwApproach.runwayIdent === undefined && msfsSdkApproach.runway.number === '') ||
      fbwApproach.runwayIdent === `${airportIdent}${msfsSdkApproach.runway.number}${msfsSdkApproach.runway.designator}`;

    if (!runwayMatches) {
      return false;
    }

    return (
      (fbwApproach.suffix === undefined && msfsSdkApproach.suffix === '') ||
      fbwApproach.suffix === msfsSdkApproach.suffix
    );
  }

  public async getSimRoute(): Promise<JS_FlightPlanRoute> {
    const route: JS_FlightPlanRoute = await Coherent.call('GET_EFB_ROUTE');

    return route;
  }
}
