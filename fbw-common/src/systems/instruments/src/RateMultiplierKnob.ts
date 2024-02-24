export type UpdateValueCallback = (x: number) => void;

/**
 * A generic rotary encoder knob with built-in rate multiplying.
 * If the knob is turned quickly the speed given to the callback increases.
 * When the knob is not used for longer than the timeout, the speed goes back to 1.
 *
 * E.g. this can be used to increase the delta heading for a heading knob
 * as a user turns faster as opposed to always changing the heading by 1 degree.
 */
export class RateMultiplierKnob {
  private timeout: number;

  private increment: number;

  private currentSpeed: number;

  private previousTimestamp: number;

  public updateValue: UpdateValueCallback;

  /**
   * @param timeout How long the user has to rotate before the rate is zeroed.
   * @param increment How long to increment the rate at each click.
   */
  constructor(timeout = 300, increment = 0.2) {
    this.timeout = timeout;
    this.increment = increment;
    this.currentSpeed = 0;
    this.previousTimestamp = 0;
  }

  /**
   * Call this method every time the knob is increased (turned clockwise).
   * If called within the timeout, the offset is steadily increased too.
   */
  increase() {
    if (this.currentSpeed < 1 || Date.now() - this.previousTimestamp > this.timeout) {
      this.currentSpeed = 1;
    } else {
      this.currentSpeed += this.increment;
    }

    this.previousTimestamp = Date.now();
    this.updateValue(Math.floor(this.currentSpeed));
  }

  /**
   * Same as increase, but in the opposite direction.
   */
  decrease() {
    if (this.currentSpeed > -1 || Date.now() - this.previousTimestamp > this.timeout) {
      this.currentSpeed = -1;
    } else {
      this.currentSpeed -= this.increment;
    }

    this.previousTimestamp = Date.now();
    this.updateValue(Math.ceil(this.currentSpeed));
  }
}
