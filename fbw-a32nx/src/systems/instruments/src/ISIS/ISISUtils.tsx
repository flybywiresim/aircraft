export class LagFilter {
    private previousInput: number = 0;

    private previousOutput: number = 0;

    private timeConstant: number;

    constructor(timeConstant: number) {
        this.timeConstant = timeConstant;
    }

    reset(): void {
        this.previousInput = 0;
        this.previousOutput = 0;
    }

    /**
     *
     * @param input Input to filter
     * @param deltaTime in seconds
     * @returns {number} Filtered output
     */
    step(input: number, deltaTime: number): number {
        const scaledDeltaTime = deltaTime * this.timeConstant;
        const sum0 = scaledDeltaTime + 2;

        const output = (input + this.previousInput) * scaledDeltaTime / sum0
            + (2 - scaledDeltaTime) / sum0 * this.previousOutput;

        this.previousInput = input;
        if (Number.isFinite(output)) {
            this.previousOutput = output;

            return output;
        }

        return 0;
    }
}
