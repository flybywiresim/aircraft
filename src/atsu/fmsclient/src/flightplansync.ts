import { AtsuFmsMessages } from '@atsu/common/databus';
import { Waypoint } from '@atsu/common/types';
import { FlightPhaseManager } from '@fmgc/flightphase';
import { WaypointStats } from '@fmgc/flightplanning/data/flightplan';
import { FlightPlanManager, ManagedFlightPlan } from '@fmgc/wtsdk';
import { FmgcFlightPhase } from '@shared/flightphase';
import { EventBus, Publisher } from 'msfssdk';

export class FlightPlanSync {
    private readonly publisher: Publisher<AtsuFmsMessages>;

    public lastWaypoint: Waypoint = null;

    public activeWaypoint: Waypoint = null;

    public nextWaypoint: Waypoint = null;

    public destination: Waypoint = null;

    private static findLastWaypoint(flightPlan: ManagedFlightPlan): Waypoint {
        let idx = flightPlan.activeWaypointIndex;
        while (idx >= 0) {
            const wp = flightPlan.getWaypoint(idx);
            if (wp && wp.waypointReachedAt !== 0) {
                return {
                    ident: wp.ident,
                    utc: wp.waypointReachedAt,
                    altitude: -1,
                };
            }

            idx -= 1;
        }

        return {
            ident: '',
            utc: -1,
            altitude: -1,
        };
    }

    private static findNextWaypoint(flightPlan: ManagedFlightPlan): Waypoint {
        const next = flightPlan.getWaypoint(flightPlan.activeWaypointIndex + 1);

        if (next) {
            return {
                ident: next.ident,
                utc: -1,
                altitude: -1,
            };
        }

        return {
            ident: '',
            utc: -1,
            altitude: -1,
        };
    }

    constructor(
        private readonly bus: EventBus,
        private readonly flightPlanManager: FlightPlanManager,
        private readonly flightPhaseManager: FlightPhaseManager,
    ) {
        this.publisher = this.bus.getPublisher<AtsuFmsMessages>();

        // FIXME use the non-guidance FMGC to get the flightplan data
        setInterval(() => {
            const activeFlightPlan = this.flightPlanManager.getCurrentFlightPlan();
            const phase = this.flightPhaseManager.phase;
            const isFlying = phase >= FmgcFlightPhase.Takeoff && phase !== FmgcFlightPhase.Done;

            if (activeFlightPlan && activeFlightPlan.waypoints.length !== 0) {
                let flightPlanStats: Map<number, WaypointStats> = null;
                if (isFlying) {
                    flightPlanStats = activeFlightPlan.computeWaypointStatistics(ppos);
                }

                if (this.destination === null || activeFlightPlan.destinationAirfield.ident !== this.destination.ident) {
                    const index = activeFlightPlan.destinationIndex;
                    this.destination = new Waypoint(activeFlightPlan.getWaypoint(index));
                    if (flightPlanStats !== null) {
                        this.destination.utc = flightPlanStats.get(index).etaFromPpos;
                    }

                    this.publisher.pub('destination', this.destination);
                }

                const activeWp = activeFlightPlan.activeWaypoint;
                if (this.activeWaypoint === null || activeWp.ident !== this.activeWaypoint.ident) {
                    this.lastWaypoint = FlightPlanSync.findLastWaypoint(activeFlightPlan);
                    this.activeWaypoint = new Waypoint(activeWp.ident);
                    this.nextWaypoint = FlightPlanSync.findNextWaypoint(activeFlightPlan);
                    if (flightPlanStats !== null && this.nextWaypoint.ident !== '') {
                        this.nextWaypoint.utc = flightPlanStats.get(activeFlightPlan.activeWaypointIndex + 1).etaFromPpos;
                    }

                    this.publisher.pub('lastWaypoint', this.lastWaypoint);
                    this.publisher.pub('activeWaypoint', this.activeWaypoint);
                    this.publisher.pub('nextWaypoint', this.nextWaypoint);
                }
            }
        }, 1000);
    }
}
