// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { AltitudeConstraint, SpeedConstraint } from '@fmgc/guidance/lnav/legs';
import { SpeedLimit } from '@fmgc/guidance/vnav/SpeedLimit';

export interface VerticalFlightPlan {
    climb: VerticalClimb,
    cruise: VerticalCruise,
    descent: VerticalDescent,
}

/**
 * Leg indices mapped to altitude constraints
 */
export type ConstraintTable = {
    [k: number]: {
        speed?: SpeedConstraint,
        altitude?: AltitudeConstraint,
    },
}

export interface VerticalClimb {
    thrustReductionAltitude: number,
    accelerationAltitude: number,

    climConstraints: ConstraintTable,

    climbSpeedLimit?: SpeedLimit,
}

export type FlightLevel = number

export interface VerticalCruise {
    cruiseAltitude: FlightLevel,

    // stepClimb?: StepClimb,
}

export interface VerticalDescent {
    descentConstraints: ConstraintTable,

    descentSpeedLimit?: SpeedLimit,

    approachConstraints: ConstraintTable,
}

// export interface VerticalMissedApproach
