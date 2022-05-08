// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { MathUtils } from '@shared/MathUtils';

/**
 * The InertialDampener provides a dampened output based on the current input
 * and an internal state value. The output value increases or decreases from the
 * internal state value towards the input value with the given acceleration value.
 */
export class InertialDampener {
    accelFactor: number = 0;

    lastValue: number = 0;

    /**
     * Creates a new instance of the InertialDampener
     * @param startValue initial value to avoid a too large delta for the first usage
     * @param accelFactor value which will be added/subtracted to/from the internal
     *                    state towards the input value.
     */
    constructor(startValue:number, accelFactor: number) {
        this.lastValue = startValue;
        this.accelFactor = accelFactor;
    }

    updateSpeed(newSpeed: number): number {
        if (MathUtils.round(newSpeed, 1) === MathUtils.round(this.lastValue, 1)) {
            return newSpeed;
        }
        if (newSpeed > this.lastValue) {
            this.lastValue += this.accelFactor;
        } else if (newSpeed < this.lastValue) {
            this.lastValue -= this.accelFactor;
        }
        return this.lastValue;
    }
}
