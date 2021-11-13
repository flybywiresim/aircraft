import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { TurnDirection } from '@fmgc/types/fstypes/FSEnums';
import { FixedRadiusTransition } from '@fmgc/guidance/lnav/transitions/FixedRadiusTransition';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { Guidable } from '@fmgc/guidance/Guidable';

export abstract class XFLeg extends Leg {
    protected constructor(
        public fix: WayPoint,
    ) {
        super();

        this.constrainedTurnDirection = fix.turnDirection;
    }

    protected inboundGuidable: Guidable | undefined;

    protected outboundGuidable: Guidable | undefined;

    getPathEndPoint(): Coordinates | undefined {
        if (this.outboundGuidable instanceof FixedRadiusTransition && !this.outboundGuidable.isReverted && this.outboundGuidable.isComputed) {
            return this.outboundGuidable.getPathStartPoint();
        }

        return this.fix.infos.coordinates;
    }

    get terminationWaypoint(): WayPoint {
        return this.fix;
    }

    get ident(): string {
        return this.fix.ident;
    }

    constrainedTurnDirection = TurnDirection.Unknown;

    get forcedTurnDirection(): TurnDirection {
        return this.fix.turnDirection ?? TurnDirection.Either;
    }

    get overflyTermFix(): boolean {
        return this.fix.additionalData.overfly ?? false;
    }

    get distanceToTermFix(): NauticalMiles {
        return Avionics.Utils.computeGreatCircleDistance(this.getPathStartPoint(), this.fix.infos.coordinates);
    }
}
