// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { Guidable } from '@fmgc/guidance/Guidable';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';

export enum TransitionState {
    UPCOMING,
    OUT_OF_ACTIVE_LEG,
    ACTIVE,
    INTO_ACTIVE_LEG,
    PASSED,
}

export abstract class Transition extends Guidable {
    abstract isAbeam(ppos: LatLongData): boolean;

    protected constructor(
        public previousLeg: Leg,
        public nextLeg: Leg,
    ) {
        super();

        this.inboundGuidable = previousLeg;
        this.outboundGuidable = nextLeg;
    }

    public isFrozen = false;

    public freeze(): void {
        this.isFrozen = true;
    }

    recomputeWithParameters(
        _isActive: boolean,
        _tas: Knots,
        _gs: MetresPerSecond,
        _ppos: Coordinates,
        _trueTrack: DegreesTrue,
    ) {
        // Default impl.
    }

    abstract getGuidanceParameters(ppos: Coordinates, trueTrack: Degrees, tas: Knots, gs: Knots);

    abstract getDistanceToGo(ppos: Coordinates);

    abstract getTurningPoints(): [Coordinates, Coordinates];

    abstract get distance(): NauticalMiles;

    abstract get repr(): string;
}
