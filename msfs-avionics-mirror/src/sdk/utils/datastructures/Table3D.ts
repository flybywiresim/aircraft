
/**
 * A 3D table for intepolating across multiple dimensions.
 */
export class Table3D {
  private readonly data: [number, Float64Array[]][] = [];

  /**
   * Adds a range of values to the table.
   * @param x The x value for this range of values.
   * @param values The range of values in [y, z]
   */
  public addRange(x: number, values: Float64Array[]): void {
    values.sort((a, b) => a[0] - b[0]);
    this.data.push([x, values]);
    this.data.sort((a, b) => a[0] - b[0]);
  }

  /**
   * Gets the interpolated value from the table given an x and y position.
   * @param x The x position to interpolate for.
   * @param y The y position to interpolate for.
   * @returns The interpolated number.
   */
  public getValue(x: number, y: number): number {

    if (x <= this.data[0][0]) {
      return this.interpRange(y, this.data[0][1]);
    }

    if (x >= this.data[this.data.length - 1][0]) {
      return this.interpRange(y, this.data[this.data.length - 1][1]);
    }

    for (let i = 0; i < this.data.length; i++) {
      if (this.data[i][0] >= x) {
        const bottomRange = this.data[i - 1][1];
        const topRange = this.data[i][1];

        const bottomZ = this.interpRange(y, bottomRange);
        const topZ = this.interpRange(y, topRange);

        return this.interp2d(x, this.data[i - 1][0], this.data[i][0], bottomZ, topZ);
      }
    }

    return NaN;
  }

  /**
   * Interpolates a range of values given a starting y value.
   * @param y The y value to use.
   * @param range The range of values to interpolate over.
   * @returns A resultant interpolated z value.
   */
  private interpRange(y: number, range: Float64Array[]): number {
    if (range.length === 0) {
      return NaN;
    }

    if (y <= range[0][0]) {
      return range[0][1];
    }

    if (y >= range[range.length - 1][0]) {
      return range[range.length - 1][1];
    }

    for (let i = 0; i < range.length; i++) {
      if (range[i][0] >= y) {
        return this.interp2d(y, range[i - 1][0], range[i][0], range[i - 1][1], range[i][1]);
      }
    }

    return NaN;
  }

  /**
   * Interpolates in two dimensions.
   * @param y The input y value.
   * @param y0 The bottom y value for interpolation.
   * @param y1 The top y value for interpolation.
   * @param z0 The bottom z number for interpolation
   * @param z1 The top z number for interpolation.
   * @returns An interpolated z result given the input y.
   */
  private interp2d(y: number, y0: number, y1: number, z0: number, z1: number): number {
    const yPercent = (y - y0) / (y1 - y0);
    return ((z1 - z0) * yPercent) + z0;
  }
}