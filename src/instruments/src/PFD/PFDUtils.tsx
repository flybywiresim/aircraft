export const calculateHorizonOffsetFromPitch = (pitch: number) => {
    if (pitch > -5 && pitch <= 20) {
        return pitch * 1.8;
    } if (pitch > 20 && pitch <= 30) {
        return -0.04 * pitch ** 2 + 3.4 * pitch - 16;
    } if (pitch > 30) {
        return 20 + pitch;
    } if (pitch < -5 && pitch >= -15) {
        return 0.04 * pitch ** 2 + 2.2 * pitch + 1;
    }
    return pitch - 8;
};

export const calculateVerticalOffsetFromRoll = (roll: number) => {
    let offset = 0;

    if (Math.abs(roll) > 60) {
        offset = Math.max(0, 41 - 35.87 / Math.sin(Math.abs(roll) / 180 * Math.PI));
    }
    return offset;
};

export const SmoothSin = (origin: number, destination: number, smoothFactor: number, dTime: number) => {
    if (origin === undefined) {
        return destination;
    }
    if (Math.abs(destination - origin) < Number.EPSILON) {
        return destination;
    }
    const delta = destination - origin;
    let result = origin + delta * Math.sin(Math.min(smoothFactor * dTime, 1.0) * Math.PI / 2.0);
    if ((origin < destination && result > destination) || (origin > destination && result < destination)) {
        result = destination;
    }
    return result;
};

export class LagFilter {
    private PreviousInput: number;

    private PreviousOutput: number;

    private TimeConstant: number;

    constructor(timeConstant: number) {
        this.PreviousInput = 0;
        this.PreviousOutput = 0;

        this.TimeConstant = timeConstant;
    }

    reset() {
        this.PreviousInput = 0;
        this.PreviousOutput = 0;
    }

    /**
     *
     * @param input Input to filter
     * @param deltaTime in seconds
     * @returns {number} Filtered output
     */
    step(input: number, deltaTime: number): number {
        const filteredInput = !Number.isNaN(input) ? input : 0;

        const scaledDeltaTime = deltaTime * this.TimeConstant;
        const sum0 = scaledDeltaTime + 2;

        const output = (filteredInput + this.PreviousInput) * scaledDeltaTime / sum0
            + (2 - scaledDeltaTime) / sum0 * this.PreviousOutput;

        this.PreviousInput = filteredInput;

        if (Number.isFinite(output)) {
            this.PreviousOutput = output;
            return output;
        }
        return 0;
    }
}

export class RateLimiter {
    private PreviousOutput: number;

    private RisingRate: number;

    private FallingRate: number;

    constructor(risingRate: number, fallingRate: number) {
        this.PreviousOutput = 0;

        this.RisingRate = risingRate;
        this.FallingRate = fallingRate;
    }

    step(input: number, deltaTime: number) {
        const filteredInput = !Number.isNaN(input) ? input : 0;

        const subInput = filteredInput - this.PreviousOutput;

        const scaledUpper = deltaTime * this.RisingRate;
        const scaledLower = deltaTime * this.FallingRate;

        const output = this.PreviousOutput + Math.max(Math.min(scaledUpper, subInput), scaledLower);
        this.PreviousOutput = output;
        return output;
    }
}
