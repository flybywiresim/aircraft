import { BaseGeometryProfile } from '@fmgc/guidance/vnav/profile/BaseGeometryProfile';
import { DescentAltitudeConstraint, MaxAltitudeConstraint, MaxSpeedConstraint, VerticalCheckpoint, VerticalCheckpointReason } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';

export class SelectedGeometryProfile extends BaseGeometryProfile {
    public override maxAltitudeConstraints: MaxAltitudeConstraint[] = [];

    public override descentAltitudeConstraints: DescentAltitudeConstraint[];

    public override maxClimbSpeedConstraints: MaxSpeedConstraint[] = [];

    public override descentSpeedConstraints: MaxSpeedConstraint[] = [];

    public override distanceToPresentPosition: number = 0;

    private checkpointsToShowAlongFlightPlan: Set<VerticalCheckpointReason> = new Set([
        VerticalCheckpointReason.CrossingFcuAltitudeClimb,
        VerticalCheckpointReason.CrossingFcuAltitudeDescent,
        VerticalCheckpointReason.CrossingClimbSpeedLimit,
    ])

    getCheckpointsToShowOnTrackLine(): VerticalCheckpoint[] {
        return this.checkpoints.filter((checkpoint) => this.checkpointsToShowAlongFlightPlan.has(checkpoint.reason));
    }

    override resetAltitudeConstraints(): void {
        this.maxAltitudeConstraints = [];
        this.descentAltitudeConstraints = [];
    }
}
