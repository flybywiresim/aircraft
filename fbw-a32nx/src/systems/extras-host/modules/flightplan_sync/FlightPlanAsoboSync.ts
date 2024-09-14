// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable no-await-in-loop */

import { NXDataStore, RunwayDesignatorChar, Waypoint, WaypointArea } from '@flybywiresim/fbw-sdk';
import { Discontinuity, SerializedFlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { FlightPlanRpcClient } from '@fmgc/flightplanning/rpc/FlightPlanRpcClient';

import {
  FlightPlanEvents,
  PerformanceDataFlightPlanSyncEvents,
  SyncFlightPlanEvents,
} from '@fmgc/flightplanning/sync/FlightPlanEvents';
import {
  A320FlightPlanPerformanceData,
  FlightPlanIndex,
  NavigationDatabase,
  NavigationDatabaseBackend,
  NavigationDatabaseService,
} from '@fmgc/index';
import {
  EventBus,
  FacilityType,
  FacilityLoader,
  FacilityRepository,
  Wait,
  ICAO,
  ApproachProcedure,
  AirportRunway,
  Subscription,
} from '@microsoft/msfs-sdk';
import { ApproachType as MSApproachType } from '../../../../../../fbw-common/src/systems/navdata/client/backends/Msfs/FsTypes';
import { FacilityCache } from '../../../../../../fbw-common/src/systems/navdata/client/backends/Msfs/FacilityCache';

export class FlightPlanAsoboSync {
  private isReady = false;

  private facilityLoaderCustom: FacilityLoader;

  private cruiseFlightLevel = undefined;

  private originAirport = undefined;

  private destinationAirport = undefined;

  private procedureDetails = undefined;

  private enrouteLegs: (SerializedFlightPlanLeg | Discontinuity)[] = undefined;

  private subs: Subscription[] = [];

  constructor(private readonly bus: EventBus) {}

  static extractRunwayNumber(ident: string) {
    return ident.substring(4, 6).startsWith('0') ? ident.substring(5, 6) : ident.substring(4, 6);
  }

  connectedCallback(): void {
    this.facilityLoaderCustom = new FacilityLoader(FacilityRepository.getRepository(this.bus));

    RegisterViewListener('JS_LISTENER_FLIGHTPLAN', () => {
      this.isReady = true;
    });
  }

  init(): void {
    NavigationDatabaseService.activeDatabase = new NavigationDatabase(NavigationDatabaseBackend.Msfs);

    const sub = this.bus.getSubscriber<
      FlightPlanEvents & SyncFlightPlanEvents & PerformanceDataFlightPlanSyncEvents<A320FlightPlanPerformanceData>
    >();

    this.subs.push(
      sub.on('flightPlanManager.syncResponse').handle(async (event) => {
        if (NXDataStore.get('FP_SYNC', 'NONE') === 'SAVE') {
          const plan = event.plans[FlightPlanIndex.Active];
          this.enrouteLegs = plan.segments.enrouteSegment.allLegs;
          this.originAirport = plan.originAirport;
          this.destinationAirport = plan.destinationAirport;
          this.cruiseFlightLevel = plan.performanceData.cruiseFlightLevel;

          // TODO not really needed anymore
          this.procedureDetails = {
            originRunway: plan.originRunway,
            departureIdent: plan.segments.departureSegment?.procedureIdent,
            departureTransitionIdent: plan.segments.departureRunwayTransitionSegment?.procedureIdent,

            arrivalIdent: plan.segments.arrivalSegment?.procedureIdent,
            arrivalTransitionIdent: plan.segments.arrivalEnrouteTransitionSegment?.procedureIdent,
            arrivalRunwayTransitionIdent: plan.segments?.arrivalRunwayTransitionSegment.procedureIdent,
            destinationRunway: plan.destinationRunway,
            approachIdent: plan.segments.approachSegment?.procedureIdent,
            approachTransitionIdent: plan.segments.approachViaSegment?.procedureIdent,
          };

          await this.syncFlightPlanToGame();
        }
      }),
    );

    this.subs.push(
      sub.on('flightPlan.setPerformanceData.cruiseFlightLevel').handle(async (event) => {
        if (event.planIndex === FlightPlanIndex.Active) {
          this.cruiseFlightLevel = event.value;
          if (this.cruiseFlightLevel) {
            await Coherent.call('SET_CRUISE_ALTITUDE', this.cruiseFlightLevel * 100);
          }
        }
      }),
    );
    this.subs.push(
      sub.on('SYNC_flightPlan.setSegmentLegs').handle(async (event) => {
        console.log('SEGMENT LEGS', event);
        if (event.planIndex === FlightPlanIndex.Active && event.segmentIndex === 4) {
          this.enrouteLegs = event.legs;
          await this.syncFlightPlanToGame();
        }
      }),
    );

    this.subs.push(
      sub.on('flightPlanManager.copy').handle(async (event) => {
        if (NXDataStore.get('FP_SYNC', 'LOAD') === 'SAVE' && event.targetPlanIndex === FlightPlanIndex.Active) {
          const pub = this.bus.getPublisher<FlightPlanEvents>();
          pub.pub('flightPlanManager.syncRequest', undefined, true);
        }
      }),
    );
    this.subs.push(
      sub.on('flightPlanManager.create').handle(async (event) => {
        if (NXDataStore.get('FP_SYNC', 'LOAD') === 'SAVE' && event.planIndex === FlightPlanIndex.Active) {
          const pub = this.bus.getPublisher<FlightPlanEvents>();
          pub.pub('flightPlanManager.syncRequest', undefined, true);
        }
      }),
    );
    NXDataStore.getAndSubscribe(
      'FP_SYNC',
      async (_, val) => {
        if (val !== 'NONE') {
          this.subs.forEach((sub) => sub.pause());
          await this.loadFlightPlanFromGame();
          await Wait.awaitDelay(3000);
          this.subs.forEach((sub) => sub.resume());
        } else {
          this.subs.forEach((sub) => sub.pause());
        }
      },
      'NONE',
    );
  }

  private async loadFlightPlanFromGame(): Promise<void> {
    await Wait.awaitDelay(3000);

    Coherent.call('LOAD_CURRENT_ATC_FLIGHTPLAN');
    const rpcClient = new FlightPlanRpcClient<A320FlightPlanPerformanceData>(
      this.bus,
      new A320FlightPlanPerformanceData(),
    );

    try {
      const pub = this.bus.getPublisher<FlightPlanEvents>();
      pub.pub('flightPlanManager.syncRequest', undefined, true);

      // TODO this needs to wait until the remote client has been initialized with the empty flight plans from the main instance
      // currently the rpc client waits 5 seconds before it sends the sync request
      while (!rpcClient.hasActive && !rpcClient.hasUplink) {
        await Wait.awaitDelay(2000);
      }

      const data = (await Coherent.call('GET_FLIGHTPLAN')) as any;

      const isDirectTo = data.isDirectTo;

      if (!isDirectTo) {
        if (data.waypoints.length === 0) {
          return;
        }
        const destIndex = data.waypoints.length - 1;
        if (!ICAO.isFacility(data.waypoints[0].icao) || !ICAO.isFacility(data.waypoints[destIndex].icao)) {
          return;
        }
        await rpcClient.newCityPair(
          data.waypoints[0].ident,
          data.waypoints[destIndex].ident,
          null,
          FlightPlanIndex.Uplink,
        );

        await rpcClient.setPerformanceData('cruiseFlightLevel', data.cruisingAltitude / 100, FlightPlanIndex.Uplink);

        // set route
        const enrouteStart = data.departureWaypointsSize === -1 ? 1 : data.departureWaypointsSize;
        // Find out first approach waypoint, - 1 to skip destination
        const enrouteEnd =
          data.waypoints.length - (data.arrivalWaypointsSize === -1 ? 0 : data.arrivalWaypointsSize) - 1;
        const enroute = data.waypoints.slice(enrouteStart, enrouteEnd);

        for (let i = 1; i <= enroute.length; i++) {
          const wpt = enroute[i - 1];
          if (wpt.icao.trim() !== '') {
            const wptMapped = this.mapFacilityToWaypoint(wpt);
            // eslint-disable-next-line no-await-in-loop
            await rpcClient.nextWaypoint(i, wptMapped, FlightPlanIndex.Uplink);
          }
        }

        await rpcClient.uplinkInsert();
      }
    } catch (e) {
      console.error('Error in loading FlightPlan from MSFS', e);
    } finally {
      rpcClient.destroy();
    }
  }

  private async syncFlightPlanToGame(): Promise<void> {
    // TODO make better
    if (NXDataStore.get('FP_SYNC', 'LOAD') !== 'SAVE') {
      return;
    }
    try {
      if (this.isReady) {
        await Coherent.call('SET_CURRENT_FLIGHTPLAN_INDEX', 0, true);
        await Coherent.call('CLEAR_CURRENT_FLIGHT_PLAN');

        if (this.originAirport && this.destinationAirport) {
          await Coherent.call('SET_ORIGIN', `A      ${this.originAirport} `, false);
          await Coherent.call('SET_DESTINATION', `A      ${this.destinationAirport} `, false);

          const allEnrouteLegs = this.enrouteLegs;

          let globalIndex = 1;

          for (let i = 0; i < allEnrouteLegs.length; i++) {
            const leg = allEnrouteLegs[i];
            if (!leg.isDiscontinuity) {
              const fpLeg = leg as SerializedFlightPlanLeg;
              if (fpLeg) {
                // eslint-disable-next-line no-await-in-loop
                if (!fpLeg.definition.waypoint.databaseId.startsWith('A')) {
                  await Coherent.call('ADD_WAYPOINT', fpLeg.definition.waypoint.databaseId, globalIndex, false);
                  globalIndex++;
                }
              }
            }
          }

          const originFacility = await this.facilityLoaderCustom.getFacility(
            FacilityType.Airport,
            `A      ${this.originAirport.substring(0, 4)} `,
          );
          let originRw = 0;
          let departureRw = 0;
          const originRwIdent = this.procedureDetails.originRunway;
          for (const runway of originFacility.runways) {
            let runwayPairIndex = 0;
            for (const designation of runway.designation.split('-')) {
              const designatorChar =
                runwayPairIndex === 0 ? runway.designatorCharPrimary : runway.designatorCharSecondary;
              runwayPairIndex++;
              console.log('ORIGIN RUNWAY', this.procedureDetails.originRunway);
              console.log(designation);
              if (
                designation === FlightPlanAsoboSync.extractRunwayNumber(originRwIdent) &&
                (designatorChar === RunwayDesignatorChar.None ||
                  designatorChar === this.mapRunwayDesignator(originRwIdent[originRwIdent.length - 1]))
              ) {
                console.log(`Runway parent ${originRw} is matching with actual index ${departureRw}. Is`, runway);
                await Coherent.call('SET_ORIGIN_RUNWAY_INDEX', originRw);
                await Coherent.call('SET_DEPARTURE_RUNWAY_INDEX', departureRw);
                const departureIndex = originFacility.departures.findIndex(
                  (departure) => departure.name === this.procedureDetails.departureIdent,
                );
                const departureTransitionIndex = originFacility.departures.findIndex((departure) =>
                  departure.enRouteTransitions.map((t) => t.name === this.procedureDetails.departureTransitionIdent),
                );

                await Coherent.call('SET_DEPARTURE_PROC_INDEX', departureIndex);
                await Coherent.call(
                  'SET_DEPARTURE_ENROUTE_TRANSITION_INDEX',
                  departureTransitionIndex > -1 ? departureTransitionIndex : 0,
                );
                break;
              }
              departureRw++;
            }
            originRw++;
          }

          let destinationRunwayIndex = 0;

          const destinationRunwayIdent = this.procedureDetails.destinationRunway;

          const airportFacility = await this.facilityLoaderCustom.getFacility(
            FacilityType.Airport,
            `A      ${this.destinationAirport.substring(0, 4)} `,
          );
          console.log('ARRIVAL', airportFacility);

          for (const runway of airportFacility.runways) {
            let runwayPairIndex = 0;
            for (const designation of runway.designation.split('-')) {
              const designatorChar =
                runwayPairIndex === 0 ? runway.designatorCharPrimary : runway.designatorCharSecondary;
              runwayPairIndex++;

              console.log(destinationRunwayIdent);
              console.log(designation);
              if (
                designation === FlightPlanAsoboSync.extractRunwayNumber(destinationRunwayIdent) &&
                (designatorChar === RunwayDesignatorChar.None ||
                  designatorChar ===
                    this.mapRunwayDesignator(destinationRunwayIdent[destinationRunwayIdent.length - 1]))
              ) {
                console.log(`Runway is matching with actual index ${destinationRunwayIndex}. Is`, runway);
                const arrivalIndex = airportFacility.arrivals.findIndex(
                  (arrival) => arrival.name === this.procedureDetails.arrivalIdent,
                );
                const arritvalTransitionIndex = airportFacility.arrivals.findIndex((arrival) =>
                  arrival.enRouteTransitions.map((t) => t.name === this.procedureDetails.arrivalTransitionIdent),
                );

                const approachType = this.mapToMsfsApproachType(this.procedureDetails.approachIdent[0]);
                const apoprachIndex = this.findApproachIndexByRunwayAndApproachType(
                  airportFacility.approaches,
                  runway,
                  runwayPairIndex === 0,
                  designation,
                  approachType,
                );

                const approachEnrouteTransitionIndex = airportFacility.approaches.findIndex((approach) =>
                  approach.transitions.map((t) => t.name === this.procedureDetails.approachTransitionIdent),
                );

                await Coherent.call('SET_ARRIVAL_RUNWAY_INDEX', destinationRunwayIndex);
                await Coherent.call('SET_ARRIVAL_PROC_INDEX', arrivalIndex);
                await Coherent.call('SET_ARRIVAL_ENROUTE_TRANSITION_INDEX', arritvalTransitionIndex);
                await Coherent.call('SET_APPROACH_INDEX', apoprachIndex);

                await Coherent.call('SET_APPROACH_TRANSITION_INDEX', approachEnrouteTransitionIndex);

                // nono
                break;
              }
              destinationRunwayIndex++;
            }
          }
        }
        await Coherent.call('SET_CRUISE_ALTITUDE', this.cruiseFlightLevel * 100);
      }

      await Coherent.call('RECOMPUTE_ACTIVE_WAYPOINT_INDEX', 0);
    } catch (e) {
      console.error(e);
    }
  }

  private findApproachIndexByRunwayAndApproachType(
    approaches: readonly ApproachProcedure[],
    runway: AirportRunway,
    isRunwayPrimary: boolean,
    designation: string,
    approachType: MSApproachType,
  ): number {
    return approaches.findIndex(
      (approach) =>
        approach.runwayNumber.toFixed(0) === designation &&
        // L/R etc...
        approach.runwayDesignator ===
          (isRunwayPrimary ? runway.designatorCharPrimary : runway.designatorCharSecondary) &&
        (approach.approachType as unknown as MSApproachType) === approachType &&
        (!approach.approachSuffix ||
          approach.approachSuffix ===
            this.procedureDetails.approachIdent[this.procedureDetails.approachIdent.length - 1]),
    );
  }

  // TODO this is a copy from Mapping.ts of MSFS backend but reversed
  private mapToMsfsApproachType(ident: string) {
    switch (ident) {
      case 'B':
        return MSApproachType.Backcourse;
      case 'D':
        return MSApproachType.Vor;
      case 'I':
        return MSApproachType.Ils;
      case 'L':
        return MSApproachType.Loc;
      case 'N':
        return MSApproachType.Ndb;
      case 'P':
        return MSApproachType.Gps;
      case 'Q':
        return MSApproachType.NdbDme;
      case 'R':
        return MSApproachType.Rnav;
      case 'U':
        return MSApproachType.Sdf;
      case 'V':
        return MSApproachType.Vor;
      case 'X':
        return MSApproachType.Lda;
      default:
        return MSApproachType.Ils;
    }
  }

  // TODO this is a copy from Mapping.ts of MSFS backend but reversed
  private mapRunwayDesignator(designatorChar: string): RunwayDesignatorChar {
    switch (designatorChar) {
      case 'A':
        return RunwayDesignatorChar.A;
      case 'B':
        return RunwayDesignatorChar.B;
      case 'C':
        return RunwayDesignatorChar.C;
      case 'L':
        return RunwayDesignatorChar.L;
      case 'R':
        return RunwayDesignatorChar.R;
      case 'W':
        return RunwayDesignatorChar.W;
      default:
        return RunwayDesignatorChar.None;
    }
  }

  // TODO JS_WAYPOINT missing in types
  // TODO copy from Mapping.ts of MSFS backend, as it would require another FacilityCache
  private mapFacilityToWaypoint(facility: any): Waypoint {
    return {
      databaseId: facility.icao,
      icaoCode: facility.icao.substring(1, 3),
      ident: FacilityCache.ident(facility.icao),
      name: Utils.Translate(facility.name),
      location: { lat: facility.lla.lat, long: facility.lla.long },
      area: facility.icao.substring(3, 7).trim().length > 0 ? WaypointArea.Terminal : WaypointArea.Enroute,
    } as Waypoint;
  }
}
