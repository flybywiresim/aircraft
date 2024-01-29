/* eslint-disable no-await-in-loop */
// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, FacilityRepository, HEventPublisher, FacilityLoader, FacilityType, FacilitySearchType } from '@microsoft/msfs-sdk';
import { NotificationManager, UpdateThrottler } from '@flybywiresim/fbw-sdk';
import { ExtrasSimVarPublisher } from 'extras-host/modules/common/ExtrasSimVarPublisher';
import { PushbuttonCheck } from 'extras-host/modules/pushbutton_check/PushbuttonCheck';
import { Discontinuity, SerializedFlightPlanLeg } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { FlightPlanSyncEvents } from '@fmgc/flightplanning/new/sync/FlightPlanSyncEvents';
import { KeyInterceptor } from './modules/key_interceptor/KeyInterceptor';
import { VersionCheck } from './modules/version_check/VersionCheck';
import { FlightPlanTest } from './modules/flight_plan_test/FlightPlanTest';

/**
 * This is the main class for the extras-host instrument.
 *
 * It provides an environment for non-aircraft non-wasm systems/modules to run in.
 *
 * Usage:
 *  - Add new modules as private readonly members of this class.
 *  - Add the modules to the constructor.
 *  - Add the modules to the connectedCallback() method.
 *  - Add the modules to the Update() method.
 *
 * Each module must implement the following methods:
 * - `constructor` to get access to the system-wide EventBus
 * - `connectedCallback` which is called after the simulator set up everything. These functions will also add the subscribtion to special events.
 * - `startPublish` which is called as soon as the simulator starts running. It will also start publishing the simulator variables onto the EventBus
 * - `update` is called in every update call of the simulator, but only after `startPublish` is called
 */
class ExtrasHost extends BaseInstrument {
    private bus: EventBus = new EventBus();

    private readonly notificationManager: NotificationManager;

    private readonly hEventPublisher: HEventPublisher;

    private readonly simVarPublisher: ExtrasSimVarPublisher;

    private readonly pushbuttonCheck: PushbuttonCheck;

    private readonly versionCheck: VersionCheck;

    private readonly keyInterceptor: KeyInterceptor;

    private readonly flightPlanTest: FlightPlanTest;

    private facilityLoaderCustom: FacilityLoader;

    private readonly syncThrottler: UpdateThrottler;

    private isReady = false;

    private lastFlightPlanVersion = undefined;

    /**
     * "mainmenu" = 0
     * "loading" = 1
     * "briefing" = 2
     * "ingame" = 3
     */
    private gameState = 0;

    constructor() {
        super();

        this.hEventPublisher = new HEventPublisher(this.bus);
        this.simVarPublisher = new ExtrasSimVarPublisher(this.bus);

        this.notificationManager = new NotificationManager();

        this.pushbuttonCheck = new PushbuttonCheck(this.bus, this.notificationManager);
        this.versionCheck = new VersionCheck(this.bus);
        this.keyInterceptor = new KeyInterceptor(this.bus, this.notificationManager);
        this.flightPlanTest = new FlightPlanTest(this.bus);

        const sub = this.bus.getSubscriber<FlightPlanSyncEvents>();

        RegisterViewListener('JS_LISTENER_FLIGHTPLAN', () => {
            this.isReady = true;
        });

        sub.on('flightPlanManager.syncResponse').handle(async (event) => {
            try {
                if (this.isReady && this.lastFlightPlanVersion !== event.plans[0]?.flightPlanVersion) {
                    const plan = event.plans[0];

                    await Coherent.call('SET_CURRENT_FLIGHTPLAN_INDEX', 0, true);
                    await Coherent.call('CLEAR_CURRENT_FLIGHT_PLAN');
                    console.log('A32NX_EXTRASHOST: Received flightPlanManager.syncResponse');
                    console.log(event);
                    this.lastFlightPlanVersion = event.plans[0]?.flightPlanVersion;

                    if (event.plans[0]?.segments?.originSegment?.allLegs[0] as SerializedFlightPlanLeg) {
                        const ident = (event.plans[0]?.segments?.originSegment?.allLegs[0] as SerializedFlightPlanLeg).ident;
                        console.log('ORIGIN IDENT', ident);
                        await Coherent.call('SET_ORIGIN', `A      ${ident.substring(0, 4)} `, false);
                        const deestIident = (event.plans[0]?.segments.approachSegment?.allLegs[plan.segments.approachSegment.allLegs?.length - 1] as SerializedFlightPlanLeg).ident;

                        const allEnrouteLegs = event.plans[0].segments.enrouteSegment.allLegs;
                        console.log('ALL ENROUTE LEGS', allEnrouteLegs);
                        // CASE FOR EDDS ONLY, ignore custom waypoints like 1700
                        // FIXME this is crap, the old sync and WT sync start with index 1, but this draws a weird route on the VFR map, need to verify
                        let globalIndex = event.plans[0]?.segments?.departureEnrouteTransitionSegment?.allLegs.length + plan.segments.originSegment.allLegs.length
                        + event.plans[0]?.segments?.departureRunwayTransitionSegment?.allLegs.length - 1 + 2;
                        // globalIndex = 1;

                        for (let i = 1; i < allEnrouteLegs.length - 1; i++) {
                            const leg = allEnrouteLegs[i];
                            console.log('LEG', leg);
                            if (!leg.isDiscontinuity) {
                                const legg = leg as SerializedFlightPlanLeg;
                                if (legg) {
                                    console.log('DEFINITION', legg.definition);

                                    console.log('DBID', legg.definition.waypoint.databaseId);
                                    // eslint-disable-next-line no-await-in-loop
                                    if (!legg.definition.waypoint.databaseId.startsWith('A')) {
                                        console.log('ADDING WAYPOINT with index', legg.definition.waypoint.databaseId, globalIndex);
                                        await Coherent.call('ADD_WAYPOINT', legg.definition.waypoint.databaseId, globalIndex, false);
                                    }
                                }
                                globalIndex++;
                            }
                        }

                        console.log('DESTINATION IDENT', deestIident);
                        await Coherent.call('SET_DESTINATION', `A      ${deestIident.substring(0, 4)} `, false);

                        console.log('A32NX_EXTRASHOST: Received flightPlanManager.syncResponse: SerializedFlightPlan');

                        const arg = await this.facilityLoaderCustom.getFacility(FacilityType.Airport, `A      ${ident.substring(0, 4)} `);
                        let originRw = 0;
                        let departureRw = 0;
                        for (const runway of arg.runways) {
                            for (const designation of runway.designation.split('-')) {
                                console.log(ident);
                                console.log(designation);
                                if (designation === (ident.substring(4, 6).startsWith('0') ? ident.substring(5, 6) : ident.substring(4, 6))) {
                                    console.log(`Runway parent ${originRw} is matching with actual index ${departureRw}. Is ${JSON.stringify(runway)}`);
                                    await Coherent.call('SET_ORIGIN_RUNWAY_INDEX', originRw);
                                    await Coherent.call('SET_DEPARTURE_RUNWAY_INDEX', departureRw);
                                    const departureIndex = arg.departures.findIndex((departure) => departure.name === event.plans[0]?.segments?.departureSegment?.procedureIdent);
                                    const departureTransitionIndex = arg.departures
                                        .findIndex((departure) => departure.enRouteTransitions
                                            .map((t) => t.name === event.plans[0]?.segments?.departureRunwayTransitionSegment?.procedureIdent));

                                    console.log('DEPARTURE INDEX', departureIndex);
                                    console.log('DEPARTURE TransitionIndex', departureIndex);

                                    await Coherent.call('SET_DEPARTURE_PROC_INDEX', departureIndex);
                                    await Coherent.call('SET_DEPARTURE_ENROUTE_TRANSITION_INDEX', departureTransitionIndex > -1 ? departureTransitionIndex : 0);
                                } else {
                                    await Coherent.call('SET_DEPARTURE_RUNWAY_INDEX', -1);
                                    await Coherent.call('SET_DEPARTURE_PROC_INDEX', -1);
                                    await Coherent.call('SET_DEPARTURE_ENROUTE_TRANSITION_INDEX', -1);
                                }
                                departureRw++;
                            }
                            originRw++;
                        }

                        console.log(arg);
                    }

                    let destinationRunwayIndex = 0;

                    console.log('DESTINATION SEGMENT', plan.segments);

                    if (event.plans[0]?.segments.approachSegment?.allLegs?.reverse()[0] as SerializedFlightPlanLeg) {
                        const ident = (event.plans[0]?.segments.approachSegment?.allLegs[0] as SerializedFlightPlanLeg).ident;
                        console.log('IDENT', ident);

                        const arg = await this.facilityLoaderCustom.getFacility(FacilityType.Airport, `A      ${ident.substring(0, 4)} `);
                        console.log('ARRIVAL', arg);
                        for (const runway of arg.runways) {
                            for (const designation of runway.designation.split('-')) {
                                console.log(ident);
                                console.log(designation);
                                if (designation === (ident.substring(4, 6).startsWith('0') ? ident.substring(5, 6) : ident.substring(4, 6))) {
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
                }

                await Coherent.call('RECOMPUTE_ACTIVE_WAYPOINT_INDEX', 0);
            } catch (e) {
                console.log(e);
            }
        });

        this.syncThrottler = new UpdateThrottler(5000);

        console.log('A32NX_EXTRASHOST: Created');
    }

    get templateID(): string {
        return 'A32NX_EXTRASHOST';
    }

    public getDeltaTime() {
        return this.deltaTime;
    }

    public onInteractionEvent(args: string[]): void {
        this.hEventPublisher.dispatchHEvent(args[0]);
    }

    public connectedCallback(): void {
        super.connectedCallback();

        this.pushbuttonCheck.connectedCallback();
        this.versionCheck.connectedCallback();
        this.keyInterceptor.connectedCallback();
        this.facilityLoaderCustom = new FacilityLoader(FacilityRepository.getRepository(this.bus));
    }

    public Update(): void {
        super.Update();

        if (this.gameState !== GameState.ingame) {
            const gs = this.getGameState();
            if (gs === GameState.ingame) {
                this.hEventPublisher.startPublish();
                this.versionCheck.startPublish();
                this.keyInterceptor.startPublish();
                this.simVarPublisher.startPublish();
            }
            this.gameState = gs;
        } else {
            this.simVarPublisher.onUpdate();
            if (this.syncThrottler.canUpdate(this.deltaTime) > 0) {
                const pub = this.bus.getPublisher<FlightPlanSyncEvents>();
                pub.pub('flightPlanManager.syncRequest', undefined, true);
            }
        }

        this.versionCheck.update();
        this.keyInterceptor.update();
    }
}

registerInstrument('extras-host', ExtrasHost);
