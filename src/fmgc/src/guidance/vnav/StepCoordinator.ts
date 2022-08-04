import { NavGeometryProfile, VerticalCheckpointReason } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { FlightPlanManager } from '@fmgc/wtsdk';

export interface Step {
    ident: string,
    toAltitude: Feet,
    location: LatLongAlt,
    isIgnored: boolean,
    get distanceFromStart(): NauticalMiles
}

class GeographicStep implements Step {
    constructor(private waypoint: WayPoint, public waypointIndex: number, public toAltitude: Feet, public isIgnored: boolean) {}

    get ident(): string {
        return this.waypoint.ident;
    }

    get location(): LatLongAlt {
        return this.waypoint.infos.coordinates;
    }

    get distanceFromStart(): NauticalMiles {
        return this.waypoint.cumulativeDistanceInFP;
    }
}

export class StepCoordinator {
    private currentNavGeometryProfile?: NavGeometryProfile;

    steps: Step[] = [];

    constructor(private flightPlanManager: FlightPlanManager) {}

    requestToAddGeographicStep(waypointIdent: string, toAltitude: Feet): boolean {
        const [index, waypoint] = this.findWaypoint(waypointIdent);

        if (!waypoint) {
            return false;
        }

        const topOfDescent = this.currentNavGeometryProfile.findLastVerticalCheckpoint(VerticalCheckpointReason.TopOfDescent);
        const waypointPrediction = this.currentNavGeometryProfile.waypointPredictions.get(index);

        let isIgnored = false;
        if (topOfDescent && waypointPrediction) {
            if (topOfDescent.distanceFromStart - waypointPrediction.distanceFromStart < 50) {
                isIgnored = true;
            }
        }

        this.insertStep(new GeographicStep(waypoint, index, toAltitude, isIgnored));

        return true;
    }

    requestToAddOptimalStep(): boolean {
        return false;
    }

    removeStep(index: number) {
        this.steps.splice(index, 1);
    }

    insertStep(step: Step) {
        if (this.steps.length <= 0 || step.distanceFromStart < this.steps[0].distanceFromStart) {
            this.steps.unshift(step);
            return;
        }

        for (let i = 0; i < this.steps.length - 1; i++) {
            if (step.distanceFromStart >= this.steps[i].distanceFromStart && step.distanceFromStart < this.steps[i + 1].distanceFromStart) {
                this.steps.splice(i + 1, 0, step);
                return;
            }
        }

        this.steps.push(step);
    }

    private findWaypoint(ident: string): [number, WayPoint | undefined] {
        for (let i = 0; i < this.flightPlanManager.getWaypointsCount(); i++) {
            const waypoint = this.flightPlanManager.getWaypoint(i);

            if (!waypoint) {
                continue;
            }

            if (this.flightPlanManager.getWaypoint(i).ident === ident) {
                return [i, waypoint];
            }
        }

        return [-1, undefined];
    }

    updateGeometryProfile(newProfile: NavGeometryProfile) {
        this.currentNavGeometryProfile = newProfile;
    }
}
