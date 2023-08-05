/*
 * MIT License
 *
 * Copyright (c) 2020-2021 Working Title, FlyByWire Simulations
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Creating a new waypoint to be added to a flight plan.
 */
export class WaypointBuilder {
    /**
   * Builds a WayPoint from basic data.
   * @param ident The ident of the waypoint to be created.
   * @param coordinates The coordinates of the waypoint.
   * @param instrument The base instrument instance.
   * @returns The built waypoint.
   */
    public static fromCoordinates(ident: string, coordinates: LatLongAlt, instrument: BaseInstrument, additionalData?: Record<string, unknown>, icao?: string): WayPoint {
        const waypoint = new WayPoint(instrument);
        waypoint.type = 'W';

        waypoint.infos = new IntersectionInfo(instrument);
        waypoint.infos.coordinates = coordinates;

        waypoint.ident = ident;
        waypoint.infos.ident = ident;

        waypoint.icao = icao ?? `W      ${ident}`;
        waypoint.infos.icao = waypoint.icao;

        waypoint.additionalData = additionalData ?? {};

        return waypoint;
    }
}
