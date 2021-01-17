/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const A32NX_Util = {};

A32NX_Util.createDeltaTimeCalculator = (startTime = Date.now()) => {
    let lastTime = startTime;

    return () => {
        const nowTime = Date.now();
        const deltaTime = nowTime - lastTime;
        lastTime = nowTime;

        return deltaTime;
    };
};

A32NX_Util.createFrameCounter = (interval = 5) => {
    let count = 0;
    return () => {
        const c = count++;
        if (c == interval) {
            count = 0;
        }
        return c;
    };
};

A32NX_Util.createMachine = (machineDef) => {
    const machine = {
        value: machineDef.init,
        action(event) {
            const currStateDef = machineDef[machine.value];
            const destTransition = currStateDef.transitions[event];
            if (!destTransition) {
                return;
            }
            const destState = destTransition.target;

            machine.value = destState;
        },
        setState(newState) {
            const valid = machineDef[newState];
            if (valid) {
                machine.value = newState;
            }
        }
    };
    return machine;
};

/**
 * Utility class to throttle instrument updates
 */
class UpdateThrottler {

    /**
     * @param {number} intervalMs Interval between updates, in milliseconds
     */
    constructor(intervalMs) {
        this.intervalMs = intervalMs;
        this.currentTime = 0;
        this.lastUpdateTime = 0;

        // Take a random offset to space out updates from different instruments among different
        // frames as much as possible.
        this.refreshOffset = Math.floor(Math.random() * intervalMs);
        this.refreshNumber = 0;
    }

    /**
     * Checks whether the instrument should be updated in the current frame according to the
     * configured update interval.
     *
     * @param {*} deltaTime
     * @returns -1 if the instrument should not update, or the time elapsed since the last
     *          update in milliseconds
     */
    canUpdate(deltaTime) {
        this.currentTime += deltaTime;
        const number = Math.floor((this.currentTime + this.refreshOffset) / this.intervalMs);
        const update = number > this.refreshNumber;
        this.refreshNumber = number;
        if (update) {
            const accumulatedDelta = this.currentTime - this.lastUpdateTime;
            this.lastUpdateTime = this.currentTime;
            return accumulatedDelta;
        } else {
            return -1;
        }
    }
}
