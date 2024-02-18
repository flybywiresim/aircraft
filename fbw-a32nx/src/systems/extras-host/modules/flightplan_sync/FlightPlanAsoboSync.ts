// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable no-await-in-loop */

import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { SerializedFlightPlanLeg } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { SerializedFlightPlan } from '@fmgc/flightplanning/new/plans/BaseFlightPlan';
import { FlightPlanSyncEvents, FlightPlanSyncResponsePacket } from '@fmgc/flightplanning/new/sync/FlightPlanSyncEvents';
import { EventBus, FacilityType, FacilityLoader, FacilityRepository } from '@microsoft/msfs-sdk';

export class FlightPlanAsoboSync {
    private isReady = false;

    private lastFlightPlanVersion = undefined;

    private facilityLoaderCustom: FacilityLoader;

    constructor(private readonly bus: EventBus) {}

    connectedCallback(): void {
        const sub = this.bus.getSubscriber<FlightPlanSyncEvents>();

        this.facilityLoaderCustom = new FacilityLoader(FacilityRepository.getRepository(this.bus));

        RegisterViewListener('JS_LISTENER_FLIGHTPLAN', () => {
            this.isReady = true;
        });
        sub.on('flightPlanManager.syncResponse').handle(async (event) => {
            await this.syncFlightPlanToGame(event);
        });
    }

    public update(): void {
        if (NXDataStore.get('FP_SYNC', 'LOAD') === 'SAVE') {
            const pub = this.bus.getPublisher<FlightPlanSyncEvents>();
            pub.pub('flightPlanManager.syncRequest', undefined, true);
        }
    }

    private async syncFlightPlanToGame(event: FlightPlanSyncResponsePacket): Promise<void> {
        try {
            if (this.isReady && this.lastFlightPlanVersion !== event.plans[0]?.flightPlanVersion) {
                const plan = event.plans[0] as SerializedFlightPlan;

                await Coherent.call('SET_CURRENT_FLIGHTPLAN_INDEX', 0, true);
                await Coherent.call('CLEAR_CURRENT_FLIGHT_PLAN');
                console.log('A32NX_EXTRASHOST: Received flightPlanManager.syncResponse');
                console.log(event);
                this.lastFlightPlanVersion = plan.flightPlanVersion;

                if (plan.originAirport && plan.destinationAirport) {
                    await Coherent.call('SET_ORIGIN', `A      ${plan.originAirport} `, false);
                    await Coherent.call('SET_DESTINATION', `A      ${plan.destinationAirport} `, false);

                    const allEnrouteLegs = event.plans[0].segments.enrouteSegment.allLegs;
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

                    const originFacility = await this.facilityLoaderCustom.getFacility(FacilityType.Airport, `A      ${plan.originAirport.substring(0, 4)} `);
                    let originRw = 0;
                    let departureRw = 0;
                    for (const runway of originFacility.runways) {
                        for (const designation of runway.designation.split('-')) {
                            console.log('ORIGIN RUNWAY', plan.originRunway);
                            console.log(designation);
                            if (designation === (plan.originRunway.substring(2, 4).startsWith('0') ? plan.originRunway.substring(3, 4) : plan.originRunway.substring(2, 4))) {
                                console.log(`Runway parent ${originRw} is matching with actual index ${departureRw}. Is ${JSON.stringify(runway)}`);
                                await Coherent.call('SET_ORIGIN_RUNWAY_INDEX', originRw);
                                await Coherent.call('SET_DEPARTURE_RUNWAY_INDEX', departureRw);
                                const departureIndex = originFacility.departures.findIndex((departure) => departure.name === plan.segments?.departureSegment?.procedureIdent);
                                const departureTransitionIndex = originFacility.departures
                                    .findIndex((departure) => departure.enRouteTransitions
                                        .map((t) => t.name === plan.segments?.departureRunwayTransitionSegment?.procedureIdent));

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

                    console.log('DESTINATION SEGMENT', plan.segments);

                    if (plan.destinationAirport) {
                        const destinationRunwayIdent = plan.destinationRunway;
                        console.log('IDENT', destinationRunwayIdent);

                        const arg = await this.facilityLoaderCustom.getFacility(FacilityType.Airport, `A      ${plan.destinationAirport.substring(0, 4)} `);
                        console.log('ARRIVAL', arg);
                        for (const runway of arg.runways) {
                            for (const designation of runway.designation.split('-')) {
                                console.log(destinationRunwayIdent);
                                console.log(designation);
                                if (designation === (
                                    destinationRunwayIdent.substring(2, 4).startsWith('0') ? destinationRunwayIdent.substring(3, 4) : destinationRunwayIdent.substring(2, 4))) {
                                    console.log(`Runway is matching with actual index ${destinationRunwayIndex}. Is ${JSON.stringify(runway)}`);
                                    const arrivalIndex = arg.arrivals.findIndex((arrival) => arrival.name === plan.segments?.arrivalSegment?.procedureIdent);
                                    const arritvalTransitionIndex = arg.arrivals
                                        .findIndex((arrival) => arrival.enRouteTransitions.map((t) => t.name === plan.segments?.arrivalRunwayTransitionSegment?.procedureIdent));
                                    const apoprachIndex = arg.approaches
                                        .findIndex((approach) => approach.name === plan.segments.approachSegment.procedureIdent);
                                    const approachEnrouteTransitionIndex = arg.approaches
                                        .findIndex((approach) => approach.transitions.map((t) => t.name === plan.segments.arrivalRunwayTransitionSegment.procedureIdent));

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
                    await Coherent.call('SET_CRUISE_ALTITUDE', plan.performanceData.cruiseFlightLevel * 100);
                }
            }
            await Coherent.call('RECOMPUTE_ACTIVE_WAYPOINT_INDEX', 0);
        } catch (e) {
            console.log(e);
        }
    }
}
