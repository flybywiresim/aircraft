/** A class that linearly drives a SimVar value towards a given set point. */
export class LinearServo {

  /** The current time. */
  private currentTime?: number;

  /**
   * Creates an instance of a LinearServo.
   * @param rate The rate, in units per second, to drive the servo.
   */
  constructor(private rate: number) { }

  /**
   * Drives the servo towards the set point.
   * @param currentValue The current value.
   * @param setValue The value to drive towards.
   * @returns The output value.
   */
  public drive(currentValue: number, setValue: number): number {
    if (this.currentTime === undefined) {
      this.currentTime = (new Date() as any).appTime();
      return currentValue;
    }

    const currentTime = (new Date() as any).appTime();
    const deltaTime = currentTime - this.currentTime;
    this.currentTime = currentTime;

    const deltaValue = setValue - currentValue;

    const maximumDrive = this.rate * (deltaTime / 1000);
    const output = Math.abs(deltaValue) > maximumDrive
      ? currentValue + (Math.sign(deltaValue) * maximumDrive)
      : setValue;

    return output;
  }
}