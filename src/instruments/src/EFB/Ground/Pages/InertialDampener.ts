// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { MathUtils } from '@shared/MathUtils';

export class InertialDampener {
    accelFactor: number = 0;

    lastSpeed: number = 0;

    constructor(accelFactor: number) {
        this.accelFactor = accelFactor;
    }

    updateSpeed(newSpeed: number): number {
        if (MathUtils.round(newSpeed, 1) === MathUtils.round(this.lastSpeed, 1)) {
            return newSpeed;
        }
        if (newSpeed > this.lastSpeed) {
            this.lastSpeed += this.accelFactor;
        } else if (newSpeed < this.lastSpeed) {
            this.lastSpeed -= this.accelFactor;
        }
        return this.lastSpeed;
    }

    isWithin(value, target, tolerance):boolean {
        return (value >= target - tolerance) && ((value <= target + tolerance));
    }
}
