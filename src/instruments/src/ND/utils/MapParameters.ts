import { Coordinates, Xy } from '@fmgc/flightplanning/data/geo';
import { MathUtils } from '@shared/MathUtils';

export class MapParameters {
    public centerCoordinates: Coordinates;

    public nmWidth: number;

    public pxWidth: number;

    public angularWidth: number;

    public angularWidthNorth: number;

    public angularWidthSouth: number;

    public angularHeight: number;

    public bottomLeftCoordinates: Coordinates = { lat: 0, long: 0 };

    public topRightCoordinates: Coordinates = { lat: 0, long: 0 };

    public mapUpDirectionRadian: number;

    public cosMapUpDirection: number;

    public sinMapUpDirection;

    public version = 0;

    compute(centerCoordinates: Coordinates, nmWidth: number, pxWidth: number, mapUpDirectionDeg: number): void {
        this.version++;

        this.centerCoordinates = centerCoordinates;
        this.nmWidth = nmWidth;
        this.pxWidth = pxWidth;
        this.angularWidth = nmWidth / 60 / Math.cos(centerCoordinates.lat * MathUtils.DEEGREES_TO_RADIANS);
        this.angularHeight = nmWidth / 60;
        this.bottomLeftCoordinates.lat = centerCoordinates.lat - this.angularHeight * 0.5;
        this.bottomLeftCoordinates.long = centerCoordinates.long - this.angularWidth * 0.5;
        this.topRightCoordinates.lat = centerCoordinates.lat + this.angularHeight * 0.5;
        this.topRightCoordinates.long = centerCoordinates.long + this.angularWidth * 0.5;
        this.angularWidthNorth = nmWidth / 60 / Math.cos(this.topRightCoordinates.lat * MathUtils.DEEGREES_TO_RADIANS);
        this.angularWidthSouth = nmWidth / 60 / Math.cos(this.bottomLeftCoordinates.lat * MathUtils.DEEGREES_TO_RADIANS);

        this.mapUpDirectionRadian = -mapUpDirectionDeg / 180 * Math.PI;
        this.cosMapUpDirection = Math.cos(this.mapUpDirectionRadian);
        this.sinMapUpDirection = Math.sin(this.mapUpDirectionRadian);
    }

    coordinatesToXYy(coordinates: Coordinates): Xy {
        const xNorth = (coordinates.long - this.centerCoordinates.long) / this.angularWidthNorth * this.pxWidth;
        const xSouth = (coordinates.long - this.centerCoordinates.long) / this.angularWidthSouth * this.pxWidth;
        let deltaLat = (coordinates.lat - this.centerCoordinates.lat) / this.angularHeight;

        const y = -deltaLat * this.pxWidth;
        deltaLat += 0.5;

        const x = xNorth * deltaLat + xSouth * (1 - deltaLat);

        // If not north up
        if (this.mapUpDirectionRadian !== 0) {
            return [
                x * this.cosMapUpDirection - y * this.sinMapUpDirection + (this.pxWidth / 2),
                x * this.sinMapUpDirection + y * this.cosMapUpDirection + (this.pxWidth / 2),
            ];
        }

        return [
            x + (this.pxWidth / 2),
            x + (this.pxWidth / 2),
        ];
    }

    nmToPixels(nm: number): number {
        return (nm / this.nmWidth) * this.pxWidth;
    }
}
