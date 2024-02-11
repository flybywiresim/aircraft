import { FlightPlanLegDefinition } from '@fmgc/flightplanning/new/legs/FlightPlanLegDefinition';
import { AltitudeDescriptor, SpeedDescriptor } from '@flybywiresim/fbw-sdk';

export enum AltitudeConstraintType {
    at = '@',
    atOrAbove = '+',
    atOrBelow = '-',
    range = 'B',
}

// TODO at and atOrAbove do not exist in the airbus (former interpreted as atOrBelow, latter discarded)
export enum SpeedConstraintType {
    at = '@',
    atOrAbove = '+',
    atOrBelow = '-',
}

export interface AltitudeConstraint {
    type: AltitudeConstraintType,
    altitude1: Feet,
    altitude2?: Feet,
}

export interface SpeedConstraint {
    type: SpeedConstraintType.atOrBelow,
    speed: Knots,
}

export class ConstraintUtils {
    static parseAltConstraintFromLegDefinition(definition: FlightPlanLegDefinition): AltitudeConstraint | undefined {
        // Type G and H constraints are ignored by the FMS
        switch (definition?.altitudeDescriptor) {
        case AltitudeDescriptor.AtAlt1:
        case AltitudeDescriptor.AtAlt1GsIntcptAlt2:
        case AltitudeDescriptor.AtAlt1AngleAlt2:
            return { type: AltitudeConstraintType.at, altitude1: definition.altitude1 };
        case AltitudeDescriptor.AtOrAboveAlt1:
        case AltitudeDescriptor.AtOrAboveAlt1GsIntcptAlt2:
        case AltitudeDescriptor.AtOrAboveAlt1AngleAlt2:
            return { type: AltitudeConstraintType.atOrAbove, altitude1: definition.altitude1 };
        case AltitudeDescriptor.AtOrBelowAlt1:
        case AltitudeDescriptor.AtOrBelowAlt1AngleAlt2:
            return { type: AltitudeConstraintType.atOrBelow, altitude1: definition.altitude1 };
        case AltitudeDescriptor.BetweenAlt1Alt2:
            return { type: AltitudeConstraintType.range, altitude1: definition.altitude1, altitude2: definition.altitude2 };
        case AltitudeDescriptor.AtOrAboveAlt2:
            return { type: AltitudeConstraintType.atOrAbove, altitude1: definition.altitude2 };
        default:
            return undefined;
        }
    }

    static minimumAltitude(constraint: AltitudeConstraint): Feet {
        switch (constraint?.type) {
        case AltitudeConstraintType.at:
        case AltitudeConstraintType.atOrAbove:
            return constraint.altitude1;
        case AltitudeConstraintType.range:
            return constraint.altitude2;
        case AltitudeConstraintType.atOrBelow:
        default:
            return -Infinity;
        }
    }

    static maximumAltitude(constraint: AltitudeConstraint): Feet {
        switch (constraint?.type) {
        case AltitudeConstraintType.at:
        case AltitudeConstraintType.atOrBelow:
        case AltitudeConstraintType.range:
            return constraint.altitude1;
        default:
        case AltitudeConstraintType.atOrAbove:
            return Infinity;
        }
    }

    static parseSpeedConstraintFromLegDefinition(definition: FlightPlanLegDefinition): SpeedConstraint | undefined {
        if (definition?.speedDescriptor === SpeedDescriptor.Maximum || definition?.speedDescriptor === SpeedDescriptor.Mandatory) {
            return { type: SpeedConstraintType.atOrBelow, speed: definition.speed };
        }

        return undefined;
    }
}
