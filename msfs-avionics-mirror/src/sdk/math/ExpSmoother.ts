/**
 * Applies time-weighted exponential smoothing (i.e. an exponential moving average) to a sequence of raw values. When
 * a new raw value is added to the sequence, it and the last smoothed value are weighted according to the time elapsed
 * since the last smoothed value was calculated (i.e. since the last raw value was added) and averaged. The calculation
 * of the weighting is such that the weight of each raw value in the sequence decays exponentially with the "age"
 * (i.e. time elapsed between when that value was added to the sequence and when the latest value was added to the
 * sequence) of the value.
 */
export class ExpSmoother {
  private lastValue: number | null;

  /**
   * Constructor.
   * @param tau This smoother's time constant. The larger the constant, the greater the smoothing effect.
   * @param initial The initial smoothed value of this smoother. Defaults to null.
   * @param dtThreshold The elapsed time threshold, in seconds, above which this smoother will not smooth a new raw
   * value. Defaults to infinity.
   */
  constructor(
    public readonly tau: number,
    initial: number | null = null,
    public readonly dtThreshold = Infinity
  ) {
    this.lastValue = initial;
  }

  /**
   * Gets the last smoothed value.
   * @returns the last smoothed value, or null if none exists.
   */
  public last(): number | null {
    return this.lastValue;
  }

  /**
   * Adds a new raw value and gets the next smoothed value. If the new raw value is the first to be added since this
   * smoother was created or reset with no initial smoothed value, the returned smoothed value will be equal to the
   * raw value.
   * @param raw The new raw value.
   * @param dt The elapsed time, in seconds, since the last raw value was added.
   * @returns The next smoothed value.
   */
  public next(raw: number, dt: number): number {
    let next;
    if (this.lastValue !== null) {
      const factor = this.calculateFactor(dt);
      next = ExpSmoother.smooth(raw, this.lastValue, factor);
    } else {
      next = raw;
    }
    this.lastValue = next;
    return next;
  }

  /**
   * Calculates the smoothing factor for a given time interval.
   * @param dt A time interval, in seconds.
   * @returns the smoothing factor for the given time interval.
   */
  private calculateFactor(dt: number): number {
    if (dt > this.dtThreshold) {
      return 0;
    } else {
      return Math.exp(-dt / this.tau);
    }
  }

  /**
   * Resets the "history" of this smoother and optionally sets the initial smoothed value.
   * @param value The new initial smoothed value. Defaults to null.
   * @returns The reset smoothed value.
   */
  public reset<T extends number | null>(value?: T): T {
    return this.lastValue = (value ?? null) as T;
  }

  /**
   * Applies exponential smoothing.
   * @param value The value to smooth.
   * @param last The last smoothed value.
   * @param factor The smoothing factor.
   * @returns A smoothed value.
   */
  private static smooth(value: number, last: number, factor: number): number {
    return value * (1 - factor) + last * factor;
  }
}