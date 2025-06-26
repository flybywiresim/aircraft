import {
  AirportSubsectionCode,
  Approach,
  ApproachType,
  Arrival,
  Departure,
  Fix,
  isMsfs2024,
  LegType,
  NavaidSubsectionCode,
  NXDataStore,
  RunwayUtils,
  SectionCode,
} from '@flybywiresim/fbw-sdk';
import { EventBus, MappedSubject, Subject, Wait } from '@microsoft/msfs-sdk';
import {
  JS_ApproachIdentifier,
  JS_EnrouteLeg,
  JS_FlightPlanRoute,
  JS_ICAO,
  JS_RunwayIdentifier,
} from '../../../../../../fbw-common/src/systems/navdata/client/backends/Msfs/FsTypes';
import { FlightPlanRpcClient } from '@fmgc/flightplanning/rpc/FlightPlanRpcClient';
import { A320FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { NavigationDatabaseService } from '@fmgc/flightplanning/NavigationDatabaseService';
import { DataManager, PilotWaypointType } from '@fmgc/flightplanning/DataManager';

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

  private readonly dataManager: DataManager;

  private readonly listenerReady = Subject.create(false);

  private readonly fmsRpcClientReady = Subject.create(false);

  private readonly isReady = MappedSubject.create(([a, b]) => a && b, this.listenerReady, this.fmsRpcClientReady);

  constructor(private readonly bus: EventBus) {
    if (!isMsfs2024()) {
      throw new Error('[MsfsFlightPlanSync] Cannot be instantiated in MSFS 2020');
    }

    console.log('[MsfsFlightPlanSync] Created');

    this.listener = RegisterViewListener('JS_LISTENER_PLANNEDROUTE', () => {
      console.log('[MsfsFlightPlanSync] Listener initialized');

      this.listenerReady.set(true);
    });

    this.rpcClient = new FlightPlanRpcClient(bus, new A320FlightPlanPerformanceData());
    this.rpcClient.onAvailable.on(() => this.fmsRpcClientReady.set(true));

    this.dataManager = new DataManager(this.bus, this.rpcClient);

    Wait.awaitSubscribable(this.isReady).then(() => {
      console.log('[MsfsFlightPlanSync] Ready');

      const autoLoadRoute = NXDataStore.get('CONFIG_AUTO_SIM_ROUTE_LOAD', 'DISABLED') === 'ENABLED';

      if (autoLoadRoute) {
        console.log('[MsfsFlightPlanSync] Configured to automatically load MSFS route - loading...');

        this.handleSimRouteSent();
      } else {
        console.log('[MsfsFlightPlanSync] Configured to not automatically load MSFS route');
      }

      this.listener.on('AvionicsRouteSync', this.handleSimRouteSent);
      this.listener.on('AvionicsRouteRequested', this.handleAvionicsRouteRequested);
    });
  }

  private handleSimRouteSent = async (route?: JS_FlightPlanRoute): Promise<void> => {
    route ??= await this.getSimRoute();

    if (route.departureAirport.ident === '' || route.destinationAirport.ident === '') {
      return;
    }

    const db = NavigationDatabaseService.activeDatabase;

    await this.rpcClient.newCityPair(
      route.departureAirport.ident,
      route.destinationAirport.ident,
      null,
      FlightPlanIndex.Uplink,
    );

    if (route.departureRunway.number !== '') {
      await this.rpcClient.setOriginRunway(
        RunwayUtils.runwayIdent(
          route.departureAirport.ident,
          route.departureRunway.number,
          route.departureRunway.designator,
        ),
        FlightPlanIndex.Uplink,
      );
    }

    if (route.destinationRunway.number !== '') {
      await this.rpcClient.setDestinationRunway(
        RunwayUtils.runwayIdent(
          route.destinationAirport.ident,
          route.destinationRunway.number,
          route.destinationRunway.designator,
        ),
        FlightPlanIndex.Uplink,
      );
    }

    let departure: Departure | null;
    if (route.departure !== '') {
      const departures = await db.backendDatabase.getDepartures(route.departureAirport.ident);
      departure = departures.find((it) => it.ident === route.departure);

      if (departure) {
        await this.rpcClient.setDepartureProcedure(departure.databaseId, FlightPlanIndex.Uplink);
      }
    }

    if (route.departureTransition !== '' && departure) {
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
        // TODO support
        continue;
      }

      let fix: Fix;

      if (leg.hasLatLon) {
        fix = this.dataManager.createLatLonWaypoint(
          { lat: leg.lat, long: leg.lon },
          true,
          leg.name.substring(0, 7),
        ).waypoint;
      } else if (leg.hasPointBearingDistance) {
        const fixes = await NavigationDatabaseService.activeDatabase.searchAllFix(leg.referenceIcao.ident);
        const originFix = fixes.find((it) => it.icaoCode === leg.referenceIcao.region);

        if (!originFix) {
          console.error(
            `[MsfsFlightPlanSync](loadSimRoute) Cannot find matching origin fix for '${leg.referenceIcao.ident}'`,
          );
          continue;
        }

        fix = this.dataManager.createPlaceBearingDistWaypoint(
          originFix,
          leg.bearing,
          leg.distance,
          true,
          leg.name.substring(0, 7),
        ).waypoint;
      } else {
        const fixes = await NavigationDatabaseService.activeDatabase.searchAllFix(leg.fixIcao.ident);
        fix = fixes.find((it) => it.icaoCode === leg.fixIcao.region);

        if (!fix) {
          console.error(`[MsfsFlightPlanSync](loadSimRoute) Cannot find matching fix for '${leg.fixIcao.ident}'`);
          continue;
        }
      }

      if (leg.via !== '') {
        await this.rpcClient.startAirwayEntry(insertHead, FlightPlanIndex.Uplink);

        const airway = await NavigationDatabaseService.activeDatabase.searchAirway(leg.via, fix);

        await this.rpcClient.continueAirwayEntryViaAirway(airway[0], FlightPlanIndex.Uplink);
        await this.rpcClient.continueAirwayEntryDirectToFix(fix, FlightPlanIndex.Uplink);

        await this.rpcClient.finaliseAirwayEntry(FlightPlanIndex.Uplink);
      } else {
        await this.rpcClient.nextWaypoint(insertHead++, fix, FlightPlanIndex.Uplink, false);
      }
    }

    let approach: Approach | null = null;
    if (route.approach.type !== '') {
      const approaches = await db.backendDatabase.getApproaches(route.destinationAirport.ident);
      approach = approaches.find((it) =>
        MsfsFlightPlanSync.fbwApproachMatchesMsfsSdkApproach(route.destinationAirport.ident, it, route.approach),
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
    if (route.arrival !== '') {
      const arrivals = await db.backendDatabase.getArrivals(route.destinationAirport.ident);
      arrival = arrivals.find((it) => it.ident === route.arrival);

      await this.rpcClient.setArrival(arrival.databaseId, FlightPlanIndex.Uplink);
    }

    if (route.arrivalTransition !== '' && arrival) {
      const transition = arrival.enrouteTransitions.find((it) => it.ident === route.arrivalTransition);

      if (transition) {
        await this.rpcClient.setArrivalEnrouteTransition(transition.databaseId, FlightPlanIndex.Uplink);
      }
    }

    await this.rpcClient.uplinkInsert();
  };

  private handleAvionicsRouteRequested = async (_requestID: number): Promise<void> => {
    const activePlan = this.rpcClient.active;

    if (!activePlan.originAirport || !activePlan.destinationAirport) {
      return;
    }

    const departureAirport: JS_ICAO = {
      __Type: 'JS_ICAO',
      type: 'A',
      region: activePlan.originAirport.icaoCode,
      airport: '',
      ident: activePlan.originAirport.ident,
    };
    const destinationAirport: JS_ICAO = {
      __Type: 'JS_ICAO',
      type: 'A',
      region: activePlan.destinationAirport.icaoCode,
      airport: '',
      ident: activePlan.destinationAirport.ident,
    };

    const departureRunway: JS_RunwayIdentifier = {
      __Type: 'JS_RunwayIdentifier',
      number: '',
      designator: '',
    };

    if (activePlan.originRunway) {
      MsfsFlightPlanSync.assignFbwRunwayIdentToMsfsRunwayIdent(departureRunway, activePlan.originRunway.ident);
    }

    const destinationRunway: JS_RunwayIdentifier = {
      __Type: 'JS_RunwayIdentifier',
      number: '',
      designator: '',
    };

    if (activePlan.destinationRunway) {
      MsfsFlightPlanSync.assignFbwRunwayIdentToMsfsRunwayIdent(destinationRunway, activePlan.destinationRunway.ident);
    }

    const enroute: JS_EnrouteLeg[] = [];

    for (const element of activePlan.enrouteSegment.allLegs) {
      if (element.isDiscontinuity === true) {
        continue;
      }

      if (element.definition.type !== LegType.TF && element.definition.type !== LegType.IF) {
        continue;
      }

      const enrouteLeg: JS_EnrouteLeg = {
        __Type: 'JS_EnrouteLeg',
        isPpos: false,
        fixIcao: {
          __Type: 'JS_ICAO',
          type: '',
          region: '',
          airport: '',
          ident: '',
        },
        hasLatLon: false,
        lat: 0,
        lon: 0,
        hasPointBearingDistance: false,
        referenceIcao: {
          __Type: 'JS_ICAO',
          type: '',
          region: '',
          airport: '',
          ident: '',
        },
        bearing: 0,
        distance: 0,
        altitude: null,
        name: '',
        via: '',
      };

      // Encode a pilot waypoint correctly
      const matchingPilotWaypoint = this.dataManager
        .getStoredWaypointsByIdent(element.definition.waypoint.ident)
        .find((it) => it.waypoint.databaseId === element.definition.waypoint.databaseId);

      if (matchingPilotWaypoint) {
        switch (matchingPilotWaypoint.type) {
          case PilotWaypointType.Pbd:
            enrouteLeg.hasPointBearingDistance = true;
            MsfsFlightPlanSync.assignFbwFixToMsfsIcao(enrouteLeg.referenceIcao, matchingPilotWaypoint.pbdPlace);
            enrouteLeg.bearing = matchingPilotWaypoint.pbdBearing;
            enrouteLeg.distance = matchingPilotWaypoint.pbdDistance;
            break;
          case PilotWaypointType.LatLon:
          default:
            enrouteLeg.hasLatLon = true;
            enrouteLeg.lat = matchingPilotWaypoint.waypoint.location.lat;
            enrouteLeg.lon = matchingPilotWaypoint.waypoint.location.long;
            break;
        }
        enrouteLeg.name = matchingPilotWaypoint.waypoint.ident;
      } else {
        MsfsFlightPlanSync.assignFbwFixToMsfsIcao(enrouteLeg.fixIcao, element.definition.waypoint);
      }

      enroute.push(enrouteLeg);
    }

    const approach: JS_ApproachIdentifier = {
      __Type: 'JS_ApproachIdentifier',
      type: '',
      runway: {
        __Type: 'JS_RunwayIdentifier',
        number: '',
        designator: '',
      },
      suffix: '',
    };

    if (activePlan.approach) {
      approach.type = MsfsFlightPlanSync.FBW_APPROACH_TO_MSFS_APPROACH[activePlan.approach.type];
      if (activePlan.approach.runwayIdent !== undefined) {
        MsfsFlightPlanSync.assignFbwRunwayIdentToMsfsRunwayIdent(approach.runway, activePlan.approach.runwayIdent);
      }
      approach.suffix = activePlan.approach.multipleIndicator;
    }

    const route: JS_FlightPlanRoute = {
      __Type: 'JS_FlightPlanRoute',
      departureAirport,
      destinationAirport,
      departureRunway,
      destinationRunway,
      departure: activePlan.originDeparture?.ident ?? '',
      departureTransition: activePlan.departureEnrouteTransition?.ident ?? '',
      departureVfrPattern: {
        __Type: 'JS_VfrPatternProcedure',
        type: '',
        altitude: 0,
        distance: 0,
        isLeftTraffic: false,
      },
      arrival: activePlan.arrival?.ident ?? '',
      arrivalTransition: activePlan.arrivalEnrouteTransition?.ident ?? '',
      approach,
      approachTransition: activePlan.approachVia?.ident ?? '',
      approachVfrPattern: {
        __Type: 'JS_VfrPatternProcedure',
        type: '',
        altitude: 0,
        distance: 0,
        isLeftTraffic: false,
      },
      enroute,
      isVfr: false,
      cruiseAltitude: {
        __Type: 'JS_FlightAltitude',
        // Altitude in the route is always in feet, even if indicated as a FL. It is divided by 100 by the sim.
        altitude:
          activePlan.performanceData.cruiseFlightLevel !== null
            ? activePlan.performanceData.cruiseFlightLevel * 100
            : 0,
        isFlightLevel: true,
      },
    };

    this.listener.call('REPLY_TO_AVIONICS_ROUTE_REQUEST', route, _requestID);
  };

  private static assignFbwFixToMsfsIcao(msfsIcao: JS_ICAO, fbwFix: Fix): void {
    msfsIcao.region = fbwFix.icaoCode;

    switch (fbwFix.sectionCode) {
      case SectionCode.Navaid: {
        msfsIcao.type = fbwFix.subSectionCode === NavaidSubsectionCode.VhfNavaid ? 'V' : 'N';
        msfsIcao.ident = fbwFix.ident;
        break;
      }
      case SectionCode.Enroute: {
        msfsIcao.type = 'W';
        msfsIcao.ident = fbwFix.ident;
        break;
      }
      case SectionCode.Airport: {
        switch (fbwFix.subSectionCode) {
          case AirportSubsectionCode.TerminalWaypoints:
            msfsIcao.type = 'W';
            msfsIcao.airport = fbwFix.airportIdent;
            msfsIcao.ident = fbwFix.ident;
            break;
          case AirportSubsectionCode.Runways:
            msfsIcao.type = 'R';
            msfsIcao.airport = fbwFix.airportIdent;
            msfsIcao.ident = `RW${fbwFix.ident.slice(4)}`;
            break;
          case AirportSubsectionCode.ReferencePoints:
            msfsIcao.type = 'A';
            msfsIcao.ident = fbwFix.ident;
            break;
          case AirportSubsectionCode.TerminalNdb:
            msfsIcao.type = 'N';
            msfsIcao.airport = fbwFix.airportIdent;
            msfsIcao.ident = fbwFix.ident;
            break;
        }
      }
    }
  }

  private static assignFbwRunwayIdentToMsfsRunwayIdent(
    msfsRunwayIdent: JS_RunwayIdentifier,
    fbwRunwayIdent: string,
  ): void {
    // Runway ident is prefixed with airport ident
    msfsRunwayIdent.number = fbwRunwayIdent.substring(4, 6);
    msfsRunwayIdent.designator = fbwRunwayIdent.substring(6);
  }

  private static fbwApproachMatchesMsfsSdkApproach(
    airportIdent: string,
    fbwApproach: Approach,
    msfsSdkApproach: JS_ApproachIdentifier,
  ): boolean {
    const typeMatches = MsfsFlightPlanSync.FBW_APPROACH_TO_MSFS_APPROACH[fbwApproach.type] === msfsSdkApproach.type;

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
      (fbwApproach.multipleIndicator === undefined && msfsSdkApproach.suffix === '') ||
      fbwApproach.multipleIndicator === msfsSdkApproach.suffix
    );
  }

  public async getSimRoute(): Promise<JS_FlightPlanRoute> {
    const route: JS_FlightPlanRoute = await Coherent.call('GET_EFB_ROUTE');

    return route;
  }
}
