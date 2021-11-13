import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { PathVector, pathVectorLength, pathVectorPoint, PathVectorType } from '@fmgc/guidance/lnav/PathVector';

export abstract class Guidable {
    protected constructor() {
    }

    abstract getPathStartPoint(): Coordinates | undefined;

    getPathEndPoint(): Coordinates | undefined {
        if (this.predictedPath) {
            for (let i = this.predictedPath.length - 1; i >= 0; i--) {
                const vector = this.predictedPath[i];

                if (vector.type === PathVectorType.DebugPoint) {
                    continue;
                }

                if (vector.endPoint) {
                    return vector.endPoint;
                }
            }
        }

        return undefined;
    }

    isComputed = false;

    /**
     * Recomputes the guidable using new parameters
     *
     * @param isActive          whether the guidable is being flown
     * @param tas               predicted true airspeed speed of the current leg (for a leg) or the next leg (for a transition) in knots
     * @param gs                predicted ground speed of the current leg
     * @param ppos              present position coordinates
     * @param trueTrack         true ground track
     * @param previousGuidable  previous guidable before leg
     * @param nextGuidable      next guidable after leg
     */
    abstract recomputeWithParameters(isActive: boolean, tas: Knots, gs: Knots, ppos: Coordinates, trueTrack: DegreesTrue, previousGuidable: Guidable, nextGuidable: Guidable): void;

    abstract getGuidanceParameters(ppos: Coordinates, trueTrack: Degrees, tas: Knots): GuidanceParameters | undefined;

    /**
     * Calculates directed DTG parameter
     *
     * @param ppos {LatLong} the current position of the aircraft
     */
    abstract getDistanceToGo(ppos: Coordinates): NauticalMiles | undefined;

    abstract isAbeam(ppos: Coordinates): boolean;

    /**
     * Obtains the location of a pseudo-waypoint on the guidable (does NOT include inbound or outbound
     * transitions for legs; see {@link PseudoWaypoints.pointFromEndOfPath} for a function that includes those).
     *
     * @param distanceBeforeTerminator
     */
    getPseudoWaypointLocation(distanceBeforeTerminator: NauticalMiles): Coordinates | undefined {
        for (const vector of [...this.predictedPath].reverse()) {
            const length = pathVectorLength(vector);

            if (length > distanceBeforeTerminator) {
                return pathVectorPoint(vector, distanceBeforeTerminator);
            }
        }
        return undefined;
    }

    /**
     * Path vectors for drawing on the ND
     */
    abstract get predictedPath(): PathVector[] | undefined;

    /**
     * Whether the path ends in a curved arc - for entry roll anticipation
     */
    get startsInCircularArc(): boolean {
        return false;
    }

    /**
     * Whether the path ends in a curved arc - for exit roll anticipation
     */
    get endsInCircularArc(): boolean {
        return false;
    }

    /**
     * Obtain the nominal roll angle for the curved portion of the path
     */
    abstract getNominalRollAngle(gs: MetresPerSecond): Degrees | undefined;

    abstract get repr(): string;
}
