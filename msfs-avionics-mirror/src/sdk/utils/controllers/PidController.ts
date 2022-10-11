/** A PID controller. */
export class PidController {

  /** The previously sampled error. */
  private previousError = 0;

  /** The previously generated output. */
  private previousOutput = 0;

  /** The currently accumulated integral. */
  private integral = 0;

  /**
   * Creates a new PidController.
   * @param kP The proportional gain of the controller.
   * @param kI The integral gain of the controller.
   * @param kD The differential gain of the controller.
   * @param maxOut The maximum output of the controller.
   * @param minOut The minumum output of the controller.
   * @param maxI The maximum integral gain.
   * @param minI The minimum integral gain.
   */
  constructor(private kP: number, private kI: number, private kD: number, private maxOut: number, private minOut: number,
    private maxI: number = Number.MAX_SAFE_INTEGER, private minI: number = Number.MIN_SAFE_INTEGER) {
  }

  /**
   * Gets the output of the PID controller at a given time.
   * @param deltaTime The difference in time between the previous sample and this sample.
   * @param error The amount of error seen between the desired output and the current output.
   * @returns The PID output.
   */
  public getOutput(deltaTime: number, error: number): number {
    const p = this.kP * error;


    if (Math.sign(error) === Math.sign(this.previousError)) {
      this.integral += ((error * deltaTime) + ((deltaTime * (error - this.previousError)) / 2)) * this.kI;
      this.integral = PidController.clamp(this.integral, this.maxI, this.minI);
    } else {
      this.integral = 0;
    }

    const i = this.integral;
    const d = this.kD * ((error - this.previousError) / deltaTime);

    const output = PidController.clamp(p + i + d, this.maxOut, this.minOut);
    this.previousError = error;
    this.previousOutput = output;

    return output;
  }

  /** Resets the controller. */
  public reset(): void {
    this.previousError = 0;
    this.previousOutput = 0;
    this.integral = 0;
  }

  /**
   * Clamps a number to maximum and minimum values.
   * @param value The value to clamp.
   * @param max The maximum value.
   * @param min The minumum value.
   * @returns The clamped value.
   */
  public static clamp(value: number, max: number, min: number): number {
    return Math.min(Math.max(value, min), max);
  }
}