/** A collection of handy SVG functions. */
export class SVGUtils {
  /**
   * Creates an arc using an SVG path.
   * From https://stackoverflow.com/questions/5736398/how-to-calculate-the-svg-path-for-an-arc-of-a-circle
   * @param x Arc center x position.
   * @param y Arc center y position.
   * @param radius Arc radius.
   * @param startAngle Arc start angle.
   * @param endAngle Arc end angle.
   * @returns The d value for and SVG path element.
   */
  public static describeArc(
    x: number, y: number, radius: number, startAngle: number, endAngle: number,
  ): string {

    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    const d = [
      'M', start[0], start[1],
      'A', radius, radius, 0, largeArcFlag, 0, end[0], end[1]
    ].join(' ');

    return d;
  }
}

// eslint-disable-next-line jsdoc/require-jsdoc
function polarToCartesian(
  centerX: number, centerY: number, radius: number, angleInDegrees: number,
): Float64Array {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

  return new Float64Array([
    centerX + (radius * Math.cos(angleInRadians)),
    centerY + (radius * Math.sin(angleInRadians))
  ]);
}