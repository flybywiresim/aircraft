export class LagFilter {
    private PreviousInput: number = 0;

    private PreviousOutput: number = 0;

    private TimeConstant: number;

    constructor(timeConstant: number) {
        this.TimeConstant = timeConstant;
    }

    reset(): void {
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
        const scaledDeltaTime = deltaTime * this.TimeConstant;
        const sum0 = scaledDeltaTime + 2;

        const output = (input + this.PreviousInput) * scaledDeltaTime / sum0
            + (2 - scaledDeltaTime) / sum0 * this.PreviousOutput;

        this.PreviousInput = input;
        if (Number.isFinite(output)) {
            this.PreviousOutput = output;
            return output;
        }
        return 0;
    }
}
