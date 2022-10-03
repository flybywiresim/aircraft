/** A collection of helper functions dealing with radios and frequencies. */
export class RadioUtils {
  /** Checks if frequency is a localizer frequency based on the number.
   * @param freq The frequency to check
   * @returns True if frequency is between 108.1 and 111.95 MHz (inclusive) and the tenths place is odd. */
  public static isLocalizerFrequency(freq: number): boolean {
    return freq >= 108.1 && freq <= 111.95 && (Math.trunc(freq * 10) % 2 === 1);
  }
}