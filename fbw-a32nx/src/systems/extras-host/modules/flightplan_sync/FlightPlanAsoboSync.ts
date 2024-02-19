// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable no-await-in-loop */

import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { Discontinuity, SerializedFlightPlanLeg } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { FlightPlanSyncEvents, PerformanceDataFlightPlanSyncEvents } from '@fmgc/flightplanning/new/sync/FlightPlanSyncEvents';
import { A320FlightPlanPerformanceData, FlightPlanIndex } from '@fmgc/index';
import { EventBus, FacilityType, FacilityLoader, FacilityRepository } from '@microsoft/msfs-sdk';

export class FlightPlanAsoboSync {
    private isReady = false;

    private lastFlightPlanVersion = undefined;

    private facilityLoaderCustom: FacilityLoader;

    private cruiseFlightLevel = undefined;

    private originAirport = undefined;

    private destinationAirport = undefined;

    private procedureDetails: ProcedureDetails = undefined;

    private enrouteLegs: (SerializedFlightPlanLeg | Discontinuity)[] = undefined;

    constructor(private readonly bus: EventBus) {}

    connectedCallback(): void {
        const sub = this.bus.getSubscriber<FlightPlanSyncEvents & PerformanceDataFlightPlanSyncEvents<A320FlightPlanPerformanceData>>();

        this.facilityLoaderCustom = new FacilityLoader(FacilityRepository.getRepository(this.bus));

        RegisterViewListener('JS_LISTENER_FLIGHTPLAN', () => {
            this.isReady = true;
        });

        // initial sync
        if (NXDataStore.get('FP_SYNC', 'LOAD') === 'SAVE') {
            const pub = this.bus.getPublisher<FlightPlanSyncEvents>();
            pub.pub('flightPlanManager.syncRequest', undefined, true);
        }

        sub.on('flightPlanManager.syncResponse').handle(async (event) => {
            console.log('SYNC RESPONSE', event);
            const plan = event.plans[FlightPlanIndex.Active];
            this.enrouteLegs = plan.segments.enrouteSegment.allLegs;
            this.originAirport = plan.originAirport;
            this.destinationAirport = plan.destinationAirport;

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
            if (event.planIndex === FlightPlanIndex.Active || event.planIndex === FlightPlanIndex.Uplink) {
                this.cruiseFlightLevel = event.value;
                console.log('SET CRUISE FLIGHT LEVEL', this.cruiseFlightLevel);
                await Coherent.call('SET_CRUISE_ALTITUDE', this.cruiseFlightLevel * 100);
            }
        });
        sub.on('flightPlan.setSegmentLegs').handle(async (event) => {
            console.log('SEGMENT LEGS', event);
            if ((event.planIndex === FlightPlanIndex.Active) && event.segmentIndex === 4) {
                this.enrouteLegs = event.legs;
                await this.syncFlightPlanToGame();
            }
        });

        /* sub.on('flightPlanManager.swap').handle(async (event) => {
            if (event.targetPlanIndex === FlightPlanIndex.Active) {
                pub.
            } */
        /*

        sub.on('flightPlan.setProcedureDetails').handle(async (event) => {
            if ((event.planIndex === FlightPlanIndex.Temporary)) {
                this.procedureDetails = event.details;
                console.log('PROCEDURE DETAILS', this.procedureDetails);
                await this.syncFlightPlanToGame();
            }
        }); */

        /*      sub.on('flightPlan.setOriginAirport').handle(async (event) => {
            this.originAirport = event.originAirport;
            console.log('ORIGIN', event);
            await this.syncFlightPlanToGame();
        });

        sub.on('flightPlan.setDestinationAirport').handle(async (event) => {
            if (event.planIndex === FlightPlanIndex.Active) {
                this.destinationAirport = event.originAirport;
                console.log('DESTINATION', this.destinationAirport);
                await this.syncFlightPlanToGame();
            }
        }); */

        sub.on('flightPlanManager.copy').handle(async (event) => {
            if (NXDataStore.get('FP_SYNC', 'LOAD') === 'SAVE' && event.targetPlanIndex === FlightPlanIndex.Active) {
                const pub = this.bus.getPublisher<FlightPlanSyncEvents>();
                pub.pub('flightPlanManager.syncRequest', undefined, true);
            }
        });
        sub.on('flightPlanManager.create').handle(async (event) => {
            if (NXDataStore.get('FP_SYNC', 'LOAD') === 'SAVE' && event.planIndex === FlightPlanIndex.Active) {
                const pub = this.bus.getPublisher<FlightPlanSyncEvents>();
                pub.pub('flightPlanManager.syncRequest', undefined, true);
            }
        });
    }

    private async syncFlightPlanToGame(): Promise<void> {
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
                            if (designation
                                === (this.procedureDetails.originRunway.substring(2, 4).startsWith('0')
                                    ? this.procedureDetails.originRunway.substring(3, 4)
                                    : this.procedureDetails.originRunway.substring(2, 4))) {
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
                            } else {
                                await Coherent.call('SET_DEPARTURE_RUNWAY_INDEX', -1);
                                await Coherent.call('SET_DEPARTURE_PROC_INDEX', -1);
                                await Coherent.call('SET_DEPARTURE_ENROUTE_TRANSITION_INDEX', -1);
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
                                if (designation
                                     === (destinationRunwayIdent.substring(2, 4).startsWith('0')
                                         ? destinationRunwayIdent.substring(3, 4)
                                         : destinationRunwayIdent.substring(2, 4))) {
                                    console.log(`Runway is matching with actual index ${destinationRunwayIndex}. Is ${JSON.stringify(runway)}`);
                                    const arrivalIndex = arg.arrivals
                                        .findIndex((arrival) => arrival.name === this.procedureDetails.arrivalIdent);
                                    const arritvalTransitionIndex = arg.arrivals
                                        .findIndex((arrival) => arrival.enRouteTransitions.map((t) => t.name === this.procedureDetails.arrivalTransitionIdent));

                                    console.log('APPR IDENT', this.procedureDetails.approachIdent);
                                    console.log('available appr', arg.approaches);
                                    let approachName = this.procedureDetails.approachIdent;

                                    if (approachName.startsWith('D')) {
                                        approachName = `VOR ${destinationRunwayIdent.substring(2, 4).startsWith('0')
                                            ? destinationRunwayIdent.substring(3, 4)
                                            : destinationRunwayIdent.substring(2, 4)} ${approachName
                                            .charAt(approachName.length - 1)}`;
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
            console.log(e);
        }
    }
}
export class ProcedureDetails {
    /** The origin runway object, consisting of the index of the origin runway
     * in the origin runway information and the direction. */
    public originRunway: string | undefined = undefined;

    /** The ICAO for the facility associated with the departure procedure. */
    // public departureFacilityIcao: string | undefined = undefined;

    /** The index of the departure in the origin airport information. */
    public departureIdent: string | undefined = undefined;

    /** The index of the departure transition in the origin airport departure information. */
    public departureTransitionIdent: string | undefined = undefined;

    /** The index of the selected runway in the original airport departure information. */
    // public departureRunwayIdent: string | undefined = undefined;

    /** The ICAO for the facility associated with the arrival procedure. */
    //  public arrivalFacilityIcao: string | undefined = undefined;

    /** The index of the arrival in the destination airport information. */
    public arrivalIdent: string | undefined = undefined;

    /** The index of the arrival transition in the destination airport arrival information. */
    public arrivalTransitionIdent: string | undefined = undefined;

    /** The index of the selected runway transition at the destination airport arrival information. */
    public arrivalRunwayTransitionIdent : string | undefined = undefined;

    /** The arrival runway object, consisting of the index of the destination runway
     * in the destination runway information and the direction. */
    // public arrivalRunway: OneWayRunway | undefined = undefined;

    /** The ICAO for the facility associated with the approach procedure. */
    // public approachFacilityIcao: string | undefined = undefined;

    /** The index of the apporach in the destination airport information. */
    public approachIdent: string | undefined = undefined;

    /** The index of the approach transition in the destination airport approach information. */
    public approachTransitionIdent: string | undefined = undefined;

    /** The destination runway object, consisting of the index of the destination runway
     * in the destination runway information and the direction. */
    public destinationRunway: string | undefined = undefined;
}
