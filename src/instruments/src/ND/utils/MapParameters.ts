import { Coordinates, Xy } from '@fmgc/flightplanning/data/geo';
import { MathUtils } from '@shared/MathUtils';

export class MapParameters {
    public centerCoordinates: Coordinates;

    public nmWidth: number;

    public angularWidth: number;

    public angularWidthNorth: number;

    public angularWidthSouth: number;

    public angularHeight: number;

    public bottomLeftCoordinates: Coordinates = { lat: 0, long: 0 };

    public topRightCoordinates: Coordinates = { lat: 0, long: 0 };

    public mapUpDirectionRadian: number;

    public cosMapUpDirection: number;

    public sinMapUpDirection: number;

    compute(centerCoordinates: Coordinates, nmWidth: number, mapUpDirectionDeg: number): void {
        this.centerCoordinates = centerCoordinates;
        this.nmWidth = nmWidth;
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
        const xNorth = (coordinates.long - this.centerCoordinates.long) / this.angularWidthNorth * 1000;
        const xSouth = (coordinates.long - this.centerCoordinates.long) / this.angularWidthSouth * 1000;
        let deltaLat = (coordinates.lat - this.centerCoordinates.lat) / this.angularHeight;

        const y = -deltaLat * 1000;
        deltaLat += 0.5;

        const x = xNorth * deltaLat + xSouth * (1 - deltaLat);

        // If not north up
        if (this.mapUpDirectionRadian !== 0) {
            return [
                x * this.cosMapUpDirection - y * this.sinMapUpDirection + 500,
                x * this.sinMapUpDirection + y * this.cosMapUpDirection + 500,
            ];
        }

        return [
            x + 500,
            x + 500,
        ];
    }

    nmToPixels(nm: number): number {
        return nm / this.nmWidth * 1000;
    }
}
