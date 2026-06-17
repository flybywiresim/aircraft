export class LowPassFilter {
  private PreviousInput: number;

  private PreviousOutput: number;

  private CornerFrequency: number;

  /**
   *
   * @param cornerFrequency Corner frequency of the filter, in Hz.
   */
  constructor(cornerFrequency: number) {
    this.PreviousInput = 0;
    this.PreviousOutput = 0;

    this.CornerFrequency = cornerFrequency;
  }

  reset() {
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

    // Difference equation determined from continuous time transfer function
    // via the bilinear transform
    const scaledDeltaTime = deltaTime * this.CornerFrequency;
    const sum0 = scaledDeltaTime + 2;

    const output =
      ((filteredInput + this.PreviousInput) * scaledDeltaTime) / sum0 +
      ((2 - scaledDeltaTime) / sum0) * this.PreviousOutput;

    this.PreviousInput = filteredInput;

    if (Number.isFinite(output)) {
      this.PreviousOutput = output;
      return output;
    }
    return 0;
  }

  public previousOutput(): number {
    return this.PreviousOutput;
  }
}
