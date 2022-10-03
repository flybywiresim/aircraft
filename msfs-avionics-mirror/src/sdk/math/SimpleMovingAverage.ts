/**
 * A utitlity class for calculating a numerical average of a selected number of samples.
 */
export class SimpleMovingAverage {

  private _values: number[] = [];
  /**
   * Class to return a numerical average from a specified number of inputs.
   * @param samples is the number of samples.
   */
  constructor(private samples: number) { }

  /**
   * Returns a numerical average of the inputs.
   * @param input is the input number.
   * @returns The numerical average.
   */
  public getAverage(input: number): number {
    let samples = this.samples;
    if (this._values.length === samples) {
      this._values.splice(0, 1);
    } else {
      samples = this._values.length;
    }
    this._values.push(input);
    let sum = 0;
    this._values.forEach((v) => {
      sum += v;
    });
    return sum / samples;
  }

  /**
   * Resets the average.
   */
  public reset(): void {
    this._values = [];
  }
}