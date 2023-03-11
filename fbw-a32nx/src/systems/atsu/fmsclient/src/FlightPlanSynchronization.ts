//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { FmsAtcMessages } from '@datalink/atc';
import { Waypoint } from '@datalink/common';
import { FlightPhaseManager } from '@fmgc/flightphase';
import { WaypointStats } from '@fmgc/flightplanning/data/flightplan';
import { FlightPlanManager, ManagedFlightPlan } from '@fmgc/wtsdk';
import { Arinc429Word } from '@shared/arinc429';
import { FmgcFlightPhase } from '@shared/flightphase';
import { EventBus, Publisher } from 'msfssdk';

export class FlightPlanSynchronization {
    private readonly publisher: Publisher<FmsAtcMessages>;

    private originIdent: string = '';

    private lastWaypoint: Waypoint = { ident: '', altitude: 0, utc: 0 };

    private activeWaypoint: Waypoint = { ident: '', altitude: 0, utc: 0 };

    private nextWaypoint: Waypoint = { ident: '', altitude: 0, utc: 0 };

    private destination: Waypoint = { ident: '', altitude: 0, utc: 0 };

    private static findLastWaypoint(flightPlan: ManagedFlightPlan): Waypoint {
        let idx = flightPlan.activeWaypointIndex;
        while (idx >= 0) {
            const wp = flightPlan.getWaypoint(idx);
            if (wp && wp.waypointReachedAt !== 0) {
                return {
                    ident: wp.ident,
                    altitude: wp.legAltitude1,
                    utc: wp.waypointReachedAt,
                };
            }

            idx -= 1;
        }

        return { ident: '', altitude: 0, utc: 0 };
    }

    private static findActiveWaypoint(flightPlan: ManagedFlightPlan, flightPlanStats: Map<number, WaypointStats>): Waypoint {
        if (flightPlan.activeWaypoint) {
            return {
                ident: flightPlan.activeWaypoint.ident,
                altitude: flightPlan.activeWaypoint.legAltitude1,
                utc: flightPlanStats !== null ? flightPlanStats.get(flightPlan.activeWaypointIndex).etaFromPpos : -1,
            };
        }

        return { ident: '', altitude: 0, utc: 0 };
    }

    private static findNextWaypoint(flightPlan: ManagedFlightPlan, flightPlanStats: Map<number, WaypointStats>): Waypoint {
        let idx = flightPlan.activeWaypointIndex + 1;
        while (idx < flightPlan.waypoints.length) {
            const wp = flightPlan.getWaypoint(idx);
            if (wp) {
                return {
                    ident: wp.ident,
                    altitude: wp.legAltitude1,
                    utc: flightPlanStats !== null ? flightPlanStats.get(idx).etaFromPpos : -1,
                };
            }

            idx += 1;
        }

        return { ident: '', altitude: 0, utc: 0 };
    }

    private static findDestinationWaypoint(flightPlan: ManagedFlightPlan, flightPlanStats: Map<number, WaypointStats>): Waypoint {
        let idx = flightPlan.activeWaypointIndex;
        while (idx < flightPlan.waypoints.length) {
            const wp = flightPlan.getWaypoint(idx);
            if (wp && wp.ident === flightPlan.destinationAirfield.ident) {
                return {
                    ident: wp.ident,
                    altitude: wp.legAltitude1,
                    utc: flightPlanStats !== null ? flightPlanStats.get(idx).etaFromPpos : -1,
                };
            }
            idx += 1;
        }

        return { ident: '', altitude: 0, utc: 0 };
    }

    constructor(
        private readonly bus: EventBus,
        private readonly flightPlanManager: FlightPlanManager,
        private readonly flightPhaseManager: FlightPhaseManager,
    ) {
        this.publisher = this.bus.getPublisher<FmsAtcMessages>();

        // FIXME use the non-guidance FMGC to get the flightplan data
        setInterval(() => {
            const activeFlightPlan = this.flightPlanManager.getCurrentFlightPlan();
            const phase = this.flightPhaseManager.phase;
            const isFlying = phase >= FmgcFlightPhase.Takeoff && phase !== FmgcFlightPhase.Done;

            if (activeFlightPlan && activeFlightPlan.waypoints.length !== 0) {
                let flightPlanStats: Map<number, WaypointStats> = null;
                if (isFlying) {
                    const latitude = new Arinc429Word(SimVar.GetSimVarValue('L:A32NX_ADIRS_IR_1_LATITUDE', 'number'));
                    const longitude = new Arinc429Word(SimVar.GetSimVarValue('L:A32NX_ADIRS_IR_1_LONGITUDE', 'number'));

                    if (latitude.isNormalOperation() && longitude.isNormalOperation()) {
                        const ppos = {
                            lat: latitude.value,
                            long: longitude.value,
                        };

                        flightPlanStats = activeFlightPlan.computeWaypointStatistics(ppos);
                    }
                }

                const origin = activeFlightPlan.originAirfield;
                const lastWaypoint = FlightPlanSynchronization.findLastWaypoint(activeFlightPlan);
                const activeWaypoint = FlightPlanSynchronization.findActiveWaypoint(activeFlightPlan, flightPlanStats);
                const nextWaypoint = FlightPlanSynchronization.findNextWaypoint(activeFlightPlan, flightPlanStats);
                const destination = FlightPlanSynchronization.findDestinationWaypoint(activeFlightPlan, flightPlanStats);

                if (origin) {
                    if (origin.ident !== this.originIdent || destination.ident !== this.destination.ident) {
                        // new route entered -> reset ATIS updater
                        this.publisher.pub('atcResetAtisAutoUpdate', true, true, false);
                    }

                    // check if we need to update the route data
                    const updateRoute = this.lastWaypoint.ident !== lastWaypoint.ident
                        || this.activeWaypoint.ident !== activeWaypoint.ident
                        || this.nextWaypoint.ident !== nextWaypoint.ident
                        || this.destination.ident !== destination.ident
                        || Math.abs(this.activeWaypoint.utc - activeWaypoint.utc) >= 60
                        || Math.abs(this.nextWaypoint.utc - nextWaypoint.utc) >= 60;

                    if (updateRoute) {
                        this.publisher.pub('atcRouteData', {
                            lastWaypoint,
                            activeWaypoint,
                            nextWaypoint,
                            destination,
                        }, true, false);
                    }
                }
            }
        }, 1000);
    }
}
