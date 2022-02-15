export class MathUtils {
    static DEEGREES_TO_RADIANS = Math.PI / 180;

    static RADIANS_TO_DEGREES = 180 / Math.PI;

    private static optiPow10 = [];

    public static fastToFixed(val: number, fraction: number): string {
        if (fraction <= 0) {
            return Math.round(val).toString();
        }

        let coefficient = MathUtils.optiPow10[fraction];
        if (!coefficient || Number.isNaN(coefficient)) {
            coefficient = 10 ** fraction;
            MathUtils.optiPow10[fraction] = coefficient;
        }

        return (Math.round(val * coefficient) / coefficient).toString();
    }

    public static diffAngle(a: number, b: number): number {
        let diff = b - a;
        while (diff > 180) {
            diff -= 360;
        }
        while (diff <= -180) {
            diff += 360;
        }
        return diff;
    }

    /**
    * Calculates the inner angle of the small triangle formed by two intersecting lines
    *
    * This effectively returns the angle XYZ in the figure shown below:
    *
    * ```
    * * Y
    * |\
    * | \
    * |  \
    * |   \
    * |    \
    * |     \
    * |      \
    * * X     * Z
    * ```
    *
    * @param xyAngle {number} bearing of line XY
    * @param zyAngle {number} bearing of line ZY
    */
    public static smallCrossingAngle(xyAngle: number, zyAngle: number): number {
        // Rotate frame of reference to 0deg
        let correctedXyBearing = xyAngle - zyAngle;
        if (correctedXyBearing < 0) {
            correctedXyBearing = 360 + correctedXyBearing;
        }

        let xyzAngle = 180 - correctedXyBearing;
        if (xyzAngle < 0) {
            // correctedXyBearing was > 180

            xyzAngle = 360 + xyzAngle;
        }

        return xyzAngle;
    }

    public static mod(x: number, n: number): number {
        return x - Math.floor(x / n) * n;
    }

    public static highestPower2(n: number): number {
        let res = 0;
        for (let i = n; i >= 1; i--) {
            if ((i & (i - 1)) === 0) {
                res = i;
                break;
            }
        }
        return res;
    }

    public static unpackPowers(n: number): number[] {
        const res: number[] = [];

        let x = n;
        while (x > 0) {
            const pow = MathUtils.highestPower2(x);
            res.push(pow);
            x -= pow;
        }

        return res;
    }

    public static packPowers(ns: number[]): number {
        if (ns.some((it) => it === 0 || (it & it - 1) !== 0)) {
            throw new Error('Cannot pack number which is not a power of 2 or is equal to zero.');
        }

        return ns.reduce((acc, v) => acc + v);
    }

    /**
     * Gets the horizontal distance between 2 points, given in lat/lon
     * @param pos0Lat {number} Position 0 lat
     * @param pos0Lon {number} Position 0 lon
     * @param pos1Lat {number} Position 1 lat
     * @param pos1Lon {number} Position 1 lon
     * @return {number} distance in nautical miles
     */
    public static computeGreatCircleDistance(pos0Lat: number, pos0Lon: number, pos1Lat: number, pos1Lon: number): number {
        const lat0 = pos0Lat * MathUtils.DEEGREES_TO_RADIANS;
        const lon0 = pos0Lon * MathUtils.DEEGREES_TO_RADIANS;
        const lat1 = pos1Lat * MathUtils.DEEGREES_TO_RADIANS;
        const lon1 = pos1Lon * MathUtils.DEEGREES_TO_RADIANS;
        const dlon = lon1 - lon0;
        const cosLat0 = Math.cos(lat0);
        const cosLat1 = Math.cos(lat1);
        const a1 = Math.sin((lat1 - lat0) / 2);
        const a2 = Math.sin(dlon / 2);
        return Math.asin(Math.sqrt(a1 * a1 + cosLat0 * cosLat1 * a2 * a2)) * 6880.126;
    }

    /**
     * Gets the heading between 2 points, given in lat/lon
     * @param pos0Lat {number} Position 0 lat
     * @param pos0Lon {number} Position 0 lon
     * @param pos1Lat {number} Position 1 lat
     * @param pos1Lon {number} Position 1 lon
     * @return {number} distance in nautical miles
     */
    static computeGreatCircleHeading(pos0Lat: number, pos0Lon: number, pos1Lat: number, pos1Lon: number): number {
        const lat0 = pos0Lat * MathUtils.DEEGREES_TO_RADIANS;
        const lon0 = pos0Lon * MathUtils.DEEGREES_TO_RADIANS;
        const lat1 = pos1Lat * MathUtils.DEEGREES_TO_RADIANS;
        const lon1 = pos1Lon * MathUtils.DEEGREES_TO_RADIANS;
        const dlon = lon1 - lon0;
        const cosLat1 = Math.cos(lat1);
        let x = Math.sin(lat1 - lat0);
        const sinLon2 = Math.sin(dlon / 2.0);
        x += sinLon2 * sinLon2 * 2.0 * Math.sin(lat0) * cosLat1;
        let heading = Math.atan2(cosLat1 * Math.sin(dlon), x);
        if (heading < 0) {
            heading += 2 * Math.PI;
        }
        return heading * MathUtils.RADIANS_TO_DEGREES;
    }

    /**
     * Gets the distance between 2 points, given in lat/lon/alt above sea level
     * @param pos0Lat {number} Position 0 lat
     * @param pos0Lon {number} Position 0 lon
     * @param pos0alt {number} Position 0 alt (feet)
     * @param pos1Lat {number} Position 1 lat
     * @param pos1Lon {number} Position 1 lon
     * @param pos1alt {number} Position 1 alt (feet)
     * @return {number} distance in nautical miles
     */
    public static computeDistance3D(pos0Lat: number, pos0Lon: number, pos0alt: number, pos1Lat: number, pos1Lon: number, pos1alt: number): number {
        const earthRadius = 3440.065; // earth radius in nautcal miles
        const deg2rad = Math.PI / 180;

        const radius1 = pos0alt / 6076 + earthRadius;
        const radius2 = pos1alt / 6076 + earthRadius;

        const x1 = radius1 * Math.sin(deg2rad * (pos0Lat + 90)) * Math.cos(deg2rad * (pos0Lon + 180));
        const y1 = radius1 * Math.sin(deg2rad * (pos0Lat + 90)) * Math.sin(deg2rad * (pos0Lon + 180));
        const z1 = radius1 * Math.cos(deg2rad * (pos0Lat + 90));

        const x2 = radius2 * Math.sin(deg2rad * (pos1Lat + 90)) * Math.cos(deg2rad * (pos1Lon + 180));
        const y2 = radius2 * Math.sin(deg2rad * (pos1Lat + 90)) * Math.sin(deg2rad * (pos1Lon + 180));
        const z2 = radius2 * Math.cos(deg2rad * (pos1Lat + 90));

        return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2);
    }

    /**
     * Check if point is inside a given ellipse
     *
     * @param {number} xPos x value of point
     * @param {number} yPos y value of point
     * @param {number} xLimPos +ve xLimit of ellipse
     * @param {number} xLimNeg -ve xLimit of ellipse
     * @param {number} yLimPos +ve yLimit of ellipse
     * @param {number} yLimNeg -ve yLimit of ellipse
     * @return {boolean} Whether the point is in the ellipse
     *
     */
    public static pointInEllipse(xPos: number, yPos: number, xLimPos: number, yLimPos: number, xLimNeg: number = xLimPos, yLimNeg: number = yLimPos): boolean {
        return (xPos ** 2 / ((xPos >= 0) ? xLimPos : xLimNeg) ** 2 + yPos ** 2 / ((yPos >= 0) ? yLimPos : yLimNeg) ** 2) <= 1;
    }

    /**
     * Performs the even-odd-rule Algorithm (a raycasting algorithm) to find out whether a point is in a given polygon.
     * This runs in O(n) where n is the number of edges of the polygon.
     *
     * @param {Array} polygon an array representation of the polygon where polygon[i][0] is the x Value of the i-th point and polygon[i][1] is the y Value.
     * @param {number} xPos  x value of point
     * @param {number} yPos y value of point
     * @return {boolean} Whether the point is in the polygon (not on the edge, just turn < into <= and > into >= for that)
     */
    public static pointInPolygon(xPos: number, yPos: number, polygon: [number, number][]): boolean {
        // A point is in a polygon if a line from the point to infinity crosses the polygon an odd number of times
        let odd = false;
        // For each edge (In this case for each point of the polygon and the previous one)
        for (let i = 0, j = polygon.length - 1; i < polygon.length; i++) {
            // If a line from the point into infinity crosses this edge
            if (((polygon[i][1] > yPos) !== (polygon[j][1] > yPos)) // One point needs to be above, one below our y coordinate
                // ...and the edge doesn't cross our Y corrdinate before our x coordinate (but between our x coordinate and infinity)
                && (xPos < ((polygon[j][0] - polygon[i][0]) * (yPos - polygon[i][1]) / (polygon[j][1] - polygon[i][1]) + polygon[i][0]))) {
                // Invert odd
                odd = !odd;
            }
            j = i;
        }
        // If the number of crossings was odd, the point is in the polygon
        return odd;
    }

    /**
     * Line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
     * Determine the intersection point of two line segments
     * Return null if the lines don't intersect
     *
     * @param {number} x1 line0 x origin
     * @param {number} y1 line0 y origin
     * @param {number} x2 line0 x end
     * @param {number} y2 line0 y end
     * @param {number} x3 line1 x origin
     * @param {number} y3 line1 y origin
     * @param {number} x4 line1 x end
     * @param {number} y4 line1 y end
     *
     * @return {[number, number] | null} [x,y] of intercept, null if no intercept.
     */
    public static intersect(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): [number, number] | null {
        // Check if none of the lines are of length 0
        if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
            return null;
        }

        const denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));

        // Lines are parallel
        if (denominator === 0) {
            return null;
        }

        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
        const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

        // is the intersection along the segments
        if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
            return null;
        }

        // Return a object with the x and y coordinates of the intersection
        const x = x1 + ua * (x2 - x1);
        const y = y1 + ua * (y2 - y1);

        return [x, y];
    }

    // Find intersect with polygon
    public static intersectWithPolygon(x1: number, y1: number, x2: number, y2: number, polygon: [number, number][]): [number, number] | null {
        let ret: [number, number] | null = null;
        polygon.forEach((xy, index, polygon) => {
            if (ret) return;
            if (index + 1 >= polygon.length) {
                return;
            }
            const x3 = xy[0];
            const y3 = xy[1];
            const x4 = polygon[index + 1][0];
            const y4 = polygon[index + 1][1];
            ret = MathUtils.intersect(x1, y1, x2, y2, x3, y3, x4, y4);
        });
        return ret;
    }
}
