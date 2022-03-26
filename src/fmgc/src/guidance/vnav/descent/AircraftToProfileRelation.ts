import { InertialDistanceAlongTrack } from '@fmgc/guidance/vnav/descent/InertialDistanceAlongTrack';
import { NavGeometryProfile, VerticalCheckpoint, VerticalCheckpointReason } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { VnavConfig } from '@fmgc/guidance/vnav/VnavConfig';
import { MathUtils } from '@shared/MathUtils';

export class AircraftToDescentProfileRelation {
    public isValid: boolean = false;

    private currentProfile?: NavGeometryProfile;

    private inertialDistanceAlongTrack: InertialDistanceAlongTrack;

    private topOfDescent?: VerticalCheckpoint;

    private geometricPathStart?: VerticalCheckpoint;

    constructor(private observer: VerticalProfileComputationParametersObserver) {
        this.inertialDistanceAlongTrack = new InertialDistanceAlongTrack();
    }

    updateProfile(profile: NavGeometryProfile) {
        const topOfDescent = profile?.findVerticalCheckpoint(VerticalCheckpointReason.TopOfDescent);
        const lastPosition = profile?.findVerticalCheckpoint(VerticalCheckpointReason.PresentPosition) ?? profile.checkpoints[0];
        const geometricPathStart = profile?.findVerticalCheckpoint(VerticalCheckpointReason.GeometricPathStart);

        const isProfileValid = !!topOfDescent && !!lastPosition && !!geometricPathStart;

        if (!isProfileValid) {
            this.invalidate();

            // If the profile is empty, we don't bother logging that it's invalid, because it probably just hasn't been computed yet.
            if (VnavConfig.DEBUG_PROFILE && profile.checkpoints.length >= 0) {
                console.warn('[FMS/VNAV] Invalid profile');
            }

            return;
        }

        this.isValid = isProfileValid;

        this.topOfDescent = topOfDescent;
        this.geometricPathStart = geometricPathStart;

        // TODO: Remove this
        profile.checkpoints = profile.checkpoints.filter(({ reason }) => reason !== VerticalCheckpointReason.PresentPosition);

        if (VnavConfig.DEBUG_PROFILE && this.currentProfile) {
            // How much the distance to the end of the path changed between the current profile and the new one.
            // Ideally, this should be as low as possible. Otherwise, there might be a bug
            const distanceToEndDeviation = this.currentProfile.getDistanceFromStart(this.inertialDistanceAlongTrack.get())
                - profile.getDistanceFromStart(profile.distanceToPresentPosition);

            if (Math.abs(distanceToEndDeviation) >= 0.1) {
                console.log(`[FMS/VNAV] Large distanceToEndDeviation: ${distanceToEndDeviation}`);
            }
        }

        this.currentProfile = profile;

        this.inertialDistanceAlongTrack.updateCorrectInformation(lastPosition.distanceFromStart);
    }

    private invalidate() {
        this.isValid = false;
        this.currentProfile = undefined;
        this.topOfDescent = undefined;
    }

    update() {
        if (!this.isValid) {
            return;
        }

        this.inertialDistanceAlongTrack.update();
    }

    isPastTopOfDescent(): boolean {
        return !this.topOfDescent || this.inertialDistanceAlongTrack.get() > this.topOfDescent.distanceFromStart;
    }

    isOnGeometricPath(): boolean {
        return this.inertialDistanceAlongTrack.get() > this.geometricPathStart.distanceFromStart;
    }

    computeLinearDeviation(): Feet {
        const altitude = this.observer.get().presentPosition.alt;
        const targetAltitude = this.currentTargetAltitude();

        return altitude - targetAltitude;
    }

    currentTargetAltitude(): Feet {
        return this.currentProfile.interpolateAltitudeAtDistance(this.inertialDistanceAlongTrack.get());
    }

    currentTargetSpeed(): Feet {
        return this.currentProfile.findNextSpeedTarget(this.inertialDistanceAlongTrack.get());
    }

    currentTargetPathAngle(): Degrees {
        return this.currentProfile.interpolatePathAngleAtDistance(this.inertialDistanceAlongTrack.get());
    }

    currentTargetVerticalSpeed(): FeetPerMinute {
        const groundSpeed = SimVar.GetSimVarValue('GPS GROUND SPEED', 'Knots');

        const knotsToFeetPerMinute = 101.269;
        return knotsToFeetPerMinute * groundSpeed * Math.tan(this.currentTargetPathAngle() * MathUtils.DEGREES_TO_RADIANS);
    }

    isAboveSpeedLimitAltitude(): boolean {
        const { presentPosition, descentSpeedLimit } = this.observer.get();

        return presentPosition.alt > descentSpeedLimit?.underAltitude;
    }
}
