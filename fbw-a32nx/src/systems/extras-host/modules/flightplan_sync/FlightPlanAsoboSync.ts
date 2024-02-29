// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable no-await-in-loop */

import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { Discontinuity, SerializedFlightPlanLeg } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { FlightPlanRpcClient } from '@fmgc/flightplanning/new/rpc/FlightPlanRpcClient';

import { FlightPlanEvents, PerformanceDataFlightPlanSyncEvents, SyncFlightPlanEvents } from '@fmgc/flightplanning/new/sync/FlightPlanEvents';
import { A320FlightPlanPerformanceData, FlightPlanIndex, NavigationDatabase, NavigationDatabaseBackend, NavigationDatabaseService } from '@fmgc/index';
import { EventBus, FacilityType, FacilityLoader, FacilityRepository, Wait, ICAO } from '@microsoft/msfs-sdk';
import { MsfsMapping } from '../../../../../../fbw-common/src/systems/navdata/client/backends/Msfs/Mapping';
import { FacilityCache } from '../../../../../../fbw-common/src/systems/navdata/client/backends/Msfs/FacilityCache';

export class FlightPlanAsoboSync {
    private isReady = false;

    private lastFlightPlanVersion = undefined;

    private facilityLoaderCustom: FacilityLoader;

    private cruiseFlightLevel = undefined;

    private originAirport = undefined;

    private destinationAirport = undefined;

    private procedureDetails = undefined;

    private enrouteLegs: (SerializedFlightPlanLeg | Discontinuity)[] = undefined;

    private rpcClient: FlightPlanRpcClient<A320FlightPlanPerformanceData>;

    private mapping: MsfsMapping;

    constructor(private readonly bus: EventBus) {
        this.rpcClient = new FlightPlanRpcClient<A320FlightPlanPerformanceData>(this.bus);
        NavigationDatabaseService.activeDatabase = new NavigationDatabase(NavigationDatabaseBackend.Msfs);

        // FIXME either find a way to get mapping without cache or map it manually
        this.mapping = new MsfsMapping(null);
    }

    static extractRunwayNumber(ident: string) {
        return ident.substring(2, 4).startsWith('0') ? ident.substring(3, 4) : ident.substring(2, 4);
    }

    connectedCallback(): void {
        const sub = this.bus.getSubscriber<FlightPlanEvents & SyncFlightPlanEvents & PerformanceDataFlightPlanSyncEvents<A320FlightPlanPerformanceData>>();

        this.facilityLoaderCustom = new FacilityLoader(FacilityRepository.getRepository(this.bus));

        RegisterViewListener('JS_LISTENER_FLIGHTPLAN', () => {
            this.isReady = true;
        });

        // initial sync
        if (NXDataStore.get('FP_SYNC', 'LOAD') === 'LOAD') {
            this.loadFlightPlanFromGame();
        }

        // initial sync
        if (NXDataStore.get('FP_SYNC', 'LOAD') === 'SAVE') {
            const pub = this.bus.getPublisher<FlightPlanEvents>();
            pub.pub('flightPlanManager.syncRequest', undefined, true);
        }

        sub.on('flightPlanManager.syncResponse').handle(async (event) => {
            console.log('SYNC RESPONSE', event);
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
        });

        sub.on('flightPlan.setPerformanceData.cruiseFlightLevel').handle(async (event) => {
            if (event.planIndex === FlightPlanIndex.Active) {
                this.cruiseFlightLevel = event.value;
                console.log('SET CRUISE FLIGHT LEVEL', this.cruiseFlightLevel);
                await Coherent.call('SET_CRUISE_ALTITUDE', this.cruiseFlightLevel * 100);
            }
        });
        sub.on('SYNC_flightPlan.setSegmentLegs').handle(async (event) => {
            console.log('SEGMENT LEGS', event);
            if ((event.planIndex === FlightPlanIndex.Active) && event.segmentIndex === 4) {
                this.enrouteLegs = event.legs;
                await this.syncFlightPlanToGame();
            }
        });

        sub.on('flightPlanManager.copy').handle(async (event) => {
            if (NXDataStore.get('FP_SYNC', 'LOAD') === 'SAVE' && event.targetPlanIndex === FlightPlanIndex.Active) {
                const pub = this.bus.getPublisher<FlightPlanEvents>();
                pub.pub('flightPlanManager.syncRequest', undefined, true);
            }
        });
        sub.on('flightPlanManager.create').handle(async (event) => {
            if (NXDataStore.get('FP_SYNC', 'LOAD') === 'SAVE' && event.planIndex === FlightPlanIndex.Active) {
                const pub = this.bus.getPublisher<FlightPlanEvents>();
                pub.pub('flightPlanManager.syncRequest', undefined, true);
            }
        });
    }

    private async loadFlightPlanFromGame(): Promise<void> {
        Coherent.call('LOAD_CURRENT_ATC_FLIGHTPLAN');

        // TODO this needs to wait until the remote client has been initialized with the empty flight plans from the main instance
        // currently the rpc client waits 5 seconds before it sends the sync request
        await Wait.awaitDelay(6000);

        const data = await Coherent.call('GET_FLIGHTPLAN') as any;
        console.log('LOADED FP', data);

        const isDirectTo = data.isDirectTo;

        if (!isDirectTo) {
            if (data.waypoints.length === 0) {
                return;
            }
            const destIndex = data.waypoints.length - 1;
            if (!ICAO.isFacility(data.waypoints[0].icao) || !ICAO.isFacility(data.waypoints[destIndex].icao)) {
                return;
            }
            console.log('NEW CITY PAIR', data.waypoints[0].ident, data.waypoints[destIndex].ident);
            await this.rpcClient.newCityPair(data.waypoints[0].ident, data.waypoints[destIndex].ident, null, FlightPlanIndex.Uplink);

            this.rpcClient.setPerformanceData('cruiseFlightLevel', 300, FlightPlanIndex.Uplink);

            // set route
            const enrouteStart = (data.departureWaypointsSize === -1) ? 1 : data.departureWaypointsSize;
            // Find out first approach waypoint, - 1 to skip destination
            const enrouteEnd = data.waypoints.length - ((data.arrivalWaypointsSize === -1) ? 0 : data.arrivalWaypointsSize) - 1;
            const enroute = data.waypoints.slice(enrouteStart, enrouteEnd);

            for (let i = 0; i < enroute.length; i++) {
                const wpt = enroute[i];
                if (wpt.icao.trim() !== '') {
                    // Without the 'await' the order of import is undefined and the flight plan waypoints
                    // are not in the correct order
                    // eslint-disable-next-line no-await-in-loop

                    console.log('adding wp loaded', i, wpt);
                    const wptMapped = this.mapping.mapFacilityToWaypoint(wpt);
                    console.log('adding wp mapped', i, wptMapped);

                    await this.rpcClient.nextWaypoint(i, wptMapped, FlightPlanIndex.Uplink);
                }
            }

            console.log('finishing upling');
            this.rpcClient.uplinkInsert();
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
                    console.log('ALL ENROUTE LEGS', allEnrouteLegs);

                    let globalIndex = 1;

                    for (let i = 0; i < allEnrouteLegs.length; i++) {
                        const leg = allEnrouteLegs[i];
                        console.log('LEG', leg);
                        if (!leg.isDiscontinuity) {
                            const fpLeg = leg as SerializedFlightPlanLeg;
                            if (fpLeg) {
                                console.log('DEFINITION', fpLeg.definition);
                                console.log('DBID', fpLeg.definition.waypoint.databaseId);
                                // eslint-disable-next-line no-await-in-loop
                                if (!fpLeg.definition.waypoint.databaseId.startsWith('A')) {
                                    console.log('ADDING WAYPOINT with index', fpLeg.definition.waypoint.databaseId, globalIndex);
                                    await Coherent.call('ADD_WAYPOINT', fpLeg.definition.waypoint.databaseId, globalIndex, false);
                                    globalIndex++;
                                }
                            }
                        }
                    }

                    const originFacility = await this.facilityLoaderCustom.getFacility(FacilityType.Airport, `A      ${this.originAirport.substring(0, 4)} `);
                    let originRw = 0;
                    let departureRw = 0;
                    for (const runway of originFacility.runways) {
                        for (const designation of runway.designation.split('-')) {
                            console.log('ORIGIN RUNWAY', this.procedureDetails.originRunway);
                            console.log(designation);
                            if (designation === FlightPlanAsoboSync.extractRunwayNumber(this.procedureDetails.originRunway)) {
                                console.log(`Runway parent ${originRw} is matching with actual index ${departureRw}. Is ${JSON.stringify(runway)}`);
                                await Coherent.call('SET_ORIGIN_RUNWAY_INDEX', originRw);
                                await Coherent.call('SET_DEPARTURE_RUNWAY_INDEX', departureRw);
                                const departureIndex = originFacility.departures
                                    .findIndex((departure) => departure.name === this.procedureDetails.departureIdent);
                                const departureTransitionIndex = originFacility.departures
                                    .findIndex((departure) => departure.enRouteTransitions
                                        .map((t) => t.name === this.procedureDetails.departureTransitionIdent));

                                console.log('DEPARTURE INDEX', departureIndex);
                                console.log('DEPARTURE TransitionIndex', departureIndex);

                                await Coherent.call('SET_DEPARTURE_PROC_INDEX', departureIndex);
                                await Coherent.call('SET_DEPARTURE_ENROUTE_TRANSITION_INDEX', departureTransitionIndex > -1 ? departureTransitionIndex : 0);
                                break;
                            }
                            departureRw++;
                        }
                        originRw++;
                    }

                    console.log(originFacility);

                    let destinationRunwayIndex = 0;

                    // console.log('DESTINATION SEGMENT', plan.segments);

                    if (this.destinationAirport) {
                        const destinationRunwayIdent = this.procedureDetails.destinationRunway;
                        console.log('IDENT', destinationRunwayIdent);

                        const arg = await this.facilityLoaderCustom.getFacility(FacilityType.Airport, `A      ${this.destinationAirport.substring(0, 4)} `);
                        console.log('ARRIVAL', arg);
                        for (const runway of arg.runways) {
                            for (const designation of runway.designation.split('-')) {
                                console.log(destinationRunwayIdent);
                                console.log(designation);
                                if (designation === FlightPlanAsoboSync.extractRunwayNumber(destinationRunwayIdent)) {
                                    console.log(`Runway is matching with actual index ${destinationRunwayIndex}. Is ${JSON.stringify(runway)}`);
                                    const arrivalIndex = arg.arrivals
                                        .findIndex((arrival) => arrival.name === this.procedureDetails.arrivalIdent);
                                    const arritvalTransitionIndex = arg.arrivals
                                        .findIndex((arrival) => arrival.enRouteTransitions.map((t) => t.name === this.procedureDetails.arrivalTransitionIdent));

                                    console.log('APPR IDENT', this.procedureDetails.approachIdent);
                                    console.log('available appr', arg.approaches);
                                    let approachName = this.procedureDetails.approachIdent;

                                    // FIXME how to map that properly
                                    if (approachName.startsWith('D')) {
                                        approachName = `VOR ${FlightPlanAsoboSync.extractRunwayNumber(approachName)} ${approachName.substring(approachName.length - 1)}`.trim();
                                        console.log('NEW APPR NAME', approachName);
                                    } else if (approachName.startsWith('I')) {
                                        approachName = `ILS ${FlightPlanAsoboSync.extractRunwayNumber(approachName)} ${approachName.substring(approachName.length - 1)}`.trim();
                                        console.log('NEW APPR NAME', approachName);
                                    } else if (approachName.startsWith('R')) {
                                        approachName = `RNAV ${FlightPlanAsoboSync.extractRunwayNumber(approachName)} ${approachName.substring(approachName.length - 1)}`.trim();
                                        console.log('NEW APPR NAME', approachName);
                                    }
                                    const apoprachIndex = arg.approaches
                                        .findIndex((approach) => approach.name === approachName);
                                    const approachEnrouteTransitionIndex = arg.approaches
                                        .findIndex((approach) => approach.transitions.map((t) => t.name === this.procedureDetails.approachTransitionIdent));

                                    console.log('DESTINATION RUNWAY INDEX', destinationRunwayIndex);
                                    console.log('ARRIVAL INDEX', arrivalIndex);
                                    console.log('ARRIVAL TransitionIndex', arritvalTransitionIndex);
                                    console.log('APPROACH INDEX', apoprachIndex);
                                    console.log('APPROACH TransitionIndex', approachEnrouteTransitionIndex);

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
            }
            await Coherent.call('RECOMPUTE_ACTIVE_WAYPOINT_INDEX', 0);
        } catch (e) {
            console.error(e);
        }
    }
}
